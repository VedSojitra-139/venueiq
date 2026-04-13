const TICKETS = [
  { pnr:'IND2024001', phone:'9999999999', name:'Arjun Mehta',    gate:'gate-7',  stand:'stand-c', block:'C4', row:'F', seat:'22' },
  { pnr:'IND2024002', phone:'9888888888', name:'Priya Shah',     gate:'gate-3',  stand:'stand-a', block:'A2', row:'C', seat:'11' },
  { pnr:'IND2024003', phone:'9777777777', name:'Rahul Verma',    gate:'gate-9',  stand:'stand-e', block:'E1', row:'A', seat:'5'  },
  { pnr:'IND2024004', phone:'9666666666', name:'Sneha Patel',    gate:'gate-1',  stand:'stand-g', block:'G3', row:'D', seat:'18' },
  { pnr:'IND2024005', phone:'9555555555', name:'Karan Joshi',    gate:'gate-5',  stand:'stand-b', block:'B2', row:'H', seat:'30' },
  { pnr:'IND2024006', phone:'9444444444', name:'Meera Iyer',     gate:'gate-11', stand:'stand-f', block:'F5', row:'B', seat:'7'  },
  { pnr:'IND2024007', phone:'9333333333', name:'Aditya Rao',     gate:'gate-7',  stand:'stand-c', block:'C4', row:'G', seat:'14' },
  { pnr:'IND2024008', phone:'9222222222', name:'Divya Nair',     gate:'gate-3',  stand:'stand-a', block:'A1', row:'E', seat:'9'  },
  { pnr:'IND2024009', phone:'9111111111', name:'Vikram Singh',   gate:'gate-9',  stand:'stand-d', block:'D3', row:'F', seat:'25' },
  { pnr:'IND2024010', phone:'9000000000', name:'Ananya Gupta',   gate:'gate-5',  stand:'stand-b', block:'B4', row:'C', seat:'16' },
  { pnr:'IND2024011', phone:'8999999999', name:'Rohan Kapoor',   gate:'gate-1',  stand:'stand-h', block:'H2', row:'A', seat:'3'  },
  { pnr:'IND2024012', phone:'8888888888', name:'Simran Gill',    gate:'gate-11', stand:'stand-f', block:'F2', row:'D', seat:'20' },
  { pnr:'IND2024013', phone:'8777777777', name:'Nikhil Das',     gate:'gate-7',  stand:'stand-c', block:'C1', row:'B', seat:'8'  },
  { pnr:'IND2024014', phone:'8666666666', name:'Pooja Menon',    gate:'gate-3',  stand:'stand-a', block:'A3', row:'G', seat:'27' },
  { pnr:'IND2024015', phone:'8555555555', name:'Amit Sharma',    gate:'gate-9',  stand:'stand-e', block:'E4', row:'H', seat:'33' },
  { pnr:'IND2024016', phone:'8444444444', name:'Kavya Reddy',    gate:'gate-5',  stand:'stand-b', block:'B1', row:'A', seat:'2'  },
  { pnr:'IND2024017', phone:'8333333333', name:'Suresh Kumar',   gate:'gate-1',  stand:'stand-g', block:'G5', row:'E', seat:'19' },
  { pnr:'IND2024018', phone:'8222222222', name:'Nisha Bose',     gate:'gate-11', stand:'stand-f', block:'F3', row:'C', seat:'13' },
  { pnr:'IND2024019', phone:'8111111111', name:'Deepak Tiwari',  gate:'gate-7',  stand:'stand-c', block:'C2', row:'F', seat:'24' },
  { pnr:'IND2024020', phone:'8000000000', name:'Ritu Choudhary', gate:'gate-3',  stand:'stand-a', block:'A4', row:'D', seat:'15' },
];

const lookup  = (pnr, phone) =>
  TICKETS.find(t => t.pnr === pnr.toUpperCase().trim() && t.phone === phone.trim()) ?? null;

const getAll = () => [...TICKETS]; // return copy — no external mutation

module.exports = { lookup, getAll };