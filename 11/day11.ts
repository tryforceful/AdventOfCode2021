const SAMPLE = false

import * as fs from "fs";

const data = fs
  .readFileSync(SAMPLE ? "./input_sample.txt" : "./input.txt", "utf8")
  .split("\n")
  .slice(0, -1)

const adjacencies = [[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1]]

function* genOctopus() {
  let numFlashes = 0, old = 0;

  const grid = data.map(x => {
    const arr = new Uint8ClampedArray(10)
    x.split('').map(Number).forEach((i,idx) => arr[idx] = i)
    return arr;
  });

  while(true) {
    const glowers = new Set<string>()

    // First increment everyone. Keep track of 10+'s
    for(let x = 0; x < grid.length; x++) {
      const row = grid[x]
      for(let y = 0; y < row.length; y++) {
        row[y]++;
        if(row[y] >= 10)
          glowers.add([x,y].join())
      }
    }

    function propogateFlash(x:number, y:number) {
      for (const [dx, dy] of adjacencies) {
        const [x2, y2] = [x+dx, y+dy]
        if (grid[x2]?.[y2] === undefined ||
            glowers.has([x2,y2].join())) continue;
        else {
          grid[x2][y2]++;
          if(grid[x2][y2] >= 10) {
            // This one glows too.
            glowers.add([x2, y2].join());

            grid[x2][y2] = 0; //flashed
            numFlashes++;
            propogateFlash(x2, y2);
          }
        }
      }
    }

    for(const g of [...glowers]) {
      const [x,y] = g.split(',').map(Number)

      grid[x][y] = 0; //flashed
      numFlashes++;
      propogateFlash(x,y)
    }

    if(numFlashes - old === 100)
      throw 'Full flash!'
    old = yield {grid, numFlashes};
  }
  return { grid, numFlashes };
}

const octoStep = genOctopus();

let size: number = 0;
for (let i = 1;; i++) {
  try {
    size = octoStep.next(size).value.numFlashes;
    if ([10,100].includes(i)) console.dir({ [i]: size });
  }
  catch(e) {
    console.dir({part2: i})
    break;
  }
}
