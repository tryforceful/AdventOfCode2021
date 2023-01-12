import * as fs from "fs";
import * as help from "../helpers";
import assert from "assert";

import { FixedStack } from "../helpers";
import { cloneDeepWith, type CloneDeepWithCustomizer } from "lodash";
import { Heap, DefaultMap } from 'mnemonist'

import {
  getAvailableMoveLocations,
  getScoreFromThisMove,
  printBurrows,
  resolveAmphipod,
  generateCameFromList,
  BURROWS,
  HALLWAY,
} from "./day23helpers";
import type { Amphipod, Spot, State, SpotsState, StateKey } from "./day23helpers";

const DEBUG = true;

function shuffleAmphipods(SAMPLE = true, PART_ONE = true) {

  // Import burrows list

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

  // Calculate initial spots that need moving
  const needToMove: Spot[] = []
  for(let i = BURROW_DEPTH-1; i >= 0; i--)
    for(const j in BURROWS) {
      const burrow = BURROWS[j]
      initialSpots[burrow].push(burrows[i][j]);

      if(burrows[i][j].toLowerCase() !== burrow || needToMove.includes(burrow))
        needToMove.push(burrow)
    }
  console.log("\nNeed to move amphipods in these burrow spots:", needToMove.sort().join())

  /**
   * We need to make sure this heuristic function is at least <= the true cost
   *  of the iterations from state --> end_state, in order to ensure a shortest path
   * So we underestimate the cost here.
   * The closer we get to the true cost while staying under, the faster it should performs.
   * http://theory.stanford.edu/~amitp/GameProgramming/Heuristics.html
   */
  function h (state: State) {
    return state.needToMove.map(spot => {
      const amphipod = resolveAmphipod(state.spots[spot]);
      const destination = amphipod.toLowerCase() as Spot

      return getScoreFromThisMove(amphipod, spot, destination, state.spots);

    }).reduce(help.sum, 0)
  }

  function makeKey(state: State): StateKey {
    const [a,b,c,d,t,u,v,w,x,y,z] = Object.values(state.spots);

    return [a,'|',b,'|',c,'|',d,'|',t,u,x,y,z,v,w]
      .map(i => i instanceof FixedStack ? i.array.join('').padEnd(BURROW_DEPTH, '-') : i ?? '-').join('')
  }

  const cloneFixedStacksCorrectly: CloneDeepWithCustomizer<SpotsState> = (value) =>
    (value instanceof FixedStack) ? new FixedStack(value) : undefined;

  // A* instantiate
  const gscore = new DefaultMap<StateKey, number>(() => Infinity)
  const fscore = new DefaultMap<StateKey, number>(() => Infinity)
  const openPQ = new Heap<State>((a: State, b: State) =>
    help.sorter(fscore.get(makeKey(a)), fscore.get(makeKey(b)))
  );
  const openSet = new Set<StateKey>
  const cameFrom = new Map<string, [string, number]>();

  // A* initialize
  const initialState = { spots: initialSpots, needToMove };
  const initialKey = makeKey(initialState);

  gscore.set(initialKey, 0);
  fscore.set(initialKey, h(initialState));
  openPQ.push(initialState)
  openSet.add(initialKey);

  printBurrows(initialState.spots, BURROW_DEPTH);

  let iterations = 0;

  console.time("timestamp")
  while(openPQ.size) {

    const state = openPQ.pop();
    if (!state) throw "Woah";

    const stateKey = makeKey(state);
    openSet.delete(stateKey);

    if (!state.needToMove.length) { // Reached the end!
      const finalMaxScore = gscore.get(stateKey);
      console.timeEnd("timestamp");

      console.log("Score is", finalMaxScore);

      if(DEBUG) console.dir({
        iterations,
        remaininginOpenset: openSet.size,
        scores: { finalMaxScore, initial_h_estimate: h(initialState) },
        fscore_size: fscore.size,
      });

      if(DEBUG) generateCameFromList(cameFrom, stateKey, BURROW_DEPTH);

      return finalMaxScore;
    }

    for (const moveFromSpot of [...new Set(state.needToMove)]) {
      const amphipod = resolveAmphipod(state.spots[moveFromSpot]);

      const availableSpots = getAvailableMoveLocations(
        state.spots,
        moveFromSpot,
        amphipod
      );

      for (const moveToSpot of availableSpots) {
        const newScore =
          gscore.get(stateKey) +
          getScoreFromThisMove(amphipod, moveFromSpot, moveToSpot, state.spots);

        const spots: SpotsState = cloneDeepWith(state.spots, cloneFixedStacksCorrectly);

        // make the move. delete Amphipod from where it was
        const from = spots[moveFromSpot];
        if (from instanceof FixedStack) {
          from.pop();
        } else {
          if (from === null) throw "Impossible";
          spots[moveFromSpot as keyof typeof HALLWAY] = null;
        }

        // record Amphipod at the new location
        if (~(BURROWS as readonly string[]).indexOf(moveToSpot)) {
          const burrow = spots[moveToSpot] as FixedStack<Amphipod>;
          burrow.push(amphipod);
        }
        else spots[moveToSpot as keyof typeof HALLWAY] = amphipod;

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

        if(DEBUG) cameFrom.set(newStateKey, [stateKey, newScore-gscore.get(stateKey)])
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
}

assert(shuffleAmphipods(true, true) === 12521); // part 1 sample, 275ms
console.log('----------------------------------')
assert(shuffleAmphipods(false, true) === 15322) // part 1, 800ms
console.log('----------------------------------')
assert(shuffleAmphipods(true, false) === 44169) // part 2 sample, 8s
console.log('----------------------------------')
assert(shuffleAmphipods(false, false) === 56324) // part 2a, 10s
