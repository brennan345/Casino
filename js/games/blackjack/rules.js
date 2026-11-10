export default {
  title: 'Blackjack',
  sections: [
    { h: 'How it works', p: 'Beat the dealer by getting closer to 21 without going over. Number cards are worth their number, J/Q/K are 10, and an Ace is 1 or 11 (whichever helps). You and the dealer each get two cards, and one dealer card is face down. This table uses 6 decks and reshuffles around 75% of the way through. The dealer must hit until reaching 17 and stands on every 17, including soft 17.' },
    { h: 'Your actions', p: 'Hit: take a card. Stand: keep your total. Double: double your bet, get exactly one more card, then you are done (allowed on any first two cards, including after a split). Split: when your two cards match in value, make two hands with a second bet; up to 4 hands total. Split aces get one card each and cannot be resplit. A 21 after splitting counts as a normal 21, not a blackjack. Surrender is not offered.' },
    { h: 'Payouts', p: 'Win: 1 to 1. Blackjack (Ace plus a 10-value card on your first two cards): 3 to 2. Push (tie): your bet is returned. If the dealer shows an Ace or 10 they check for blackjack right away, so you never lose extra money on doubles or splits to a dealer blackjack.' },
    { h: 'Insurance', p: 'When the dealer shows an Ace you may bet half your wager that they have blackjack. It pays 2 to 1. It is a bad bet, about a 7% house edge, and basic strategy always says no. Coach mode flags it every time.' },
    { h: 'House edge', p: 'With perfect basic strategy under these rules the house edge is roughly 0.4% to 0.5%. Every strategy mistake adds to that. Coach mode shows the correct play for every hand, and the Stats page tracks your accuracy and the hands you miss most.' }
  ]
};
