const SAMPLE = true;
const PART_ONE = true;

import * as fs from "fs";

const data = fs
  .readFileSync(SAMPLE ? "./input_sample.txt" : "./input.txt", "utf8")
  .split("\n")
  .slice(0, -1);
