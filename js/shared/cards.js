// Shared card helpers. Cards are {r: rank, s: 's'|'h'|'d'|'c'}.
import { shuffle } from './rng.js';
export const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
export const SUITS = ['s','h','d','c'];
export const makeShoe = (decks = 1) => {
  const a = [];
  for (let d = 0; d < decks; d++) for (const s of SUITS) for (const r of RANKS) a.push({ r, s });
  return shuffle(a);
};
const SUIT = { s: '♠', h: '♥', d: '♦', c: '♣' };
// Card face as HTML (styles in table.css). Pass null for a face-down card.
export const cardHTML = c => c
  ? `<span class="card ${c.s === 'h' || c.s === 'd' ? 'red' : ''}">${c.r}<i>${SUIT[c.s]}</i><b>${SUIT[c.s]}</b></span>`
  : '<span class="card down"></span>';
