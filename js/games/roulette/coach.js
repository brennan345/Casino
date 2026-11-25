// Coach: shows the house edge for every bet and flags the five-number bet.
import { betDef, edge } from './engine.js';
const pct = e => (e * 100).toFixed(2) + '%';
const $ = n => '$' + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
export const betNote = (k, w) => { const d = betDef(k);
  return `${d.name}: pays ${d.pays} to 1, house edge ${pct(edge(d, w))}.` + (k === 'five' ? ' This is the worst bet on the table.' : ''); };
export const general = w => w === 'american'
  ? 'Every American bet has a 5.26% house edge except the five-number bet at 7.89%. Avoid that one.'
  : 'Every European bet has a 2.70% house edge. No bet is better than another; the green 0 is the house.';
export function feedback(bets, w) {
  let cost = 0, total = 0;
  for (const [k, v] of Object.entries(bets)) { cost += v * edge(betDef(k), w); total += v; }
  return `You wagered ${$(total)}, which costs about ${$(cost)} per spin on average.` +
    ('five' in bets ? ' The five-number bet is the worst on the table (7.89%).' : '') +
    (w === 'american' ? ' The European wheel cuts the edge about in half.' : '');
}
