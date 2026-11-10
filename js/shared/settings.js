// mode: 'play' | 'coach'. hint/feedback are the two independent Coach switches.
import { storage } from './storage.js';
const DEFAULTS = { mode: 'play', hint: false, feedback: false, sound: false };
export const get = () => ({ ...DEFAULTS, ...storage.get('settings', {}) });
export const set = patch => { const s = { ...get(), ...patch }; storage.set('settings', s); return s; };
