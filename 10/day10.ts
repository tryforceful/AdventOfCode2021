const SAMPLE = true;

import { Stack, BiMap, Heap } from 'mnemonist'

const sorter = (a: number, b: number) => (a < b ? -1 : a > b ? 1 : 0);

import * as fs from "fs";

const data = fs
  .readFileSync(SAMPLE ? "./input_sample.txt" : "./input.txt", "utf8")
  .split("\n")
  .slice(0, -1);

type T_OPENER = '('|'<'|'['|'{'
type T_CLOSER = ')'|'>'|']'|'}'

let PAIR_MAP = BiMap.from<T_OPENER, T_CLOSER>({
  "{": "}",
  "[": "]",
  "(": ")",
  "<": ">",
});
const OPENERS = new Set(PAIR_MAP.keys());

function processRow(row: string) {
  const stack = new Stack<T_OPENER>();

  for (const char of row) {
    if (OPENERS.has(char as T_OPENER)) {
      stack.push(char as T_OPENER);
    } else {
      // char is a closer
      const opener = PAIR_MAP.inverse.get(char as T_CLOSER);
      if (!opener || stack.peek() !== opener) {
        return {corrupted: char};
      } else stack.pop();
    }
  }

  // If we made it here, the string was incomplete. Finish it.
  return {completed: [...stack].map((open) => PAIR_MAP.get(open)).join('')};
}

const PART1_POINTS = {
  "}": 1197,
  "]": 57,
  ")": 3,
  ">": 25137,
} as const;
const PART2_POINTS = {
  "}": 3,
  "]": 2,
  ")": 1,
  ">": 4,
} as const;

const results = data.map(row => processRow(row))

let part1 = 0;
const part2heap = new Heap<number>(sorter)
for(const {completed, corrupted} of results) {
  if(corrupted) {
    part1 += PART1_POINTS[corrupted]
  }
  else if (completed) {
    const score = [...completed].reduce((a,c) => a*5 + PART2_POINTS[c] , 0)
    part2heap.push(score);
  }
}

const part2 = part2heap.toArray()[(part2heap.size - 1)/2];

console.dir({ part1 });
console.dir({ part2 });
