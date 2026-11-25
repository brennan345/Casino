export const CHIPS = [1, 5, 25, 100, 500];
export const LIMITS = { min: 5, max: 500 }; // blackjack, roulette, baccarat, craps
// A stack of chips worth `amount` (largest chips at the bottom). Styles live in table.css (.chip, .stack).
export function stackHTML(amount, max = 14) {
  const chips = []; let a = amount;
  for (const d of [500, 100, 25, 5, 1]) while (a >= d && chips.length < max) { chips.push(d); a -= d; }
  if (!chips.length) return '';
  return `<div class="stack" style="height:${7.6 + (chips.length - 1) * 0.8}cqw">${chips.map((d, i) => `<span class="chip c${d}" data-n="${d}" style="bottom:${i * 0.8}cqw"></span>`).join('')}</div>`;
}
