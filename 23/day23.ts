import * as fs from "fs";
import * as help from "../helpers";

import { FixedStack } from "../helpers";
import { cloneDeepWith, type CloneDeepWithCustomizer } from "lodash";
import { Heap, DefaultMap } from 'mnemonist'

import {
  fetchDistance,
  getAvailableMoveLocations,
  getScoreFromThisMove,
  printBurrows,
  resolveAmphipod,
  BURROWS,
  HALLWAY,
} from "./day23helpers";
import type { Amphipod, Spot, SpotsState, StateKey } from "./day23helpers";


function shuffleAmphipods(SAMPLE = true, PART_ONE = true) {

  const data = fs
    .readFileSync(SAMPLE ? "./input_sample.txt" : "./input.txt", "utf8")
    .split("\n")
    .slice(0, -1);

  const burrows = data.slice(2, 4).map((x) => x.split(/[\s#]*/).filter(x=>x)) as Amphipod[][]

  if(!PART_ONE)
    burrows.splice(1, 0, ['D','C','B','A'], ['D','B','A','C'])

  const BURROW_DEPTH = burrows.length as 2|4

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

  const needToMove: Spot[] = []

  for(let i = BURROW_DEPTH-1; i >= 0; i--)
    for(const j in BURROWS) {
      const burrow = BURROWS[j]
      initialSpots[burrow].push(burrows[i][j]);

      if(burrows[i][j].toLowerCase() !== burrow || needToMove.includes(burrow))
        needToMove.push(burrow)
    }
  console.log("\nneed to move these spaces:", needToMove.sort().join())


  /**
   * We need to make sure this heuristic function is at least <= the true cost
   *  of the iterations from state --> end_state, in order to ensure a shortest path
   * So we underestimate the cost here.
   * The closer we get to the true cost while staying under, the faster it performs.
   * http://theory.stanford.edu/~amitp/GameProgramming/Heuristics.html
   */
  function h (state: State) {
    const totalEstimate = state.needToMove.map(spot => {
      const amphi = resolveAmphipod(state.spots[spot]);

      const destination = amphi.toLowerCase() as Spot
      const oneStep = 10 ** (amphi.charCodeAt(0) - 65);

      const dist = fetchDistance(destination, spot)
      return dist * oneStep;

    }).reduce(help.sum, 0)

    // USE getScoreFromThisMove

    return totalEstimate
  }

  const cloneFixedStacksCorrectly: CloneDeepWithCustomizer<SpotsState> = (value) =>
    (value instanceof FixedStack) ? new FixedStack(value) : undefined;

  type State = {
    spots: SpotsState;
    needToMove: Spot[];
  };

  const gscore = new DefaultMap<StateKey, number>(() => Infinity)
  const fscore = new DefaultMap<StateKey, number>(() => Infinity)
  const openPQ = new Heap<State>((a: State, b: State) => {
      const _a = makeKey(a), _b = makeKey(b);
      return fscore.get(_a) < fscore.get(_b) ? -1 : fscore.get(_a) > fscore.get(_b) ? 1 : 0
    }
  );
  const openSet = new Set<StateKey>
  const cameFrom = new Map<string, [string, number]>();

  const initialstate = { spots: initialSpots, needToMove };
  const initialKey = makeKey(initialstate);

  gscore.set(initialKey, 0);
  fscore.set(initialKey, h(initialstate));

  printBurrows(initialstate.spots, BURROW_DEPTH)

  openPQ.push(initialstate)
  openSet.add(makeKey(initialstate))

  function makeKey(state: State): StateKey {
    const [a,b,c,d,t,u,v,w,x,y,z] = Object.values(state.spots);

    return [a,'|',b,'|',c,'|',d,'|',t,u,x,y,z,v,w]
      .map(i => i instanceof FixedStack ? i.array.join('').padEnd(BURROW_DEPTH, '-') : i ?? '-').join('')
  }

  let finalMaxScore = Infinity;
  let iterations = 0;
  let endsHit = 0

  console.time("timestamp")
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
        console.timeLog("timestamp");
        // return stateKey;
      }
      endsHit++;

      console.dir({
        iterations,
        remaininginOpenset: openSet.size,
      });
      continue;
      //break;
    }

    for (const moveFromSpot of [...new Set(state.needToMove)]) {
      // Get amphipod value
      const amphipod = resolveAmphipod(state.spots[moveFromSpot]);

      const availableSpots = getAvailableMoveLocations(
        state.spots,
        moveFromSpot,
        amphipod,
        BURROW_DEPTH
      );

      for (const moveToSpot of availableSpots) {
        const newScore =
          gscore.get(stateKey) +
          getScoreFromThisMove(amphipod, moveFromSpot, moveToSpot, state.spots, BURROW_DEPTH);

        if (newScore > finalMaxScore)
          // we're already over the bounds of what the min score can be so don't progress further!
          continue;

        const spots: SpotsState = cloneDeepWith(state.spots, cloneFixedStacksCorrectly);

        // make the move. delete from from where it was
        const from = spots[moveFromSpot];
        if (from instanceof FixedStack) {
          from.pop();
        } else {
          if (from === null) throw "Impossible";
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

        // Record
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
  console.timeEnd("timestamp");

  console.dir({
    iterations,
    scores: { finalMaxScore, initial_h_estimate: h(initialstate) },
    fscore_size: fscore.size,
  });
}

shuffleAmphipods(true, true);
console.log('----------------------------------')
shuffleAmphipods(true, false);
console.log('----------------------------------')
shuffleAmphipods(false, true);
console.log('----------------------------------')
shuffleAmphipods(false, false);

// fs.writeFileSync("fscore.txt", JSON.stringify([...fscore.entries()]));

//openSet

// const fff = [...fscore.entries()].sort( (a,b) =>{
//   return a[1] < b[1] ? -1 : a[1] > b[1] ? 1 :0
// });

// fs.writeFileSync("fscore.txt", JSON.stringify(fff));

// console.dir([...fscore.entries()].slice(-30))


/**
 * Part 1 sample answer : 12521
 * 15322 is the real answer for Part 1
 *
 * Part 2 sample answer: 44169
 * Part 2 answer: 56324
 * */
