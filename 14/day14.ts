const SAMPLE = false;

import * as fs from "fs";
import * as help from "../helpers";
import { DefaultMap } from 'mnemonist'

const data = fs
  .readFileSync(SAMPLE ? "./input_sample.txt" : "./input.txt", "utf8")
  .split("\n")
  .slice(0, -1);

const rules = new Map(
  data.slice(2).map((x) => x.split(" -> ")) as [string, string][]
);

function* polymerizer() {
  const template = data[0];

  const charcounts = new DefaultMap<string, number>(() => 0);
  const paircounts = new DefaultMap<string, number>(() => 0);

  for(let i = 0; i < template.length-1; i++) {
    const char = template[i],
          pair = template.slice(i,i+2)
    charcounts.set(char, charcounts.get(char)+1)
    paircounts.set(pair, paircounts.get(pair)+1)
  }
  charcounts.set(template.slice(-1), charcounts.get(template.slice(-1)) + 1);

  while(true) {
    for(const [pair, num] of [...paircounts.entries()]) {

      // subtract the old amount first
      paircounts.set(pair, paircounts.get(pair) - num)

      const newchar = rules.get(pair)
      if(!newchar) throw 'Wah'

      const pair1 = pair[0]+newchar, pair2 = newchar+pair[1]

      paircounts.set(pair1, paircounts.get(pair1) + num)
      paircounts.set(pair2, paircounts.get(pair2) + num)

      charcounts.set(newchar, charcounts.get(newchar) + num)
    }

    yield {charcounts, paircounts};
  }
}

const polymerize = polymerizer();

for (let i = 1; i <= 40; i++) {
  const val = polymerize.next().value
  if(!val) break;

  if ([10,40].includes(i)) {
    getSolution(val);
  }
}

function getSolution({ charcounts }) {
  const countArray = [...charcounts.inspect().values()].sort(help.sorter);
  console.dir({ solution: countArray[countArray.length - 1] - countArray[0] });
}
