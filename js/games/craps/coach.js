// Coach: steers you to pass/come plus odds and warns about the costly middle-of-the-table bets.
import { EDGE, MULT } from './engine.js';
const pct = e => (e * 100).toFixed(2) + '%';
const $ = n => '$' + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
export const general = 'Best bets: Pass/Don\'t Pass or Come/Don\'t Come (about 1.4% edge), then take odds (0% edge). Avoid Field (2.78%) and Place 4/10 (6.67%).';
export function betNote(key, g) {
  const [a, n] = key.split(':');
  const m = {
    pass: ['Pass Line', EDGE.pass, 'pays 1 to 1', 'A solid bet. Back it with odds once the point is set.'],
    dont: ["Don't Pass", EDGE.dont, 'pays 1 to 1 (a 12 on the come-out is a push)', 'A solid bet, slightly cheaper than the Pass Line.'],
    come: ['Come', EDGE.pass, 'pays 1 to 1', 'Same as the Pass Line but you can bet it any time the point is on.'],
    dcome: ["Don't Come", EDGE.dont, 'pays 1 to 1 (a 12 is a push)', 'Same as Don\'t Pass but any time the point is on.'],
    field: ['Field', EDGE.field, 'pays 1 to 1, 2 pays 2 to 1, 12 pays 3 to 1', 'A one-roll bet that costs double the Pass Line. Skip it if you want value.'],
  }[a];
  if (m) return `${m[0]}: ${m[2]}, house edge ${pct(m[1])}. ${m[3]}`;
  if (a === 'place') { const e = EDGE['place' + (n === '8' ? 6 : n === '9' ? 5 : n === '10' ? 4 : n)];
    const pay = n === '6' || n === '8' ? '7 to 6' : n === '5' || n === '9' ? '7 to 5' : '9 to 5';
    return `Place ${n}: pays ${pay}, house edge ${pct(e)}.` + (e > 0.03 ? ' Expensive: Pass/Come plus odds costs far less.' : ' Fair price, but Pass/Come plus odds is still cheaper. Off on come-out rolls.'); }
  if (a === 'passOdds') return `Pass odds: 0% house edge, the best bet in the casino. Max ${MULT[g.point]}x your Pass Line bet on a ${g.point}.`;
  if (a === 'dontOdds') return "Don't pass lay odds: 0% house edge. You can lay up to 6x your bet (winning up to 3x to 5x).";
  if (a === 'codds') return `Come odds on ${n}: 0% house edge. Max ${MULT[n]}x your Come bet.`;
  if (a === 'dodds') return `Don't come lay odds on ${n}: 0% house edge. Lay up to 6x.`;
  return '';
}
export function feedback(res, snap) { // snap = table before the roll
  const tips = [];
  if (snap.field) tips.push('The Field costs 2.78% per roll, double the Pass Line.');
  const bad = Object.keys(snap.place).filter(n => n === '4' || n === '10' || n === '5' || n === '9');
  if (bad.length) tips.push(`Place ${bad.join('/')} costs ${bad.some(n => n === '4' || n === '10') ? '6.67%' : '4.00%'}; Pass/Come plus odds is cheaper.`);
  if (!tips.length && snap.point !== null && snap.pass && !snap.passOdds) tips.push(`You can back your Pass Line with up to ${MULT[snap.point]}x odds (0% edge).`);
  if (!tips.length && snap.point !== null && snap.dont && !snap.dontOdds) tips.push('You can lay odds behind Don\'t Pass (0% edge).');
  if (!tips.length && Object.values(snap.comes).some(c => !c.odds)) tips.push('Your Come bets can take odds too: tap the strip at the top of the number.');
  if (!tips.length) tips.push(snap.point === null && !snap.pass && !snap.dont ? 'Tip: start with a Pass or Don\'t Pass bet.' : 'Your money is on low-edge bets. Nice.');
  return tips[0];
}
