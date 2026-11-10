// Blackjack engine: pure game logic, no DOM. 6 decks, S17, 3:2, DAS, split to 4, one card on split aces.
import { makeShoe } from '../../shared/cards.js';
const DECKS = 6, PEN = 0.75;
export const val = r => r === 'A' ? 11 : ['10','J','Q','K'].includes(r) ? 10 : +r;
export function handTotal(cards) {
  let t = 0, a = 0;
  for (const c of cards) { t += val(c.r); if (c.r === 'A') a++; }
  while (t > 21 && a > 0) { t -= 10; a--; }
  return { total: t, soft: a > 0 };
}
const isBJ = h => !h.split && h.cards.length === 2 && handTotal(h.cards).total === 21;
const draw = t => t.shoe[t.pos++];

export function createTable() {
  const t = { shoe: makeShoe(DECKS), pos: 0, phase: 'bet', insurance: 0, hands: [], dealer: [], active: 0, net: 0 };
  t.cut = Math.floor(t.shoe.length * PEN);
  return t;
}
export function startRound(t, bet) {
  t.shuffled = false;
  if (t.pos >= t.cut) { t.shoe = makeShoe(DECKS); t.pos = 0; t.shuffled = true; }
  const h = { cards: [], bet, done: false, split: false, aces: false, doubled: false };
  Object.assign(t, { hands: [h], dealer: [], active: 0, insurance: 0, net: 0, paid: false });
  h.cards.push(draw(t)); t.dealer.push(draw(t)); h.cards.push(draw(t)); t.dealer.push(draw(t));
  if (t.dealer[0].r === 'A') { t.phase = 'insurance'; return t; }
  return afterInsurance(t);
}
export function takeInsurance(t, yes) {
  if (yes) t.insurance = t.hands[0].bet / 2;
  return afterInsurance(t);
}
function afterInsurance(t) { // dealer peeks (A or 10 up); round ends on any blackjack
  if (handTotal(t.dealer).total === 21 || isBJ(t.hands[0])) return finish(t);
  t.phase = 'player'; return t;
}
export function legal(t, funds) {
  if (t.phase !== 'player') return [];
  const h = t.hands[t.active], two = h.cards.length === 2, a = ['hit', 'stand'];
  if (two && funds >= h.bet) a.push('double');
  if (two && !h.aces && t.hands.length < 4 && funds >= h.bet && val(h.cards[0].r) === val(h.cards[1].r)) a.push('split');
  return a;
}
export function act(t, action) {
  const h = t.hands[t.active];
  if (action === 'hit') { h.cards.push(draw(t)); if (handTotal(h.cards).total >= 21) h.done = true; }
  else if (action === 'stand') h.done = true;
  else if (action === 'double') { h.bet *= 2; h.doubled = true; h.cards.push(draw(t)); h.done = true; }
  else if (action === 'split') {
    const [c1, c2] = h.cards, ace = c1.r === 'A';
    h.cards = [c1, draw(t)]; h.split = true; h.aces = ace;
    const n = { cards: [c2, draw(t)], bet: h.bet, done: false, split: true, aces: ace, doubled: false };
    t.hands.splice(t.active + 1, 0, n);
    for (const x of [h, n]) if (ace || handTotal(x.cards).total === 21) x.done = true;
  }
  while (t.hands[t.active] && t.hands[t.active].done) t.active++;
  if (t.active >= t.hands.length) finish(t);
  return t;
}
function finish(t) {
  const live = t.hands.some(h => handTotal(h.cards).total <= 21 && !isBJ(h));
  if (live && handTotal(t.dealer).total !== 21) {
    while (handTotal(t.dealer).total < 17) t.dealer.push(draw(t)); // stands on all 17s
  }
  const d = handTotal(t.dealer).total, dBJ = t.dealer.length === 2 && d === 21;
  let net = 0;
  for (const h of t.hands) {
    const p = handTotal(h.cards).total; let res, n;
    if (p > 21) { res = 'bust'; n = -h.bet; }
    else if (isBJ(h)) { if (dBJ) { res = 'push'; n = 0; } else { res = 'blackjack'; n = h.bet * 1.5; } }
    else if (dBJ) { res = 'lose'; n = -h.bet; }
    else if (d > 21 || p > d) { res = 'win'; n = h.bet; }
    else if (p === d) { res = 'push'; n = 0; }
    else { res = 'lose'; n = -h.bet; }
    h.result = res; net += n;
  }
  if (t.insurance) net += dBJ ? t.insurance * 2 : -t.insurance;
  t.net = net; t.phase = 'done'; return t;
}
