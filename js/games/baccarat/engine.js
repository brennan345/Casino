// Baccarat engine: pure game logic, no DOM. Punto Banco, 8 decks.
import { makeShoe } from '../../shared/cards.js';
const DECKS = 8, RESHUFFLE_BELOW = 14;
export const PAYS = { player: 1, banker: 0.95, tie: 8 }; // banker = 1:1 minus 5% commission
export const EDGE = { banker: 0.0106, player: 0.0124, tie: 0.1436 };
export const cardValue = c => ['10', 'J', 'Q', 'K'].includes(c.r) ? 0 : c.r === 'A' ? 1 : +c.r;
export const total = cs => cs.reduce((a, c) => a + cardValue(c), 0) % 10;
export const createTable = () => ({ shoe: makeShoe(DECKS), pos: 0, shuffled: false });
export const playerDraws = pt => pt <= 5;
// p3 = value (0-9) of the player's third card, or null if the player stood.
export function bankerDraws(bt, p3) {
  if (p3 === null) return bt <= 5;
  if (bt <= 2) return true;
  if (bt === 3) return p3 !== 8;
  if (bt === 4) return p3 >= 2 && p3 <= 7;
  if (bt === 5) return p3 >= 4 && p3 <= 7;
  if (bt === 6) return p3 === 6 || p3 === 7;
  return false;
}
export function playRound(t) {
  t.shuffled = false;
  if (t.shoe.length - t.pos < RESHUFFLE_BELOW) { t.shoe = makeShoe(DECKS); t.pos = 0; t.shuffled = true; }
  const d = () => t.shoe[t.pos++];
  const P = [d()], B = [d()]; P.push(d()); B.push(d());
  const natural = total(P) >= 8 || total(B) >= 8; let p3 = null;
  if (!natural) {
    if (playerDraws(total(P))) { const c = d(); P.push(c); p3 = cardValue(c); }
    if (bankerDraws(total(B), p3)) B.push(d());
  }
  const pTotal = total(P), bTotal = total(B);
  return { player: P, banker: B, pTotal, bTotal, natural, p3, winner: pTotal > bTotal ? 'player' : bTotal > pTotal ? 'banker' : 'tie' };
}
// bets = { player, banker, tie } amounts. Player/banker bets push on a tie. Returns profit/loss.
export function settle(bets, winner) {
  let net = 0;
  for (const [k, v] of Object.entries(bets)) {
    if (winner === 'tie' && k !== 'tie') continue;
    net += k === winner ? v * PAYS[k] : -v;
  }
  return Math.round(net * 100) / 100;
}
