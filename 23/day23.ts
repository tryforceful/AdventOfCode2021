const SAMPLE = true;
const PART_ONE = true;

import * as fs from "fs";
import { FixedStack } from "../helpers";
import { EnhancedSet } from "datastructures-js"
import { cloneDeepWith, type CloneDeepWithCustomizer } from "lodash";

const data = fs
  .readFileSync(SAMPLE ? "./input_sample.txt" : "./input.txt", "utf8")
  .split("\n")
  .slice(0, -1);

type Amphipod = 'A'|'B'|'C'|'D';
type Spot = 'a'|'b'|'c'|'d'|'t'|'u'|'v'|'w'|'x'|'y'|'z';

const burrows = data.slice(2, 4).map((x) => x.split(/[\s#]*/).filter(x=>x)) as Amphipod[][]

console.dir(data);
console.dir(burrows);

/**
 * #############
 * #tu.x.y.z.vw#
 * ###B#C#B#D###
 *   #A#D#C#A#
 *   #########
 *    a b c d
 *
 * t,u,v,w,x,y,z <--
 *
 * And set up a weighting algorithm for moving from each burrow (1,2,3,4) into a stack posiiton, or back
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

type State = {
  spots: SpotsState;
  needToMove: Spot[];
  score: number;
  movePath: string[];
};

const initialSpots: SpotsState = {
  a: new FixedStack<Amphipod>(2),
  b: new FixedStack<Amphipod>(2),
  c: new FixedStack<Amphipod>(2),
  d: new FixedStack<Amphipod>(2),
  t: null,
  u: null,
  v: null,
  w: null,
  x: null,
  y: null,
  z: null,
};
initialSpots.a.push([burrows[1][0], burrows[0][0]]);
initialSpots.b.push([burrows[1][1], burrows[0][1]]);
initialSpots.c.push([burrows[1][2], burrows[0][2]]);
initialSpots.d.push([burrows[1][3], burrows[0][3]]);

const BURROWS = ["a", "b", "c", "d"] as const;
const HALLWAY = ["t", "u", "v", "w", "x", "y", "z"] as const;

const BLOCKED_MAP = {
  u: [["t"], [..."abcdvwxyz"]],
  v: [["w"], [..."abcdtuxyz"]],
  x: [[..."tua"], [..."bcdvwyz"]],
  y: [[..."tuxab"], [..."vwzcd"]],
  z: [[..."tuxyab"], [..."dvw"]],
};
const BLOCKER_SPOTS = Object.keys(BLOCKED_MAP) as Spot[];

//     a,b,c,d,t,u,v,w,x,y,z
const DISTANCE_GRID = [
/*a*/ [0,4,6,8,3,2,8,9,2,4,6],
/*b*/ [4,0,4,6,6,5,6,7,2,2,4],
/*c*/ [6,4,0,4,7,6,4,5,4,2,2],
/*d*/ [8,6,4,0,9,8,2,3,6,4,2],
/*t*/ [3,6,7,9,0,1,9,10,3,5,7],
/*u*/ [2,5,6,8,1,0,8,9,2,4,6],
/*v*/ [8,6,4,2,9,8,0,1,6,4,2],
/*w*/ [9,7,5,3,10,9,1,0,7,5,3],
/*x*/ [2,2,4,6,3,2,6,7,0,2,4],
/*y*/ [4,2,2,4,5,4,4,5,2,0,2],
/*z*/ [6,4,2,2,7,6,2,3,4,2,0],
] as const;


const cloneFixedStacksCorrectly: CloneDeepWithCustomizer<SpotsState> = (value) => {
  if(value instanceof FixedStack)
    return new FixedStack(value)
  else return undefined
}

/**
 * INITIAL STATE
 */

// TODO: UNHARDCODE THIS
const needToMove = SAMPLE
  ? (["a", "b", "b", "c", "d", "d"] as Spot[])
  : (["a", "a", "b", "b", "c", "c", "d", "d"] as Spot[]);// {a:1,b:2,c:1,d:2}

const initialstate = { spots: initialSpots, needToMove, score: 0, movePath:[] };


// Memoization
const memo = new Map<string, number>;

function makeKey(state: State) {
  const spots = Object.values(state.spots)

  const str = spots.map(i => i instanceof FixedStack<Amphipod> ? i.array.join('').padEnd(2, '-') : i ?? '-').join('')

  // console.log([...str.join('')].map(x => Number.parseInt(x,16)-9).join(''));
  // console.log(str.join(""));
  // console.log(
    
  // );

  // throw str

  return str

  // return str.join()
}


let finalMaxScore = Infinity;
let finalPath: string[] = []
let iterations = 0;
let endsHit = 0
let recurseStack = 0;
function recurseDFSState(state: State = initialstate) {
  recurseStack++

  if(iterations % 50000 === 0) console.dir({iterations, endsHit, recurseStack})


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

      const newScore =
        state.score +
        getScoreFromThisMove(amphipod, moveFromSpot, moveToSpot, state.spots);

      // handle "still need to move" state
      const newNeedToMove = [...state.needToMove];
      const fromidx = newNeedToMove.indexOf(moveFromSpot);
      if (~fromidx) newNeedToMove.splice(fromidx, 1);
      if (moveToSpot.toUpperCase() !== amphipod) newNeedToMove.push(moveToSpot); // only add it back in if this amphipod hasn't come to rest

      if (!newNeedToMove.length) {
        // We are theoretically done!
        // Eject this edge case into an array of final scores?

        if(newScore < finalMaxScore) {
          finalMaxScore = newScore;
          console.log(`We have an updated min score of ${finalMaxScore}`)
          console.dir(state.movePath);
          console.timeLog('zelda')
          finalPath = state.movePath;
        }
        endsHit++

        // console.dir({ "we made it!": "", newScore, iterations: iterations });
        continue;
        // throw 'boo'
      }

      // //print, for now
      // console.dir({
      //   moveFromSpot,
      //   moveToSpot,
      //   spots,
      //   score: newScore,
      //   newNeedToMove,
      // });

      // printBurrows(spots);

      const newState: State = {
        spots,
        needToMove: newNeedToMove,
        score: newScore,
        movePath: [...state.movePath, `${amphipod} from ${moveFromSpot} to ${moveToSpot}`]
      };

      if (state.movePath.length > needToMove.length*2) continue; // Can't possibly move more than this

      // Memoize
      const stateKey = makeKey(newState);
      const alreadyScored = memo.get(stateKey);
      if (alreadyScored !== undefined) {
        if (alreadyScored < newScore) {
          continue; // we found a better path to this state somehow
        }
      }
      memo.set(stateKey, newScore);

      // queue.enqueue(newState);

      if(newScore > finalMaxScore) {
        // we're already over the bounds of what the min score can be so don't recurse further!
        continue;
      }

      iterations++;
      recurseDFSState(newState)
    }
  }
  recurseStack--;
}

console.time('zelda')
recurseDFSState()
console.timeEnd("zelda");

console.dir({ iterations, finalMaxScore, finalPath });
console.dir(memo.size);
// console.dir([...memo.entries()].slice(0,10))

// HELPER FUNCTIONS

function getScoreFromThisMove(amphipod: Amphipod, from: Spot, to: Spot, originalState: SpotsState) {
  const oneStep = 10 ** (amphipod.charCodeAt(0) - 65);

  const order = 'abcdtuvwxyz'
  const fidx = order.indexOf(from), tidx = order.indexOf(to)
  if(fidx < 0 || tidx < 0) throw 'Improper from/to indices!'
  let distance = DISTANCE_GRID[fidx][tidx];

  // consider if we were deeper in the burrows (requiring +1s)
  for(const burrow of BURROWS) {
    if(from === burrow && originalState[burrow].size === 1)
      distance++;
    if(to === burrow && originalState[burrow].size === 0)
      distance++;
  }

  return distance * oneStep
}

function getAvailableMoveLocations(from: Spot, spots: SpotsState, amphipodAtFromSpot: Amphipod): EnhancedSet<Spot> {
  let available = new EnhancedSet<Spot>([..."abcdtuvwxyz"] as Spot[]);

  // remove currently occupied spots
  for (const solo of HALLWAY) if (spots[solo] !== null) available.delete(solo);
  for (const duo of BURROWS) {
    const burrow = spots[duo];
    if (burrow.size === 2) available.delete(duo);

    // Also make sure we can't move into a burrow unless it is empty of "strangers"
    if (burrow.size > 0 && burrow.peek() !== amphipodAtFromSpot)
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
    const openBurrows = spots[dest_burrow].size < 2 ? [dest_burrow as Spot] : [];
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

function printBurrows(spots: SpotsState) {
  const {a,b,c,d,t,u,v,w,x,y,z} = spots;
  const a0 = a.array[0] ?? ' ', a1 = a.array[1] ?? ' '
  const b0 = b.array[0] ?? ' ', b1 = b.array[1] ?? ' '
  const c0 = c.array[0] ?? ' ', c1 = c.array[1] ?? ' '
  const d0 = d.array[0] ?? ' ', d1 = d.array[1] ?? ' '

  const [_t, _u, _v, _w, _x, _y, _z] = [t, u, v, w, x, y, z].map(x => x ?? ' ');

  const burrows = ''+
 `|-----------|` + '\n'+
 `|${_t}${_u} ${_x} ${_y} ${_z} ${_v}${_w}|` + '\n'+
 `|-|${a1}|${b1}|${c1}|${d1}|-|` + '\n'+
 `  |${a0}|${b0}|${c0}|${d0}|` + '\n'+
 `  |-------|` + '\n'

 console.log(burrows)
 return burrows
}
