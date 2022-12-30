const SAMPLE = true;

import * as fs from "fs";

const sorter = (a: number, b: number) => (a < b ? -1 : a > b ? 1 : 0);
const sum = (a: number, c: number) => a + c;

const data = fs
  .readFileSync(SAMPLE ? "./input_sample.txt" : "./input.txt", "utf8")
  .split("\n")[0]
  .split(',')
  .map(Number)
  .sort(sorter);

const test = (trial: number) => data.map( x => Math.abs(x-trial)).reduce(sum)
const test2 = (trial: number) =>
  data.map((x) => Math.abs(x - trial) * (Math.abs(x - trial)+1) / 2).reduce(sum);

// Part 1

const median = (data[data.length / 2 - 1] + data[data.length / 2]) / 2;

console.dir({ part1: test(median), median });

// Part 2

const mean = data.reduce(sum, 0) / data.length | 0;

let min = Infinity;
let min_o = 0

for (let o = mean - 2; o < mean + 3; o++) {
  const value = test2(o);
  if (value < min) {
    min = value;
    min_o = o;
  }
}

console.dir({part2: min, min_o})
