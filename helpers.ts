export const sorter = (a: number, b: number) => (a < b ? -1 : a > b ? 1 : 0);
export const sum = (a: number, c: number) => a + c;
export const multiply = (a: number, c: number) => a * c;

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
