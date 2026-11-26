export default {
  title: 'Baccarat',
  sections: [
    { h: 'How it works', p: 'Punto Banco, played with 8 decks. You bet on which hand finishes closest to 9: the Player hand, the Banker hand, or a Tie. You never act on the cards. The game deals and draws automatically. Aces count 1, 2 through 9 count face value, and 10s and face cards count 0. A hand total is the sum of its cards with the tens digit dropped (7 + 8 = 15 counts as 5). Table limits: $5 minimum, $500 maximum per bet.' },
    { h: 'Dealing', p: 'Two cards go to the Player hand and two to the Banker hand. If either hand totals 8 or 9 (a natural), both hands stand and the round is over. Otherwise the third-card rules below decide whether each hand draws.' },
    { h: 'Player third card', p: 'Player total 0-5: draws a third card. Player total 6 or 7: stands.' },
    { h: 'Banker third card', p: 'If the Player stood (no third card): the Banker draws on 0-5 and stands on 6-7. If the Player drew a third card, the Banker acts on his own total and the value of that card. Banker 0-2: always draws. Banker 3: draws unless the Player third card was 8. Banker 4: draws if the Player third card was 2-7. Banker 5: draws if it was 4-7. Banker 6: draws if it was 6 or 7. Banker 7: stands.' },
    { h: 'Payouts', p: 'Player pays 1 to 1. Banker pays 1 to 1 minus a 5% commission (a $100 winning bet pays $95), because the Banker hand wins slightly more often. Tie pays 8 to 1. If the round is a tie, Player and Banker bets push (you keep your bet).' },
    { h: 'House edge', p: 'Banker 1.06%, Player 1.24%, Tie 14.36%. Banker is the best bet on the table. The tie bet pays well but is by far the worst. Coach mode shows the edge as you bet and explains each round\'s third-card decisions.' },
    { h: 'Bead plate', p: 'The grid at the table records recent rounds, filling top to bottom then left to right: blue is Player, red is Banker, green is Tie. Streaks are fun to watch, but every round is independent and the shoe has no memory.' }
  ]
};
