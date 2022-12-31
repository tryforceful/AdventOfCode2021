const SAMPLE = false;
import * as fs from "fs";

const data = fs
  .readFileSync(SAMPLE ? "./input_sample.txt" : "./input.txt", "utf8")
  .split("\n")
  .slice(0, -1)
  .map(x => x.split('').map(Number));

const adjacencies = [[0,1],[0,-1],[1,0],[-1,0]]

let risk_sum = 0;
const lowest_points = new Set<string>()

for (let x = 0; x < data.length; x++)
  for (let y = 0; y < data[0].length; y++) {
    const curheight = data[x][y];
    let lowest = true;
    for(const [dx,dy] of adjacencies) {
      const neighbor = data[x+dx]?.[y+dy]
      if(neighbor !== undefined && neighbor <= curheight) {
        lowest = false;
        break;
      }
    }
    if(lowest) {
      risk_sum += curheight + 1;
      lowest_points.add([x,y].join())
    }
  }

console.dir({risk_sum})

// Part 2

const sorter = (a: number, b: number) => (a < b ? -1 : a > b ? 1 : 0);
const sum = (a: number, c: number) => a + c;
const multiply = (a: number, c: number) => a * c;

const visited = new Set<string>()

function recurseExploreBasins(x: number, y: number) {
  const current = data[x]?.[y];
  if(current === undefined || current === 9) return 0;

  const key = [x, y].join();
  if(visited.has(key)) return 0;

  visited.add(key)

  return adjacencies
    .map(([dx,dy]) => recurseExploreBasins(x+dx, y+dy))
    .reduce(sum, 0) + 1 // this spot
}

const basins = [...lowest_points].map(x => x.split(',')).map(([x,y]) => recurseExploreBasins(+x,+y)).sort(sorter)

console.dir({part2: basins.slice(-3).reduce(multiply, 1)})
