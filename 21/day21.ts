const SAMPLE = false;

import * as fs from "fs";
import { Queue } from 'mnemonist';

const [player1_start, player2_start] = fs
  .readFileSync(SAMPLE ? "./input_sample.txt" : "./input.txt", "utf8")
  .split("\n")
  .slice(0, -1)
  .map(x => Number(x.split(' starting position: ')[1]));

console.dir({ player1_start, player2_start });

class DeterministicDie {
  private _numRolls = 0;
  private _counter = -1;

  roll() {
    this._numRolls += 1;
    return (this._counter = ++this._counter % 100) + 1;
  }

  get numRolls() {
    return this._numRolls
  }
}

function playDeterministicGame() {
  const p1 = {
    score: 0, space: player1_start
  }
  const p2 = {
    score: 0, space: player2_start,
  };

  const die = new DeterministicDie();

  labell:
  while(true)
    for(const player of [p1, p2]) {
      player.space =
        ((player.space + die.roll() + die.roll() + die.roll() - 1) % 10) + 1;
      player.score += player.space;

      if(player.score >= 1000)
        break labell;
    }

  console.dir({p1, p2, rolls: die.numRolls})
  console.dir({part1: Math.min(p1.score, p2.score) * die.numRolls})
}
playDeterministicGame();

/**
 * PART 2
 *
 * Each 3 rolls of the quantum die produces the following sums (27 combos/universes):
 *
 * 3 - 1x
 * 4 - 3x
 * 5 - 6x   122 212 221 113 131 311
 * 6 - 7x   123 312 231 132 213 321 222
 * 7 - 6x
 * 8 - 3x
 * 9 - 1x
 *
 * State is [p1_score,p1_space,p2_score,p2_space,whoPlaysNext] => num_universes
 */

function playQuantumGame() {
  let p1Wins = 0, p2Wins = 0;

  const probabilityMap = {3:1,4:3,5:6,6:7,7:6,8:3,9:1} as const;

  type QueueState = {
    p1: { score: number; space: number };
    p2: { score: number; space: number };
    numUniverses: number,
    p1next: boolean
  };

  const queue = new Queue<QueueState>();
  queue.enqueue({
    p1: { score: 0, space: player1_start },
    p2: { score: 0, space: player2_start },
    numUniverses: 1,
    p1next: true,
  });

  const timestamp = Date.now();
  console.log("Starting quantum universe playthroughs...")
  while(queue.size) {
    const state = queue.dequeue();
    if(!state) throw 'Impossible'
    const { numUniverses, p1next } = state

    for (const tripleRoll in probabilityMap) {
      const p1 = {...state.p1};
      const p2 = {...state.p2};
      const player = p1next ? p1 : p2;

      player.space = ((player.space + +tripleRoll - 1) % 10) + 1;
      player.score += player.space;

      const newNumUniverses = numUniverses * probabilityMap[tripleRoll];

      if (player.score >= 21) {
        // console.log(`This universe chain ends with ${newNumUniverses} universes, ${p1next?'p1':'p2'} wins`);
        if(p1next) p1Wins += newNumUniverses;
        else p2Wins += newNumUniverses;
        continue;
      }

      const newObj = {
        p1,
        p2,
        numUniverses: newNumUniverses,
        p1next: !p1next,
      };

      // console.dir(newObj)
      queue.enqueue(newObj);
    }
  }

  console.dir({
    timeTaken: `${Date.now() - timestamp}ms`,
    p1Wins,
    p2Wins,
    part2: p1Wins < p2Wins ? p2Wins : p1Wins
  });
}
playQuantumGame()
