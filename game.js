(function () {
  'use strict';
  const W = window.NEO || (window.NEO = {});

  W.groundHeightAt = (x, z) => Math.max(4, Math.min(W.SY - 8, Math.floor(18 + W.fbm(x, z) * 14 + W.valueNoise(x * 0.14, z * 0.14) * 3)));

  W.generateWorld = () => {
    W.chunks.clear();
    const cxMax = Math.ceil(W.SX / W.CHUNK), czMax = Math.ceil(W.SZ / W.CHUNK);
    for (let cx = 0; cx < cxMax; cx++) for (let cz = 0; cz < czMax; cz++) {
      const c = W.makeChunk(cx, cz);
      for (let lx = 0; lx < W.CHUNK; lx++) for (let lz = 0; lz < W.CHUNK; lz++) {
        const x = cx * W.CHUNK + lx, z = cz * W.CHUNK + lz;
        if (x >= W.SX || z >= W.SZ) continue;
        const h = W.groundHeightAt(x, z), waterLevel = 14;
        for (let y = 0; y < W.SY; y++) {
          let b = W.BLOCK.AIR;
          if (y < h - 4) b = W.BLOCK.STONE;
          else if (y < h - 1) b = W.BLOCK.DIRT;
          else if (y === h - 1) b = h < waterLevel + 2 ? W.BLOCK.SAND : W.BLOCK.GRASS;
          if (y > h - 1 && y <= waterLevel && h < waterLevel) b = W.BLOCK.WATER;
          c.blocks[W.idx(lx, y, lz)] = b;
        }
      }
    }
    W.buildMesh();
  };

  W.placeSpawn = () => {
    const sx = Math.floor(W.SX / 2), sz = Math.floor(W.SZ / 2), sy = W.groundHeightAt(sx, sz);
    W.player.pos.set(sx + 0.2, sy + 2.2, sz + 0.2);
  };

  W.newWorld = () => {
    W.seed = 1337;
    W.inventory = {};
    W.equippedTool = 0;
    W.selected = 1;
    W.elapsed = 0;
    W.dayCount = 1;
    W.player.health = 100;
    W.player.hunger = 100;
    W.player.alive = true;
    W.generateWorld();
    W.placeSpawn();
    W.mobs.length = 0;
    W.refreshHotbarCounts();
    W.updateToolLine();
    W.renderInventoryPanel();
  };

  W.respawn = () => {
    W.player.health = 100;
    W.player.hunger = 100;
    W.player.alive = true;
    W.player.vel.set(0, 0, 0);
    W.placeSpawn();
    document.getElementById('deathScreen').style.display = 'none';
  };

  W.initInput = () => {
    const isMobile = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    const keys = {};
    W.breakHeld = false;
    W.gameStarted = false;

    document.addEventListener('keydown', e => {
      keys[e.code] = true;
      if (e.code === 'KeyE') W.toggleInventory();
      if (/Digit[1-8]/.test(e.code)) W.selectSlot(+e.code.replace('Digit', ''));
    });
    document.addEventListener('keyup', e => keys[e.code] = false);

    document.getElementById('startBtn').onclick = () => {
      W.gameStarted = true;
      document.getElementById('loading').style.display = 'none';
      document.getElementById('blocker').style.display = 'none';
      if (!isMobile && W.renderer.domElement.requestPointerLock) W.renderer.domElement.requestPointerLock();
    };

    document.getElementById('newBtn').onclick = () => {
      W.newWorld();
      W.gameStarted = true;
      document.getElementById('loading').style.display = 'none';
      document.getElementById('blocker').style.display = 'none';
      if (!isMobile && W.renderer.domElement.requestPointerLock) W.renderer.domElement.requestPointerLock();
    };

    W.startLoop = () => {
      let last = performance.now();
      function frame(now) {
        requestAnimationFrame(frame);
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;

        if (W.gameStarted && W.player.alive) {
          let fwd = 0, str = 0;
          if (!isMobile) {
            if (keys.KeyW) fwd += 1;
            if (keys.KeyS) fwd -= 1;
            if (keys.KeyD) str += 1;
            if (keys.KeyA) str -= 1;
            W.breakHeld = keys.Mouse0 || W.breakHeld;
          }
          W.camera.position.set(W.player.pos.x, W.player.pos.y + W.player.eye, W.player.pos.z);
          W.camera.rotation.order = 'YXZ';
          W.camera.rotation.y = W.player.yaw;
          W.camera.rotation.x = W.player.pitch;
          document.getElementById('posLine').textContent = `x:${W.player.pos.x.toFixed(1)} y:${W.player.pos.y.toFixed(1)} z:${W.player.pos.z.toFixed(1)}`;
        }
        W.renderer.render(W.scene, W.camera);
      }
      requestAnimationFrame(frame);
    };
  };

  function boot() {
    try {
      W.uiInit();
      W.initInput();
      W.newWorld();
      document.getElementById('loading').style.display = 'none';
      document.getElementById('blocker').style.display = 'flex';
      W.startLoop();
    } catch (e) {
      console.error(e);
      const l = document.getElementById('loading');
      if (l) l.textContent = 'Boot error: ' + e.message;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
