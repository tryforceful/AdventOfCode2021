/**
 * IMPORT DATA
 */

const SAMPLE = false;

import * as fs from "fs";

const data = fs
  .readFileSync(SAMPLE ? "./input_sample.txt" : "./input.txt", "utf8")
  .split('\n')
  .map(Number)

// PART ONE

let increases = 0;
data.reduce((a,c) => {
  if(c > a) increases++
  return c
})
console.log({increases})

// PART TWO
let p2_increases = 0, prevvalue: number | null = null;
for(let i = 0; i < data.length - 3; i++) {
  const current = data[i] + data[i + 1] + data[i + 2];
  if(prevvalue && current > prevvalue) p2_increases++;
  prevvalue = current
}
console.log({ p2_increases });
