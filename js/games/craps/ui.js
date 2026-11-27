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
let g = E.newGame(), order = [], chip = 5, msg = '', last = null, rolling = false, dice = [1, 1], root, goHome, iv;
let hist = storage.get('cr:hist', []);
const money = n => '$' + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
const pl = (v, label = '', cls = '') => v ? `<span class="pl ${cls}">${label}${money(v)}</span>` : '';
const die = v => `<span class="die ${rolling ? 'tumble' : ''}">${Array.from({ length: 9 }, (_, i) => `<i class="${PIPS[v].includes(i) ? 'on' : ''}"></i>`).join('')}</span>`;

function felt() {
  const out = [], bw = 65 / 6;
  const Z = (key, x, y, w, h, inner, cls = '') => out.push(`<button class="cell plain cz ${cls}" data-a="bet" data-k="${key}" style="left:${x}cqw;top:${y}cqw;width:${w}cqw;height:${h}cqw">${inner}</button>`);
  Z('dcome', 0, 0, 11, 9, `<span class="lb">DON'T<br>COME</span>${pl(g.dcome)}`);
  E.NUMS.forEach((n, i) => { const x = 11 + i * bw, c = g.comes[n], d = g.dcomes[n];
    Z('codds:' + n, x, 0, bw, 2.6, c ? `${pl(c.amt, 'C ')}${pl(c.odds, '+')}` : '');
    Z('place:' + n, x, 2.6, bw, 3.8, `<span class="num">${n}</span>${pl(g.place[n])}`, g.point === n ? 'pt' : '');
    Z('dodds:' + n, x, 6.4, bw, 2.6, d ? `${pl(d.amt, 'DC ')}${pl(d.odds, '+')}` : ''); });
  Z('come', 0, 9, 76, 6.5, `<span class="lb">COME</span>${pl(g.come)}`);
  Z('field', 0, 15.5, 76, 6.5, `<span class="lb">FIELD</span><span class="sm">2 3 4 9 10 11 12</span>${pl(g.field)}`);
  Z('dont', 0, 22, 76, 5, `<span class="lb">DON'T PASS</span><span class="sm">BAR 12</span>${pl(g.dont)}${pl(g.dontOdds, 'odds ', 'od')}`);
  Z('pass', 0, 27, 76, 5, `<span class="lb">PASS LINE</span>${pl(g.pass)}${pl(g.passOdds, 'odds ', 'od')}`);
  return out.join('') + `<div class="dice" style="left:63cqw;top:9.7cqw">${die(dice[0])}${die(dice[1])}</div>`;
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
      <div class="cside"><div class="puck ${g.point ? 'on' : ''}">${g.point ? 'ON<br>' + g.point : 'OFF'}</div><small>LAST ROLLS</small>
        <div class="hist">${hist.slice(0, 12).map(h => `<span class="pill ${h === 7 ? 'red' : 'black'}">${h}</span>`).join('')}</div>
        <div class="sbtns"><button data-a="undo" ${rolling ? 'disabled' : ''}>Undo</button><button data-a="clear" ${rolling ? 'disabled' : ''}>Clear</button></div></div></div>
    <div class="mid"></div>
    <div class="coach"><span>${msg || (c && s.hint ? coach.general : HELP)}</span></div>
    <div class="bottom"><div class="stat"><b>${money(bal)}</b><small>BALANCE</small></div><div class="ctl">${ctl}</div>
      <div class="stat"><b>${last && last.net > 0 && !rolling ? money(last.net) : '&nbsp;'}</b><small>WIN</small></div></div>`;
}
function doRoll() {
  if (rolling) return; rolling = true; msg = ''; render();
  iv = setInterval(() => { const el = root.querySelector('.dice'); if (el) el.innerHTML = die(randomInt(6) + 1) + die(randomInt(6) + 1); }, 90);
  setTimeout(() => {
    clearInterval(iv); rolling = false;
    const [d1, d2] = E.rollDice(), snap = E.snapshot(g), res = E.roll(g, d1, d2), s = settings.get();
    dice = [d1, d2]; last = res; order = [];
    bank.add(res.net); if (res.events.length) stats.record('craps', res.net, res.net > 0);
    hist = [res.total, ...hist].slice(0, 24); storage.set('cr:hist', hist);
    const ev = res.events.map(e => `${e.name} ${e.net > 0 ? 'wins ' + money(e.net) : e.net < 0 ? 'loses ' + money(-e.net) : 'pushes'}.`).join(' ');
    msg = `Rolled ${res.total}. ${res.note} ${ev}`.replace(/\s+/g, ' ').trim() + (s.mode === 'coach' && s.feedback ? ' ' + coach.feedback(res, snap) : '');
    render();
  }, 800);
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
