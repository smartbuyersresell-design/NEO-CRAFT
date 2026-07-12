(function () {
  'use strict';
  const W = window.NEO;
  W.SAVEKEY = 'neocraft2-save';
  W.uint8ToBase64 = u8 => btoa(String.fromCharCode(...u8));
  W.base64ToUint8 = b64 => Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  W.showSaveToast = () => {
    const t = document.getElementById('saveToast');
    t.style.opacity = 1;
    setTimeout(() => t.style.opacity = 0, 1200);
  };
  W.exportWorld = () => ({
    chunks: [...W.chunks.entries()].map(([k, c]) => [k, W.uint8ToBase64(c.blocks)]),
    px: W.player.pos.x, py: W.player.pos.y, pz: W.player.pos.z,
    yaw: W.player.yaw, pitch: W.player.pitch,
    health: W.player.health, hunger: W.player.hunger,
    inventory: W.inventory, selected: W.selected, equippedTool: W.equippedTool,
    elapsed: W.elapsed, dayCount: W.dayCount, seed: W.seed
  });
  W.importWorld = data => {
    W.chunks.clear();
    for (const [k, b64] of (data.chunks || [])) {
      const [cx, cz] = k.split(',').map(Number);
      W.chunks.set(k, { cx, cz, blocks: W.base64ToUint8(b64), dirty: true });
    }
    W.player.pos.set(data.px, data.py, data.pz);
    W.player.yaw = data.yaw || 0;
    W.player.pitch = data.pitch || 0;
    W.player.health = data.health ?? 100;
    W.player.hunger = data.hunger ?? 100;
    W.inventory = data.inventory || {};
    W.selected = data.selected || 1;
    W.equippedTool = data.equippedTool || 0;
    W.elapsed = data.elapsed || 0;
    W.dayCount = data.dayCount || 1;
    W.seed = data.seed || 1337;
  };
  W.saveGame = () => { localStorage.setItem(W.SAVEKEY, JSON.stringify(W.exportWorld())); W.showSaveToast(); };
  W.loadGame = () => {
    const raw = localStorage.getItem(W.SAVEKEY);
    if (!raw) return W.newWorld();
    try { W.importWorld(JSON.parse(raw)); W.buildMesh(); W.refreshHotbarCounts(); W.updateToolLine(); }
    catch (e) { W.newWorld(); }
  };
})();
