const SAMPLE = false;
const PART_ONE = false;

import * as fs from "fs";

import { Queue, DefaultMap } from 'mnemonist'

const data = fs
  .readFileSync(SAMPLE ? "./input_sample3.txt" : "./input.txt", "utf8")
  .split("\n")
  .slice(0, -1)
  .map(row => row.split('-'));

const edges = new DefaultMap<string, string[]>(() => []);

for(const [from, to] of data) {
  edges.get(from).push(to)
  edges.get(to).push(from)
}

console.dir(edges.inspect());

const start_node: {
  path: string[];
  visited: Set<string>;
  second_small_cave: string | null;
} = {
  path: ["start"],
  visited: new Set(["start"]),
  second_small_cave: null,
};

const BFS = Queue.from([start_node]);

const allPaths = new Set<string>()

while(BFS.size) {
  const cur_node = BFS.dequeue();
  if (cur_node === undefined) throw "foo";

  const { path, visited, second_small_cave } = cur_node;

  const last = path[path.length - 1];
  for (const dest of edges.get(last)) {
    // it's a lowercase node and we already visited it
    if(dest.toLowerCase() === dest && visited.has(dest)) {
      if (!PART_ONE &&
        second_small_cave === null &&
        !["start", "end"].includes(dest)
      ) {
        // we can try to use the extra small cave
        BFS.enqueue({
          path: [...path, dest],
          visited,
          second_small_cave: dest,
        });
      }
      continue;
    }

    if(dest === 'end') // we're finished
    {
      allPaths.add([...path, dest].join())
      continue;
    }

    BFS.enqueue({
      path: [...path, dest],
      visited: new Set([...visited]).add(dest),
      second_small_cave,
    });
  }
}

console.dir({size: allPaths.size});
