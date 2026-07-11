(function () {
  'use strict';
  const W = window.NEO;
  W.mobs = [];
  W.MAXPIGS = 10;
  W.MAXZOMBIES = 12;
  W.createMobMesh = type => {
    const g = new THREE.Group();
    const bodyColor = type === 'pig' ? 0xe8a0a8 : 0x3d6b3d;
    const headColor = type === 'pig' ? 0xf2b8be : 0x4a7a4a;
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 1.0), new THREE.MeshLambertMaterial({ color: bodyColor }));
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshLambertMaterial({ color: headColor }));
    body.position.y = 0.5;
    head.position.set(0, 0.85, 0.6);
    g.add(body, head);
    return g;
  };
  W.spawnMob = (type, x, z) => {
    const y = W.groundHeightAt(x, z);
    const mesh = W.createMobMesh(type);
    mesh.position.set(x, y, z);
    W.scene.add(mesh);
    W.mobs.push({ type, mesh, pos: new THREE.Vector3(x, y, z), dir: Math.random() * Math.PI * 2, speed: type === 'pig' ? 1.1 : 1.7, changeDirT: 1 + Math.random() * 3, health: type === 'pig' ? 10 : 18, attackCd: 0, alive: true, state: 'wander' });
  };
  W.updateMobs = dt => {
    for (const m of W.mobs) {
      if (!m.alive) continue;
      if (m.attackCd > 0) m.attackCd -= dt;
      const dx = W.player.pos.x - m.pos.x;
      const dz = W.player.pos.z - m.pos.z;
      const dist = Math.hypot(dx, dz);
      if (m.type === 'zombie' && dist < 10) { m.state = 'chase'; m.dir = Math.atan2(dz, dx); }
      else if (m.state === 'chase' && dist > 11) m.state = 'wander';
      if (m.state === 'wander') {
        m.changeDirT -= dt;
        if (m.changeDirT <= 0) { m.dir = Math.random() * Math.PI * 2; m.changeDirT = 2 + Math.random() * 4; }
      }
      const spd = m.state === 'chase' ? m.speed * 1.4 : m.speed * 0.6;
      const nx = m.pos.x + Math.cos(m.dir) * spd * dt;
      const nz = m.pos.z + Math.sin(m.dir) * spd * dt;
      const gh = W.groundHeightAt(nx, nz);
      m.pos.x = Math.max(2, Math.min(W.SX - 3, nx));
      m.pos.z = Math.max(2, Math.min(W.SZ - 3, nz));
      m.pos.y = gh;
      m.mesh.position.copy(m.pos);
      m.mesh.rotation.y = -m.dir + Math.PI / 2;
      if (m.type === 'zombie' && dist < 1.35 && m.attackCd <= 0) {
        W.player.health = Math.max(0, W.player.health - 8);
        m.attackCd = 1.0;
        if (W.flashDamage) W.flashDamage();
      }
    }
  };
  W.killMob = m => {
    m.alive = false;
    W.scene.remove(m.mesh);
    W.addItem(m.type === 'pig' ? W.ITEM.PORK : W.ITEM.ROTTEN, 1);
    W.refreshHotbarCounts();
  };
})();
