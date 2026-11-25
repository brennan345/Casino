// Bump VERSION on every deploy, and keep FILES in sync with the repo.
const VERSION = 'v4';
const FILES = [
  './', './index.html', './manifest.json',
  './icons/icon-192.png', './icons/icon-512.png',
  './css/base.css', './css/table.css',
  './js/app.js',
  './js/shared/storage.js', './js/shared/bankroll.js', './js/shared/stats.js',
  './js/shared/settings.js', './js/shared/rng.js', './js/shared/cards.js',
  './js/shared/pokerEval.js', './js/shared/chips.js', './js/shared/orientation.js',
  './js/games/blackjack/engine.js', './js/games/blackjack/strategy.js', './js/games/blackjack/coach.js', './js/games/blackjack/ui.js', './js/games/blackjack/rules.js',
  './js/games/roulette/engine.js', './js/games/roulette/coach.js', './js/games/roulette/ui.js', './js/games/roulette/rules.js',
  './js/games/baccarat/engine.js', './js/games/baccarat/coach.js', './js/games/baccarat/ui.js', './js/games/baccarat/rules.js',
  './js/games/craps/engine.js', './js/games/craps/coach.js', './js/games/craps/ui.js', './js/games/craps/rules.js',
  './js/games/holdem/engine.js', './js/games/holdem/bots.js', './js/games/holdem/coach.js', './js/games/holdem/ui.js', './js/games/holdem/rules.js'
];
const CACHE = 'casino-' + VERSION;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
});
