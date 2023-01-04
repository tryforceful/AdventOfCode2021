const SAMPLE = false;

import * as fs from "fs";

/**
 * TYPE / CLASS
 */
type Pair = [number | Pair, number | Pair]

class PairNode {
  public left: number | PairNode;
  public right: number | PairNode;

  constructor(left: number | PairNode, right: number | PairNode) {
    this.left = left;
    this.right = right;
  }

  toString(): string {
    return `[${this.left.toString()},${this.right.toString()}]`;
  }
}

/**
 * ACTUAL PROCESS
 */
const data = fs
  .readFileSync(SAMPLE ? "./input_sample.txt" : "./input.txt", "utf8")
  .split("\n")
  .slice(0, -1)
  .map((x) => JSON.parse(x)) as Pair[]

const final_result = data.reduce((a,c) => reduceSnailfishNumber([a,c]))

console.dir({ part1: {
  final_result: JSON.stringify(final_result),
  magnitude: getMagnitude(final_result),
}});

let part2 = 0;
for(let i = 0; i < data.length; i++)
  for(let j = 0; j < data.length; j++)
    if(i !== j)
      part2 = Math.max(part2, getMagnitude(reduceSnailfishNumber([data[i], data[j]])))

console.dir({part2})

/**
 * BINARY TREE IMPLEMENTATION
 *
 * - This could have probably been done more easily with simple string manipulation too...
 */

function getMagnitude(root: Pair): number {
  const [l, r] = root
  return (
    3 * (typeof l === "number" ? l : getMagnitude(l)) +
    2 * (typeof r === "number" ? r : getMagnitude(r))
  );
}

function reduceSnailfishNumber (input: Pair): Pair {
  const TreeRoot = makePairNodes();

  while (checkForExplosions() || checkForSplits()); // Iteratively reduce

  return JSON.parse(TreeRoot.toString()) as Pair;

  /**
   * FUNCTIONS
   */
  function makePairNodes(pair: Pair = input): PairNode {
    const [l, r] = pair;
    return new PairNode(
      typeof l === "number" ? l : makePairNodes(l),
      typeof r === "number" ? r : makePairNodes(r)
    );
  }

  function getNodeFromPath(path: string) {
    const dirArray = [...path];
    let node: number | PairNode = TreeRoot;
    while (dirArray.length) {
      const dir = dirArray.shift() as "0" | "1";
      if (node instanceof PairNode) {
        node = dir === "0" ? node.left : node.right;
      }
      else if (dirArray.length) return false;
    }
    return node;
  }

  function checkForExplosions(node = TreeRoot, path = "") {
    if (node.left instanceof PairNode)
      if (checkForExplosions(node.left, path + "0")) return true;

    if (path.length >= 4) {
      explode(node, path);
      return true;
    }

    if (node.right instanceof PairNode)
      if (checkForExplosions(node.right, path + "1")) return true;

    return false;
  }

  function checkForSplits(node = TreeRoot, path = "") {
    if (node.left instanceof PairNode)
      if (checkForSplits(node.left, path + "0")) return true;

    if (node.left >= 10) {
      split(node, false);
      return true;
    } else if (node.right >= 10) {
      split(node, true);
      return true;
    }

    if (node.right instanceof PairNode)
      if (checkForSplits(node.right, path + "1")) return true;

    return false;
  }

  function split(parent: PairNode, isRight: boolean) {
    const val = (isRight ? parent.right : parent.left) as number;
    const new_node = new PairNode(Math.floor(val / 2), Math.ceil(val / 2));
    parent[isRight ? 'right' : 'left'] = new_node;
  }

  function explode(node: PairNode, path: string) {
    const parentPath = path.slice(0, -1);
    const parent = getNodeFromPath(parentPath) as PairNode;

    parent[path.slice(-1) === "0" ? "left" : "right"] = 0; //replace node with 0

    const addendLeft = node.left as number,
          addendRight = node.right as number;

    let x: number;
    if ((x = path.lastIndexOf("1")) !== -1) {
      // there's a number to the left
      let neighbor_ancestor = getNodeFromPath(path.slice(0, x) + "0");
      if (neighbor_ancestor === false) throw "Shouldn't be here";

      if (!(neighbor_ancestor instanceof PairNode)) {
        ((getNodeFromPath(path.slice(0, x)) as PairNode).left as number) +=
          addendLeft;
      } else {
        while (neighbor_ancestor.right instanceof PairNode)
          neighbor_ancestor = neighbor_ancestor.right;
        neighbor_ancestor.right += addendLeft;
      }
    }
    if ((x = path.lastIndexOf("0")) !== -1) {
      // there's a number to the right
      let neighbor_ancestor = getNodeFromPath(path.slice(0, x) + "1");
      if (neighbor_ancestor === false) throw "Shouldn't be here";

      if (!(neighbor_ancestor instanceof PairNode)) {
        ((getNodeFromPath(path.slice(0, x)) as PairNode).right as number) +=
          addendRight;
      } else {
        while (neighbor_ancestor.left instanceof PairNode)
          neighbor_ancestor = neighbor_ancestor.left;
        neighbor_ancestor.left += addendRight;
      }
    }
  }
}
