(function () {
  'use strict';
  const W = window.NEO || (window.NEO = {});

  W.scene = new THREE.Scene();
  W.camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.05, 400);

  W.renderer = new THREE.WebGLRenderer({ antialias: true });
  W.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  W.renderer.setSize(innerWidth, innerHeight);
  document.body.appendChild(W.renderer.domElement);

  W.scene.background = new THREE.Color(0x8fd0ef);
  W.scene.fog = new THREE.Fog(0x8fd0ef, 40, 140);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x445533, 0.9);
  const sun = new THREE.DirectionalLight(0xfff3d0, 0.9);
  const amb = new THREE.AmbientLight(0xffffff, 0.25);
  W.scene.add(hemi, sun, amb);
  W.hemi = hemi;
  W.sun = sun;
  W.amb = amb;

  W.sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(4, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xfff2b0 })
  );
  W.moonMesh = new THREE.Mesh(
    new THREE.SphereGeometry(3, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xcfd8ee })
  );
  W.scene.add(W.sunMesh, W.moonMesh);

  W.mesh = null;

  const F = [
    [1, 0, 0, [1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1], 'side'],
    [-1, 0, 0, [0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0], 'side'],
    [0, 1, 0, [0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0], 'top'],
    [0, -1, 0, [0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1], 'bottom'],
    [0, 0, 1, [1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 0, 1], 'side'],
    [0, 0, -1, [0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0], 'side']
  ];

  W.buildMesh = () => {
    const pos = [];
    const nor = [];
    const col = [];

    for (const c of W.chunks.values()) {
      for (let x = 0; x < W.CHUNK; x++) {
        for (let y = 0; y < W.SY; y++) {
          for (let z = 0; z < W.CHUNK; z++) {
            const b = c.blocks[W.idx(x, y, z)];
            if (!b || b === W.BLOCK.AIR) continue;

            const gx = c.cx * W.CHUNK + x;
            const gz = c.cz * W.CHUNK + z;
            const bc = W.BLOCKCOLORS[b] || W.BLOCKCOLORS[3];

            for (const f of F) {
              const nx = gx + f[0];
              const ny = y + f[1];
              const nz = gz + f[2];
              const nb = W.getBlock(nx, ny, nz);
              if (nb !== W.BLOCK.AIR && nb !== W.BLOCK.WATER) continue;

              const shade = f[4] === 'top' ? 1 : (f[4] === 'bottom' ? 0.55 : 0.78);
              const base = bc[f[4]];
              const [r, g, bl] = base.map(v => v * shade);

              const cr = f[3];
              const order = [0, 1, 2, 0, 2, 3];

              for (const oi of order) {
                const vx = cr[oi * 3];
                const vy = cr[oi * 3 + 1];
                const vz = cr[oi * 3 + 2];
                pos.push(gx + vx, y + vy, gz + vz);
                nor.push(f[0], f[1], f[2]);
                col.push(r, g, bl);
              }
            }
          }
        }
      }
    }

    console.log('mesh verts', pos.length / 3);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.computeBoundingSphere();

    const mat = new THREE.MeshLambertMaterial({ vertexColors: true });

    if (W.mesh) {
      W.scene.remove(W.mesh);
      W.mesh.geometry.dispose();
      W.mesh.material.dispose();
    }

    W.mesh = new THREE.Mesh(geo, mat);
    W.scene.add(W.mesh);
  };

  W.onResize = () => {
    W.camera.aspect = innerWidth / innerHeight;
    W.camera.updateProjectionMatrix();
    W.renderer.setSize(innerWidth, innerHeight);
  };

  window.addEventListener('resize', W.onResize);
})();
