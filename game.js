(function () {
  'use strict';
  const W = window.NEO || (window.NEO = {});

  W.groundHeightAt = (x, z) => {
    const h = Math.floor(18 + W.fbm(x, z) * 14 + W.valueNoise(x * 0.14, z * 0.14) * 3);
    return Math.max(4, Math.min(W.SY - 8, h));
  };

  W.generateWorld = () => {
    W.chunks.clear();

    const cxMax = Math.ceil(W.SX / W.CHUNK);
    const czMax = Math.ceil(W.SZ / W.CHUNK);

    for (let cx = 0; cx < cxMax; cx++) {
      for (let cz = 0; cz < czMax; cz++) {
        const c = W.makeChunk(cx, cz);

        for (let lx = 0; lx < W.CHUNK; lx++) {
          for (let lz = 0; lz < W.CHUNK; lz++) {
            const x = cx * W.CHUNK + lx;
            const z = cz * W.CHUNK + lz;
            if (x >= W.SX || z >= W.SZ) continue;

            const h = W.groundHeightAt(x, z);
            const waterLevel = 14;

            for (let y = 0; y < W.SY; y++) {
              let b = W.BLOCK.AIR;
              if (y < h - 4) b = W.BLOCK.STONE;
              else if (y < h - 1) b = W.BLOCK.DIRT;
              else if (y === h - 1) b = h < waterLevel + 2 ? W.BLOCK.SAND : W.BLOCK.GRASS;
              if (y > h - 1 && y <= waterLevel && h < waterLevel) b = W.BLOCK.WATER;
              c.blocks[W.idx(lx, y, lz)] = b;
            }

            if (h > waterLevel + 1 && W.rnd() < 0.02) {
              const trunk = 3 + Math.floor(W.rnd() * 3);
              for (let i = 0; i < trunk; i++) W.setBlock(x, h + i, z, W.BLOCK.WOOD);
            }

            if (h > waterLevel + 1 && W.rnd() < 0.03) W.setBlock(x, h, z, W.BLOCK.TALLGRASS);
            if (h > waterLevel + 1 && W.rnd() < 0.015) W.setBlock(x, h, z, W.BLOCK.FLOWER);
          }
        }
      }
    }

    console.log('world chunks', W.chunks.size);
    W.buildMesh();
  };

  W.placeSpawn = () => {
    const sx = Math.floor(W.SX / 2);
    const sz = Math.floor(W.SZ / 2);
    const sy = W.groundHeightAt(sx, sz);
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
    W.player.vel.set(0, 0, 0);

    W.generateWorld();
    W.placeSpawn();
    W.mobs.length = 0;
    W.refreshHotbarCounts();
    W.updateToolLine();
    W.renderInventoryPanel();
    W.updateSky();

    document.getElementById('deathScreen').style.display = 'none';
    document.getElementById('loading').style.display = 'none';
    document.getElementById('blocker').style.display = 'flex';
    console.log('new world ready');
  };

  W.respawn = () => {
    W.player.health = 100;
    W.player.hunger = 100;
    W.player.alive = true;
    W.player.vel.set(0, 0, 0);
    W.placeSpawn();
    document.getElementById('deathScreen').style.display = 'none';
  };

  W.raycastVoxel = maxDist => {
    const dir = new THREE.Vector3();
    W.camera.getWorldDirection(dir);
    const origin = W.camera.position.clone();
    let prev = null;

    for (let t = 0; t < maxDist; t += 0.05) {
      const p = origin.clone().addScaledVector(dir, t);
      const bx = Math.floor(p.x);
      const by = Math.floor(p.y);
      const bz = Math.floor(p.z);
      const hit = W.getBlock(bx, by, bz);
      if (hit !== W.BLOCK.AIR && hit !== W.BLOCK.WATER) {
        return { hit: { x: bx, y: by, z: bz }, prev };
      }
      prev = { x: bx, y: by, z: bz };
    }
    return null;
  };

  W.getBreakTime = blockId => {
    const base = W.BREAKTIME[blockId] || 1;
    let mult = 1;
    if (blockId === W.BLOCK.STONE && W.equippedTool === 105) mult = 3.5;
    if (blockId === W.BLOCK.STONE && W.equippedTool === 102) mult = 1.8;
    if ([W.BLOCK.WOOD, W.BLOCK.LEAVES, W.BLOCK.PLANKS, W.BLOCK.TABLE].includes(blockId) && [103, 106].includes(W.equippedTool)) mult = 3.2;
    return base / mult;
  };

  W.getAttackDamage = () => ({ 104: 4, 107: 7, 102: 2, 105: 5, 103: 3, 106: 4 }[W.equippedTool] || 2);

  W.tryPlace = () => {
    const r = W.raycastVoxel(6);
    if (!r || !r.prev || !W.hasItem(W.SLOT_ORDER[W.selected - 1], 1)) return;

    const p = r.prev;
    const px = Math.floor(W.player.pos.x);
    const py = Math.floor(W.player.pos.y);
    const pz = Math.floor(W.player.pos.z);

    if (p.x === px && p.z === pz && (p.y === py || p.y === py + 1)) return;

    W.setBlock(p.x, p.y, p.z, W.SLOT_ORDER[W.selected - 1]);
    W.removeItem(W.SLOT_ORDER[W.selected - 1], 1);
    W.buildMesh();
    W.refreshHotbarCounts();
  };

  W.updateMining = dt => {
    const bar = document.getElementById('breakBar');
    const fill = document.getElementById('breakBarFill');

    if (!W.breakHeld || !W.gameStarted || document.getElementById('invPanel').style.display === 'flex') {
      W.breakTarget = null;
      W.breakProgress = 0;
      bar.style.display = 'none';
      return;
    }

    const mob = W.findTargetMob && W.findTargetMob(5);
    if (mob) {
      W.playerAttackCooldown = Math.max(0, (W.playerAttackCooldown || 0) - dt);
      if ((W.playerAttackCooldown || 0) <= 0) {
        mob.health -= W.getAttackDamage();
        W.playerAttackCooldown = 0.45;
        if (mob.health <= 0) W.killMob(mob);
      }
      return;
    }

    const r = W.raycastVoxel(6);
    if (!r || !r.hit) {
      W.breakTarget = null;
      W.breakProgress = 0;
      bar.style.display = 'none';
      return;
    }

    const key = `${r.hit.x},${r.hit.y},${r.hit.z}`;
    if (W.breakTarget !== key) {
      W.breakTarget = key;
      W.breakProgress = 0;
    }

    const blockId = W.getBlock(r.hit.x, r.hit.y, r.hit.z);
    const req = W.getBreakTime(blockId);
    W.breakProgress += dt;
    bar.style.display = 'block';
    fill.style.width = Math.min(100, W.breakProgress / req * 100) + '%';

    if (W.breakProgress >= req) {
      W.setBlock(r.hit.x, r.hit.y, r.hit.z, W.BLOCK.AIR);
      W.addItem(blockId, 1);
      if (blockId === W.BLOCK.LEAVES && Math.random() < 0.08) W.addItem(W.ITEM.APPLE, 1);
      W.buildMesh();
      W.refreshHotbarCounts();
      W.breakTarget = null;
      W.breakProgress = 0;
    }
  };

  W.eatFood = id => {
    const f = W.FOOD[id];
    if (!f || !W.hasItem(id, 1)) return false;
    W.removeItem(id, 1);
    W.player.hunger = Math.min(100, W.player.hunger + f.hunger);
    if (f.poisonChance && Math.random() < f.poisonChance) {
      W.player.health = Math.max(0, W.player.health - f.poisonDamage);
      if (W.flashDamage) W.flashDamage();
    }
    W.refreshHotbarCounts();
    return true;
  };

  W.updateSurvival = dt => {
    W.hungerTimer = (W.hungerTimer || 0) + dt * (W.isSprinting ? 2.2 : 1);
    if (W.hungerTimer >= 18) {
      W.hungerTimer = 0;
      W.player.hunger = Math.max(0, W.player.hunger - 2);
    }
    if (W.player.hunger <= 0) W.player.health = Math.max(0, W.player.health - 2 * dt);
    else if (W.player.hunger >= 60) W.player.health = Math.min(100, W.player.health + 1.5 * dt);

    if (W.player.health <= 0 && W.player.alive) {
      W.player.alive = false;
      document.getElementById('deathScreen').style.display = 'flex';
    }
  };

  W.elapsed = 0;
  W.dayCount = 1;
  W.dayFrac = () => (W.elapsed % 240) / 240;
  W.sunElevation = () => -Math.cos(W.dayFrac() * Math.PI * 2);
  W.isDaylight = () => W.sunElevation() > 0.15;

  W.updateSky = () => {
    const dayLight = Math.max(0, W.sunElevation());
    const angle = W.dayFrac() * Math.PI * 2;
    const cx = W.SX / 2;
    const cz = W.SZ / 2;

    W.sunMesh.position.set(cx + Math.cos(angle) * 140, Math.sin(angle) * 90 + 30, cz);
    W.moonMesh.position.set(cx - Math.cos(angle) * 140, -Math.sin(angle) * 90 - 30, cz);
    W.sun.position.copy(W.sunMesh.position);

    W.sun.intensity = 0.15 + dayLight * 0.85;
    W.hemi.intensity = 0.25 + dayLight * 0.65;
    W.amb.intensity = 0.06 + dayLight * 0.22;

    const sky = new THREE.Color(0x8fd0ef).lerp(new THREE.Color(0x0a0f1c), 1 - dayLight);
    W.scene.background = sky;
    W.scene.fog.color = sky;
  };

  W.findTargetMob = maxDist => {
    const dir = new THREE.Vector3();
    W.camera.getWorldDirection(dir);
    const origin = W.camera.position;
    let best = null;
    let bestDist = maxDist;

    for (const m of W.mobs) {
      if (!m.alive) continue;
      const to = new THREE.Vector3(m.pos.x - origin.x, m.pos.y + 0.5 - origin.y, m.pos.z - origin.z);
      const dist = to.length();
      if (dist > maxDist) continue;
      if (dir.angleTo(to.normalize()) < 0.3 && dist < bestDist) {
        best = m;
        bestDist = dist;
      }
    }
    return best;
  };

  W.spawnTimer = 0;
  W.updateSpawning = dt => {
    W.spawnTimer -= dt;
    if (W.spawnTimer > 0) return;
    W.spawnTimer = 4;

    const pigs = W.mobs.filter(m => m.alive && m.type === 'pig').length;
    const cows = W.mobs.filter(m => m.alive && m.type === 'cow').length;
    const zombies = W.mobs.filter(m => m.alive && m.type === 'zombie').length;
    const day = W.isDaylight();

    if (day && pigs < W.MAXPIGS) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 14 + Math.random() * 18;
      const x = W.player.pos.x + Math.cos(ang) * dist;
      const z = W.player.pos.z + Math.sin(ang) * dist;
      if (x > 2 && x < W.SX - 2 && z > 2 && z < W.SZ - 2) W.spawnMob('pig', x, z);
    }

    if (day && cows < W.MAXCOWS) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 14 + Math.random() * 18;
      const x = W.player.pos.x + Math.cos(ang) * dist;
      const z = W.player.pos.z + Math.sin(ang) * dist;
      if (x > 2 && x < W.SX - 2 && z > 2 && z < W.SZ - 2) W.spawnMob('cow', x, z);
    }

    if (!day && zombies < W.MAXZOMBIES) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 12 + Math.random() * 16;
      const x = W.player.pos.x + Math.cos(ang) * dist;
      const z = W.player.pos.z + Math.sin(ang) * dist;
      if (x > 2 && x < W.SX - 2 && z > 2 && z < W.SZ - 2) W.spawnMob('zombie', x, z);
    }
  };

  W.heartsString = v => '❤'.repeat(Math.max(0, Math.round(v / 10))) + '♡'.repeat(Math.max(0, 10 - Math.round(v / 10)));
  W.hungerString = v => '🍖'.repeat(Math.max(0, Math.round(v / 10))) + '·'.repeat(Math.max(0, 10 - Math.round(v / 10)));

  W.flashDamage = () => {
    document.body.style.filter = 'hue-rotate(330deg) saturate(1.6)';
    setTimeout(() => (document.body.style.filter = ''), 120);
  };

  W.toggleInventory = () => {
    const p = document.getElementById('invPanel');
    if (p.style.display === 'flex') p.style.display = 'none';
    else {
      W.renderInventoryPanel();
      p.style.display = 'flex';
    }
  };

  W.renderInventoryPanel = () => {
    const matList = document.getElementById('matList');
    const craftList = document.getElementById('craftList');
    const toolList = document.getElementById('toolList');
    matList.innerHTML = '';
    craftList.innerHTML = '';
    toolList.innerHTML = '';

    const matIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 101, 108, 109, 110, 111];
    let any = false;

    for (const id of matIds) {
      const c = W.inventory[id] || 0;
      if (!c) continue;
      any = true;
      const isFood = !!W.FOOD[id];
      const row = document.createElement('div');
      row.className = 'invRow';
      row.innerHTML = `<div class="name">${W.itemName(id)}</div><div class="cnt">${c}</div>` + (isFood ? `<button class="eat">Eat</button>` : '');
      if (isFood) {
        row.querySelector('button').onclick = () => {
          if (W.eatFood(id)) W.renderInventoryPanel();
        };
      }
      matList.appendChild(row);
    }

    if (!any) matList.innerHTML = '<div class="invRow"><div class="name">Nothing yet. Mine some blocks!</div></div>';

    for (const r of W.RECIPES) {
      const can = r.inputs.every(i => W.hasItem(i.item, i.count));
      const req = r.inputs.map(i => `${i.count} ${W.itemName(i.item)}`).join(', ');
      const row = document.createElement('div');
      row.className = 'invRow';
      row.innerHTML = `<div class="name">${r.name}<br><small style="opacity:.6">${req}</small></div><button ${can ? '' : 'disabled'}>Craft</button>`;
      row.querySelector('button').onclick = () => {
        if (W.craftRecipe(r)) W.renderInventoryPanel();
        W.refreshHotbarCounts();
      };
      craftList.appendChild(row);
    }

    const tools = [102, 103, 104, 105, 106, 107];
    let anyTool = false;

    for (const id of tools) {
      const c = W.inventory[id] || 0;
      if (!c) continue;
      anyTool = true;
      const row = document.createElement('div');
      row.className = 'invRow';
      row.innerHTML = `<div class="name">${W.itemName(id)} ${W.equippedTool === id ? '(equipped)' : ''}</div><div class="cnt">${c}</div><button class="eq">${W.equippedTool === id ? 'Equipped' : 'Equip'}</button>`;
      row.querySelector('button').onclick = () => {
        W.equippedTool = id;
        W.updateToolLine();
        W.renderInventoryPanel();
      };
      toolList.appendChild(row);
    }

    if (!anyTool) toolList.innerHTML = '<div class="invRow"><div class="name">No tools or food yet.</div></div>';
  };

  W.initInput = () => {
    const isMobile = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    const keys = {};
    W.breakHeld = false;
    W.gameStarted = false;
    W.playerAttackCooldown = 0;

    document.addEventListener('keydown', e => {
      keys[e.code] = true;
      if (e.code === 'KeyE') W.toggleInventory();
      if (/Digit[1-9]/.test(e.code)) W.selectSlot(+e.code.replace('Digit', ''));
      if (e.code === 'Space') e.preventDefault();
    });

    document.addEventListener('keyup', e => {
      keys[e.code] = false;
    });

    document.addEventListener('pointerlockchange', () => {
      W.pointerLocked = document.pointerLockElement === W.renderer.domElement;
    });

    document.addEventListener('mousemove', e => {
      if (!W.pointerLocked) return;
      W.player.yaw -= e.movementX * 0.0022;
      W.player.pitch -= e.movementY * 0.0022;
      W.player.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, W.player.pitch));
    });

    W.renderer.domElement.addEventListener('mousedown', e => {
      if (!W.pointerLocked && !isMobile) {
        if (W.gameStarted && W.renderer.domElement.requestPointerLock) W.renderer.domElement.requestPointerLock();
        return;
      }
      if (e.button === 0) W.breakHeld = true;
      if (e.button === 2) W.tryPlace();
    });

    document.addEventListener('mouseup', e => {
      if (e.button === 0) W.breakHeld = false;
    });

    W.renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());

    if (isMobile) {
      document.getElementById('mobileUI').style.display = 'block';

      const joystickZone = document.getElementById('joystickZone');
      const joystickKnob = document.getElementById('joystickKnob');
      let joyId = null;
      let center = { x: 0, y: 0 };
      W.moveVec = { x: 0, y: 0 };

      joystickZone.addEventListener('touchstart', e => {
        const t = e.changedTouches[0];
        joyId = t.identifier;
        const r = joystickZone.getBoundingClientRect();
        center = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        e.preventDefault();
      }, { passive: false });

      joystickZone.addEventListener('touchmove', e => {
        for (const t of e.changedTouches) if (t.identifier === joyId) {
          let dx = t.clientX - center.x;
          let dy = t.clientY - center.y;
          const max = 45;
          const dist = Math.min(max, Math.hypot(dx, dy));
          const ang = Math.atan2(dy, dx);
          dx = Math.cos(ang) * dist;
          dy = Math.sin(ang) * dist;
          joystickKnob.style.left = (37 + dx) + 'px';
          joystickKnob.style.top = (37 + dy) + 'px';
          W.moveVec.x = dx / max;
          W.moveVec.y = -dy / max;
          e.preventDefault();
        }
      }, { passive: false });

      const resetJoy = e => {
        for (const t of e.changedTouches) if (t.identifier === joyId) {
          joyId = null;
          W.moveVec.x = 0;
          W.moveVec.y = 0;
          joystickKnob.style.left = '37px';
          joystickKnob.style.top = '37px';
        }
      };
      joystickZone.addEventListener('touchend', resetJoy);
      joystickZone.addEventListener('touchcancel', resetJoy);

      const lookZone = document.getElementById('lookZone');
      let lookId = null;
      let last = { x: 0, y: 0 };

      lookZone.addEventListener('touchstart', e => {
        const t = e.changedTouches[0];
        lookId = t.identifier;
        last = { x: t.clientX, y: t.clientY };
        e.preventDefault();
      }, { passive: false });

      lookZone.addEventListener('touchmove', e => {
        for (const t of e.changedTouches) if (t.identifier === lookId) {
          W.player.yaw -= (t.clientX - last.x) * 0.0032;
          W.player.pitch -= (t.clientY - last.y) * 0.0032;
          W.player.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, W.player.pitch));
          last = { x: t.clientX, y: t.clientY };
          e.preventDefault();
        }
      }, { passive: false });

      const resetLook = e => {
        for (const t of e.changedTouches) if (t.identifier === lookId) lookId = null;
      };
      lookZone.addEventListener('touchend', resetLook);
      lookZone.addEventListener('touchcancel', resetLook);

      document.getElementById('jumpBtn').addEventListener('touchstart', e => {
        W.wantJump = true;
        e.preventDefault();
      }, { passive: false });

      document.getElementById('breakBtn').addEventListener('touchstart', e => {
        W.breakHeld = true;
        e.preventDefault();
      }, { passive: false });

      document.getElementById('breakBtn').addEventListener('touchend', e => {
        W.breakHeld = false;
        e.preventDefault();
      }, { passive: false });

      document.getElementById('placeBtn').addEventListener('touchstart', e => {
        W.tryPlace();
        e.preventDefault();
      }, { passive: false });
    }

    W.startLoop = () => {
      let last = performance.now();

      function frame(now) {
        requestAnimationFrame(frame);
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;

        if (W.gameStarted && W.player.alive) {
          W.elapsed += dt;

          if (W.playerAttackCooldown > 0) W.playerAttackCooldown -= dt;

          let fwd = 0;
          let str = 0;

          if (!isMobile) {
            if (keys.KeyW) fwd += 1;
            if (keys.KeyS) fwd -= 1;
            if (keys.KeyD) str += 1;
            if (keys.KeyA) str -= 1;
          } else {
            fwd = W.moveVec ? W.moveVec.y : 0;
            str = W.moveVec ? W.moveVec.x : 0;
          }

          const len = Math.hypot(fwd, str);
          if (len > 1) {
            fwd /= len;
            str /= len;
          }

          const sprinting = !isMobile && (keys.ShiftLeft || keys.ShiftRight) && fwd > 0 && W.player.hunger > 0;
          W.isSprinting = sprinting;
          const speedMult = sprinting ? 1.6 : 1;

          const sinY = Math.sin(W.player.yaw);
          const cosY = Math.cos(W.player.yaw);
          const moveX = (fwd * sinY + str * cosY) * W.G.speed * speedMult;
          const moveZ = (fwd * cosY - str * sinY) * W.G.speed * speedMult;

          W.player.vel.y += W.G.gravity * dt;

          const jumpPressed = !isMobile ? keys.Space : W.wantJump;
          if (jumpPressed && W.player.onGround) {
            W.player.vel.y = W.G.jump;
            W.wantJump = false;
          }

          const np = W.player.pos.clone();
          np.x += moveX * dt;
          np.z += moveZ * dt;
          np.y += W.player.vel.y * dt;

          W.collide(np);

          W.camera.position.set(W.player.pos.x, W.player.pos.y + W.player.eye, W.player.pos.z);
          W.camera.rotation.order = 'YXZ';
          W.camera.rotation.y = W.player.yaw;
          W.camera.rotation.x = W.player.pitch;

          W.updateMobs(dt);
          W.updateSpawning(dt);
          W.updateMining(dt);
          W.updateSurvival(dt);

          if (W.elapsed >= 240) {
            W.elapsed -= 240;
            W.dayCount++;
          }

          W.updateSky();

          document.getElementById('posLine').textContent =
            `x:${W.player.pos.x.toFixed(1)} y:${W.player.pos.y.toFixed(1)} z:${W.player.pos.z.toFixed(1)}`;
          document.getElementById('hearts').textContent = W.heartsString(W.player.health);
          document.getElementById('hunger').textContent = W.hungerString(W.player.hunger);
          document.getElementById('clockLine').textContent = `${W.isDaylight() ? '☀' : '☾'} Day ${W.dayCount}`;
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
