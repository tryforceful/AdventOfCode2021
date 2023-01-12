import { FixedStack } from "../helpers";
import { EnhancedSet } from "datastructures-js";

export type Amphipod = 'A'|'B'|'C'|'D';
export type Spot = 'a'|'b'|'c'|'d'|'t'|'u'|'v'|'w'|'x'|'y'|'z';

export type SpotsState = {
  a: FixedStack<Amphipod>;
  b: FixedStack<Amphipod>;
  c: FixedStack<Amphipod>;
  d: FixedStack<Amphipod>;
  t: Amphipod | null;
  u: Amphipod | null;
  v: Amphipod | null;
  w: Amphipod | null;
  x: Amphipod | null;
  y: Amphipod | null;
  z: Amphipod | null;
};

export type StateKey = string;

// CONSTS

export const BURROWS = ["a", "b", "c", "d"] as const;
export const HALLWAY = ["t", "u", "v", "w", "x", "y", "z"] as const;

export const DISTANCE_GRID = [
  //     a,b,c,d,t,u,v,w,x,y,z
  /*a*/ [0, 4, 6, 8, 3, 2, 8, 9, 2, 4, 6],
  /*b*/ [4, 0, 4, 6, 5, 4, 6, 7, 2, 2, 4],
  /*c*/ [6, 4, 0, 4, 7, 6, 4, 5, 4, 2, 2],
  /*d*/ [8, 6, 4, 0, 9, 8, 2, 3, 6, 4, 2],
  /*t*/ [3, 5, 7, 9, 0, 1, 9, 10, 3, 5, 7],
  /*u*/ [2, 4, 6, 8, 1, 0, 8, 9, 2, 4, 6],
  /*v*/ [8, 6, 4, 2, 9, 8, 0, 1, 6, 4, 2],
  /*w*/ [9, 7, 5, 3, 10, 9, 1, 0, 7, 5, 3],
  /*x*/ [2, 2, 4, 6, 3, 2, 6, 7, 0, 2, 4],
  /*y*/ [4, 2, 2, 4, 5, 4, 4, 5, 2, 0, 2],
  /*z*/ [6, 4, 2, 2, 7, 6, 2, 3, 4, 2, 0],
] as const;
const ORDER = "abcdtuvwxyz" as const;

const BLOCKED_MAP = {
  u: [[..."t"], [..."abcdvwxyz"]],
  v: [[..."w"], [..."abcdtuxyz"]],
  x: [[..."tua"], [..."bcdvwyz"]],
  y: [[..."tuxab"], [..."vwzcd"]],
  z: [[..."tuxyabc"], [..."dvw"]],
} as const;

const BLOCKER_SPOTS = Object.keys(BLOCKED_MAP) as unknown as keyof typeof BLOCKED_MAP;



// HELPER FUNCTIONS

export function fetchDistance(from: Spot, to: Spot) {
  const fidx = ORDER.indexOf(from),
    tidx = ORDER.indexOf(to);
  if (fidx < 0 || tidx < 0) throw "Improper from/to indices!";
  return DISTANCE_GRID[fidx][tidx];
}

export function getScoreFromThisMove(
  amphipod: Amphipod,
  from: Spot,
  to: Spot,
  originalState: SpotsState,
  BURROW_DEPTH: 2 | 4
) {
  const oneStep = 10 ** (amphipod.charCodeAt(0) - 65);
  let distance = fetchDistance(from, to);

  // consider if we were deeper in the burrows (requiring +1s)
  for (const burrow of BURROWS) {
    if (from === burrow && originalState[burrow].size < BURROW_DEPTH)
      distance += BURROW_DEPTH - originalState[burrow].size;
    if (to === burrow && originalState[burrow].size + 1 < BURROW_DEPTH)
      distance += BURROW_DEPTH - (originalState[burrow].size + 1);
  }

  return distance * oneStep;
}

export function getAvailableMoveLocations(
  spots: SpotsState,
  from: Spot,
  amphipodAtFromSpot: Amphipod,
  BURROW_DEPTH: 2 | 4
): Spot[] {
  let available = new EnhancedSet<Spot>([...ORDER] as Spot[]);
  const dest_burrow = amphipodAtFromSpot.toLowerCase() as "a" | "b" | "c" | "d";

  // if we are in the hallway, the amphipod can only go to its proper burrow next
  if (HALLWAY.includes(from as any)) {
    if (spots[dest_burrow].size < BURROW_DEPTH)
      available = new EnhancedSet([dest_burrow as Spot]);
    else return [];
  }

  // remove currently occupied spots
  for (const hallspot of HALLWAY)
    if (spots[hallspot]) available.delete(hallspot);
  for (const burrow of BURROWS) {
    const stack = spots[burrow];

    if (
      stack.size === BURROW_DEPTH || // Burrow is full
      burrow !== dest_burrow || // Burrow type doesn't match this Amphipod
      stack.array.some((x) => x !== amphipodAtFromSpot) // Burrow still has a "stranger" in it
    )
      available.delete(burrow);
  }

  // consider blocking spots
  for (const key of BLOCKER_SPOTS) {
    if (from !== key && spots[key] !== null) {
      // a blocking spot is occupied which will limit where we can go from "from"
      // find which side we're on and then limit the available set to that side
      const [side1, side2] = BLOCKED_MAP[key] as [Spot[], Spot[]];
      if (~side1.indexOf(from))
        available = available.intersect(new EnhancedSet(side1));
      else if (~side2.indexOf(from))
        available = available.intersect(new EnhancedSet(side2));
    }
  }

  return available.toArray();
}

export function resolveAmphipod(
  maybeAmphipod: Amphipod | FixedStack<Amphipod> | null
): Amphipod {
  if (!maybeAmphipod) throw "Can't resolve; amphi is null";
  if (maybeAmphipod instanceof FixedStack) {
    if (maybeAmphipod.size <= 0) throw "Stack is empty";
    return maybeAmphipod.peek();
  }
  return maybeAmphipod;
}

export function generateCameFromList(cameFrom: Map<string, [string, number]>, BURROW_DEPTH: 2 | 4) {
  // generate "came from" list
  let x = "AAAA|BBBB|CCCC|DDDD|-------",
    d_time = 0;
  printBurrows("AAAA|BBBB|CCCC|DDDD|-------", BURROW_DEPTH);
  while (cameFrom.has(x)) {
    [x, d_time] = cameFrom.get(x) ?? ["", 0];
    console.log(`cost ${d_time} ^`);
    printBurrows(x, BURROW_DEPTH);
  }
}

export function printBurrows(spots: SpotsState | StateKey, BURROW_DEPTH: 2 | 4) {
  let _a, _b, _c, _d, _t, _u, _v, _w, _x, _y, _z;
  if (typeof spots == "string") {
    const _spots = [...spots];
    [_a, _b, _c, _d] = [
      _spots.slice(0, 4),
      _spots.slice(5, 9),
      _spots.slice(10, 14),
      _spots.slice(15, 19),
    ].map((y) => y.map((x) => (x === "-" ? "." : x)));
    [_t, _u, _v, _w, _x, _y, _z] = _spots
      .slice(-7)
      .map((x) => (x == "-" ? "." : x));
  } else {
    const { a, b, c, d, t, u, v, w, x, y, z } = spots;
    [_a, _b, _c, _d] = [a, b, c, d].map((stack) =>
      stack.array.map((x) => (x === null ? "." : x))
    );
    [_t, _u, _v, _w, _x, _y, _z] = [t, u, v, w, x, y, z].map((x) => x ?? ".");
  }

  const burrows =
`|-----------|\n` +
`|${_t}${_u}.${_x}.${_y}.${_z}.${_v}${_w}|\n` +
( BURROW_DEPTH === 2
  ? `|-|${_a[1]}|${_b[1]}|${_c[1]}|${_d[1]}|-|\n`
  : `|-|${_a[3]}|${_b[3]}|${_c[3]}|${_d[3]}|-|\n` +
    `  |${_a[2]}|${_b[2]}|${_c[2]}|${_d[2]}|\n` +
    `  |${_a[1]}|${_b[1]}|${_c[1]}|${_d[1]}|\n`) +
`  |${_a[0]}|${_b[0]}|${_c[0]}|${_d[0]}|\n` +
`  |-------|\n`;

  console.log(burrows);
  return burrows;
}
