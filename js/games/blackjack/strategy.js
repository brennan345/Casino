// Basic strategy: 6 decks, dealer stands on soft 17, double after split, no surrender.
// Columns = dealer upcard 2,3,4,5,6,7,8,9,10,A. H hit, S stand, P split,
// D double (else hit), d double (else stand).
import { val, handTotal } from './engine.js';
const HARD = { 9:'HDDDDHHHHH', 10:'DDDDDDDDHH', 11:'DDDDDDDDDH', 12:'HHSSSHHHHH',
  13:'SSSSSHHHHH', 14:'SSSSSHHHHH', 15:'SSSSSHHHHH', 16:'SSSSSHHHHH' };
const SOFT = { 13:'HHHDDHHHHH', 14:'HHHDDHHHHH', 15:'HHDDDHHHHH', 16:'HHDDDHHHHH',
  17:'HDDDDHHHHH', 18:'dddddSSHHH', 19:'SSSSSSSSSS' };
const PAIR = { 11:'PPPPPPPPPP', 9:'PPPPPSPPSS', 8:'PPPPPPPPPP', 7:'PPPPPPHHHH',
  6:'PPPPPHHHHH', 4:'HHHPPHHHHH', 3:'PPPPPPHHHH', 2:'PPPPPPHHHH' }; // 5s play as hard 10, 10s stand

export function best(cards, up, { canDouble, canSplit }) {
  const col = up === 'A' ? 9 : val(up) - 2, { total, soft } = handTotal(cards), v = val(cards[0].r);
  const pair = cards.length === 2 && v === val(cards[1].r);
  let code = pair && canSplit ? PAIR[v]?.[col] : undefined;
  if (!code) code = soft && total <= 19 ? (SOFT[total]?.[col] || 'H') : total >= 17 ? 'S' : total <= 8 ? 'H' : HARD[total][col];
  const action = { D: canDouble ? 'double' : 'hit', d: canDouble ? 'double' : 'stand', P: 'split', H: 'hit', S: 'stand' }[code];
  const key = (pair ? `Pair of ${v === 11 ? 'Aces' : v + 's'}` : `${soft ? 'Soft' : 'Hard'} ${total}`) + ` vs ${up}`;
  return { action, key, why: explain(action, cards[0].r, up, total, soft) };
}
function explain(a, r, up, total, soft) {
  if (a === 'split') return r === 'A' ? 'Two shots at 21 beat one soft 12. Always split aces.'
    : r === '8' ? '16 is the worst hand in the game; two hands starting on 8 are much better. Always split 8s.'
    : `Splitting beats playing this pair against the dealer's ${up}.`;
  if (a === 'double') return `Strong spot against the dealer's ${up}: get more money on the hand.`;
  if (a === 'stand') return total >= 17 ? 'A made hand. Another card mostly just risks busting.' : `The dealer's ${up} busts often, so let them draw.`;
  return soft ? "A soft hand can't bust on one card, so keep improving it."
    : total <= 11 ? "You can't bust, so take the card."
    : `The dealer's ${up} usually ends on 17+, so standing on ${total} loses more than hitting.`;
}
