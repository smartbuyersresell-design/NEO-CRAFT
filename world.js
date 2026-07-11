(function () {
  'use strict';
  const W = window.NEO || (window.NEO = {});
  W.BLOCK = { AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, SAND: 4, WOOD: 5, LEAVES: 6, PLANKS: 7, TABLE: 8, WATER: 9, FLOWER: 10, TALLGRASS: 11 };
  W.ITEM = { STICK: 101, WPICK: 102, WAXE: 103, WSWORD: 104, SPICK: 105, SAXE: 106, SSWORD: 107, PORK: 108, ROTTEN: 109 };
  W.BLOCKNAMES = { 1: 'Grass', 2: 'Dirt', 3: 'Stone', 4: 'Sand', 5: 'Wood Log', 6: 'Leaves', 7: 'Planks', 8: 'Crafting Table', 9: 'Water', 10: 'Flower', 11: 'Tall Grass' };
  W.ITEMNAMES = { 101: 'Stick', 102: 'Wood Pickaxe', 103: 'Wood Axe', 104: 'Wood Sword', 105: 'Stone Pickaxe', 106: 'Stone Axe', 107: 'Stone Sword', 108: 'Porkchop', 109: 'Rotten Flesh' };
  W.itemName = id => W.BLOCKNAMES[id] || W.ITEMNAMES[id] || ('Item ' + id);
  W.BLOCKCOLORS = {
    1: { top: [0.35, 0.70, 0.25], bottom: [0.42, 0.30, 0.16], side: [0.30, 0.56, 0.22] },
    2: { top: [0.42, 0.30, 0.16], bottom: [0.42, 0.30, 0.16], side: [0.42, 0.30, 0.16] },
    3: { top: [0.55, 0.55, 0.57], bottom: [0.55, 0.55, 0.57], side: [0.55, 0.55, 0.57] },
    4: { top: [0.86, 0.79, 0.56], bottom: [0.86, 0.79, 0.56], side: [0.86, 0.79, 0.56] },
    5: { top: [0.55, 0.38, 0.20], bottom: [0.55, 0.38, 0.20], side: [0.45, 0.30, 0.15] },
    6: { top: [0.22, 0.52, 0.18], bottom: [0.22, 0.52, 0.18], side: [0.22, 0.52, 0.18] },
    7: { top: [0.72, 0.55, 0.34], bottom: [0.72, 0.55, 0.34], side: [0.72, 0.55, 0.34] },
    8: { top: [0.60, 0.42, 0.24], bottom: [0.45, 0.32, 0.18], side: [0.52, 0.36, 0.20] },
    9: { top: [0.15, 0.45, 0.88], bottom: [0.15, 0.45, 0.88], side: [0.12, 0.37, 0.78] },
    10: { top: [0.94, 0.38, 0.70], bottom: [0.94, 0.38, 0.70], side: [0.94, 0.38, 0.70] },
    11: { top: [0.25, 0.78, 0.25], bottom: [0.25, 0.78, 0.25], side: [0.25, 0.78, 0.25] }
  };
  W.BREAKTIME = { 1: 2, 2: 2.5, 3: 4.5, 4: 2.8, 5: 4.5, 6: 1.2, 7: 2, 8: 3.5, 9: 1.8, 10: 0.8, 11: 0.5 };
  W.RECIPES = [
    { id: 'planks', name: 'Planks x4', inputs: [{ item: 5, count: 1 }], output: { item: 7, count: 4 } },
    { id: 'stick', name: 'Stick x4', inputs: [{ item: 7, count: 2 }], output: { item: 101, count: 4 } },
    { id: 'table', name: 'Crafting Table', inputs: [{ item: 7, count: 4 }], output: { item: 8, count: 1 } },
    { id: 'wpick', name: 'Wood Pickaxe', inputs: [{ item: 7, count: 3 }, { item: 101, count: 2 }], output: { item: 102, count: 1 } },
    { id: 'waxe', name: 'Wood Axe', inputs: [{ item: 7, count: 3 }, { item: 101, count: 2 }], output: { item: 103, count: 1 } },
    { id: 'wsword', name: 'Wood Sword', inputs: [{ item: 7, count: 2 }, { item: 101, count: 1 }], output: { item: 104, count: 1 } },
    { id: 'spick', name: 'Stone Pickaxe', inputs: [{ item: 3, count: 3 }, { item: 101, count: 2 }], output: { item: 105, count: 1 } },
    { id: 'saxe', name: 'Stone Axe', inputs: [{ item: 3, count: 3 }, { item: 101, count: 2 }], output: { item: 106, count: 1 } },
    { id: 'ssword', name: 'Stone Sword', inputs: [{ item: 3, count: 2 }, { item: 101, count: 1 }], output: { item: 107, count: 1 } }
  ];
  W.SLOT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8];
  W.SX = 192; W.SY = 48; W.SZ = 192;
  W.CHUNK = 16;
  W.hash2 = (x, z) => { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123; return s - Math.floor(s); };
  W.fade = t => t * t * (3 - 2 * t);
  W.lerp = (a, b, t) => a + (b - a) * t;
  W.valueNoise = (x, z) => {
    const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
    const v1 = W.hash2(xi, zi), v2 = W.hash2(xi + 1, zi), v3 = W.hash2(xi, zi + 1), v4 = W.hash2(xi + 1, zi + 1);
    const i1 = W.lerp(v1, v2, W.fade(xf)), i2 = W.lerp(v3, v4, W.fade(xf));
    return W.lerp(i1, i2, W.fade(zf));
  };
  W.fbm = (x, z) => {
    let total = 0, amp = 1, freq = 1, maxAmp = 0;
    for (let o = 0; o < 5; o++) { total += W.valueNoise(x * freq * 0.04, z * freq * 0.04) * amp; maxAmp += amp; amp *= 0.5; freq *= 2; }
    return total / maxAmp;
  };
  W.seed = 1337;
  W.rnd = () => (W.seed = (W.seed * 1664525 + 1013904223) >>> 0, W.seed / 4294967296);
})();
