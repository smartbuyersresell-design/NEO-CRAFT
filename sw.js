const CACHE = 'neo-craft-cache-v2';
const ASSETS = ['./','./index.html','./game.js','./world.js','./chunk.js','./player.js','./mobs.js','./inventory.js','./crafting.js','./renderer.js','./ui.js','./save.js','./manifest.json','./icon.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))));
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));
