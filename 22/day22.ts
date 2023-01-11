const SAMPLE = false;

import * as fs from "fs";

console.time();
const data = fs
  .readFileSync(SAMPLE ? "./input_sample.txt" : "./input.txt", "utf8")
  .split("\n")
  .slice(0, -1);

type XYZRange = [[number, number], [number, number], [number, number]]

const instructions = data.map((x) => {
  const [flip, a, b, c, d, e, f] = x.split(/\sx=|\.\.|,y=|,z=/);
  return {
    turnOn: flip === "on",
    coords: [[+a, +b], [+c, +d], [+e, +f]] as XYZRange,
  };
});

let total_volume_on = 0;
let allPerms: [XYZRange, 1 | -1][] = []

for(const a of instructions) {
  const vol_a = volume(a.coords);

  const intersects = allPerms
    .map(([perm, sign]) => [getCubicIntersection(a.coords, perm), -1 * sign] as [XYZRange, 1 | -1])
    .filter(([x]) => x && volume(x) > 0)
  const vol_intersects = intersects.reduce((acc, [int, sign]) => acc + volume(int) * sign, 0);

  if (a.turnOn) allPerms.push([a.coords, 1])
  allPerms.push(...intersects)

  total_volume_on += (a.turnOn ? vol_a : 0) + vol_intersects;
}
console.timeEnd();
console.dir({total_volume_on});

function getCubicIntersection(a: XYZRange, b: XYZRange): XYZRange | false {
  const [ax, ay, az] = a, [bx, by, bz] = b;

  if (
    ((ax[0] <= bx[0] && bx[0] <= ax[1]) || (bx[0] <= ax[0] && ax[0] <= bx[1])) &&
    ((ay[0] <= by[0] && by[0] <= ay[1]) || (by[0] <= ay[0] && ay[0] <= by[1])) &&
    ((az[0] <= bz[0] && bz[0] <= az[1]) || (bz[0] <= az[0] && az[0] <= bz[1]))
  )
    return [
      [Math.max(ax[0], bx[0]), Math.min(ax[1], bx[1])],
      [Math.max(ay[0], by[0]), Math.min(ay[1], by[1])],
      [Math.max(az[0], bz[0]), Math.min(az[1], bz[1])],
    ]
  else return false
}

function volume([x,y,z]: XYZRange) {
  return ((x[1] - x[0] + 1) * (y[1] - y[0] + 1) * (z[1] - z[0] + 1))
}
