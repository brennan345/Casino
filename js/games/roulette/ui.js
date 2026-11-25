import * as E from './engine.js';
import * as coach from './coach.js';
import * as bank from '../../shared/bankroll.js';
import * as stats from '../../shared/stats.js';
import * as settings from '../../shared/settings.js';
import { storage } from '../../shared/storage.js';
import { CHIPS, LIMITS } from '../../shared/chips.js';

const ZW = 6, CW = 5.4, RH = 6.6, OH = 5, Z = 2.4; // board geometry in cqw
const HELP = 'Tap a number to bet. Tap the lines between numbers for splits, corners, streets and six lines.';
let wheel = storage.get('rl:wheel', 'american'), bets = {}, order = [], lastBets = null, last = null;
let hist = storage.get('rl:hist', []), chip = 5, msg = '', root, goHome;
const money = n => '$' + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
const total = () => Object.values(bets).reduce((a, b) => a + b, 0);

function layout() {
  const out = [], centers = {};
  const cell = (key, x, y, w, h, cls, txt) => { centers[key] = [x + w / 2, y + h / 2];
    out.push(`<button class="cell ${cls}" data-a="bet" data-k="${key}" style="left:${x}cqw;top:${y}cqw;width:${w}cqw;height:${h}cqw">${txt}</button>`); };
  const zone = (key, cx, cy, w, h) => { centers[key] = [cx, cy];
    out.push(`<button class="z" data-a="bet" data-k="${key}" aria-label="${E.betDef(key).name}" style="left:${cx}cqw;top:${cy}cqw;width:${w}cqw;height:${h}cqw"></button>`); };
  const am = wheel === 'american', X = c => ZW + c * CW;
  if (am) { cell('st:37', 0, 0, ZW, 1.5 * RH, 'green', '00'); cell('st:0', 0, 1.5 * RH, ZW, 1.5 * RH, 'green', '0'); }
  else cell('st:0', 0, 0, ZW, 3 * RH, 'green', '0');
  for (let c = 0; c < 12; c++) for (let r = 0; r < 3; r++) { const n = 3 * c + 3 - r; cell('st:' + n, X(c), r * RH, CW, RH, E.color(n), n); }
  for (let r = 0; r < 3; r++) cell('cl:' + (3 - r), X(12), r * RH, CW, RH, 'plain', '2:1');
  ['1st 12', '2nd 12', '3rd 12'].forEach((t, i) => cell('dz:' + (i + 1), X(4 * i), 3 * RH, 4 * CW, OH, 'plain', t));
  [['low', '1-18', 'plain'], ['even', 'EVEN', 'plain'], ['red', '◆', 'red'], ['black', '◆', 'black'], ['odd', 'ODD', 'plain'], ['high', '19-36', 'plain']]
    .forEach(([k, t, cls], i) => cell(k, X(2 * i), 3 * RH + OH, 2 * CW, OH, cls, t));
  if (am) cell('five', 0, 3 * RH, ZW, 2 * OH, 'plain small', '0 00<br>1 2 3');
  for (let c = 0; c < 12; c++) { // street + inside lines
    zone('sr:' + (3 * c + 1), X(c) + CW / 2, 3 * RH, CW - Z, Z);
    for (let r = 0; r < 2; r++) { const n = 3 * c + 3 - r; zone(`sp:${n - 1}-${n}`, X(c) + CW / 2, (r + 1) * RH, CW - Z, Z); }
    if (c < 11) {
      zone('sx:' + (3 * c + 1), X(c + 1), 3 * RH, Z, Z);
      for (let r = 0; r < 3; r++) { const n = 3 * c + 3 - r; zone(`sp:${n}-${n + 3}`, X(c + 1), r * RH + RH / 2, Z, RH - Z); }
      for (let r = 0; r < 2; r++) zone('co:' + (3 * c + 2 - r), X(c + 1), (r + 1) * RH, Z, Z);
    }
  }
  const zs = am ? [['sp:3-37', .5], ['sp:2-37', 1.25], ['sp:0-2', 1.75], ['sp:0-1', 2.5]] : [['sp:0-3', .5], ['sp:0-2', 1.5], ['sp:0-1', 2.5]];
  zs.forEach(([k, f]) => zone(k, ZW, f * RH, Z, 3.2));
  if (am) zone('sp:0-37', ZW / 2, 1.5 * RH, ZW - Z, Z);
  return { html: out.join(''), centers };
}

function render() {
  const s = settings.get(), c = s.mode === 'coach', bal = bank.getBalance(), tot = total(), L = layout();
  const mk = Object.entries(bets).map(([k, v]) => { const [x, y] = L.centers[k];
    return `<span class="mk c${v >= 500 ? 500 : v >= 100 ? 100 : v >= 25 ? 25 : v >= 5 ? 5 : 1}" style="left:${x}cqw;top:${y}cqw">${v}</span>`; }).join('');
  const line = msg || (c && s.hint ? coach.general(wheel) : HELP);
  const ok = tot > 0 && tot <= bal && Object.values(bets).every(v => v >= LIMITS.min);
  const ctl = bal < LIMITS.min && !tot
    ? `<span class="q">You're out of money.</span><button class="primary" data-a="reset">Reset to ${money(bank.START)}</button>`
    : CHIPS.map(n => `<button class="chip c${n} ${n === chip ? 'sel' : ''}" data-a="chip" data-n="${n}" aria-label="$${n}"></button>`).join('')
      + `<div class="stat"><b>${money(tot)}</b><small>BET</small></div><button class="primary" data-a="spin" ${ok ? '' : 'disabled'}>Spin</button>`;
  const ball = last ? `<div class="ball ${E.color(last.pocket)}">${E.label(last.pocket)}</div>` : '<div class="ball none">-</div>';
  root.innerHTML = `<div class="top"><button class="home" data-a="home">Home</button>
      <div class="seg"><button data-a="wheel" data-w="american" class="${wheel === 'american' ? 'on' : ''}">American</button><button data-a="wheel" data-w="european" class="${wheel === 'european' ? 'on' : ''}">European</button></div>
      <span>${money(LIMITS.min)}-${money(LIMITS.max)} per bet</span></div>
    <div class="mid"></div>
    <div class="rbody"><div class="board">${L.html}${mk}</div>
      <div class="side"><small>LAST SPIN</small>${ball}<div class="hist">${hist.slice(0, 12).map(p => `<span class="pill ${E.color(p)}">${E.label(p)}</span>`).join('')}</div>
        <div class="sbtns"><button data-a="undo">Undo</button><button data-a="clear">Clear</button><button data-a="rebet" ${lastBets ? '' : 'disabled'}>Rebet</button></div></div></div>
    <div class="mid"></div>
    <div class="coach"><span>${line}</span></div>
    <div class="bottom"><div class="stat"><b>${money(bal)}</b><small>BALANCE</small></div><div class="ctl">${ctl}</div>
      <div class="stat"><b>${last && last.res.net > 0 && !tot ? money(last.res.net) : '&nbsp;'}</b><small>WIN</small></div></div>`;
}

function doSpin() {
  const pocket = E.spin(wheel), res = E.resolve(bets, pocket), s = settings.get();
  bank.add(res.net); stats.record('roulette', res.net, res.net > 0);
  hist = [pocket, ...hist].slice(0, 24); storage.set('rl:hist', hist);
  lastBets = { ...bets }; last = { pocket, res };
  msg = `${E.label(pocket)} ${E.color(pocket)}. ` + (res.net > 0 ? `You won ${money(res.net)}.` : res.net < 0 ? `You lost ${money(-res.net)}.` : 'You broke even.')
    + (s.mode === 'coach' && s.feedback ? ' ' + coach.feedback(bets, wheel) : '');
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
    msg = s.mode === 'coach' && s.hint ? coach.betNote(k, wheel) : '';
  }
  else if (a === 'undo') { const o = order.pop(); if (o) { bets[o[0]] -= o[1]; if (bets[o[0]] <= 0) delete bets[o[0]]; } msg = ''; }
  else if (a === 'clear') { bets = {}; order = []; msg = ''; }
  else if (a === 'rebet') {
    bets = {}; order = []; let room = bank.getBalance();
    for (const [k, v] of Object.entries(lastBets)) { const x = Math.min(v, room); if (x > 0) { bets[k] = x; room -= x; order.push([k, x]); } }
    msg = '';
  }
  else if (a === 'wheel') { wheel = b.dataset.w; storage.set('rl:wheel', wheel); bets = {}; order = []; lastBets = null; msg = ''; }
  else if (a === 'spin') doSpin();
  else if (a === 'reset') bank.reset();
  render();
}
export function mount(el, home) { root = el; goHome = home; el.onclick = onClick; render(); }
