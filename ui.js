(function () {
  'use strict';
  const W = window.NEO;
  W.uiInit = () => {
    const isMobile = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    document.getElementById('controlsHelp').textContent = isMobile
      ? 'Left pad to move, right side to look. Hold break to mine/attack, tap place to build, jump to jump.'
      : 'WASD move, Shift to sprint, mouse look. Hold left click to mine/attack, right click to place. Keys 1-9 select block, E opens inventory (eat food there).';
    if (isMobile) document.getElementById('mobileUI').style.display = 'block';
    const hotbar = document.getElementById('hotbar');
    hotbar.innerHTML = '';
    W.SLOT_ORDER.forEach((b, i) => {
      const el = document.createElement('div');
      el.className = 'slot' + (i === 0 ? ' active' : '');
      el.style.background = `rgb(${Math.round(W.BLOCKCOLORS[b].side[0]*255)},${Math.round(W.BLOCKCOLORS[b].side[1]*255)},${Math.round(W.BLOCKCOLORS[b].side[2]*255)})`;
      el.innerHTML = `<span class="num">${i+1}</span><span>${W.itemName(b)}</span><span class="cnt">0</span>`;
      el.onclick = () => W.selectSlot(i + 1);
      hotbar.appendChild(el);
    });
    document.getElementById('invBtn').onclick = () => W.toggleInventory();
    document.getElementById('closeInv').onclick = () => W.toggleInventory();
    document.getElementById('respawnBtn').onclick = () => W.respawn();
    document.getElementById('startBtn').onclick = () => W.loadGame();
    document.getElementById('newBtn').onclick = () => W.newWorld();
  };
})();
