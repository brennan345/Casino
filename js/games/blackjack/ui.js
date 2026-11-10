import * as E from './engine.js';
import * as coach from './coach.js';
import * as bank from '../../shared/bankroll.js';
import * as stats from '../../shared/stats.js';
import * as settings from '../../shared/settings.js';
import { CHIPS, LIMITS } from '../../shared/chips.js';

const SUIT = { s: '♠', h: '♥', d: '♦', c: '♣' }, ACT = { hit: 'Hit', stand: 'Stand', double: 'Double', split: 'Split' };
const RES = { blackjack: 'Blackjack', win: 'Win', push: 'Push', lose: 'Lose', bust: 'Bust' };
let t = E.createTable(), bet = 0, msg = '', root, goHome; // table persists while the app is open
const money = n => '$' + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
const inRound = () => t.phase === 'player' || t.phase === 'insurance';
const avail = () => bank.getBalance() - (inRound() ? t.hands.reduce((a, h) => a + h.bet, 0) + t.insurance : 0);
const card = c => c ? `<span class="card ${c.s === 'h' || c.s === 'd' ? 'red' : ''}">${c.r}<i>${SUIT[c.s]}</i></span>` : '<span class="card back"></span>';
const tot = cs => { const x = E.handTotal(cs); return (x.soft && x.total < 21 ? 'soft ' : '') + x.total; };
const rec = (k, ok) => stats.recordDecision('blackjack', k, ok);

function render() {
  const s = settings.get(), coachOn = s.mode === 'coach', p = t.phase, bal = bank.getBalance(), live = inRound();
  let hint = '';
  if (coachOn && s.hint && p === 'player') { const h = coach.hint(t, avail()); hint = `Hint: ${ACT[h.action]}. ${h.why}`; }
  if (coachOn && s.hint && p === 'insurance') hint = 'Hint: No. ' + coach.INS.why;
  const outcome = p === 'done' ? (t.net > 0 ? `You won ${money(t.net)}` : t.net < 0 ? `You lost ${money(-t.net)}` : 'Push') : (live && t.shuffled ? 'New shoe shuffled' : '');
  const hands = t.hands.map((h, i) => `<div class="hand ${p === 'player' && i === t.active ? 'active' : ''}">
    <div class="cards">${h.cards.map(card).join('')}</div>
    <div class="tot">${tot(h.cards)} <small>${money(h.bet)}</small></div>
    ${h.result ? `<div class="res ${h.result}">${RES[h.result]}</div>` : ''}</div>`).join('');
  let ctl;
  if (p === 'insurance') ctl = `<span>Insurance for ${money(t.hands[0].bet / 2)}?</span><button data-a="ins-y" ${avail() < t.hands[0].bet / 2 ? 'disabled' : ''}>Yes</button><button class="primary" data-a="ins-n">No</button>`;
  else if (p === 'player') { const l = E.legal(t, avail()); ctl = Object.keys(ACT).map(a => `<button data-a="${a}" ${l.includes(a) ? '' : 'disabled'}>${ACT[a]}</button>`).join(''); }
  else if (bal < LIMITS.min) ctl = `<span>You're out of money.</span><button class="primary" data-a="reset">Reset to ${money(bank.START)}</button>`;
  else ctl = CHIPS.map(n => `<button class="chip c${n}" data-a="chip" data-n="${n}" ${bet + n > Math.min(LIMITS.max, bal) ? 'disabled' : ''}>${n}</button>`).join('')
    + `<b class="betamt">Bet ${money(bet)}</b><button data-a="clear">Clear</button><button class="primary" data-a="deal" ${bet < LIMITS.min ? 'disabled' : ''}>Deal</button>`;
  root.innerHTML = `<div class="bar"><button data-a="home">Home</button><span>6 decks, dealer stands on soft 17, blackjack pays 3:2, bets ${LIMITS.min}-${LIMITS.max}</span><b class="gold">${money(bal)}</b></div>
    <div class="zone dealer">${t.dealer.length ? `<div class="cards">${t.dealer.map((c, i) => card(i === 1 && live ? null : c)).join('')}</div>${live ? '' : `<div class="tot">${tot(t.dealer)}</div>`}` : '<span class="dim">Place your bet</span>'}</div>
    <div class="coach"><div>${outcome}</div>${hint ? `<div>${hint}</div>` : ''}${msg ? `<div>${msg}</div>` : ''}</div>
    <div class="zone">${hands}</div>
    <div class="ctl">${ctl}</div>`;
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
