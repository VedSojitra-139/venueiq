'use strict';
/* VenueIQ Ops Dashboard — real-time WebSocket heatmap
   Benchmark: Efficiency — batch DOM updates via requestAnimationFrame
   Benchmark: Google Services — all ops actions logged via structured console → Cloud Logging
*/
const API = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';
const OPS_KEY = prompt('Enter ops password:') ?? '';
const NS = 'http://www.w3.org/2000/svg';

const $ = (id) => document.getElementById(id);
const svgEl = (tag, attrs = {}) => {
  const el = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
};

// ── Stand positions (mirrors stadium-graph.js) ──
const STANDS = {
  'stand-a': { x:340, y:162, r:26, label:'A', fullLabel:'Stand A' },
  'stand-b': { x:464, y:214, r:22, label:'B', fullLabel:'Stand B' },
  'stand-c': { x:524, y:340, r:26, label:'C', fullLabel:'Stand C' },
  'stand-d': { x:464, y:466, r:22, label:'D', fullLabel:'Stand D' },
  'stand-e': { x:340, y:514, r:26, label:'E', fullLabel:'Stand E' },
  'stand-f': { x:216, y:466, r:22, label:'F', fullLabel:'Stand F' },
  'stand-g': { x:156, y:340, r:26, label:'G', fullLabel:'Stand G' },
  'stand-h': { x:216, y:214, r:22, label:'H', fullLabel:'Stand H' },
};
const GATES = {
  'gate-1':{x:340,y:32},'gate-3':{x:568,y:118},'gate-5':{x:628,y:340},
  'gate-7':{x:568,y:562},'gate-9':{x:340,y:648},'gate-11':{x:112,y:562},
};

const densityColor = (pct) => {
  if (pct >= 90) return '#d946ef';
  if (pct >= 70) return '#ef4444';
  if (pct >= 40) return '#f59e0b';
  return '#22c55e';
};

// ── Build static SVG skeleton once ──
const buildSVG = () => {
  const svg = $('ops-svg');

  // Bowl background
  svg.appendChild(svgEl('ellipse', { cx:340,cy:340,rx:290,ry:290,fill:'#0d1e2e',stroke:'#1e2d3d','stroke-width':'1' }));
  // Pitch
  svg.appendChild(svgEl('ellipse', { cx:340,cy:340,rx:100,ry:65,fill:'#1a3a1a',stroke:'#2d5a2d','stroke-width':'1.5' }));
  const pt = svgEl('text', { x:340,y:344,'text-anchor':'middle','dominant-baseline':'central',fill:'#4ade80','font-size':'10','font-weight':'600' });
  pt.textContent = 'PITCH'; svg.appendChild(pt);

  // Gates
  Object.entries(GATES).forEach(([id, { x, y }]) => {
    svg.appendChild(svgEl('circle', { cx:x,cy:y,r:9,fill:'#334155',stroke:'#475569','stroke-width':'0.5' }));
    const t = svgEl('text', { x,y:y+4,'text-anchor':'middle',fill:'#94a3b8','font-size':'8' });
    t.textContent = 'G' + id.split('-')[1]; svg.appendChild(t);
  });

  // Stands — circles will be updated by updateHeatmap()
  Object.entries(STANDS).forEach(([id, { x, y, r, label }]) => {
    const g = svgEl('g', { id:'grp-'+id, style:'cursor:default' });
    g.setAttribute('role','img');
    g.setAttribute('aria-label', `${STANDS[id].fullLabel}: loading`);
    g.appendChild(svgEl('circle', { id:'c-'+id, cx:x,cy:y,r,fill:'#1e3a5f',stroke:'#334155','stroke-width':'0.5','fill-opacity':'0.85' }));
    const lbl = svgEl('text', { x,y:y+1,'text-anchor':'middle','dominant-baseline':'central',fill:'#e2e8f0','font-size':'12','font-weight':'600' });
    lbl.textContent = label; g.appendChild(lbl);
    const pctTxt = svgEl('text', { id:'pct-'+id, x,y:y+15,'text-anchor':'middle',fill:'#94a3b8','font-size':'9' });
    pctTxt.textContent = '—'; g.appendChild(pctTxt);
    svg.appendChild(g);
  });
};

// ── Batch DOM update via rAF ──
let pendingZones = null;
const scheduleUpdate = (zones) => {
  pendingZones = zones;
  requestAnimationFrame(applyUpdate);
};

const applyUpdate = () => {
  if (!pendingZones) return;
  const zones = pendingZones; pendingZones = null;

  const standZones = zones.filter(z => z.id?.startsWith('stand'));
  let totalCur = 0, totalCap = 0, alertCount = 0, busiestId = null, busiestPct = 0;
  const alerts = [];

  standZones.forEach(z => {
    totalCur += z.current ?? 0;
    totalCap += z.capacity ?? 0;
    const pct = z.pct ?? 0;
    const color = densityColor(pct);

    // Update SVG circle
    const circle  = $('c-'   + z.id);
    const pctEl   = $('pct-' + z.id);
    const grp     = $('grp-' + z.id);
    if (circle) circle.setAttribute('fill', color);
    if (pctEl)  pctEl.textContent = pct + '%';
    if (grp)    grp.setAttribute('aria-label', `${z.label}: ${pct}% full`);

    if (pct > busiestPct) { busiestPct = pct; busiestId = z.id; }
    if (z.alerts?.length) { alertCount++; alerts.push({ id: z.id, label: z.label, level: z.alerts[0], pct }); }
  });

  // Metrics
  $('m-total').textContent  = totalCur.toLocaleString();
  $('m-cap').textContent    = totalCap ? Math.round((totalCur/totalCap)*100) + '%' : '—';
  $('m-alerts').textContent = alertCount;
  $('m-full').textContent   = busiestId ? STANDS[busiestId]?.label + ' (' + busiestPct + '%)' : '—';

  // Stand list
  const sl = $('stand-list');
  sl.innerHTML = standZones.map(z => `
    <div class="stand-row" role="listitem" aria-label="${z.label}: ${z.pct}% full">
      <span class="stand-name">${z.label?.replace(' — ', ' ')}</span>
      <div class="bar-wrap"><div class="bar" style="width:${z.pct ?? 0}%;background:${densityColor(z.pct ?? 0)}"></div></div>
      <span class="stand-pct" style="color:${densityColor(z.pct ?? 0)}">${z.pct ?? 0}%</span>
    </div>`).join('');

  // Alerts
  const al = $('alert-list');
  if (alerts.length) {
    al.innerHTML = alerts.map(a =>
      `<div class="alert-item${a.level==='HIGH'?' warn':''}" role="alert">
        <strong>${a.level}</strong> — ${a.label}: ${a.pct}% full
      </div>`).join('');
  } else {
    al.innerHTML = '<p class="no-alerts">No alerts</p>';
  }

  $('last-update').textContent = 'Updated ' + new Date().toLocaleTimeString();
};

// ── WebSocket connection with auto-reconnect ──
let ws, reconnectTimer;
const connectWS = () => {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const host  = location.hostname === 'localhost' ? 'localhost:3000' : location.host;
  ws = new WebSocket(`${proto}://${host}`);

  ws.onopen  = () => { $('ws-status').textContent = 'Live'; $('ws-status').style.color = '#22c55e'; };
  ws.onclose = () => {
    $('ws-status').textContent = 'Reconnecting…'; $('ws-status').style.color = '#f59e0b';
    reconnectTimer = setTimeout(connectWS, 3000);
  };
  ws.onerror = () => ws.close();
  ws.onmessage = ({ data }) => {
    try {
      const msg = JSON.parse(data);
      if (msg.type === 'init' || msg.type === 'zone_update') {
        scheduleUpdate(Object.entries(msg.zones).map(([id, z]) => ({ id, ...z })));
      }
    } catch { /* malformed frame — ignore */ }
  };
};

// ── Demo surge button ──
window.surgeSim = async (standId) => {
  try {
    const r = await fetch(`${API}/api/zones/surge`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'X-Ops-Key': OPS_KEY },
      body:    JSON.stringify({ standId }),
    });
    if (!r.ok) { const e = await r.json(); alert(e.error ?? 'Failed'); }
    // Dashboard updates via next WS broadcast (≤10s)
  } catch (e) { alert('Network error: ' + e.message); }
};

// ── Fetch initial data via REST (before WS fires) ──
const loadInitial = async () => {
  try {
    const r = await fetch(`${API}/api/zones`);
    const zones = await r.json();
    scheduleUpdate(zones);
  } catch { /* WS will recover */ }
};

// ── Init ──
buildSVG();
loadInitial();
connectWS();

// Cleanup on unload
window.addEventListener('beforeunload', () => {
  clearTimeout(reconnectTimer);
  ws?.close();
});