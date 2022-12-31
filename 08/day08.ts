const SAMPLE = false;

import * as fs from "fs";

const data = fs
  .readFileSync(SAMPLE ? "./input_sample.txt" : "./input.txt", "utf8")
  .split("\n")
  .slice(0, -1);

// Part 1
const outputs = data.map(line => line.split(' | ')[1].split(' '))

console.dir(outputs.map(line => line.map(item => item.length)).flat().filter(x => [2,3,4,7].includes(x)).length);

// Part 2
const USUAL_MAPPINGS = {
  ABCEFG: 0,
  CF: 1,
  ACDEG: 2,
  ACDFG: 3,
  BCDF: 4,
  ABDFG: 5,
  ABDEFG: 6,
  ACF: 7,
  ABCDEFG: 8,
  ABCDFG: 9,
};

const rows = data.map((line) => line.split(" | ").map(x => x.split(" "))).map(([a,b]) => ({digits:a, outputs:b}));

const setDiff = (a:string|string[], b:string|string[]) => [...a].filter(x => ![...b].includes(x))

let part2 = 0;
for(const {digits, outputs} of rows) {
  let A = '', B = '', C = '', D = '', E = '', F = '', G = '';

  // determine top
  const _seven = digits.find(x => x.length === 3) as string
  const _one = digits.find((x) => x.length === 2) as string;
  const _four = digits.find((x) => x.length === 4) as string;
  const _eight = digits.find((x) => x.length === 7) as string;
  const _0_6_9 = digits.filter((x) => x.length === 6);

  A = setDiff(_seven, _one)[0]

  let temp = _0_6_9.map((x) => setDiff(setDiff(x, _four), A));

  G = temp.find(x => x.length === 1)?.[0] as string
  E = setDiff(temp.find((x) => x.length === 2) as string[], G)[0];

  temp = _0_6_9.map((x) => setDiff(setDiff(x, _seven), G+E));

  B = temp.find((x) => x.length === 1)?.[0] as string;
  D = setDiff(setDiff(_eight, _seven), G+E+B)[0]

  temp = _0_6_9.map((x) => setDiff(x, A+B+D+E+G));

  F = temp.find((x) => x.length === 1)?.[0] as string;
  C = setDiff(temp.find((x) => x.length === 2) as string[], F)[0];

  const smallToBig = Object.fromEntries(Object.entries({A,B,C,D,E,F,G}).map(x => x.reverse()))

  const mappedOutputs = outputs.map(num => [...num].map(x => smallToBig[x]).sort().join('')).map(num => USUAL_MAPPINGS[num]).join('')

  part2 += +mappedOutputs;
}

console.dir(part2)
