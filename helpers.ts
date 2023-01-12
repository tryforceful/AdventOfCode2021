export const sorter = (a: number, b: number) => (a < b ? -1 : a > b ? 1 : 0);
export const sum = (a: number, c: number) => a + c;
export const multiply = (a: number, c: number) => a * c;

export const ADJACENCIES_4 = [[0,1],[1,0],[0,-1],[-1,0]]
export const ADJACENCIES_8 = [[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1]]
export const ADJACENCIES_9 = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,0],[0,1],[1,-1],[1,0],[1,1]]

export function foldArray<T>(array: T[], delimiters: T | T[], equalityFunction: (a:T,b:T) => boolean = (a,b)=>a===b): T[][] {
  const foldedArray: T[][] = [];
  let subArray: T[] = new Array<T>()

  const _delimiters = delimiters instanceof Array ? delimiters : [delimiters]
  for(const item of array) {
    if (_delimiters.some(delimiter => equalityFunction(item, delimiter))) {
      if (subArray.length) {
        foldedArray.push(subArray);
        subArray = new Array<T>()
      }
    } else subArray.push(item);
  }
  foldedArray.push(subArray);
  return foldedArray
}

export function pad2DArray<T>(
  array: Array<Array<T>>,
  paddingValue: T,
  paddingThickness: number = 1
) {
  if (!array.length || !array[0].length || paddingThickness <= 0) return array;
  const X_LENGTH = array.length,
    Y_LENGTH = array[0].length;

  const newArray: T[][] = [];
  for (const _ of Array(paddingThickness))
    newArray.push(
      new Array(Y_LENGTH + 2 * paddingThickness).fill(paddingValue)
    );

  for (const i in Array(X_LENGTH).fill(0))
    newArray.push(
      new Array(paddingThickness)
        .fill(paddingValue)
        .concat([...array[i]], new Array(paddingThickness).fill(paddingValue))
    );

  for (const _ of Array(paddingThickness))
    newArray.push(
      new Array(Y_LENGTH + 2 * paddingThickness).fill(paddingValue)
    );

  return newArray;
}

export function findFirstDupe<T>(array: T[], 
  sortFunction: ((a:T,b:T) => 0|-1|1) = (a,b)=>(a < b ? -1 : a > b ? 1 : 0), 
  equalityFunction: (a:T,b:T) => boolean = (a,b)=>a===b) 
{
  const sorted = [...array].sort(sortFunction)
  try{
    sorted.reduce((acc, cur) => {
      if (equalityFunction(acc, cur)) throw cur;
      return cur
    })
  }
  catch(item) {
    return item as T
  }
  return false;
}

export function print2DArray<T>(array: T[][]) {
  const string = array.map((x) => x.join("")).join("\n");
  console.log(string + '\n');
}

export class CoordSet implements Set<[number, number]> {
  private _set: Set<string>;

  constructor(values?: string[] | [number, number][] | null | undefined) {
    function foo(item: string | [number, number]): string {
      return typeof item === "string" ? item : item.join();
    }

    this._set = new Set<string>(
      values instanceof Array ? values.map(foo).values() : values
    );
  }

  add(value: [number, number] | string) {
    this._set.add(typeof value === "object" ? value.join() : value);
    return this;
  }

  has(value: [number, number] | string) {
    return this._set.has(typeof value === "object" ? value.join() : value);
  }

  delete(value: [number, number] | string) {
    return this._set.delete(typeof value === "object" ? value.join() : value);
  }

  clear(): void {
    this._set.clear()
  }

  get size() {
    return this._set.size
  }

  entries(): IterableIterator<[[number, number], [number, number]]> {
    /*

    interface Iterator<T, TReturn = any, TNext = undefined> {
        // NOTE: 'next' is defined using a tuple to ensure we report the correct assignability errors in all places.
        next(...args: [] | [TNext]): IteratorResult<T, TReturn>;
        return?(value?: TReturn): IteratorResult<T, TReturn>;
        throw?(e?: any): IteratorResult<T, TReturn>;
    }

    */
    const foo = this._set.entries();

    const X = {
      [Symbol.iterator]: () => X, // FIXME
      next: () => {
        const _result = foo.next();
        if (!_result.done)
          return {
            done: false,
            value: _result.value.map(
              (i) => i.split(",").map(Number) as [number, number]
            ),
          } as IteratorYieldResult<[[number, number], [number, number]]>;
        return {
          done: true,
        } as IteratorReturnResult<void>;
      },

      // return: () => foo.return?.(), // FIXME
      // throw: () => foo.throw?.(), // FIXME
    };

    return X
  }

  keys(): IterableIterator<[number, number]> {
    return this.values()
  }

  forEach(callbackfn: (value: [number, number], value2: [number, number], set: Set<[number, number]>) => void, thisArg?: any): void {
    this._set.forEach((val, val2) =>
      callbackfn(
        val.split(",").map(Number) as [number, number],
        val2.split(",").map(Number) as [number, number],
        this
      )
    );
  }

  values() {
    return [...this._set.values()].map(
      (item) => item.split(",").map(Number) as [number, number]
    ).values();
  }

  [Symbol.iterator]() {
    return this.values()
  }

  get [Symbol.toStringTag] () {
    return 'CoordSet'
  }
}

export class FixedStack<T> {
  readonly #array = new Array<T>();
  readonly #fixedsize: number;

  constructor(val: number | FixedStack<T> | T[]) {
    if(typeof val === 'number')
      this.#fixedsize = val;
    else if(val instanceof FixedStack) {
      //this is like a copy constructor
      this.#fixedsize = val.#fixedsize
      this.#array = [...val.#array]
    }
    else {
      this.#fixedsize = val.length;
      this.#array = [...val]
    }
  }

  push(item: T | T[]) {
    const _item = (item instanceof Array<T>) ? item : [item]

    if (this.#array.length + _item.length <= this.#fixedsize)
      return this.#array.push(..._item);

    else return false;
  }

  pop = () => this.size !== 0 ? this.#array.pop() as T : undefined;
  peek = () => this.#array[this.#array.length - 1];

  get maxsize() { return this.#fixedsize }
  get size() { return this.#array.length }
  get array() { return [...this.#array]}

  get [Symbol.toStringTag] () {
    return this.#array.toString()
  }
}
