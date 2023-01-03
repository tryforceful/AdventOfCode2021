const SAMPLE = false;
const DEBUG = false;

import * as fs from "fs";
import * as help from "../helpers";

import { BitStream } from 'bit-buffer';

const data = fs
  .readFileSync(SAMPLE ? "./input_sample.txt" : "./input.txt", "utf8")
  .split("\n")
  .slice(0, -1);

for(const line of data) {
  if(DEBUG) console.log('--------line---------')

  const buff = Buffer.from(line, 'hex')
  const uintArray = new Uint8Array(buff).buffer
  const stream = new BitStream(uintArray);
  stream.bigEndian = true;

  let versionSum = 0;

  function readPacket() {
    const version = stream.readBits(3)
    versionSum += version;
    const packetTypeID = stream.readBits(3)

    if (DEBUG) console.dir({ version, packetTypeID });

    if(packetTypeID === 4) { // literal value
      let doneReading = false;
      let sum = 0;
      while (!doneReading) {
        doneReading = !stream.readBits(1);
        const nibble = stream.readBits(4);
        sum *= 16;
        sum += nibble;
      }
      if (DEBUG) console.dir({ literal: sum });
      return sum;
    }
    else { // operator
      const sub_values: number[] = [];

      if (stream.readBits(1)) {
        const numSubPackets = stream.readBits(11);
        if (DEBUG) console.dir({ numSubPackets });

        for(let x = 0; x < numSubPackets; x++)
          sub_values.push(readPacket()); // recurse
      } else {
        const subPacketBitLength = stream.readBits(15);
        const currStreamIdx = stream.index
        if (DEBUG) console.dir({ subPacketBitLength, currStreamIdx });

        while (stream.index - currStreamIdx < subPacketBitLength)
          sub_values.push(readPacket());
      }

      switch(packetTypeID) {
        case 0: return sub_values.reduce(help.sum, 0)
        case 1: return sub_values.reduce(help.multiply, 1)
        case 2: return sub_values.reduce((a, c) => Math.min(a, c))
        case 3: return sub_values.reduce((a, c) => Math.max(a, c));
        case 5: return +(sub_values[0] > sub_values[1])
        case 6: return +(sub_values[0] < sub_values[1]);
        case 7: return +(sub_values[0] == sub_values[1]);
      }

      throw "Shouldn't get here!";
    }
  }

  const total = readPacket();

  console.dir({ part1: versionSum, part2: total })
}
