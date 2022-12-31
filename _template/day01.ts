const SAMPLE = true;
const PART_ONE = true;

import * as fs from "fs";

const sorter = (a: number, b: number) => (a < b ? -1 : a > b ? 1 : 0);
const sum = (a: number, c: number) => a + c;
const multiply = (a: number, c: number) => a * c;

const data = fs
  .readFileSync(SAMPLE ? "./input_sample.txt" : "./input.txt", "utf8")
  .split("\n")
  .slice(0, -1);

console.dir(data);
