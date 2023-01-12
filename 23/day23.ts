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

for(let i = BURROW_DEPTH-1; i >= 0; i--)
  for(const j in BURROWS) {
    const burrow = BURROWS[j]
    initialSpots[burrow].push(burrows[i][j]);

    if(burrows[i][j].toLowerCase() !== burrow || needToMove.includes(burrow))
      needToMove.push(burrow)
  }

console.dir(needToMove)

const BLOCKED_MAP = {
  u: [[..."t"], [..."abcdvwxyz"]],
  v: [[..."w"], [..."abcdtuxyz"]],
  x: [[..."tua"], [..."bcdvwyz"]],
  y: [[..."tuxab"], [..."vwzcd"]],
  z: [[..."tuxyabc"], [..."dvw"]],
} as const;
const BLOCKER_SPOTS = Object.keys(BLOCKED_MAP) as unknown as keyof typeof BLOCKED_MAP;

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
  const [a,b,c,d,t,u,v,w,x,y,z] = Object.values(state.spots);

  return [a,'|',b,'|',c,'|',d,'|',t,u,x,y,z,v,w]
    .map(i => i instanceof FixedStack<Amphipod> ? i.array.join('').padEnd(BURROW_DEPTH, '-') : i ?? '-').join('')
}

let finalMaxScore = Infinity;
let iterations = 0;
let endsHit = 0

function shuffleAmphipods() {

  console.time('zelda')
  while(openPQ.size) {

    // console.log(openPQ
    //   .toArray()
    //   .slice(0,5)
    //   .map((x) => [makeKey(x), fscore.get(makeKey(x))]))
    const state = openPQ.pop();
    if (!state) throw "Woah";

    const stateKey = makeKey(state);
    openSet.delete(stateKey);
    // console.dir([stateKey, fscore.get(stateKey)])

    // if(iterations % 5000 === 0) {
    //   console.dir({iterations, endsHit})
    //   console.dir([...fscore.entries()].slice(-10));
    // }

    if (!state.needToMove.length) {
      // We are theoretically done!

      if (gscore.get(stateKey) < finalMaxScore) {
        finalMaxScore = gscore.get(stateKey);
        console.log(`We have an updated min score of ${finalMaxScore}`);
        console.timeLog("zelda");
        // return stateKey;
      }
      endsHit++;

      console.dir({
        iterations,
        remaininginOpenset: openSet.size,
      });
      continue;
    }

    for (const moveFromSpot of [...new Set(state.needToMove)]) {
      // Get amphipod value
      let from = state.spots[moveFromSpot];
      if (from === null) throw "Impossible";
      let amphipod: Amphipod;

      if (from instanceof FixedStack) {
        if (from.size <= 0) throw "Impossible 2";
        amphipod = from.peek();
      } else {
        amphipod = from;
      }

      const availableSpots = getAvailableMoveLocations(
        state.spots,
        moveFromSpot,
        amphipod
      );

      for (const moveToSpot of availableSpots) {

        const newScore =
          gscore.get(stateKey) +
          getScoreFromThisMove(amphipod, moveFromSpot, moveToSpot, state.spots);

        if (newScore > finalMaxScore)
          // we're already over the bounds of what the min score can be so don't progress further!
          continue;

        const spots = cloneDeepWith(state.spots, cloneFixedStacksCorrectly) as SpotsState;

        const from = spots[moveFromSpot];
        if (from === null) throw "Impossible";

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

        // handle "still need to move" state
        const newNeedToMove = [...state.needToMove];
        const fromidx = newNeedToMove.indexOf(moveFromSpot);
        if (~fromidx) newNeedToMove.splice(fromidx, 1);
        if (moveToSpot.toUpperCase() !== amphipod)
          newNeedToMove.push(moveToSpot); // only add it back in if this amphipod hasn't come to rest

        // Memoize
        const newState: State = { spots, needToMove: newNeedToMove };
        const newStateKey = makeKey(newState);

        const alreadyScored = gscore.get(newStateKey);
        if (alreadyScored <= newScore)
          continue; // we found a better path to this state somehow

        cameFrom.set(newStateKey, [stateKey, newScore-gscore.get(stateKey)])
        gscore.set(newStateKey, newScore);
        fscore.set(newStateKey, newScore + h(newState));

        if (!openSet.has(newStateKey)) {
          openPQ.push(newState);
          openSet.add(newStateKey);
        }

        iterations++;
      }
    }
  }
  console.timeEnd("zelda");
}

shuffleAmphipods();

fs.writeFileSync("fscore.txt", JSON.stringify([...fscore.entries()]));

//openSet
console.dir({ iterations, finalMaxScore, openSet: openSet.size, fscoresize: fscore.size });

// (function generateCameFromList() {
//   // generate "came from" list
//   let x = endStateKey, d_time=0;
//   printBurrows(endStateKey);
//   while(cameFrom.has(x)) {
//     [x, d_time] = cameFrom.get(x) ?? ['',0]
//     console.log(`cost ${d_time} ^`);
//     printBurrows(x)
//   }
// })

// const fff = [...fscore.entries()].sort( (a,b) =>{
//   return a[1] < b[1] ? -1 : a[1] > b[1] ? 1 :0
// });

// fs.writeFileSync("fscore.txt", JSON.stringify(fff));

// console.dir([...fscore.entries()].slice(-30))


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

function getAvailableMoveLocations(
  spots: SpotsState,
  from: Spot,
  amphipodAtFromSpot: Amphipod
): Spot[] {
  let available = new EnhancedSet<Spot>([..."abcdtuvwxyz"] as Spot[]);
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

function printBurrows(spots: SpotsState | StateKey) {
  let _a, _b, _c, _d, _t, _u, _v, _w, _x, _y, _z;
  if(typeof spots == 'string') {
    const _spots = [...spots];
    [_a, _b, _c, _d] = [_spots.slice(0,4), _spots.slice(5,9), _spots.slice(10,14), _spots.slice(15, 19)].map(y => y.map(x => x === '-' ? '.' : x));
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
 * Part 1 sample answer : 12521
 * 15322 is the real answer for Part 1
 *
 * Part 2 sample answer: 44169
 * Part 2 answer: 56324
 * */
