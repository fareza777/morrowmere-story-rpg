export interface SeededRng {
  readonly state: number;
  next(): number;
  int(minimum: number, maximum: number): number;
  pick<T>(values: readonly T[]): T;
  shuffle<T>(values: readonly T[]): T[];
}

export function createRng(seed: number): SeededRng {
  let current = seed >>> 0;

  const next = () => {
    current = (current + 0x6d2b79f5) >>> 0;
    let value = current;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };

  return {
    get state() {
      return current;
    },
    next,
    int(minimum, maximum) {
      if (!Number.isInteger(minimum) || !Number.isInteger(maximum) || maximum < minimum) {
        throw new RangeError(`Invalid integer range: ${minimum}..${maximum}`);
      }
      return minimum + Math.floor(next() * (maximum - minimum + 1));
    },
    pick<T>(values: readonly T[]) {
      if (values.length === 0) {
        throw new RangeError('Cannot pick from an empty collection');
      }
      return values[Math.floor(next() * values.length)] as T;
    },
    shuffle<T>(values: readonly T[]) {
      const copy = [...values];
      for (let index = copy.length - 1; index > 0; index -= 1) {
        const target = Math.floor(next() * (index + 1));
        [copy[index], copy[target]] = [copy[target] as T, copy[index] as T];
      }
      return copy;
    },
  };
}
