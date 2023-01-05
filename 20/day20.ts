const SAMPLE = true;
const PART_ONE = false;

import * as fs from "fs";
import * as help from "../helpers";

const data = fs
  .readFileSync(SAMPLE ? "./input_sample.txt" : "./input.txt", "utf8")
  .split("\n")
  .slice(0, -1);

const algorithm = [...data.slice(0, 1)[0]] as ("#" | ".")[];
const _input = data.slice(2).map((x) => [...x]) as ("#" | ".")[][];

function enhanceImage(input: ("#" | ".")[][], paddingChar: ("#" | ".") = '.') {
  const padded_input = help.pad2DArray(input, paddingChar, 2),
        INPUT_LENGTH = padded_input.length-2,
        INPUT_WIDTH = padded_input[0]?.length-2;

  const dest_array: ('#'|'.')[][] = new Array(INPUT_LENGTH).fill(0).map(_ => new Array(INPUT_WIDTH).fill('.'))

  for(let x = 0; x < INPUT_LENGTH; x++)
    for(let y = 0; y < INPUT_WIDTH; y++) {
      const mask_key = help.ADJACENCIES_9.map(([dx,dy]) => padded_input[x+dx+1][y+dy+1] === '#' ? 1 : 0).join('')
      const algo_key = Number.parseInt(mask_key, 2);

      dest_array[x][y] = algorithm[algo_key];
    }

  // help.print2DArray(dest_array);
  return dest_array
}

let output = _input;
for(let i = 0; i < (PART_ONE ? 2 : 50); i++)
  output = enhanceImage(output, (SAMPLE || i % 2 === 0) ? '.' : '#');

const numPixels = output.flat().reduce((a, c) => (c === "#" ? a + 1 : a), 0);
console.dir({ numPixels });
