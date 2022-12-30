const SAMPLE = false;
const PART_TWO = true;

import * as fs from "fs";

const data = fs
  .readFileSync(SAMPLE ? "./input_sample.txt" : "./input.txt", "utf8")
  .split("\n")

const called = data.shift()?.split(',').map(Number) as number[]

// Generate cards
const cards: Set<number>[][] = [];

for(let i = 0; i+6 < data.length; i+=6) {
  const card_array: Set<number>[] = [];

  const data_slice = data.slice(i, i+6).map(x => x.split(' ').filter(x=>x).map(Number))

  for(let j of [1,2,3,4,5]) {
    const row = new Set<number>(), col = new Set<number>();
    for(let k of [0,1,2,3,4]) {
      row.add(data_slice[j][k])
      col.add(data_slice[k+1][j-1])
    }
    card_array.push(row)
    card_array.push(col)
  }

  cards.push(card_array);
}

// (card_idx => last_bingo_number_triggering_win)
const MapOfWinningCards = new Map<number, number>()

function playBingo() {
  while(called.length) {
    const current = called.shift();
    if (current === undefined) throw "Wow";

    for (const card_idx in cards) {
      // Don't play with this card anymore, it already won.
      if (MapOfWinningCards.has(+card_idx)) continue;

      const card = cards[card_idx];
      for (const set of card) {
        set.delete(current);
        if (set.size === 0) {
          if (!MapOfWinningCards.has(+card_idx)) {
            MapOfWinningCards.set(+card_idx, current);
          }
        }
      }
    }

    // all cards have won
    if (MapOfWinningCards.size >= cards.length) return;
  }
  throw "Shouldn't get here"
}

playBingo();

const winning_indices = [...MapOfWinningCards.keys()]

const winning_card_idx = PART_TWO ? winning_indices[winning_indices.length - 1] : winning_indices[0]
const card = cards[winning_card_idx]

const last = MapOfWinningCards.get(winning_card_idx);
if(last === undefined) throw 'Wuh-oh'

const unmarked = [...new Set(card.map((x) => [...x]).flat())];

const sum = (a: number, c: number) => a+c
const unmarked_sum = unmarked.reduce(sum, 0)

console.dir({ last, unmarked_sum, score: last * unmarked_sum });
