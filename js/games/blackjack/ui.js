import * as E from './engine.js';
import * as coach from './coach.js';
import * as bank from '../../shared/bankroll.js';
import * as stats from '../../shared/stats.js';
import * as settings from '../../shared/settings.js';
import { CHIPS, LIMITS, stackHTML } from '../../shared/chips.js';

const SUIT = { s: '♠', h: '♥', d: '♦', c: '♣' }, ACT = { hit: 'Hit', stand: 'Stand', double: 'Double', split: 'Split' };
const RES = { blackjack: 'Blackjack', win: 'Win', push: 'Push', lose: 'Lose', bust: 'Bust' };
let t = E.createTable(), bet = 0, msg = '', root, goHome; // table persists while the app is open
const money = n => '$' + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
const inRound = () => t.phase === 'player' || t.phase === 'insurance';
const avail = () => bank.getBalance() - (inRound() ? t.hands.reduce((a, h) => a + h.bet, 0) + t.insurance : 0);
const card = c => c ? `<span class="card ${c.s === 'h' || c.s === 'd' ? 'red' : ''}">${c.r}<i>${SUIT[c.s]}</i><b>${SUIT[c.s]}</b></span>` : '<span class="card down"></span>';
const tot = cs => { const x = E.handTotal(cs); return (x.soft && x.total < 21 ? 'soft ' : '') + x.total; };
const rec = (k, ok) => stats.recordDecision('blackjack', k, ok);

const FELT = `<svg class="felt" viewBox="0 0 100 56.25" aria-hidden="true"><defs>
  <path id="p1" d="M22 17 Q50 24 78 17"/><path id="p2" d="M27 21.6 Q50 27.6 73 21.6"/></defs>
  <text class="t1"><textPath href="#p1" startOffset="50%" text-anchor="middle">BLACKJACK PAYS 3 TO 2</textPath></text>
  <text class="t2"><textPath href="#p2" startOffset="50%" text-anchor="middle">INSURANCE PAYS 2 TO 1</textPath></text></svg>`;

function render() {
  const s = settings.get(), coachOn = s.mode === 'coach', p = t.phase, bal = bank.getBalance(), live = inRound();
  const staked = live ? t.hands.reduce((a, h) => a + h.bet, 0) + t.insurance : bet;
  let hint = '';
  if (coachOn && s.hint && p === 'player') { const h = coach.hint(t, avail()); hint = `Hint: ${ACT[h.action]}. ${h.why}`; }
  if (coachOn && s.hint && p === 'insurance') hint = 'Hint: No. ' + coach.INS.why;
  const outcome = p === 'bet' ? 'Place your bet.' : p === 'done' ? (t.net > 0 ? `You won ${money(t.net)}.` : t.net < 0 ? `You lost ${money(-t.net)}.` : 'Push.') : (live && t.shuffled ? 'New shoe shuffled.' : '');
  const line = [outcome, hint, msg].filter(Boolean).join(' ');
  const hands = t.hands.map((h, i) => `<div class="hand ${p === 'player' && i === t.active ? 'active' : ''}">
    <div class="cards">${h.cards.map(card).join('')}</div>
    <div class="tot"><b>${tot(h.cards)}</b> <small>${money(h.bet)}</small>${h.result ? ` <span class="res ${h.result}">${RES[h.result]}</span>` : ''}</div></div>`).join('');
  const spot = p === 'bet' || p === 'done' ? `<div class="spot">${stackHTML(bet)}</div>` : '';
  const betBox = `<div class="stat"><b>${money(staked)}</b><small>BET</small></div>`;
  let ctl;
  if (p === 'insurance') ctl = `<span class="q">Insurance for ${money(t.hands[0].bet / 2)}?</span><button data-a="ins-y" ${avail() < t.hands[0].bet / 2 ? 'disabled' : ''}>Yes</button><button class="primary" data-a="ins-n">No</button>${betBox}`;
  else if (p === 'player') { const l = E.legal(t, avail()); ctl = betBox + Object.keys(ACT).map(a => `<button data-a="${a}" ${l.includes(a) ? '' : 'disabled'}>${ACT[a]}</button>`).join(''); }
  else if (bal < LIMITS.min) ctl = `<span class="q">You're out of money.</span><button class="primary" data-a="reset">Reset to ${money(bank.START)}</button>`;
  else ctl = CHIPS.map(n => `<button class="chip c${n}" data-a="chip" data-n="${n}" aria-label="$${n}" ${bet + n > Math.min(LIMITS.max, bal) ? 'disabled' : ''}></button>`).join('')
    + betBox + `<button data-a="clear">Clear</button><button class="primary" data-a="deal" ${bet < LIMITS.min ? 'disabled' : ''}>Deal</button>`;
  root.innerHTML = `${FELT}
    <div class="top"><button class="home" data-a="home">Home</button><span>6 decks, dealer stands on soft 17, bets ${LIMITS.min}-${LIMITS.max}</span></div>
    <div class="dealer">${t.dealer.length ? `<div class="cards">${t.dealer.map((c, i) => card(i === 1 && live ? null : c)).join('')}</div>${live ? '' : `<div class="tot"><b>${tot(t.dealer)}</b></div>`}` : ''}</div>
    <div class="mid"></div>
    <div class="hands">${hands}${spot}</div>
    <div class="coach">${line ? `<span>${line}</span>` : ''}</div>
    <div class="bottom"><div class="stat"><b>${money(bal)}</b><small>BALANCE</small></div><div class="ctl">${ctl}</div>
      <div class="stat"><b>${p === 'done' && t.net > 0 ? money(t.net) : '&nbsp;'}</b><small>WIN</small></div></div>`;
}

function after() { // pay out once, when a round finishes
  if (t.phase === 'done' && !t.paid) {
    t.paid = true; bank.add(t.net); stats.record('blackjack', t.net, t.net > 0);
    bet = Math.min(bet, bank.getBalance(), LIMITS.max);
  }
}
function onClick(e) {
  const b = e.target.closest('button[data-a]'); if (!b || b.disabled) return;
  const a = b.dataset.a, s = settings.get(), fb = s.mode === 'coach' && s.feedback;
  if (a === 'home') return goHome();
  if (a === 'chip') bet += +b.dataset.n;
  else if (a === 'clear') bet = 0;
  else if (a === 'reset') bank.reset();
  else if (a === 'deal') { msg = ''; E.startRound(t, bet); }
  else if (a === 'ins-y' || a === 'ins-n') {
    const y = a === 'ins-y'; rec(coach.INS.key, !y);
    if (fb) msg = (y ? 'Not quite. ' : 'Correct. ') + coach.INS.why;
    E.takeInsurance(t, y);
  } else {
    const h = coach.hint(t, avail()); rec(h.key, a === h.action);
    if (fb) msg = coach.feedback(a, h);
    E.act(t, a);
  }
  after(); render();
}
export function mount(el, home) { root = el; goHome = home; el.onclick = onClick; render(); }
