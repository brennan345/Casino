export default {
  title: 'Roulette',
  sections: [
    { h: 'How it works', p: 'Place chips on the layout, then spin. A ball lands in one pocket and every bet covering that number wins. American wheels have 38 pockets (1-36, 0 and 00). European wheels have 37 (1-36 and a single 0). Use the toggle at the top of the table to switch; changing wheels clears your bets. Table limits here: $5 minimum and $500 maximum on each bet.' },
    { h: 'Inside bets', p: 'Straight up (one number) pays 35 to 1. Split (two touching numbers, tap the line between them) pays 17 to 1. Street (a row of three, tap the bottom edge) pays 11 to 1. Corner (four numbers, tap where the lines cross) pays 8 to 1. Six line (two streets, tap the bottom edge between them) pays 5 to 1. On the American wheel the five-number bet (0, 00, 1, 2, 3) pays 6 to 1. Bets touching the zeros are limited to straight-ups and splits.' },
    { h: 'Outside bets', p: 'Red or black, odd or even, and 1-18 or 19-36 all pay 1 to 1. Dozens (1-12, 13-24, 25-36) and the three columns (the 2:1 boxes) pay 2 to 1. Zero and 00 lose every outside bet.' },
    { h: 'House edge', p: 'American: 5.26% on every bet except the five-number bet, which is 7.89% and the worst on the table. European: 2.70% on every bet. The payouts are set so that no bet is better than another; what you control is the wheel. The European wheel costs you about half as much per bet.' },
    { h: 'Coach mode', p: 'With the hint switch on, tapping a bet shows its payout and house edge. With the feedback switch on, each spin tells you what you wagered and what that costs you on average, and flags the five-number bet.' }
  ]
};
