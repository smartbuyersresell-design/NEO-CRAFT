(function () {
  'use strict';
  const W = window.NEO;
  W.inventory = {};
  W.selected = 1;
  W.equippedTool = 0;
  W.addItem = (id, count) => { W.inventory[id] = (W.inventory[id] || 0) + count; };
  W.hasItem = (id, count) => (W.inventory[id] || 0) >= count;
  W.removeItem = (id, count) => {
    if (!W.hasItem(id, count)) return false;
    W.inventory[id] -= count;
    if (W.inventory[id] <= 0) delete W.inventory[id];
    return true;
  };
  W.refreshHotbarCounts = () => {
    document.querySelectorAll('#hotbar .slot').forEach((el, i) => {
      const b = W.SLOT_ORDER[i];
      const cnt = el.querySelector('.cnt');
      if (cnt) cnt.textContent = W.inventory[b] || 0;
      el.classList.toggle('active', i === W.selected - 1);
    });
  };
  W.selectSlot = n => {
    if (n < 1 || n > W.SLOT_ORDER.length) return;
    W.selected = n;
    W.refreshHotbarCounts();
  };
  W.updateToolLine = () => {
    document.getElementById('toolLine').textContent = 'Tool: ' + (W.equippedTool ? W.itemName(W.equippedTool) : 'Hand');
  };
})();
