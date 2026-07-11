(function () {
  'use strict';
  const W = window.NEO;
  W.player = { pos: new THREE.Vector3(0,0,0), vel: new THREE.Vector3(0,0,0), yaw: 0, pitch: 0, onGround: false, height: 1.7, radius: 0.32, eye: 1.55, health: 100, hunger: 100, alive: true };
  W.G = { gravity: -22, jump: 8.2, speed: 5.2 };
  W.solidAt = (x, y, z) => {
    const b = W.getBlock(Math.floor(x), Math.floor(y), Math.floor(z));
    return b !== W.BLOCK.AIR && b !== W.BLOCK.WATER;
  };
  W.collide = newPos => {
    const p = W.player, r = p.radius;
    let x = p.pos.x, y = p.pos.y, z = p.pos.z, tx = newPos.x, tz = newPos.z, ty = newPos.y;
    p.onGround = false;
    if (!W.solidAt(tx + Math.sign(tx - x) * r, y, z) && !W.solidAt(tx + Math.sign(tx - x) * r, y + p.height - 0.2, z)) x = tx;
    if (!W.solidAt(x, y, tz + Math.sign(tz - z) * r) && !W.solidAt(x, y + p.height - 0.2, tz + Math.sign(tz - z) * r)) z = tz;
    if (ty < y) {
      if (W.solidAt(x, ty - 0.6, z) || W.solidAt(x + r, ty - 0.6, z) || W.solidAt(x - r, ty - 0.6, z) || W.solidAt(x, ty - 0.6, z + r) || W.solidAt(x, ty - 0.6, z - r)) {
        ty = y; p.vel.y = 0; p.onGround = true;
      }
    } else if (ty > y) {
      if (W.solidAt(x, ty + p.height, z)) { ty = y; p.vel.y = 0; }
    }
    p.pos.set(x, ty, z);
  };
})();
