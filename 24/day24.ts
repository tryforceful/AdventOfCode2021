const SAMPLE = false;

import * as fs from "fs";
import * as help from "../helpers";
import assert from "assert";

const data = fs
  .readFileSync(SAMPLE ? "./input_sample.txt" : "./input.txt", "utf8")
  .split("\n")
  .slice(0, -1)

const instructions = data.map((x) => x.split(" "));

function runMONAD(_input: number[], instructionSet = instructions) {
  const input = [..._input]

  if(input.indexOf(0) > -1) throw 'No zeroes allowed';

  const registers = {w: 0, x: 0, y: 0, z: 0};

  for(const [op, var1, var2] of instructionSet) {
    const val1 = registers[var1] as number,
          val2 = !isNaN(+var2) ? +var2 : registers[var2] as number;

    switch(op) {
      case 'inp':
        registers[var1] = input.shift(); break;
      case 'add':
        registers[var1] += val2; break;
      case 'mul':
        registers[var1] *= val2; break;
      case 'div':
        registers[var1] = Math.floor(val1 / val2); break;
      case 'mod':
        registers[var1] %= val2; break;
      case 'eql':
        registers[var1] = val1 === val2 ? 1 : 0; break;
    }
  }
  return registers
}


const instructions_grouped = help.foldArray(data, "inp w")
  .map((x) => (x.unshift("inp w"), x.map((x) => x.split(" "))));

const possibleRemaindersAsLetters = new Array(14).fill('')

for (const i of [0, 1, 2, 3, 6, 8, 10]) {
  const group = instructions_grouped[i];
  possibleRemaindersAsLetters[i] = [...Array(9)]
    .map((_, j) => runMONAD([+j + 1], group))
    .map((x) => String.fromCharCode(96 + x.z))
    .join("")
}
// console.dir(possibleRemaindersAsLetters);
// x, x, x, x, D, D, x, D, x, D, x, D, D, D;

// See notes.txt for why the "for" ranges & "modeltest" are what they are below

let biggest = 0, smallest = Infinity;

for(const a of [1,2,3,4,5])
for(const c of [7,8,9])
for(const d of [1,2,3])
for(const g of [3,4,5,6,7,8,9])
for(const i of [2,3,4,5,6,7,8,9])
for(const k of [1,2,3,4,5,6,7,8,9])
{
  const modeltest = [a, 1, c, d, d+6, c-6, g, g-2, i, i-1, k, k, 9, a+4]

  const result = runMONAD(modeltest);

  assert(result.z === 0, `Z was non-zero: ${result.z}`);

  const asNum = +modeltest.join('')
  if(asNum > biggest)
    biggest = asNum;
  if (asNum < smallest)
    smallest = asNum;
}
console.dir({ biggest, smallest });
