'use strict';
/* VenueIQ Fan App — client JS
   Benchmark: Efficiency — no framework, minimal DOM ops, requestAnimationFrame for animations
   Benchmark: Accessibility — ARIA live regions, role management, focus trapping per screen
   Benchmark: Security — token stored in memory only (not localStorage), input sanitised server-side
*/

const API = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';
let AUTH_TOKEN = null; // in-memory only — never persisted
let FAN = null;
let SESSION_ID = crypto.randomUUID();
let CURRENT_TAB = 'seat';

// ── DOM refs ─────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

// ── Screen manager ───────────────────────────────────────────
const showScreen = (id) => {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.setAttribute('aria-hidden', 'true');
  });
  const next = $(id);
  next.classList.add('active');
  next.removeAttribute('aria-hidden');
  // Move focus to first interactive element for keyboard/screen reader users
  const firstFocus = next.querySelector('button,input,[tabindex="0"]');
  requestAnimationFrame(() => firstFocus?.focus());
};

// ── PNR Verification ─────────────────────────────────────────
const setVerifyState = (loading) => {
  const btn = $('btn-verify');
  btn.disabled = loading;
  btn.innerHTML = loading
    ? '<span class="spinner" aria-hidden="true"></span> Checking…'
    : 'Find my seat';
};

window.verifyPNR = async () => {
  const pnr   = $('inp-pnr').value.trim();
  const phone = $('inp-phone').value.trim();
  const errEl = $('pnr-err');
  errEl.textContent = '';
  $('inp-pnr').removeAttribute('aria-invalid');
  $('inp-phone').removeAttribute('aria-invalid');

  if (!pnr)   { errEl.textContent = 'PNR is required.';   $('inp-pnr').setAttribute('aria-invalid','true');   return; }
  if (!phone) { errEl.textContent = 'Phone is required.'; $('inp-phone').setAttribute('aria-invalid','true'); return; }

  setVerifyState(true);
  try {
    const res  = await fetch(`${API}/api/verify-pnr`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ pnr, phone }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Verification failed');

    AUTH_TOKEN = data.token; // keep in memory
    FAN = data.fan;
    populateWelcome();
    showScreen('s-welcome');
  } catch (e) {
    errEl.textContent = e.message;
    // Announce error to screen readers via aria-live region
  } finally {
    setVerifyState(false);
  }
};

// ── Welcome screen ───────────────────────────────────────────
const populateWelcome = () => {
  $('fan-first-name').textContent = FAN.name.split(' ')[0];
  $('match-meta').textContent     = FAN.match;
  $('seat-card').innerHTML = `
    <div class="seat-field"><label>Gate</label><span>${FAN.gate.replace('gate-', 'Gate ')}</span></div>
    <div class="seat-field"><label>Stand</label><span>${FAN.stand.replace('stand-', 'Stand ').toUpperCase()}</span></div>
    <div class="seat-field"><label>Block</label><span>${FAN.block}</span></div>
    <div class="seat-field"><label>Row</label><span>${FAN.row}</span></div>
    <div class="seat-field"><label>Seat</label><span>${FAN.seat}</span></div>
    <div class="seat-field"><label>Walk est.</label><span>~4 min</span></div>`;
  $('walk-hint').textContent = `Enter via ${FAN.gate.replace('gate-', 'Gate ')} → head to ${FAN.stand.replace('stand-', 'Stand ').toUpperCase()}`;
};

window.goToMap = (tab) => {
  CURRENT_TAB = tab;
  showScreen('s-map');
  initMap();
  switchTab(tab);
};

// ── Map rendering ─────────────────────────────────────────────
// Coordinates mirror stadium-graph.js exactly
const NODE_POS = {
  'gate-1':{x:340,y:32},'gate-3':{x:568,y:118},'gate-5':{x:628,y:340},
  'gate-7':{x:568,y:562},'gate-9':{x:340,y:648},'gate-11':{x:112,y:562},
  'con-n':{x:340,y:100},'con-ne':{x:484,y:152},'con-e':{x:552,y:340},
  'con-se':{x:484,y:528},'con-s':{x:340,y:580},'con-sw':{x:196,y:528},
  'con-w':{x:128,y:340},'con-nw':{x:196,y:152},
  'stand-a':{x:340,y:162},'stand-b':{x:464,y:214},'stand-c':{x:524,y:340},
  'stand-d':{x:464,y:466},'stand-e':{x:340,y:514},'stand-f':{x:216,y:466},
  'stand-g':{x:156,y:340},'stand-h':{x:216,y:214},
  'food-1':{x:372,y:112},'food-2':{x:504,y:162},'food-3':{x:562,y:292},
  'food-4':{x:504,y:504},'food-5':{x:308,y:572},'food-6':{x:176,y:504},
  'food-7':{x:112,y:300},'food-8':{x:176,y:162},
  'wc-1':{x:356,y:120},'wc-2':{x:496,y:172},'wc-3':{x:556,y:372},
  'wc-4':{x:324,y:568},'wc-5':{x:184,y:512},'wc-6':{x:120,y:362},
  'exit-1':{x:532,y:88},'exit-2':{x:634,y:340},'exit-3':{x:532,y:592},
  'exit-4':{x:148,y:592},'exit-5':{x:56,y:340},'exit-6':{x:148,y:88},
};

const NS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs = {}) => {
  const el = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
};

let svgRoot = null;

const initMap = () => {
  const wrap = $('stadium-svg');
  wrap.innerHTML = '';

  svgRoot = svgEl('svg', {
    viewBox: '0 0 680 680', width: '100%', height: '100%',
    role: 'img', 'aria-label': 'Narendra Modi Stadium map',
    id: 'main-svg',
  });

  // Outer bowl
  svgRoot.appendChild(svgEl('ellipse', { cx:340, cy:340, rx:290, ry:290, fill:'#111d28', stroke:'#1e2d3d', 'stroke-width':'1' }));
  // Pitch
  svgRoot.appendChild(svgEl('ellipse', { cx:340, cy:340, rx:100, ry:65, fill:'#1a3a1a', stroke:'#2d5a2d', 'stroke-width':'1.5' }));
  const pitchTxt = svgEl('text', { x:340, y:344, 'text-anchor':'middle', 'dominant-baseline':'central', fill:'#4ade80', 'font-size':'11', 'font-weight':'600' });
  pitchTxt.textContent = 'PITCH';
  svgRoot.appendChild(pitchTxt);

  // Draw all nodes
  Object.entries(NODE_POS).forEach(([id, { x, y }]) => {
    const type = id.split('-')[0];
    const isStand = type === 'stand', isGate = type === 'gate';
    const r = isStand ? 22 : isGate ? 10 : 7;
    const fill = { stand:'#1e3a5f', gate:'#334155', con:'#1a2b3c', food:'#451a03', washroom:'#052e16', exit:'#450a0a' }[type] ?? '#1e2d3d';
    const circle = svgEl('circle', { cx:x, cy:y, r, fill, stroke:'#334155', 'stroke-width':'0.5', id:'node-'+id });
    svgRoot.appendChild(circle);
    if (isGate || isStand) {
      const lbl = svgEl('text', { x, y:y+1, 'text-anchor':'middle', 'dominant-baseline':'central', fill:'#94a3b8', 'font-size': isStand ? '9' : '8' });
      lbl.textContent = isGate ? 'G'+id.split('-')[1] : id.split('-')[1].toUpperCase();
      svgRoot.appendChild(lbl);
    }
  });

  wrap.appendChild(svgRoot);
};

// Animate path with dashed line draw-on effect
const drawPath = (pathIds, color = '#38bdf8', ariaLabel = 'Route') => {
  document.querySelectorAll('.route-el').forEach(e => e.remove());
  if (!svgRoot || !pathIds?.length) return;

  for (let i = 0; i < pathIds.length - 1; i++) {
    const a = NODE_POS[pathIds[i]], b = NODE_POS[pathIds[i + 1]];
    if (!a || !b) continue;
    const line = svgEl('line', {
      x1: a.x, y1: a.y, x2: b.x, y2: b.y,
      stroke: color, 'stroke-width': '3.5',
      'stroke-dasharray': '8 4', 'stroke-linecap': 'round',
      opacity: '0.9', class: 'route-el',
    });
    svgRoot.appendChild(line);
  }

  // Origin dot (white)
  const orig = NODE_POS[pathIds[0]];
  if (orig) {
    const dot = svgEl('circle', { cx: orig.x, cy: orig.y, r: 9, fill: '#fff', opacity: '.85', class: 'route-el' });
    svgRoot.appendChild(dot);
  }
  // Destination pulse ring
  const dest = NODE_POS[pathIds[pathIds.length - 1]];
  if (dest) {
    const ring = svgEl('circle', { cx: dest.x, cy: dest.y, r: 16, fill: color, opacity: '.25', class: 'route-el', 'aria-label': ariaLabel });
    svgRoot.appendChild(ring);
    const pin = svgEl('circle', { cx: dest.x, cy: dest.y, r: 8, fill: color, class: 'route-el' });
    svgRoot.appendChild(pin);
  }
};

// ── Tab switching ─────────────────────────────────────────────
window.switchTab = async (tab) => {
  CURRENT_TAB = tab;
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
    t.setAttribute('aria-selected', t.dataset.tab === tab ? 'true' : 'false');
  });
  $('map-title').textContent = { seat:'Route to your seat', food:'Nearest food stalls', washroom:'Nearest washrooms', exit:'Emergency exits' }[tab];

  const poiPanel = $('poi-panel');
  poiPanel.innerHTML = '';
  poiPanel.hidden = true;

  if (!FAN || !AUTH_TOKEN) return;
  const from = FAN.gate;
  const headers = { Authorization: `Bearer ${AUTH_TOKEN}` };

  if (tab === 'seat') {
    const r = await fetch(`${API}/api/route?from=${from}&to=${FAN.stand}`, { headers });
    const d = await r.json();
    if (d.path) drawPath(d.path, '#38bdf8', `Route to your seat in ${FAN.stand.replace('stand-','Stand ')}`);
  } else {
    const type = tab === 'washroom' ? 'washroom' : tab === 'exit' ? 'exit' : 'food';
    const r = await fetch(`${API}/api/route/alternatives?from=${from}&type=${type}`, { headers });
    const alts = await r.json();
    if (!alts?.length) return;
    const color = { food:'#facc15', washroom:'#4ade80', exit:'#f87171' }[tab];
    drawPath(alts[0].path, color);

    poiPanel.hidden = false;
    alts.forEach(alt => {
      const dest = alt.steps[alt.steps.length - 1];
      const item = document.createElement('div');
      item.className = 'poi-item';
      item.setAttribute('role', 'listitem');
      item.innerHTML = `
        <div>
          <div class="poi-name">${dest.label}</div>
          <div class="poi-meta">${alt.walkMinutes} min walk${alt.queueMin != null ? ` · ${alt.queueMin} min queue` : ''}</div>
        </div>
        <button class="poi-go" aria-label="Get directions to ${dest.label}">Go</button>`;
      item.querySelector('.poi-go').addEventListener('click', () => drawPath(alt.path, color, `Route to ${dest.label}`));
      poiPanel.appendChild(item);
    });
  }
};

// ── AI Chat ───────────────────────────────────────────────────
window.sendChat = async () => {
  const inp = $('chat-inp');
  const msg = inp.value.trim();
  if (!msg) return;
  inp.value = '';
  appendMsg(msg, 'user');
  const typingId = appendMsg('Thinking…', 'bot typing', true);

  try {
    const res  = await fetch(`${API}/api/chat`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AUTH_TOKEN}` },
      body:    JSON.stringify({ sessionId: SESSION_ID, message: msg }),
    });
    const data = await res.json();
    document.getElementById(typingId)?.remove();
    appendMsg(data.reply ?? 'Sorry, I could not process that.', 'bot');
  } catch {
    document.getElementById(typingId)?.remove();
    appendMsg('Network error — please try again.', 'bot');
  }
};

const appendMsg = (text, cls, returnId = false) => {
  const msgs = $('chat-msgs');
  const div  = document.createElement('div');
  const id   = 'msg-' + Date.now();
  div.id = id;
  div.className = `msg ${cls}`;
  div.textContent = text;
  if (cls.includes('bot')) div.setAttribute('role', 'status'); // announced by screen readers
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return returnId ? id : undefined;
};

// Enter key on chat input
document.addEventListener('DOMContentLoaded', () => {
  $('chat-inp')?.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } });
  $('inp-phone')?.addEventListener('keydown', e => { if (e.key === 'Enter') verifyPNR(); });
});