import * as E from './engine.js';
import * as coach from './coach.js';
import * as bank from '../../shared/bankroll.js';
import * as stats from '../../shared/stats.js';
import * as settings from '../../shared/settings.js';
import { storage } from '../../shared/storage.js';
import { randomInt } from '../../shared/rng.js';
import { CHIPS, LIMITS } from '../../shared/chips.js';

const HELP = 'Pick a chip, then tap a bet. Start with the Pass Line and press Roll.';
const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
const WORD = { 4: '4', 5: '5', 6: 'SIX', 8: '8', 9: 'NINE', 10: '10' };
const BW = (76 - 17.4) / 6, X = i => 17.4 + i * BW; // number boxes: 6 across, starting right of Don't Come
let g = E.newGame(), order = [], chip = 5, msg = '', last = null, rolling = false, dice = [1, 1], root, goHome, iv;
let hist = storage.get('cr:hist', []);
const money = n => '$' + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
const cc = v => v >= 500 ? 500 : v >= 100 ? 100 : v >= 25 ? 25 : v >= 5 ? 5 : 1;
const die = v => `<span class="die ${rolling ? 'tumble' : ''}">${Array.from({ length: 9 }, (_, i) => `<i class="${PIPS[v].includes(i) ? 'on' : ''}"></i>`).join('')}</span>`;
const setFaces = (el, a, b) => [a, b].forEach((v, i) => [...el.children[i].children].forEach((p, j) => p.classList.toggle('on', PIPS[v].includes(j))));

// Printed table art: lines, numbers, labels, puck (SVG, 1 unit = 1cqw)
function art() {
  const pi = E.NUMS.indexOf(g.point), cx = i => X(i) + BW * 0.36;
  const bar = x => `<text x="${x - 2.4}" y="26.7" class="w" font-size="1.4">BAR</text><rect x="${x}" y="25.3" width="1.8" height="1.8" rx=".3" class="wf"/><rect x="${x + 2.3}" y="25.3" width="1.8" height="1.8" rx=".3" class="wf"/>`;
  return `<svg class="ctable" viewBox="0 0 76 32" aria-hidden="true">
    ${pi >= 0 ? `<rect x="${X(pi)}" y="0" width="${BW}" height="9" fill="#f0cb6226" stroke="#f0cb62" stroke-width=".45"/>` : ''}
    <path d="M0 3 L6.4 0 L76 0 L76 32 L0 32 Z M3.2 1.5 L3.2 28 L76 28 M6.4 0 L6.4 24 L76 24 M6.4 9 L76 9 M6.4 16 L76 16 M17.4 0 L17.4 9 M17.4 2.8 L76 2.8 M17.4 6.2 L76 6.2 ${[1, 2, 3, 4, 5].map(i => `M${X(i)} 0 L${X(i)} 9`).join(' ')}"/>
    ${E.NUMS.map((n, i) => `<text x="${cx(i)}" y="${WORD[n].length > 2 ? 5.5 : 5.8}" class="y" font-size="${WORD[n].length > 2 ? 2.9 : 4.2}" ${WORD[n].length > 2 ? `transform="rotate(-12 ${cx(i)} 5)"` : ''}>${WORD[n]}</text>`).join('')}
    <text x="11.9" y="4.2" class="w" font-size="2.1">DON'T</text><text x="11.9" y="6.6" class="w" font-size="2.1">COME</text>
    <text x="8.4" y="8.5" class="w" font-size="1.2">BAR</text><rect x="9.8" y="7.3" width="1.4" height="1.4" rx=".25" class="wf"/><rect x="11.6" y="7.3" width="1.4" height="1.4" rx=".25" class="wf"/>
    <text x="41.2" y="14.7" class="r" font-size="5.8" letter-spacing=".4">COME</text>
    <circle cx="14" cy="20" r="2.3" fill="none" stroke="#f2d03b" stroke-width=".25"/><text x="14" y="21.1" class="y" font-size="3">2</text><text x="14" y="17.3" class="w" font-size="1">PAYS DOUBLE</text>
    <circle cx="68.4" cy="20" r="2.3" fill="none" stroke="#f2d03b" stroke-width=".25"/><text x="68.4" y="21.1" class="y" font-size="2.6">12</text><text x="68.4" y="17.3" class="w" font-size="1">PAYS TRIPLE</text>
    <text x="41.2" y="20.2" class="y" font-size="3.2">3 · 4 · 9 · 10 · 11</text><text x="41.2" y="23.4" class="r" font-size="3.8" letter-spacing=".3">FIELD</text>
    <text x="41.2" y="26.8" class="w" font-size="2.1" letter-spacing=".2">DON'T PASS</text>${bar(55)}
    <text x="41.2" y="30.8" class="w" font-size="2.4" letter-spacing=".3">PASS LINE</text>
    <text transform="translate(2.2 17) rotate(-90)" class="w" font-size="2">PASS LINE</text><text transform="translate(5.3 13) rotate(-90)" class="w" font-size="1.8">DON'T PASS</text>
    ${pi >= 0 ? `<circle cx="${X(pi) + 1.9}" cy="7.7" r="1.6" fill="#fff" stroke="#f0cb62" stroke-width=".3"/><text x="${X(pi) + 1.9}" y="8.1" font-size="1.2" fill="#111">ON</text>`
      : `<circle cx="15.2" cy="7.7" r="1.6" fill="#111" stroke="#bbb" stroke-width=".3"/><text x="15.2" y="8.1" font-size="1.1" fill="#fff">OFF</text>`}</svg>`;
}
function felt() {
  const B = (k, x, y, w, h) => `<button class="zb" data-a="bet" data-k="${k}" aria-label="${k}" style="left:${x}cqw;top:${y}cqw;width:${w}cqw;height:${h}cqw"></button>`;
  const M = (v, x, y, od) => v ? `<span class="mk c${cc(v)} ${od ? 'od' : ''} ${v >= 1000 ? 'big' : ''}" style="left:${x}cqw;top:${y}cqw">${v}</span>` : '';
  let z = B('pass', 0, 3, 3.2, 25) + B('pass', 0, 28, 76, 4) + B('dont', 3.2, 3, 3.2, 21) + B('dont', 3.2, 24, 72.8, 4)
    + B('dcome', 6.4, 0, 11, 9) + B('come', 6.4, 9, 69.6, 7) + B('field', 6.4, 16, 69.6, 8);
  let m = M(g.pass, 14, 30) + M(g.passOdds, 20.5, 30, 1) + M(g.dont, 14, 26) + M(g.dontOdds, 20.5, 26, 1)
    + M(g.dcome, 11.9, 5.3) + M(g.come, 24, 12.5) + M(g.field, 24, 20.6);
  E.NUMS.forEach((n, i) => { const x = X(i), c = g.comes[n], d = g.dcomes[n];
    z += B('codds:' + n, x, 0, BW, 2.8) + B('place:' + n, x, 2.8, BW, 3.4) + B('dodds:' + n, x, 6.2, BW, 2.8);
    m += M(g.place[n], x + BW * 0.76, 4.5) + (c ? M(c.amt, x + BW * 0.27, 1.5) + M(c.odds, x + BW * 0.73, 1.5, 1) : '') + (d ? M(d.amt, x + BW * 0.27, 7.7) + M(d.odds, x + BW * 0.73, 7.7, 1) : ''); });
  return art() + z + m;
}
function render() {
  const s = settings.get(), c = s.mode === 'coach', bal = bank.getBalance(), tot = E.onTable(g);
  const ok = E.flatOK(g) && !rolling;
  const ctl = bal < LIMITS.min && !tot
    ? `<span class="q">You're out of money.</span><button class="primary" data-a="reset">Reset to ${money(bank.START)}</button>`
    : CHIPS.map(n => `<button class="chip c${n} ${n === chip ? 'sel' : ''}" data-a="chip" data-n="${n}" aria-label="$${n}"></button>`).join('')
      + `<div class="stat"><b>${money(tot)}</b><small>ON TABLE</small></div><button class="primary" data-a="roll" ${ok ? '' : 'disabled'}>Roll</button>`;
  root.innerHTML = `<div class="top"><button class="home" data-a="home">Home</button><span>Place bets are off on come-out rolls, bets ${money(LIMITS.min)}-${money(LIMITS.max)}</span></div>
    <div class="mid"></div>
    <div class="cbody"><div class="cfelt">${felt()}</div>
      <div class="cside"><div class="tray"><div class="dice">${die(dice[0])}${die(dice[1])}</div></div><small>LAST ROLLS</small>
        <div class="hist">${hist.slice(0, 12).map(h => `<span class="pill ${h === 7 ? 'red' : 'black'}">${h}</span>`).join('')}</div>
        <div class="sbtns"><button data-a="undo" ${rolling ? 'disabled' : ''}>Undo</button><button data-a="clear" ${rolling ? 'disabled' : ''}>Clear</button></div></div></div>
    <div class="mid"></div>
    <div class="coach"><span>${msg || (c && s.hint ? coach.general : HELP)}</span></div>
    <div class="bottom"><div class="stat"><b>${money(bal)}</b><small>BALANCE</small></div><div class="ctl">${ctl}</div>
      <div class="stat"><b>${last && last.net > 0 && !rolling ? money(last.net) : '&nbsp;'}</b><small>WIN</small></div></div>`;
}
function doRoll() {
  if (rolling) return; rolling = true; msg = ''; render();
  iv = setInterval(() => { const el = root.querySelector('.dice'); if (el) setFaces(el, randomInt(6) + 1, randomInt(6) + 1); }, 90);
  setTimeout(() => {
    clearInterval(iv); rolling = false;
    const [d1, d2] = E.rollDice(), snap = E.snapshot(g), res = E.roll(g, d1, d2), s = settings.get();
    dice = [d1, d2]; last = res; order = [];
    bank.add(res.net); if (res.events.length) stats.record('craps', res.net, res.net > 0);
    hist = [res.total, ...hist].slice(0, 24); storage.set('cr:hist', hist);
    const ev = res.events.map(e => `${e.name} ${e.net > 0 ? 'wins ' + money(e.net) : e.net < 0 ? 'loses ' + money(-e.net) : 'pushes'}.`).join(' ');
    msg = `Rolled ${res.total}. ${res.note} ${ev}`.replace(/\s+/g, ' ').trim() + (s.mode === 'coach' && s.feedback ? ' ' + coach.feedback(res, snap) : '');
    render();
  }, 900);
}
function onClick(e) {
  const b = e.target.closest('button[data-a]'); if (!b || b.disabled) return;
  const a = b.dataset.a, s = settings.get();
  if (a === 'home') return goHome();
  if (rolling) return;
  if (a === 'chip') chip = +b.dataset.n;
  else if (a === 'bet') {
    const t = E.target(g, b.dataset.k);
    if (t.err) msg = t.err;
    else {
      const room = bank.getBalance() - E.onTable(g), cap = E.maxAmount(g, t.key) - E.getv(g, t.key), amt = Math.min(chip, cap, room);
      if (amt > 0) { E.add(g, t.key, amt); order.push([t.key, amt]); msg = ''; }
      else msg = cap <= 0 ? 'That is the maximum for this bet.' : 'Not enough bankroll for that chip.';
      if (amt > 0 && s.mode === 'coach' && s.hint) msg = coach.betNote(t.key, g);
    }
  }
  else if (a === 'undo') { const o = order.pop(); if (o) E.remove(g, o[0], o[1]); msg = ''; }
  else if (a === 'clear') { E.clearSoft(g); order = []; msg = ''; }
  else if (a === 'roll') return doRoll();
  else if (a === 'reset') bank.reset();
  render();
}
export function mount(el, home) { root = el; goHome = home; el.onclick = onClick; render(); }
