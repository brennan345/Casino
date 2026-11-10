// Coach: turns strategy.js into hints and after-the-fact feedback.
import * as E from './engine.js';
import { best } from './strategy.js';
export const INS = { key: 'Insurance', why: 'Insurance is a side bet with about a 7% house edge. Basic strategy always declines it.' };
export function hint(t, funds) {
  const l = E.legal(t, funds);
  return best(t.hands[t.active].cards, t.dealer[0].r, { canDouble: l.includes('double'), canSplit: l.includes('split') });
}
const NAME = { hit: 'Hit', stand: 'Stand', double: 'Double', split: 'Split' };
export const feedback = (played, h) => played === h.action
  ? `Correct: ${NAME[h.action]}. ${h.why}`
  : `Not quite. Basic strategy says ${NAME[h.action]} (${h.key}). ${h.why}`;
