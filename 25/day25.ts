const SAMPLE = false;
const DEBUG = false;

import * as fs from "fs";

console.time();

const data = fs
  .readFileSync(SAMPLE ? "./input_sample.txt" : "./input.txt", "utf8")
  .split("\n")
  .slice(0, -1)
  .map(x => x.split('')) as ('v'|'>'|'.')[][];

const HEIGHT = data.length;
const WIDTH = data[0].length;

function* stepGenerator() {
  let curMap = [...data.map(x => [...x])];

  while(true) {
    const nextMap = new Array(HEIGHT).fill(0).map(_ => new Array(WIDTH).fill('.')) as ('v'|'>'|'.')[][]

    for(let x = 0; x < HEIGHT; x++)
      for(let y = 0; y < WIDTH; y++)
      { // handle right-movers first
        const space = curMap[x][y];
        if(space === '>') {
          const aheadCur = curMap[x][(y+1) % WIDTH];
          const aheadNext = nextMap[x][(y+1) % WIDTH];
          if(aheadCur === '.' && aheadNext === '.')
            // we get to move one forward
            nextMap[x][(y+1) % WIDTH] = '>';
          else nextMap[x][y] = '>';
        }
      }
    for(let x = 0; x < HEIGHT; x++)
      for(let y = 0; y < WIDTH; y++)
      { // now handle down-movers
        const space = curMap[x][y];
        if(space === 'v') {
          const aheadCur = curMap[(x + 1) % HEIGHT][y];
          const aheadNext = nextMap[(x + 1) % HEIGHT][y];
          if(aheadCur !== 'v' && aheadNext === '.')
            // we get to move one forward
            nextMap[(x + 1) % HEIGHT][y] = "v";
          else nextMap[x][y] = 'v';
        }
      }

    if(nextMap.flat().join() === curMap.flat().join())
      return nextMap;

    curMap = nextMap
    yield nextMap;
  }
}

const namakoStep = stepGenerator();

if(DEBUG) console.log(data.map(x=>x.join('')).join('\n')  + '\n')

let numSteps = 1;
let next: any;
while(!((next = namakoStep.next()).done)) {
  if(DEBUG) console.log(next.value.map((x) => x.join("")).join("\n") + "\n");
  numSteps++;
}

console.dir({numSteps})

console.timeEnd();
