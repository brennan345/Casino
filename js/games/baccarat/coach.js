// Coach: house edge per bet, flags the tie bet, explains the third-card rules after each round.
import { EDGE, PAYS, total } from './engine.js';
const $ = n => '$' + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
const pct = e => (e * 100).toFixed(2) + '%';
const NAME = { player: 'Player', banker: 'Banker', tie: 'Tie' };
export const betNote = k => `${NAME[k]}: pays ${k === 'banker' ? '1 to 1 minus 5% commission' : PAYS[k] + ' to 1'}, house edge ${pct(EDGE[k])}.`
  + (k === 'tie' ? ' The tie bet looks tempting but it is the worst bet on the table.' : k === 'banker' ? ' The best bet on the table.' : '');
export const general = 'House edge: Banker 1.06%, Player 1.24%, Tie 14.36%. Banker is the best bet; skip the tie.';
export function explain(r) {
  if (r.natural) return `Natural ${Math.max(r.pTotal, r.bTotal)}: nobody draws.`;
  const p2 = total(r.player.slice(0, 2)), b2 = total(r.banker.slice(0, 2)), bd = r.banker.length === 3 ? 'drew' : 'stood';
  return `Player had ${p2} and ${r.player.length === 3 ? 'drew' : 'stood'}. Banker had ${b2} and ${bd}`
    + (r.p3 === null ? ' (Player stood, so Banker draws on 0-5).' : ` against a Player third card of ${r.p3}.`);
}
export function feedback(bets, r) {
  let cost = 0, tot = 0;
  for (const [k, v] of Object.entries(bets)) { cost += v * EDGE[k]; tot += v; }
  return `${explain(r)} Wagered ${$(tot)}, about ${$(cost)} expected cost.` + ('tie' in bets ? ' Tie is the worst bet (14.36%).' : '');
}
