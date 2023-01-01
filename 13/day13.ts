const SAMPLE = false;

import * as fs from "fs";
import { CoordSet } from "../helpers";

const data = fs
  .readFileSync(SAMPLE ? "./input_sample.txt" : "./input.txt", "utf8")
  .split("\n")
  .slice(0, -1);

const idx = data.indexOf('')
if(!~idx) throw 'Apple'

const coords = data.slice(0, idx).map(row => row.split(',').map(Number)) as [number, number][]
const instructions = data.slice(idx+1).map(row => [...row.matchAll(/fold along ([x|y])=(\d+)/g)].flat().slice(1));

for(const i of instructions) {
  const pos = +i[1], dir = i[0] as 'x'|'y'

  for(let j = 0; j < coords.length; j++) {
    const [x,y] = coords[j]
    if((dir==='x' ? x : y) > pos)
      coords[j] = [
        dir === "y" ? x : 2 * pos - x,
        dir === "x" ? y : 2 * pos - y
      ];
  }
}

const result = [...new CoordSet(coords)];
const maxes = result.reduce((a,c) => [Math.max(a[0],c[0]), Math.max(a[1], c[1])])

const grid = new Array(maxes[1]+1).fill(0).map(() => new Array(maxes[0]+1).fill('.'))

for(const [x,y] of result)
  grid[y][x] = '#'

console.dir(grid.map(i=>i.join('')));
