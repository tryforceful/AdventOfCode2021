const SAMPLE = false;
const PART_ONE = false;

import * as fs from "fs";
import * as help from "../helpers";
import { FixedStack } from "../helpers";
import { EnhancedSet } from "datastructures-js"
import { cloneDeepWith, type CloneDeepWithCustomizer } from "lodash";
import { Heap, DefaultMap } from 'mnemonist'

const data = fs
  .readFileSync(SAMPLE ? "./input_sample.txt" : "./input.txt", "utf8")
  .split("\n")
  .slice(0, -1);

type Amphipod = 'A'|'B'|'C'|'D';
type Spot = 'a'|'b'|'c'|'d'|'t'|'u'|'v'|'w'|'x'|'y'|'z';

const burrows = data.slice(2, 4).map((x) => x.split(/[\s#]*/).filter(x=>x)) as Amphipod[][]

if(!PART_ONE)
  burrows.splice(1, 0, ['D','C','B','A'], ['D','B','A','C'])

const BURROW_DEPTH = PART_ONE ? 2 : 4;

// console.dir(data);
// console.dir(burrows);


/**
 * We will represent the structure with state variables like this:
 *
 * #############
 * #tu.x.y.z.vw#
 * ###B#C#B#D###
 *   #A#D#C#A#
 *   #########
 *    a b c d
 */

/**
 * SET UP TYPES AND CONSTS
 */

type SpotsState = {
  a: FixedStack<Amphipod>,
  b: FixedStack<Amphipod>,
  c: FixedStack<Amphipod>,
  d: FixedStack<Amphipod>,
  t: Amphipod | null;
  u: Amphipod | null;
  v: Amphipod | null;
  w: Amphipod | null;
  x: Amphipod | null;
  y: Amphipod | null;
  z: Amphipod | null;
};

const initialSpots: SpotsState = {
  a: new FixedStack<Amphipod>(BURROW_DEPTH),
  b: new FixedStack<Amphipod>(BURROW_DEPTH),
  c: new FixedStack<Amphipod>(BURROW_DEPTH),
  d: new FixedStack<Amphipod>(BURROW_DEPTH),
  t: null,
  u: null,
  v: null,
  w: null,
  x: null,
  y: null,
  z: null,
};

const BURROWS = ["a", "b", "c", "d"] as const;
const HALLWAY = ["t", "u", "v", "w", "x", "y", "z"] as const;

const needToMove: Spot[] = []

for(let i = BURROW_DEPTH-1; i >= 0; i--) {
  for(const j in BURROWS) {
    const burrow = BURROWS[j]
    initialSpots[burrow].push(burrows[i][j]);

    if(burrows[i][j].toLowerCase() !== burrow || needToMove.includes(burrow))
      needToMove.push(burrow)
  }
}
console.dir(needToMove)

const BLOCKED_MAP = {
  u: [["t"], [..."abcdvwxyz"]],
  v: [["w"], [..."abcdtuxyz"]],
  x: [[..."tua"], [..."bcdvwyz"]],
  y: [[..."tuxab"], [..."vwzcd"]],
  z: [[..."tuxyab"], [..."dvw"]],
};
const BLOCKER_SPOTS = Object.keys(BLOCKED_MAP) as Spot[];

const DISTANCE_GRID = [
//     a,b,c,d,t,u,v,w,x,y,z
/*a*/ [0,4,6,8,3,2,8,9,2,4,6],
/*b*/ [4,0,4,6,5,4,6,7,2,2,4],
/*c*/ [6,4,0,4,7,6,4,5,4,2,2],
/*d*/ [8,6,4,0,9,8,2,3,6,4,2],
/*t*/ [3,5,7,9,0,1,9,10,3,5,7],
/*u*/ [2,4,6,8,1,0,8,9,2,4,6],
/*v*/ [8,6,4,2,9,8,0,1,6,4,2],
/*w*/ [9,7,5,3,10,9,1,0,7,5,3],
/*x*/ [2,2,4,6,3,2,6,7,0,2,4],
/*y*/ [4,2,2,4,5,4,4,5,2,0,2],
/*z*/ [6,4,2,2,7,6,2,3,4,2,0],
] as const;

const cloneFixedStacksCorrectly: CloneDeepWithCustomizer<SpotsState> = (value) =>
  (value instanceof FixedStack) ? new FixedStack(value) : undefined;

type State = {
  spots: SpotsState;
  needToMove: Spot[];
};

type StateKey = string;

const gscore = new DefaultMap<string, number>(() => Infinity)
const fscore = new DefaultMap<string, number>(() => Infinity)
const openPQ = new Heap<State>((a: State, b: State) => {
    const _a = makeKey(a), _b = makeKey(b);
    return fscore.get(_a) < fscore.get(_b) ? -1 : fscore.get(_a) > fscore.get(_b) ? 1 : 0
  }
);
const openSet = new Set<StateKey>
const cameFrom = new Map<string, [string, number]>();

function h (state: State) {
  // 0 - gscore.get(makeKey(state));
  return 0

  const totalEstimate = state.needToMove.map(spot => {
    const maybeAmphi = state.spots[spot];
    if(maybeAmphi instanceof FixedStack) {
      const oneStep = 10 ** (maybeAmphi.peek().charCodeAt(0) - 65);
      return 16 * oneStep + (maybeAmphi.size === 1 ? 2 : 0)
    } else {
      // it has to be a hallway spot
      if(!maybeAmphi) throw 'wrong'
      const destination = maybeAmphi.toLowerCase()
      const oneStep = 10 ** (maybeAmphi.charCodeAt(0) - 65);

      const order = "abcdtuvwxyz";
      const fidx = order.indexOf(destination), tidx = order.indexOf(spot);
      if (fidx < 0 || tidx < 0) throw "Improper from/to indices!";
      return DISTANCE_GRID[fidx][tidx] * oneStep;
    }
  }).reduce(help.sum, 0)

  return totalEstimate
}

const initialstate = { spots: initialSpots, needToMove };

const initialKey = makeKey(initialstate);
gscore.set(initialKey, 0);
fscore.set(initialKey, h(initialstate));

// console.dir(h(initialstate));

printBurrows(initialstate.spots)

openPQ.push(initialstate)
openSet.add(makeKey(initialstate))

function makeKey(state: State): StateKey {
  const spots = Object.values(state.spots)
  return spots.map(i => i instanceof FixedStack<Amphipod> ? i.array.join('').padEnd(BURROW_DEPTH, '-') : i ?? '-').join('')
  // console.log([...str.join('')].map(x => Number.parseInt(x,16)-9).join(''));
  // console.log(str.join(""));
  // return str.join()
}

let finalMaxScore = Infinity;
// let finalPath: string[] = []
let iterations = 0;
let endsHit = 0

function PART1() {

  console.time('zelda')
  while(openPQ.size) {

    // console.log(openPQ
    //   .toArray()
    //   .slice(0,5)
    //   .map((x) => [makeKey(x), fscore.get(makeKey(x))]))
    const state = openPQ.pop();
    if (!state) throw "Woah";

    const stateKey = makeKey(state);
    // console.dir([stateKey, fscore.get(stateKey)])
    openSet.delete(stateKey);

    // if(iterations % 5000 === 0) {
    //   console.dir({iterations, endsHit, key: stateKey, movesLeft: state.needToMove.length})
    //   console.dir({openSet: openSet.size, openPQ: openPQ.size})
    //   console.dir([...fscore.entries()].slice(-10));
    // }

    if (!state.needToMove.length) {
      // We are theoretically done!
      // Eject this edge case into an array of final scores?

      if (gscore.get(stateKey) < finalMaxScore) {
        finalMaxScore = gscore.get(stateKey);
        console.log(`We have an updated min score of ${finalMaxScore}`);

        console.timeLog("zelda");

        console.dir({
          fscore: fscore.get(stateKey),
          gscore: gscore.get(stateKey),
        });

        // return stateKey;
      }
      endsHit++;

      console.dir({ "we made it!": "", x: gscore.get(stateKey), iterations: iterations });
      // continue;
    }

    for (const moveFromSpot of [...new Set(state.needToMove)]) {
      let from = state.spots[moveFromSpot];
      let amphipod: Amphipod;
      if (from === null) throw "Problem";

      if (from instanceof FixedStack) {
        if (from.size <= 0) throw "blah";
        amphipod = from.peek() as Amphipod;
      } else {
        amphipod = from;
      }

      const availableSpots = getAvailableMoveLocations(
        moveFromSpot,
        state.spots,
        amphipod
      );
      // console.dir({moveFromSpot, availableSpots:availableSpots})

      for (const moveToSpot of availableSpots.toArray()) {
        const spots = cloneDeepWith(state.spots, cloneFixedStacksCorrectly);

        const from = spots[moveFromSpot];
        if (from === null) throw "Problem";

        // make the move. delete from from where it was
        if (from instanceof FixedStack) {
          from.pop();
        } else {
          spots[moveFromSpot as keyof typeof HALLWAY] = null;
        }

        //move "from" to the new location
        if (~(BURROWS as readonly string[]).indexOf(moveToSpot)) {
          const burrow = spots[moveToSpot] as FixedStack<Amphipod>;
          burrow.push(amphipod);
        } else {
          spots[moveToSpot as keyof typeof HALLWAY] = amphipod;
        }

        const oldStateKey = makeKey(state);

        const newScore =
          gscore.get(oldStateKey) +
          getScoreFromThisMove(amphipod, moveFromSpot, moveToSpot, state.spots);

        if (newScore > finalMaxScore) {
          // we're already over the bounds of what the min score can be so don't recurse further!
          continue;
        }

        // handle "still need to move" state
        const newNeedToMove = [...state.needToMove];
        const fromidx = newNeedToMove.indexOf(moveFromSpot);
        if (~fromidx) newNeedToMove.splice(fromidx, 1);
        if (moveToSpot.toUpperCase() !== amphipod)
          newNeedToMove.push(moveToSpot); // only add it back in if this amphipod hasn't come to rest

        // console.dir({ moveFromSpot, moveToSpot, spots, score: newScore, newNeedToMove, });

        // printBurrows(spots);

        const newState: State = {  spots, needToMove: newNeedToMove, };

        // if (state.movePath.length > needToMove.length*2) continue; // Can't possibly move more than this

        // Memoize
        const newStateKey = makeKey(newState);

        const alreadyScored = gscore.get(newStateKey);
        if (alreadyScored && alreadyScored <= newScore) {
          continue; // we found a better path to this state somehow
        }

        cameFrom.set(newStateKey, [stateKey, newScore-gscore.get(oldStateKey)])
        gscore.set(newStateKey, newScore);
        fscore.set(newStateKey, newScore + h(newState));

        iterations++;

        if (!openSet.has(newStateKey)) {
          openPQ.push(newState);
          openSet.add(newStateKey);
        }
      }
    }
  }
  console.timeEnd("zelda");
  return ''
}
const endStateKey = PART1();

console.dir({ iterations, finalMaxScore, openSet, gscoresize: gscore.size, fscoresize: fscore.size });



// // generate "came from" list
// let x = endStateKey, d_time=0;
// printBurrows(endStateKey);
// while(cameFrom.has(x)) {
//   [x, d_time] = cameFrom.get(x) ?? ['',0]
//   console.log(`cost ${d_time} ^`);
//   printBurrows(x)
// }

// console.dir([...gscore.entries()].slice(0,10))

// HELPER FUNCTIONS

function getScoreFromThisMove(amphipod: Amphipod, from: Spot, to: Spot, originalState: SpotsState) {
  const oneStep = 10 ** (amphipod.charCodeAt(0) - 65);

  const order = 'abcdtuvwxyz'
  const fidx = order.indexOf(from), tidx = order.indexOf(to)
  if(fidx < 0 || tidx < 0) throw 'Improper from/to indices!'
  let distance = DISTANCE_GRID[fidx][tidx];

  // consider if we were deeper in the burrows (requiring +1s)
  for(const burrow of BURROWS) {
    if(from === burrow && originalState[burrow].size < BURROW_DEPTH)
      distance += (BURROW_DEPTH - originalState[burrow].size);
    if(to === burrow && originalState[burrow].size + 1 < BURROW_DEPTH)
      distance += (BURROW_DEPTH - (originalState[burrow].size+1));
  }

  return distance * oneStep
}

function getAvailableMoveLocations(from: Spot, spots: SpotsState, amphipodAtFromSpot: Amphipod): EnhancedSet<Spot> {
  let available = new EnhancedSet<Spot>([..."abcdtuvwxyz"] as Spot[]);

  // remove currently occupied spots
  for (const solo of HALLWAY) if (spots[solo] !== null) available.delete(solo);
  for (const duo of BURROWS) {
    const burrow = spots[duo];
    if (burrow.size === BURROW_DEPTH) available.delete(duo);

    // Also make sure we can't move into a burrow unless it is empty of "strangers"
    if (burrow.size > 0 && burrow.array.some(x => x !== amphipodAtFromSpot))
      available.delete(duo);
  }

  // consider blocking spots
  for (const key of BLOCKER_SPOTS) {
    if (from !== key && spots[key] !== null) {
      // a blocking spot is occupied which will limit where we can go from "from"
      // find which side we're on and then limit the available set to that side
      const [side1, side2] = BLOCKED_MAP[key as keyof typeof BLOCKED_MAP] as [
        Spot[],
        Spot[]
      ];
      if (~side1.indexOf(from))
        available = available.intersect(new EnhancedSet(side1));
      else if (~side2.indexOf(from))
        available = available.intersect(new EnhancedSet(side2));
    }
  }

  //now include logic that says, if we are in the hallway, the amphipod can only go to its proper burrow next
  if (HALLWAY.includes(from as any)) {
    const dest_burrow = amphipodAtFromSpot.toLowerCase();
    const openBurrows = spots[dest_burrow].size < BURROW_DEPTH ? [dest_burrow as Spot] : [];
    available = available.intersect(new EnhancedSet(openBurrows));
  }

  return available;
}


//Tests
// console.dir(initialstate);
// console.dir(getAvailableMoveLocations('a', initialstate.spots));
// console.dir(getAvailableMoveLocations('b', initialstate.spots));
// console.dir(getAvailableMoveLocations("z", initialstate.spots));

// initialstate.spots.t = 'A'
// initialstate.spots.x = 'A'
// initialstate.spots.z = "A";
// console.dir(initialstate);
// console.dir(getAvailableMoveLocations("a", initialstate.spots));
// console.dir(getAvailableMoveLocations("b", initialstate.spots));

// let foob = {
//   a: new FixedStack<Amphipod>(2),
//   b: new FixedStack<Amphipod>(2),
//   c: new FixedStack<Amphipod>(2),
//   d: new FixedStack<Amphipod>(2),
//   t: "A" as Amphipod,
//   u: "A" as Amphipod,
//   v: "D" as Amphipod,
//   w: null,
//   x: null,
//   y: null,
//   z: null,
// };
// foob.a.push(['C']);
// foob.b.push(['C', 'C']);
// foob.c.push(['C', 'C']);
// foob.d.push(['D','D']);

// console.dir(getAvailableMoveLocations("v", foob, "D"));

function printBurrows(spots: SpotsState | StateKey) {
  let _a, _b, _c, _d, _t, _u, _v, _w, _x, _y, _z;
  if(typeof spots == 'string') {
    const _spots = [...spots];
    [_a, _b, _c, _d] = [_spots.slice(0,4), _spots.slice(4,8), _spots.slice(8,12), _spots.slice(12, 16)].map(y => y.map(x => x === '-' ? '.' : x));
    [_t, _u, _v, _w, _x, _y, _z] = _spots.slice(-7).map((x) => x == '-' ? '.' : x);
  }
  else {
    const {a,b,c,d,t,u,v,w,x,y,z} = spots;
    [_a, _b, _c, _d] = [a,b,c,d].map(stack => stack.array.map(x => x === null ? '.' : x));
    [_t, _u, _v, _w, _x, _y, _z] = [t, u, v, w, x, y, z].map(x => x ?? '.');
  }

  const burrows = ''+
 `|-----------|` + '\n'+
 `|${_t}${_u}.${_x}.${_y}.${_z}.${_v}${_w}|` + '\n'+

  (PART_ONE ?
  `|-|${_a[1]}|${_b[1]}|${_c[1]}|${_d[1]}|-|` + '\n' :
  `|-|${_a[3]}|${_b[3]}|${_c[3]}|${_d[3]}|-|` + '\n'+
  `  |${_a[2]}|${_b[2]}|${_c[2]}|${_d[2]}|` + '\n'+
  `  |${_a[1]}|${_b[1]}|${_c[1]}|${_d[1]}|` + '\n'
  ) +

 `  |${_a[0]}|${_b[0]}|${_c[0]}|${_d[0]}|` + '\n'+
 `  |-------|` + '\n'

 console.log(burrows)
 return burrows
}

/**
 *
 * wrong tries
 * 15324 is too high
 * 15438 <-- shouldnt it also be too high
 *
 * 15322 is the answer for Part 1
 *
 *
 * Part 2 real: 56928, 56808 is too high
 * Part 2 sample: we got too low somehow?? should be 44169
 * 43199 too low
 *
 * */
