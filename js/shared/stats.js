// Per-game stats. record() is what each game calls after a hand/round.
import { storage } from './storage.js';
export const GAMES = ['blackjack', 'roulette', 'baccarat', 'craps', 'holdem'];
const blank = () => ({ hands: 0, wins: 0, net: 0 });
export const get = game => ({ ...blank(), ...storage.get('stats:' + game, {}) });
export const record = (game, net, won) => {
  const s = get(game); s.hands++; s.net += net; if (won) s.wins++;
  storage.set('stats:' + game, s);
};
export const winRate = s => (s.hands ? (100 * s.wins / s.hands).toFixed(1) + '%' : '—');
export const resetAll = () => GAMES.forEach(g => storage.remove('stats:' + g));
// Later: blackjack strategy accuracy + most-missed hands, hold'em net bb/100.
// Strategy decisions (blackjack): accuracy + which spots you miss most.
export const recordDecision = (game, key, ok) => {
  const s = get(game); s.acc = s.acc || { r: 0, t: 0 }; s.acc.t++;
  if (ok) s.acc.r++; else { s.missed = s.missed || {}; s.missed[key] = (s.missed[key] || 0) + 1; }
  storage.set('stats:' + game, s);
};
