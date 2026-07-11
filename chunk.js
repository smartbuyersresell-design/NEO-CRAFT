(function () {
  'use strict';
  const W = window.NEO;
  W.chunks = new Map();
  W.key = (cx, cz) => `${cx},${cz}`;
  W.chunkOf = (x, z) => [Math.floor(x / W.CHUNK), Math.floor(z / W.CHUNK)];
  W.makeChunk = (cx, cz) => {
    const key = W.key(cx, cz);
    if (W.chunks.has(key)) return W.chunks.get(key);
    const c = { cx, cz, blocks: new Uint8Array(W.CHUNK * W.SY * W.CHUNK), dirty: true };
    W.chunks.set(key, c);
    return c;
  };
  W.idx = (x, y, z) => x + z * W.CHUNK + y * W.CHUNK * W.CHUNK;
  W.getBlock = (x, y, z) => {
    if (y < 0 || y >= W.SY) return W.BLOCK.AIR;
    const [cx, cz] = W.chunkOf(x, z), c = W.chunks.get(W.key(cx, cz));
    if (!c) return W.BLOCK.AIR;
    const lx = ((x % W.CHUNK) + W.CHUNK) % W.CHUNK;
    const lz = ((z % W.CHUNK) + W.CHUNK) % W.CHUNK;
    return c.blocks[W.idx(lx, y, lz)] || W.BLOCK.AIR;
  };
  W.setBlock = (x, y, z, v) => {
    if (y < 0 || y >= W.SY) return;
    const [cx, cz] = W.chunkOf(x, z), c = W.makeChunk(cx, cz);
    const lx = ((x % W.CHUNK) + W.CHUNK) % W.CHUNK;
    const lz = ((z % W.CHUNK) + W.CHUNK) % W.CHUNK;
    c.blocks[W.idx(lx, y, lz)] = v;
    c.dirty = true;
  };
})();
