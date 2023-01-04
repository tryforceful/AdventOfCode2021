const SAMPLE = true;

import * as fs from "fs";

const matches = fs
  .readFileSync(SAMPLE ? "./input_sample.txt" : "./input.txt", "utf8")
  .split("\n")
  .slice(0, -1)[0]
  .matchAll(/x=(-?\d+)\.\.(-?\d+), y=(-?\d+)\.\.(-?\d+)/g);

const [x_from, x_to, y_from, y_to] = [...matches].flat().slice(1).map(Number);

console.dir({ from: [x_from, y_from], to: [x_to, y_to] });

/**
 * DEFINE REASONABLE BOUNDS
 *
 * vx max bound
 * vx < x_to (for sure) (loose bound)
 *
 * vy min bound
 * vy > y_from (for sure) (loose bound)
 *
 * vy max bound
 * when the parametric X goes beyond x_to while being above y_to
 *
 ***** (q)(q+1) = x_from * 2
 ***** q^2 + q - (x_from * 2) = 0
 ***** a = 1, b = 1, c = (-2*x_from)
 *****
 ***** QUADRATIC FORMULA
 ***** x = (-b +- sqrt(b^2 - 4ac)) / (2a)
 *****   = (sqrt(1 + 8*x_from) - 1) / 2     (we don't need negative solution)
 *
 * vx min bound
 * vx >= (sqrt(1 + 8*x_from) - 1) / 2
 */

const VX_MIN_BOUND = Math.ceil((Math.sqrt(1 + 8 * x_from) - 1) / 2)
const VX_MAX_BOUND = x_to
const VY_MIN_BOUND = y_from

console.dir({ VX_MIN_BOUND, VX_MAX_BOUND, VY_MIN_BOUND });

const array_of_good_vxvy: string[] = []

let highest_y_reached = -Infinity;
let last_vy_with_a_match = -Infinity;

// Using 1000 as a wide-berth test bound. Still very performant considering restricted X
for(let init_vy = VY_MIN_BOUND; init_vy < (SAMPLE ? 20 : 1000); init_vy++) {
  for(let init_vx = VX_MIN_BOUND; init_vx <= VX_MAX_BOUND; init_vx++) {
    let vx = init_vx, vy = init_vy;
    let x = 0, y = 0, local_max_y = -Infinity;

    while(true) {
      x += vx; y += vy;
      vx = Math.max(0, vx-1);
      vy--;

      if (y > local_max_y) local_max_y = y;

      if(x >= x_from && x <= x_to && y >= y_from && y <= y_to) {
        // we made it into the target! nice.
        // count this path when finding our max
        highest_y_reached = Math.max(highest_y_reached, local_max_y);

        last_vy_with_a_match = init_vy;

        array_of_good_vxvy.push([init_vx,init_vy].join())
        break;
      }

      if(vx === 0) // Short circuit for case where X stops moving
        if(x < x_from || x > x_to) break;

      if(y < y_from || x > x_to) break; // this path is not a match
    }
  }
}

console.dir({ highest_y_reached, count_good_trajectories: array_of_good_vxvy.length, last_vy_with_a_match });
