import { DefaultMap } from 'mnemonist'

const SAMPLE = false;
const PART_TWO = false;

import * as fs from "fs";

const data = fs
  .readFileSync(SAMPLE ? "./input_sample.txt" : "./input.txt", "utf8")
  .split("\n")
  .slice(0, -1)
  .map((line) => [...line.matchAll(/(\d+)/g)].map(x => +x[0]))
  .map(([a,b,c,d]) => ({start: [a,b], end: [c,d]}));

let points = data;
if(!PART_TWO) {
  points = data.filter(({start,end}) => start[0] === end[0] || start[1] === end[1])
}

const pointMap = new DefaultMap(() => 0);

for(const {start, end} of points) {
  const x_increment = Math.sign(end[0] - start[0])
  const y_increment = Math.sign(end[1] - start[1]);
  let [x,y] = start;
  let [x_end, y_end] = end;

  // handle first endpoint outside of loop
  const key = [x, y].join();
  pointMap.set(key, pointMap.get(key) + 1);

  do {
    (x += x_increment), (y += y_increment);
    const key = [x,y].join()
    pointMap.set(key, pointMap.get(key) + 1);

  } while (!(x === x_end && y === y_end))
}

console.dir([...pointMap].filter(([,count]) => count > 1).length);
