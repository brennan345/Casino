import * as E from './engine.js';
import * as coach from './coach.js';
import * as bank from '../../shared/bankroll.js';
import * as stats from '../../shared/stats.js';
import * as settings from '../../shared/settings.js';
import { storage } from '../../shared/storage.js';
import { CHIPS, LIMITS } from '../../shared/chips.js';
import { cardHTML } from '../../shared/cards.js';

const SPOTS = { player: ['PLAYER', '1:1'], tie: ['TIE', '8:1'], banker: ['BANKER', '0.95:1'] };
const HELP = 'Pick a chip, then tap Player, Tie or Banker to bet. Press Deal when ready.';
const FELT = `<svg class="felt" viewBox="0 0 100 56.25" aria-hidden="true"><defs><path id="b1" d="M40 12.5 Q50 9.5 60 12.5"/><path id="b2" d="M41 16.5 Q50 14 59 16.5"/></defs>
  <text class="t1"><textPath href="#b1" startOffset="50%" text-anchor="middle">BACCARAT</textPath></text>
  <text class="t2"><textPath href="#b2" startOffset="50%" text-anchor="middle">TIE PAYS 8 TO 1</textPath></text></svg>`;
let t = E.createTable(), bets = {}, order = [], lastBets = null, last = null, chip = 5, msg = '', root, goHome;
let hist = storage.get('bc:hist', []); // 'p' | 'b' | 't', oldest first
const money = n => '$' + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
const total = () => Object.values(bets).reduce((a, b) => a + b, 0);
const cc = v => v >= 500 ? 500 : v >= 100 ? 100 : v >= 25 ? 25 : v >= 5 ? 5 : 1;

function plate() { // bead plate: fills top to bottom, 6 rows, newest on the right
  const cols = Math.ceil(hist.length / 6), shown = cols > 14 ? hist.slice((cols - 14) * 6) : hist;
  return `<div class="plate">${shown.map(h => `<i class="bd ${h}"></i>`).join('')}</div>`;
}
function render() {
  const s = settings.get(), c = s.mode === 'coach', bal = bank.getBalance(), tot = total(), r = last && last.res;
  const ok = tot > 0 && tot <= bal && Object.values(bets).every(v => v >= LIMITS.min);
  const hand = (label, cards, tt, win) => `<div class="bh ${win ? 'win' : ''}"><small>${label}</small><div class="cards">${cards.map(cardHTML).join('')}</div><div class="tot">${cards.length ? tt : ''}</div></div>`;
  const shown = r && !tot; // highlight the winner until a new bet is placed
  const spots = Object.keys(SPOTS).map(k => `<button class="spot2 ${shown && r.winner === k ? 'won' : ''}" data-a="bet" data-k="${k}">
    <span class="nm">${SPOTS[k][0]}</span><span class="pay">pays ${SPOTS[k][1]}</span>${bets[k] ? `<span class="mk c${cc(bets[k])}">${bets[k]}</span>` : ''}</button>`).join('');
  const ctl = bal < LIMITS.min && !tot
    ? `<span class="q">You're out of money.</span><button class="primary" data-a="reset">Reset to ${money(bank.START)}</button>`
    : CHIPS.map(n => `<button class="chip c${n} ${n === chip ? 'sel' : ''}" data-a="chip" data-n="${n}" aria-label="$${n}"></button>`).join('')
      + `<div class="stat"><b>${money(tot)}</b><small>BET</small></div><button class="primary" data-a="deal" ${ok ? '' : 'disabled'}>Deal</button>`;
  root.innerHTML = `${FELT}
    <div class="top"><button class="home" data-a="home">Home</button><span>8 decks, banker pays 1:1 minus 5% commission, bets ${LIMITS.min}-${LIMITS.max}</span></div>
    <div class="hands2">${hand('PLAYER', r ? r.player : [], r && r.pTotal, shown && r.winner === 'player')}${hand('BANKER', r ? r.banker : [], r && r.bTotal, shown && r.winner === 'banker')}</div>
    <div class="mid"></div>
    <div class="brow">${plate()}<div class="spots">${spots}</div>
      <div class="bside"><button data-a="clear">Clear</button><button data-a="rebet" ${lastBets ? '' : 'disabled'}>Rebet</button></div></div>
    <div class="mid"></div>
    <div class="coach"><span>${msg || (c && s.hint ? coach.general : HELP)}</span></div>
    <div class="bottom"><div class="stat"><b>${money(bal)}</b><small>BALANCE</small></div><div class="ctl">${ctl}</div>
      <div class="stat"><b>${shown && last.net > 0 ? money(last.net) : '&nbsp;'}</b><small>WIN</small></div></div>`;
}
function deal() {
  const res = E.playRound(t), net = E.settle(bets, res.winner), s = settings.get();
  bank.add(net); stats.record('baccarat', net, net > 0);
  hist = [...hist, res.winner[0]].slice(-200); storage.set('bc:hist', hist);
  last = { res, net }; lastBets = { ...bets };
  msg = `${res.winner === 'tie' ? 'Tie.' : res.winner === 'player' ? 'Player wins.' : 'Banker wins.'} `
    + (net > 0 ? `You won ${money(net)}.` : net < 0 ? `You lost ${money(-net)}.` : 'No money changes hands.')
    + (res.winner === 'tie' && ('player' in bets || 'banker' in bets) ? ' Player and Banker bets push.' : '')
    + (s.mode === 'coach' && s.feedback ? ' ' + coach.feedback(bets, res) : '') + (t.shuffled ? ' New shoe shuffled.' : '');
  bets = {}; order = [];
}
function onClick(e) {
  const b = e.target.closest('button[data-a]'); if (!b || b.disabled) return;
  const a = b.dataset.a, s = settings.get();
  if (a === 'home') return goHome();
  if (a === 'chip') chip = +b.dataset.n;
  else if (a === 'bet') {
    const k = b.dataset.k, add = Math.min(chip, LIMITS.max - (bets[k] || 0), bank.getBalance() - total());
    if (add > 0) { bets[k] = (bets[k] || 0) + add; order.push([k, add]); }
    msg = s.mode === 'coach' && s.hint ? coach.betNote(k) : '';
  }
  else if (a === 'clear') { bets = {}; order = []; msg = ''; }
  else if (a === 'rebet') {
    bets = {}; order = []; let room = bank.getBalance();
    for (const [k, v] of Object.entries(lastBets)) { const x = Math.min(v, room); if (x > 0) { bets[k] = x; room -= x; order.push([k, x]); } }
    msg = '';
  }
  else if (a === 'deal') deal();
  else if (a === 'reset') bank.reset();
  render();
}
export function mount(el, home) { root = el; goHome = home; el.onclick = onClick; render(); }
