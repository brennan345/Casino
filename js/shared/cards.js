// Shared card helpers. Cards are {r: rank, s: 's'|'h'|'d'|'c'}.
import { shuffle } from './rng.js';
export const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
export const SUITS = ['s','h','d','c'];
export const makeShoe = (decks = 1) => {
  const a = [];
  for (let d = 0; d < decks; d++) for (const s of SUITS) for (const r of RANKS) a.push({ r, s });
  return shuffle(a);
};
