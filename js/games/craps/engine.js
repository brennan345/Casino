// Craps engine, pass 1 (core bets): pure game logic, no DOM.
// Bets: pass/don't pass (+odds), come/don't come (+odds on each number), place 4-10, field.
// Hardways and one-roll props come in pass 2.
import { randomInt } from '../../shared/rng.js';
import { LIMITS } from '../../shared/chips.js';
export const NUMS = [4, 5, 6, 8, 9, 10];
export const MULT = { 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3 };           // max odds multiple (3-4-5x)
const ODDS = { 4: 2, 5: 1.5, 6: 1.2, 8: 1.2, 9: 1.5, 10: 2 };          // odds payout: 2:1, 3:2, 6:5
const LAY = { 4: 1 / 2, 5: 2 / 3, 6: 5 / 6, 8: 5 / 6, 9: 2 / 3, 10: 1 / 2 }; // lay odds: 1:2, 2:3, 5:6
const PLACE = { 4: 9 / 5, 5: 7 / 5, 6: 7 / 6, 8: 7 / 6, 9: 7 / 5, 10: 9 / 5 };
export const EDGE = { pass: 0.0141, dont: 0.0136, field: 0.0278, place4: 0.0667, place5: 0.04, place6: 0.0152 };
export const rollDice = () => [randomInt(6) + 1, randomInt(6) + 1];
export const newGame = () => ({ point: null, pass: 0, passOdds: 0, dont: 0, dontOdds: 0, come: 0, dcome: 0, comes: {}, dcomes: {}, place: {}, field: 0 });
export const snapshot = g => JSON.parse(JSON.stringify(g));
const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
export const onTable = g => g.pass + g.passOdds + g.dont + g.dontOdds + g.come + g.dcome + g.field + sum(g.place)
  + Object.values(g.comes).reduce((a, c) => a + c.amt + c.odds, 0) + Object.values(g.dcomes).reduce((a, c) => a + c.amt + c.odds, 0);
export const flatOK = g => [g.pass, g.dont, g.come, g.dcome, g.field, ...Object.values(g.place)].every(v => !v || v >= LIMITS.min);

export function getv(g, k) {
  const [a, n] = k.split(':');
  if (a === 'place') return g.place[n] || 0;
  if (a === 'codds') return g.comes[n]?.odds || 0;
  if (a === 'dodds') return g.dcomes[n]?.odds || 0;
  return g[a] || 0;
}
function setv(g, k, v) {
  const [a, n] = k.split(':');
  if (a === 'place') { if (v > 0) g.place[n] = v; else delete g.place[n]; }
  else if (a === 'codds') g.comes[n].odds = v;
  else if (a === 'dodds') g.dcomes[n].odds = v;
  else g[a] = v;
}
export const add = (g, k, amt) => setv(g, k, getv(g, k) + amt);
export const remove = (g, k, amt) => setv(g, k, Math.max(0, getv(g, k) - amt));
// Which bet does tapping a zone mean right now? (Pass Line becomes pass odds once the point is on.)
export function target(g, k) {
  const [a, n] = k.split(':'), on = g.point !== null;
  if (a === 'pass' || a === 'dont') return !on ? { key: a } : g[a] ? { key: a + 'Odds' } : { err: `The ${a === 'pass' ? 'Pass Line' : "Don't Pass"} can only be bet before the point is set. Use ${a === 'pass' ? 'Come' : "Don't Come"} instead.` };
  if (a === 'come' || a === 'dcome') return on ? { key: a } : { err: 'Come bets need a point. Bet the Pass Line first, then roll.' };
  if (a === 'codds') return g.comes[n] ? { key: k } : { err: `You have no Come bet on ${n} yet.` };
  if (a === 'dodds') return g.dcomes[n] ? { key: k } : { err: `You have no Don't Come bet on ${n} yet.` };
  return { key: k };
}
export function maxAmount(g, key) {
  const [a, n] = key.split(':');
  if (a === 'passOdds') return g.pass * MULT[g.point];
  if (a === 'dontOdds') return g.dont * 6; // laying 6x always risks to win up to 3x/4x/5x
  if (a === 'codds') return g.comes[n].amt * MULT[n];
  if (a === 'dodds') return g.dcomes[n].amt * 6;
  return LIMITS.max;
}
// Clear: removes everything that isn't locked in (locked = pass/don't pass after the point, come bets on a number).
export function clearSoft(g) {
  g.field = 0; g.place = {}; g.come = 0; g.dcome = 0; g.passOdds = 0; g.dontOdds = 0;
  for (const c of Object.values(g.comes)) c.odds = 0;
  for (const c of Object.values(g.dcomes)) c.odds = 0;
  if (g.point === null) { g.pass = 0; g.dont = 0; }
}
export function roll(g, d1, d2) {
  const r = d1 + d2, ev = [], w = g.point, working = w !== null; let note = '';
  const pay = (name, net) => ev.push({ name, net });
  if (g.field) { const a = g.field; g.field = 0; pay('Field', [3, 4, 9, 10, 11].includes(r) ? a : r === 2 ? 2 * a : r === 12 ? 3 * a : -a); }
  for (const n of Object.keys(g.comes)) { const c = g.comes[n]; // odds are off on a come-out roll
    if (r === 7) { pay(`Come ${n}`, -(c.amt + (working ? c.odds : 0))); delete g.comes[n]; }
    else if (r == n) { pay(`Come ${n}`, c.amt + (working ? c.odds * ODDS[n] : 0)); delete g.comes[n]; } }
  for (const n of Object.keys(g.dcomes)) { const c = g.dcomes[n];
    if (r === 7) { pay(`Don't come ${n}`, c.amt + (working ? c.odds * LAY[n] : 0)); delete g.dcomes[n]; }
    else if (r == n) { pay(`Don't come ${n}`, -(c.amt + (working ? c.odds : 0))); delete g.dcomes[n]; } }
  if (g.come) { const a = g.come; g.come = 0;
    if (r === 7 || r === 11) pay('Come', a); else if ([2, 3, 12].includes(r)) pay('Come', -a);
    else { const c = g.comes[r] || { amt: 0, odds: 0 }; c.amt += a; g.comes[r] = c; note += `Come bet moves to ${r}. `; } }
  if (g.dcome) { const a = g.dcome; g.dcome = 0;
    if (r === 2 || r === 3) pay("Don't come", a); else if (r === 7 || r === 11) pay("Don't come", -a); else if (r === 12) pay("Don't come", 0);
    else { const c = g.dcomes[r] || { amt: 0, odds: 0 }; c.amt += a; g.dcomes[r] = c; note += `Don't come bet moves to ${r}. `; } }
  if (!working) {
    if (g.pass) { if (r === 7 || r === 11) { pay('Pass line', g.pass); g.pass = 0; } else if ([2, 3, 12].includes(r)) { pay('Pass line', -g.pass); g.pass = 0; } }
    if (g.dont) { if (r === 2 || r === 3) { pay("Don't pass", g.dont); g.dont = 0; } else if (r === 7 || r === 11) { pay("Don't pass", -g.dont); g.dont = 0; } else if (r === 12) { pay("Don't pass", 0); g.dont = 0; } }
    if (NUMS.includes(r)) { g.point = r; note += `Point is ${r}. `; }
  } else if (r === w) {
    if (g.pass) pay('Pass line', g.pass); if (g.passOdds) pay('Pass odds', g.passOdds * ODDS[w]);
    if (g.dont) pay("Don't pass", -g.dont); if (g.dontOdds) pay("Don't pass odds", -g.dontOdds);
    Object.assign(g, { pass: 0, passOdds: 0, dont: 0, dontOdds: 0, point: null }); note += 'Point made. ';
  } else if (r === 7) {
    if (g.pass) pay('Pass line', -g.pass); if (g.passOdds) pay('Pass odds', -g.passOdds);
    if (g.dont) pay("Don't pass", g.dont); if (g.dontOdds) pay("Don't pass odds", g.dontOdds * LAY[w]);
    Object.assign(g, { pass: 0, passOdds: 0, dont: 0, dontOdds: 0, point: null }); note += 'Seven out. ';
  }
  if (working) { // place bets are off on come-out rolls
    if (r === 7) { for (const n of Object.keys(g.place)) pay(`Place ${n}`, -g.place[n]); g.place = {}; }
    else if (g.place[r]) pay(`Place ${r}`, g.place[r] * PLACE[r]);
  }
  return { total: r, d1, d2, events: ev, note: note.trim(), net: Math.round(ev.reduce((a, e) => a + e.net, 0) * 100) / 100 };
}
