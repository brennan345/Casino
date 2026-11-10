import * as bank from './shared/bankroll.js';
import * as stats from './shared/stats.js';
import * as settings from './shared/settings.js';
import { isPortrait, onChange } from './shared/orientation.js';
import blackjack from './games/blackjack/rules.js';
import roulette from './games/roulette/rules.js';
import baccarat from './games/baccarat/rules.js';
import craps from './games/craps/rules.js';
import holdem from './games/holdem/rules.js';
import * as bjui from './games/blackjack/ui.js';

const GAMES = [
  { id: 'blackjack', rules: blackjack, phase: 1 },
  { id: 'roulette', rules: roulette, phase: 2 },
  { id: 'baccarat', rules: baccarat, phase: 3 },
  { id: 'craps', rules: craps, phase: 4 },
  { id: 'holdem', rules: holdem, phase: 5 }
];
const find = id => GAMES.find(g => g.id === id);
const $app = document.getElementById('app'), $rotate = document.getElementById('rotate');
const money = n => (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
const cls = n => (n > 0 ? 'pos' : n < 0 ? 'neg' : 'dim');

// Router: hash-based (#/, #/stats, #/rules/blackjack, #/play/blackjack). No server rewrites needed.
function route() {
  const [, page, id] = location.hash.split('/');
  const g = find(id);
  if (page === 'play' && g) renderTable(g);
  else if (page === 'rules') g ? renderRule(g) : renderRulesList();
  else if (page === 'stats') renderStats();
  else renderHome();
  updateRotate();
}

function updateRotate() {
  $rotate.hidden = !(location.hash.startsWith('#/play/') && isPortrait());
}

function renderHome() {
  const s = settings.get();
  $app.innerHTML = `<main class="screen">
    <div class="top"><h1>Casino Practice</h1></div>
    <div class="bank"><div><small>Bankroll</small><b>${money(bank.getBalance())}</b></div>
      <button id="reset">Reset</button></div>
    ${bank.isBroke() ? `<div class="warn">You're broke. Reset your bankroll to ${money(bank.START)} to keep playing.
      <br><button class="primary" id="reset2">Reset bankroll</button></div>` : ''}
    <div class="tiles">${GAMES.map(g => `<a class="tile" href="#/play/${g.id}"><b>${g.rules.title}</b><small>Open table</small></a>`).join('')}</div>
    <div class="links"><a href="#/rules">Rules</a><a href="#/stats">Stats</a></div>
    <div class="panel"><h3>Mode</h3>
      <div class="row"><span>Play style</span><div class="seg">
        <button data-mode="play" class="${s.mode === 'play' ? 'on' : ''}">Play</button>
        <button data-mode="coach" class="${s.mode === 'coach' ? 'on' : ''}">Coach</button></div></div>
      ${s.mode === 'coach' ? `
      <label class="row sub"><span>Hint before I act</span><input type="checkbox" id="hint" ${s.hint ? 'checked' : ''}></label>
      <label class="row sub"><span>Feedback after I act</span><input type="checkbox" id="feedback" ${s.feedback ? 'checked' : ''}></label>` : ''}
      <label class="row"><span>Sound</span><input type="checkbox" id="sound" ${s.sound ? 'checked' : ''}></label>
    </div></main>`;
  const doReset = () => { if (confirm('Reset bankroll to ' + money(bank.START) + '?')) { bank.reset(); renderHome(); } };
  $app.querySelector('#reset').onclick = doReset;
  const r2 = $app.querySelector('#reset2'); if (r2) r2.onclick = doReset;
  $app.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { settings.set({ mode: b.dataset.mode }); renderHome(); });
  for (const k of ['hint', 'feedback', 'sound']) {
    const el = $app.querySelector('#' + k); if (el) el.onchange = () => settings.set({ [k]: el.checked });
  }
}

function renderTable(g) {
  if (g.id === 'blackjack') {
    $app.innerHTML = '<div class="table-screen"><div class="stage bj" id="stage"></div></div>';
    bjui.mount(document.getElementById('stage'), () => { location.hash = '#/'; });
    return;
  }
  const s = settings.get();
  $app.innerHTML = `<div class="table-screen"><div class="stage">
    <button class="back" id="back">Home</button>
    <span class="bankchip">${money(bank.getBalance())}</span>
    <h2>${g.rules.title}</h2>
    <p>Table coming in Phase ${g.phase}.</p>
    <p>Mode: ${s.mode}${s.mode === 'coach' ? ` (hint ${s.hint ? 'on' : 'off'}, feedback ${s.feedback ? 'on' : 'off'})` : ''}</p>
  </div></div>`;
  $app.querySelector('#back').onclick = () => { location.hash = '#/'; };
}

function renderRulesList() {
  $app.innerHTML = `<main class="screen"><div class="top"><a href="#/">Home</a><h2>Rules</h2></div>
    <div class="tiles">${GAMES.map(g => `<a class="tile" href="#/rules/${g.id}"><b>${g.rules.title}</b></a>`).join('')}</div></main>`;
}
function renderRule(g) {
  $app.innerHTML = `<main class="screen rules"><div class="top"><a href="#/rules">Rules</a><h2>${g.rules.title}</h2></div>
    ${g.rules.sections.map(x => `<h3>${x.h}</h3><p>${x.p}</p>`).join('')}</main>`;
}

function bjExtra() {
  const s = stats.get('blackjack'), a = s.acc;
  if (!a || !a.t) return '';
  const miss = Object.entries(s.missed || {}).sort((x, y) => y[1] - x[1]).slice(0, 5);
  return `<div class="panel"><h3>Blackjack strategy</h3><div class="row"><span>Accuracy</span><b>${(100 * a.r / a.t).toFixed(1)}% (${a.r}/${a.t})</b></div>${miss.length ? '<h3>Most missed</h3>' + miss.map(([k, n]) => `<div class="row"><span>${k}</span><span>${n}x</span></div>`).join('') : ''}</div>`;
}

function renderStats() {
  const rows = GAMES.map(g => { const s = stats.get(g.id);
    return `<tr><td>${g.rules.title}</td><td>${s.hands}</td><td class="${cls(s.net)}">${money(s.net)}</td><td>${stats.winRate(s)}</td></tr>`; }).join('');
  $app.innerHTML = `<main class="screen"><div class="top"><a href="#/">Home</a><h2>Stats</h2></div>
    <div class="panel"><table><tr><th>Game</th><th>Hands</th><th>Net</th><th>Win rate</th></tr>${rows}</table></div>
    ${bjExtra()}<button id="clear">Clear stats</button></main>`;
  $app.querySelector('#clear').onclick = () => { if (confirm('Clear all stats?')) { stats.resetAll(); renderStats(); } };
}

window.addEventListener('hashchange', route);
onChange(updateRotate);
route();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(console.error);
