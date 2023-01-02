const SAMPLE = true;
const PART_ONE = false;

import * as fs from "fs";
import { DefaultMap } from 'mnemonist';

const data = fs
  .readFileSync(SAMPLE ? "./input_sample.txt" : "./input.txt", "utf8")
  .split("\n")
  .slice(0, -1)
  .map(row => row.split('').map(Number));

const LENGTH = data.length
const start = [0,0]
let end = [LENGTH-1,LENGTH-1]

let grid: number[][]
if(PART_ONE){
  grid = data;
}
else {
  // Make 5x5 grid
  end = [LENGTH*5 - 1, LENGTH*5 - 1]
  grid = new Array(LENGTH*5).fill(0).map(() => new Array(LENGTH*5))
  for(const i of [0,1,2,3,4])
    for(const j of [0,1,2,3,4])
      for(const x in [...Array(LENGTH)])
        for(const y in [...Array(LENGTH)])
          grid[+x + i*LENGTH][+y + j*LENGTH] = ((data[x][y] + i + j - 1) % 9) + 1
}
// fs.writeFileSync('foo.txt', grid.map(x=>x.join('')).join('\n'))


const adjacencies = [[1,0],[0,1],[0,-1],[-1,0]]

const h = ([x,y]:[number, number]) => Math.abs(end[0]-x) + Math.abs(end[1]-y) // manhattan

const gScore = new DefaultMap<string, number>(() => Infinity).set(start.join(), 0);
const fScore = new DefaultMap<string, number>(() => Infinity).set(start.join(), 0)

const sortByFScore = (a:string,b:string) => fScore.get(a) < fScore.get(b) ? -1 : fScore.get(a) === fScore.get(b) ? 0 : 1

const open = new Set<string>([start.join()])

// A* search
while (open.size) {
  const current_key = [...open].sort(sortByFScore)[0]
  const [x,y] = current_key.split(',').map(Number);

  open.delete(current_key)

  if (x === end[0] && y === end[1]) {
    // this is the goal. stop
    console.dir(fScore.get([x,y].join()));
    break;
  }

  for(const [dx,dy] of adjacencies) {
    const neighbor = [x + dx, y + dy] as [number, number];
    const neighbor_weight = grid[x+dx]?.[y+dy]
    if (neighbor_weight === undefined) continue;

    const neighbor_key = neighbor.join();

    const _g = gScore.get(current_key) + neighbor_weight

    if(_g < gScore.get(neighbor_key)) {
      gScore.set(neighbor_key, _g)
      fScore.set(neighbor_key, _g + h(neighbor))
      open.add(neighbor_key);
    }
  }
}
