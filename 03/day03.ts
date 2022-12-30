const SAMPLE = false;

import * as fs from "fs";

const data = fs
  .readFileSync(SAMPLE ? "./input_sample.txt" : "./input.txt", "utf8")
  .split("\n")
  .slice(0, -1)

const bits = data.map(line => line.split('').map(Number));

const sums = bits.reduce((a,c) => a.map((digit, idx) => digit + (c[idx] == 0 ? -1 : 1)))

const gamma = sums.reduce((a,c,idx) => {
  const exp = (sums.length - 1 - idx);
  return a + (c < 0 ? 0 : 2 ** exp)
}, 0)
const epsilon = 2 ** sums.length - gamma - 1

console.dir({ gamma, epsilon, power_consumption: gamma * epsilon });

// Part 2

function findRating(least_common = false) {
  const strings = new Set(data)

  let digit = 0;
  while (strings.size > 1 && digit < data[0].length) {
    let count = 0;
    strings.forEach((value) => {
      count += value[digit] === "0" ? -1 : 1;
    });

    const comparison = least_common ? count < 0 : count >= 0;
    strings.forEach((value) => {
      if (value[digit] === (comparison ? "0" : "1")) strings.delete(value);
    });

    digit++;
  }

  if(strings.size > 1) throw 'Too many left in set'
  const rating_base2 = [...strings][0];
  const rating = [...rating_base2].reduce((a, c, idx, arr) => 
    a + (+c === 0 ? 0 : 2 ** (arr.length - 1 - idx))
  , 0)

  console.dir({rating, rating_base2})
  return rating;
}

console.dir({life_support:
  findRating() *
  findRating(true)
})
