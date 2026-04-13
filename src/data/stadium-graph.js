const NODES = {
  // Entry gates — perimeter
  'gate-1':  { label:'Gate 1',           type:'gate',      x:340, y:32  },
  'gate-3':  { label:'Gate 3',           type:'gate',      x:568, y:118 },
  'gate-5':  { label:'Gate 5',           type:'gate',      x:628, y:340 },
  'gate-7':  { label:'Gate 7',           type:'gate',      x:568, y:562 },
  'gate-9':  { label:'Gate 9',           type:'gate',      x:340, y:648 },
  'gate-11': { label:'Gate 11',          type:'gate',      x:112, y:562 },
  // Concourse ring
  'con-n':   { label:'North concourse',  type:'concourse', x:340, y:100 },
  'con-ne':  { label:'NE concourse',     type:'concourse', x:484, y:152 },
  'con-e':   { label:'East concourse',   type:'concourse', x:552, y:340 },
  'con-se':  { label:'SE concourse',     type:'concourse', x:484, y:528 },
  'con-s':   { label:'South concourse',  type:'concourse', x:340, y:580 },
  'con-sw':  { label:'SW concourse',     type:'concourse', x:196, y:528 },
  'con-w':   { label:'West concourse',   type:'concourse', x:128, y:340 },
  'con-nw':  { label:'NW concourse',     type:'concourse', x:196, y:152 },
  // Stands
  'stand-a': { label:'Stand A — North',  type:'stand', x:340, y:162, capacity:2000 },
  'stand-b': { label:'Stand B — NE',     type:'stand', x:464, y:214, capacity:1800 },
  'stand-c': { label:'Stand C — East',   type:'stand', x:524, y:340, capacity:2200 },
  'stand-d': { label:'Stand D — SE',     type:'stand', x:464, y:466, capacity:1800 },
  'stand-e': { label:'Stand E — South',  type:'stand', x:340, y:514, capacity:2000 },
  'stand-f': { label:'Stand F — SW',     type:'stand', x:216, y:466, capacity:1800 },
  'stand-g': { label:'Stand G — West',   type:'stand', x:156, y:340, capacity:2200 },
  'stand-h': { label:'Stand H — NW',     type:'stand', x:216, y:214, capacity:1800 },
  // Food stalls
  'food-1':  { label:'Food Court — North',  type:'food', x:372, y:112, queueBase:3 },
  'food-2':  { label:'Food Court — NE',     type:'food', x:504, y:162, queueBase:5 },
  'food-3':  { label:'Food Court — East',   type:'food', x:562, y:292, queueBase:4 },
  'food-4':  { label:'Food Court — SE',     type:'food', x:504, y:504, queueBase:6 },
  'food-5':  { label:'Food Court — South',  type:'food', x:308, y:572, queueBase:4 },
  'food-6':  { label:'Food Court — SW',     type:'food', x:176, y:504, queueBase:3 },
  'food-7':  { label:'Food Court — West',   type:'food', x:112, y:300, queueBase:5 },
  'food-8':  { label:'Food Court — NW',     type:'food', x:176, y:162, queueBase:4 },
  // Washrooms
  'wc-1': { label:'Washroom — North', type:'washroom', x:356, y:120 },
  'wc-2': { label:'Washroom — NE',    type:'washroom', x:496, y:172 },
  'wc-3': { label:'Washroom — East',  type:'washroom', x:556, y:372 },
  'wc-4': { label:'Washroom — South', type:'washroom', x:324, y:568 },
  'wc-5': { label:'Washroom — SW',    type:'washroom', x:184, y:512 },
  'wc-6': { label:'Washroom — West',  type:'washroom', x:120, y:362 },
  // Emergency exits
  'exit-1': { label:'Emergency Exit — NE', type:'exit', x:532, y:88  },
  'exit-2': { label:'Emergency Exit — E',  type:'exit', x:634, y:340 },
  'exit-3': { label:'Emergency Exit — SE', type:'exit', x:532, y:592 },
  'exit-4': { label:'Emergency Exit — SW', type:'exit', x:148, y:592 },
  'exit-5': { label:'Emergency Exit — W',  type:'exit', x:56,  y:340 },
  'exit-6': { label:'Emergency Exit — NW', type:'exit', x:148, y:88  },
};

// [nodeA, nodeB, distanceMetres]
const EDGES = [
  ['gate-1',  'con-n',  40], ['gate-3',  'con-ne', 40],
  ['gate-5',  'con-e',  40], ['gate-7',  'con-se', 40],
  ['gate-9',  'con-s',  40], ['gate-11', 'con-sw', 40],
  ['con-n',  'con-ne', 80], ['con-ne', 'con-e',  80],
  ['con-e',  'con-se', 80], ['con-se', 'con-s',  80],
  ['con-s',  'con-sw', 80], ['con-sw', 'con-w',  80],
  ['con-w',  'con-nw', 80], ['con-nw', 'con-n',  80],
  ['con-n',  'stand-a', 30], ['con-ne', 'stand-b', 30],
  ['con-e',  'stand-c', 30], ['con-se', 'stand-d', 30],
  ['con-s',  'stand-e', 30], ['con-sw', 'stand-f', 30],
  ['con-w',  'stand-g', 30], ['con-nw', 'stand-h', 30],
  ['con-n',  'food-1', 15], ['con-ne', 'food-2', 15],
  ['con-e',  'food-3', 15], ['con-se', 'food-4', 15],
  ['con-s',  'food-5', 15], ['con-sw', 'food-6', 15],
  ['con-w',  'food-7', 15], ['con-nw', 'food-8', 15],
  ['con-n',  'wc-1', 10], ['con-ne', 'wc-2', 10],
  ['con-e',  'wc-3', 10], ['con-s',  'wc-4', 10],
  ['con-sw', 'wc-5', 10], ['con-w',  'wc-6', 10],
  ['con-ne', 'exit-1', 20], ['con-e',  'exit-2', 20],
  ['con-se', 'exit-3', 20], ['con-sw', 'exit-4', 20],
  ['con-w',  'exit-5', 20], ['con-nw', 'exit-6', 20],
];

const buildGraph = () => {
  const g = Object.fromEntries(Object.keys(NODES).map(n => [n, []]));
  EDGES.forEach(([a, b, d]) => {
    g[a].push({ node: b, dist: d });
    g[b].push({ node: a, dist: d });
  });
  return Object.freeze(g);
};

module.exports = { NODES, EDGES, buildGraph };