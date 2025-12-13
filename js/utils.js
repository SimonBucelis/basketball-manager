// js/utils.js
const Utils = {
  randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  randFloat(min, max) {
    return Math.random() * (max - min) + min;
  },

  clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
  },

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  },

  weightedChoice(choices) {
     // choices = [ { item: 'A', weight: 10 }, { item: 'B', weight: 2 } ... ]
     const total = choices.reduce((sum, c) => sum + c.weight, 0);
     let r = Math.random() * total;
     for (const c of choices) {
         if (r < c.weight) return c.item;
         r -= c.weight;
     }
     return choices[0].item;
  },

  saveToLocalStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error("Save failed", e);
      return false;
    }
  },

  loadFromLocalStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error("Load failed", e);
      return null;
    }
  }
};
