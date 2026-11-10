// One balance shared by every game.
import { storage } from './storage.js';
export const START = 10000;
export const MIN_BET = 5;
export const getBalance = () => storage.get('bankroll', START);
export const setBalance = n => storage.set('bankroll', Math.round(n * 100) / 100);
export const add = delta => { const n = getBalance() + delta; setBalance(n); return n; };
export const reset = () => setBalance(START);
export const isBroke = () => getBalance() < MIN_BET;
