/**
 * IMPORT DATA
 */

const SAMPLE = false;
const PART_ONE = false;

import * as fs from "fs";

type DIR = 'forward' | 'up' | 'down'

const data = fs
  .readFileSync(SAMPLE ? "./input_sample.txt" : "./input.txt", "utf8")
  .split("\n")
  .slice(0, -1)
  .map((line) => line.split(" "))
  .map((double) => [double[0], Number(double[1])]) as [DIR, number][];

console.dir(data);

if(PART_ONE)
{
  let depth = 0, horiz = 0;

  data.forEach(([direction, distance]) => {
    switch (direction) {
      case 'forward': horiz += distance; break;
      case 'up': depth -= distance; break;
      case 'down': depth += distance; break;
    }
  })

  console.dir({ depth, horiz, combo: depth * horiz })
}
else
{
  let depth = 0, horiz = 0, aim = 0;

  data.forEach(([direction, distance]) => {
    switch (direction) {
      case 'up': aim -= distance; break;
      case 'down': aim += distance; break;
      case 'forward':
        horiz += distance;
        depth += distance * aim;
        break;
    }
  })

  console.dir({ depth, horiz, combo: depth * horiz })
}
