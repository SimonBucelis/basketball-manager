// Utility functions - ported from utils.js
export const Utils = {
  randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  randFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  },
  clamp(num: number, min: number, max: number): number {
    return Math.min(Math.max(num, min), max);
  },
  shuffle<T>(array: T[]): T[] {
    const a = [...array];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },
  weightedChoice<T>(choices: { item: T; weight: number }[]): T {
    const total = choices.reduce((sum, c) => sum + c.weight, 0);
    let r = Math.random() * total;
    for (const c of choices) {
      if (r < c.weight) return c.item;
      r -= c.weight;
    }
    return choices[0].item;
  },
  sample<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  },
};
