# Neo Craft ⛏✨

A neon-lit voxel sandbox you build and explore right in the browser — inspired by
block-building games like Minecraft, built from scratch with [three.js](https://threejs.org/),
with an original glowing "Neo Crystal" block that lights up your builds.

No build step, no server required — it's a static site, so it runs great on
GitHub Pages and works on both desktop and mobile.

## Features

- Procedurally generated voxel terrain (hills, beaches, water, trees) from a text seed
- Break and place 8 block types: grass, dirt, stone, sand, wood, leaves, glowing
  Neo Crystal, and planks
- Day/night cycle with a moving sun and shifting sky color
- Neo Crystal blocks emit real-time colored light
- Desktop controls: WASD + mouse look + click to break/place
- Mobile controls: on-screen joystick, touch-drag look, jump/break/place buttons —
  auto-detected, no extra setup
- Save/continue your world (stored locally in the browser)

## Play locally

Just open `index.html` in a modern browser (Chrome, Safari, Firefox, Edge).
Because it uses ES6+ features and fetches three.js from a CDN, an internet
connection is needed the first time it loads three.js.

For the smoothest experience (some browsers restrict features on `file://`
pages), serve it with any static file server, e.g.:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Then visit `http://localhost:8000` (or whatever port your tool prints).

## Deploy to GitHub Pages

1. Create a new GitHub repository (e.g. `neocraft`) and push these files:
   ```bash
   git init
   git add .
   git commit -m "Neo Craft: initial voxel game"
   git branch -M main
   git remote add origin https://github.com/<your-username>/neocraft.git
   git push -u origin main
   ```
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to `Deploy from a branch`,
   branch `main`, folder `/ (root)`.
4. Save. GitHub will publish your game at:
   `https://<your-username>.github.io/neocraft/`
5. Open that link on your phone too — it's mobile-optimized out of the box.

## Controls

**Desktop**
| Action | Key |
|---|---|
| Move | `W A S D` |
| Look | Mouse (click the game to lock the pointer) |
| Jump | `Space` |
| Break block | Left click |
| Place block | Right click |
| Select block | `1`–`8` |
| Pause | `Esc` |

**Mobile (touch)**
| Action | Control |
|---|---|
| Move | Left joystick |
| Look | Drag anywhere on the right half of the screen |
| Jump | Round jump button |
| Break | Pink pickaxe button |
| Place | Cyan place button |
| Select block | Tap a hotbar slot |

## Project structure

```
neocraft/
├── index.html      # markup, title screen, HUD, touch controls
├── style.css        # neon voxel visual design, responsive/mobile layout
├── js/
│   ├── noise.js      # seedable 2D noise for terrain generation
│   └── main.js       # world gen, chunk meshing, physics, input, game loop
└── README.md
```

## Customizing your world

- **World size / height**: edit `CHUNK`, `CHUNKS_PER_AXIS`, `WORLD_HEIGHT` at
  the top of `js/main.js`. Bigger worlds cost more memory and mesh-build time,
  especially on phones — test on a real device after changing these.
- **Block palette**: edit `BLOCK_COLORS` in `js/main.js` — every block is just
  a top/side/bottom color, no texture files needed.
- **Add a new block type**: add an entry to `BLOCKS`, give it a color in
  `BLOCK_COLORS`, and add it to `HOTBAR_ORDER` if it should be placeable.
- **Terrain shape**: tweak the noise scales/octaves in `NeoWorld.heightAt`
  and `generate()`.

## Notes

- All art is procedural (flat-shaded colored voxels) — no copyrighted textures
  or assets from any existing game are used.
- Saving uses the browser's `localStorage`, so a save is tied to one browser
  on one device.
- Tested against recent Chrome/Safari/Firefox. Very old browsers without
  WebGL2/pointer-lock support may not run it.

Have fun building. 🟪🟦
