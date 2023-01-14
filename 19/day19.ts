const SAMPLE = false;

import * as fs from "fs";
import * as help from "../helpers";
import { foldArray } from '../helpers';
import { DefaultMap } from 'mnemonist'
import { EnhancedSet } from "datastructures-js";
import assert from "assert";

console.time();

const data = fs
  .readFileSync(SAMPLE ? "./input_sample.txt" : "./input.txt", "utf8")
  .split("\n")
  .slice(0, -1);

type Coord = [number, number, number]

const scanners = foldArray(data, "").map((x) => ({
  beacons: x.slice(1).map((trio) => trio.split(",").map(Number)) as Coord[],
}));

// This is an array of maps of all square Pythagorean distances between beacons, for each scanner.
// Beacons which are visible to 2(+) beacons will have the same distances, even if their coords are different
const beaconDistances = scanners.map(({beacons}) => {
  const mapDistances = new Map<number, [Coord,Coord]>;

  for (let i = 1; i < beacons.length; i++)
    for (let j = 0; j < i; j++) {
      const [a, b] = [beacons[i], beacons[j]];
      const distance3D = ( // no need to sqrt
        (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
      );
      if(mapDistances.has(distance3D))
        throw 'We have a duplicate! Nooo'
      mapDistances.set(distance3D, [a, b]);
    }

  return mapDistances
})

function compareTwoScanners(index0: number, index1: number) {
  const map0 = beaconDistances[index0];
  const map1 = beaconDistances[index1];
  const distances0 = new EnhancedSet([...map0.keys()]);
  const distances1 = new EnhancedSet([...map1.keys()]);

  const shared_distances = distances0.intersect(distances1);

  // We need at least 66 (=11*12/2) shared distances --> 12 beacons are shared
  if (shared_distances.size < 66) return null;

  const sharedBeacons0 = new DefaultMap<Coord, number>(() => 0);

  const setOfPairedBeacons = new EnhancedSet<{
    zero: [string, string];
    one: [string, string];
  }>;

  shared_distances.forEach((dist) => {
    const coordPairFrom0 = map0.get(dist);
    const coordPairFrom1 = map1.get(dist);
    if (!coordPairFrom0 || !coordPairFrom1) throw "Pythagorean distance not found";

    coordPairFrom0.forEach((coord) => sharedBeacons0.set(coord, sharedBeacons0.get(coord) + 1));

    setOfPairedBeacons.add({
      zero: coordPairFrom0.map(String) as [string, string],
      one: coordPairFrom1.map(String) as [string, string],
    });
  });

  // Now go thru the setOfPairedBeacons and pair them up.
  // This map represents the same coords in [scanner0 POV] => [scanner1 POV]
  const match_0_to_1 = new Map<Coord, Coord>;

  sharedBeacons0.forEach((count, beacon0) => {
    if(count < 11) return; // We need at least 11 neighbors for each beacon
    // Sometimes there can be more than 11 if single stray/outlier beacons are dangling onto the graph.
    // The Find Most Frequent Element function below should properly ignore them.

    const beaconKey = beacon0.join();
    const intersect = setOfPairedBeacons.filter(({ zero }) =>
      zero.includes(beaconKey)
    );

    const matchingBeaconsFrom1 = [...intersect.keys()].map((x) => x.one).flat();

    const match = help.findMostFrequentElement(matchingBeaconsFrom1);

    if (match === undefined) throw `Uh oh: no match found for ${beacon0}`;
    else if (match instanceof Array) throw `Uh oh: more than one match found: ${match}`;

    match_0_to_1.set(beacon0, match.split(",").map(Number) as Coord);
  });

  if (match_0_to_1.size !== 12) throw "Size error with zero/one map";

  // Now we have the pair matches, we need to determine the orientation (rotation and cardinality)
  // By testing all permutations of (+-a,+-b,+-c)
  // Below represents 6*8=48 permutations (vs 24) but it still is very performant
  const POSITIONS = [
    [0, 1, 2], [0, 2, 1],
    [1, 0, 2], [1, 2, 0],
    [2, 0, 1], [2, 1, 0],
  ];
  const NEGATIONS = [
    [1, 1, 1],    [-1, 1, 1],
    [1, -1, 1],   [1, 1, -1],
    [-1, -1, -1], [1, -1, -1],
    [-1, 1, -1],  [-1, -1, 1],
  ];

  for (const [x, y, z] of NEGATIONS)
    for (const [a, b, c] of POSITIONS) {
      const mappedCoords = new Set<string>;
      match_0_to_1.forEach(([one0, one1, one2], zero) => {
        // This generates the "scanner 1" versions of the coordinates
        mappedCoords.add([one0 + x * zero[a], one1 + y * zero[b], one2 + z * zero[c]].join());
      });

      if (mappedCoords.size === 1) {
        // We found the correct orientation
        const oneInTermsOfZero = [...mappedCoords][0].split(",").map(Number) as Coord;

        return {
          oneInTermsOfZero,
          negations: [x, y, z],
          position: [a, b, c],
          match_0_to_1,
        };
      }
    }

  throw `We tried all 48 orientations but none reduced to 1 match: ${[index0, index1]}`
}

const mapOfConversionFunctions = new Map</*from:*/ number, { to: number, fn: (_: Coord) => Coord}>

const touched: (0|1)[] = new Array(scanners.length).fill(0);
const queue = [0];

while (queue.length) {
  const j = queue.shift();
  if (j === undefined) throw "Impossible: Queue empty";

  if (touched[j] !== 0) continue;
  touched[j] = 1;

  for (let i = 0; i < scanners.length; i++) {
    if(i===j || touched[i] === 1) continue;

    const results = compareTwoScanners(i,j);
    if(results === null) continue;

    function getNewMappingFunction() {
      if (!results) throw "Can't create mapping function -- no results";
      const dees = results.oneInTermsOfZero;
      const negs = results.negations;
      const [px, py, pz] =  results.position;

      return (from: Coord): Coord => [
          dees[0] - negs[0] * from[px],
          dees[1] - negs[1] * from[py],
          dees[2] - negs[2] * from[pz],
        ];
    }

    const fromItoJ = getNewMappingFunction();
    const fromJtoZero = mapOfConversionFunctions.get(j)?.fn ?? ((x)=>x);
    const newfunc = (from: Coord) => fromJtoZero(fromItoJ(from));

    mapOfConversionFunctions.set(i, { to: j, fn: newfunc });

    queue.push(i)
  }
}

if(~touched.indexOf(0)) throw "Didn't touch all scanners when traversing scanner overlap graph"


// Last step: Go thru each set of beacons and convert them into scanner0 coordinates.
// Then add them to a unique Set and count the total.

const normalizedBeacons = new Set<string>(
  scanners[0].beacons.map(String) // Preload scanner 0
);

const normalizedScanners: Coord[] = [[0,0,0]]; // Preload scanner 0

for(let i = 1; i < scanners.length; i++) {
  const convert_i_to_0 = mapOfConversionFunctions.get(i)?.fn;
  if(convert_i_to_0 === undefined) throw 'convert_i_to_0 function missing';

  scanners[i].beacons.forEach((beacon) =>
    normalizedBeacons.add(String(convert_i_to_0(beacon)))
  );

  normalizedScanners.push(convert_i_to_0([0,0,0] as Coord));
}

console.dir({finalsize: normalizedBeacons.size})
assert(normalizedBeacons.size === (SAMPLE ? 79 : 362), "Failed Part 1");


// Calculate manhattan distances between all scanner pairs
let maxManhattanDistance = 0;

for (let i = 1; i < normalizedScanners.length; i++)
  for (let j = 0; j < i; j++) {
    const [a, b, c] = normalizedScanners[i],
      [x, y, z] = normalizedScanners[j];

    const dist = Math.abs(x - a) + Math.abs(y - b) + Math.abs(z - c);
    if (dist > maxManhattanDistance) maxManhattanDistance = dist;
  }

console.dir({ maxManhattanDistance });
assert(maxManhattanDistance === (SAMPLE ? 3621 : 12204), "Failed Part 2");

console.timeEnd();
