const SAMPLE = false;

import * as fs from "fs";

const data = fs
  .readFileSync(SAMPLE ? "./input_sample.txt" : "./input.txt", "utf8")
  .split("\n")[0]
  .split(',').map(Number);

let cycle: number[] = new Array(9).fill(0)

const sum = (a: number, c: number) => a+c

function* dayIncrementer() {

  // setup
  for(const item of data)
    cycle[item]++

  yield cycle.reduce(sum, 0)

  while(true) {
    const numEnding = cycle.shift()
    if (numEnding === undefined) throw 'Uh oh'
    cycle.push(numEnding);
    cycle[6] += numEnding;

    yield cycle.reduce(sum, 0);
  }
}
const fishDay = dayIncrementer();

let size: number | void = 0;
for(let i = 0; i <= 256; i++) {
  size = fishDay.next().value;
  if([18,80,256].includes(i))
    console.dir({[i]: size})
}
