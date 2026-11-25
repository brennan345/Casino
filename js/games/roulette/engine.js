// Roulette engine: pure game logic, no DOM. Pockets are numbers 0..36; 37 means "00" (American only).
import { randomInt } from '../../shared/rng.js';
const REDS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
export const label = p => p === 37 ? '00' : String(p);
export const color = p => p === 0 || p === 37 ? 'green' : REDS.includes(p) ? 'red' : 'black';
export const pockets = wheel => wheel === 'american' ? 38 : 37;
export const spin = wheel => randomInt(pockets(wheel));
const run = (s, c) => Array.from({ length: c }, (_, i) => s + i);
const all = run(1, 36);
const OUT = {
  red: { nums: REDS, name: 'Red' }, black: { nums: all.filter(n => !REDS.includes(n)), name: 'Black' },
  odd: { nums: all.filter(n => n % 2), name: 'Odd' }, even: { nums: all.filter(n => !(n % 2)), name: 'Even' },
  low: { nums: run(1, 18), name: '1-18' }, high: { nums: run(19, 18), name: '19-36' }
};
// Bet keys: st:n  sp:a-b  sr:n (street, n=1,4,..)  co:n (corner, lowest number)  sx:n (six line)  five  dz:1-3  cl:1-3  red black odd even low high
export function betDef(key) {
  if (OUT[key]) return { ...OUT[key], pays: 1 };
  const [k, a] = key.split(':'), n = +a;
  switch (k) {
    case 'st': return { nums: [n], pays: 35, name: `Straight ${label(n)}` };
    case 'sp': { const [x, y] = a.split('-').map(Number); return { nums: [x, y], pays: 17, name: `Split ${label(x)}-${label(y)}` }; }
    case 'sr': return { nums: run(n, 3), pays: 11, name: `Street ${n}-${n + 2}` };
    case 'co': return { nums: [n, n + 1, n + 3, n + 4], pays: 8, name: `Corner ${n}-${n + 4}` };
    case 'sx': return { nums: run(n, 6), pays: 5, name: `Six line ${n}-${n + 5}` };
    case 'dz': return { nums: run(12 * (n - 1) + 1, 12), pays: 2, name: `${['1st', '2nd', '3rd'][n - 1]} dozen` };
    case 'cl': return { nums: run(0, 12).map(i => 3 * i + n), pays: 2, name: `Column ${n}` };
  }
  if (key === 'five') return { nums: [0, 37, 1, 2, 3], pays: 6, name: 'Five-number (0, 00, 1, 2, 3)' };
  throw new Error('bad bet ' + key);
}
// House edge as a fraction: 1 - (numbers covered * (pays + 1)) / pockets
export const edge = (def, wheel) => 1 - def.nums.length * (def.pays + 1) / pockets(wheel);
export function resolve(bets, pocket) { // bets = { key: amount }; net is profit/loss for the spin
  let net = 0; const wins = [];
  for (const [k, v] of Object.entries(bets)) {
    const d = betDef(k);
    if (d.nums.includes(pocket)) { net += v * d.pays; wins.push(k); } else net -= v;
  }
  return { net, wins };
}
