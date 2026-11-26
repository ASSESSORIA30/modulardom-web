import * as THREE from 'three';

/*
  What the model is lit by and made of, all generated at start: no image or HDR file is fetched.
*/

/**
 * Image-based lighting without an HDRI download: a small scene (a dusk sky graded from a warm
 * horizon to a cool zenith, a warm key panel, a cool fill, a dark ground) is filtered once into
 * an environment map. It gives the materials the soft, directional ambience and the reflections
 * an HDRI would, at no network cost and a few milliseconds of GPU time.
 */
export function makeEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const scene = new THREE.Scene();
  const sky = new THREE.SphereGeometry(60, 32, 16);
  const pos = sky.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const ground = new THREE.Color(0.05, 0.05, 0.05);
  const horizon = new THREE.Color(1.5, 1.05, 0.72);
  const zenith = new THREE.Color(0.42, 0.56, 0.72);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 60;
    if (y < 0) c.copy(ground).lerp(horizon, Math.pow(1 + y, 6));
    else c.copy(horizon).lerp(zenith, Math.pow(y, 0.45));
    colors.set([c.r, c.g, c.b], i * 3);
  }
  sky.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const skyMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, toneMapped: false });
  scene.add(new THREE.Mesh(sky, skyMat));
  const panel = new THREE.PlaneGeometry(1, 1);
  const light = (color: [number, number, number], size: [number, number], at: [number, number, number]) => {
    const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(...color), toneMapped: false, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(panel, m);
    mesh.scale.set(size[0], size[1], 1);
    mesh.position.set(...at);
    mesh.lookAt(0, 0, 0);
    scene.add(mesh);
    return m;
  };
  const made = [light([9, 6.6, 4.4], [34, 20], [26, 30, 24]), light([1.5, 2.2, 2.8], [40, 24], [-34, 16, -20]), light([3, 2.6, 2.2], [60, 6], [0, 44, 0])];
  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(scene, 0.035);
  pmrem.dispose();
  sky.dispose();
  panel.dispose();
  skyMat.dispose();
  made.forEach((m) => m.dispose());
  return target.texture;
}

const rand = (() => {
  let s = 11;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
})();

function canvasTexture(size: number, draw: (ctx: CanvasRenderingContext2D, s: number) => void, color = true): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d')!, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 4;
  return t;
}

/**
 * Colour maps are near white: they multiply the material's own colour, so one map serves several
 * materials. They are painted to tile (every mark is drawn again one tile over).
 */
export function makeTextures() {
  const wrap = (ctx: CanvasRenderingContext2D, s: number, fn: (dx: number, dy: number) => void) => {
    for (const dx of [-s, 0, s]) for (const dy of [-s, 0, s]) fn(dx, dy);
    void ctx;
  };
  // travertine: soft horizontal veining and a scatter of pores
  const stone = canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = '#f6f2ec';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 90; i++) {
      const y = rand() * s;
      const h = 1 + rand() * 7;
      const x = rand() * s;
      const w = s * (0.3 + rand() * 0.9);
      ctx.fillStyle = rand() > 0.45 ? `rgba(150,128,100,${0.03 + rand() * 0.07})` : `rgba(255,255,255,${0.1 + rand() * 0.2})`;
      wrap(ctx, s, (dx, dy) => ctx.fillRect(x + dx, y + dy, w, h));
    }
    for (let i = 0; i < 700; i++) {
      ctx.fillStyle = `rgba(110,92,70,${0.05 + rand() * 0.12})`;
      ctx.fillRect(rand() * s, rand() * s, 1 + rand() * 3, 1);
    }
  });
  // fine relief for concrete, block and stone
  const grit = canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 9000; i++) {
      const v = Math.floor(96 + rand() * 64);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(rand() * s, rand() * s, 1 + rand() * 1.5, 1 + rand() * 1.5);
    }
  }, false);
  // cast surfaces: broad, faint clouds
  const mottle = canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = '#f2f1ee';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 40; i++) {
      const x = rand() * s;
      const y = rand() * s;
      const r = 20 + rand() * 60;
      const dark = rand() > 0.5;
      wrap(ctx, s, (dx, dy) => {
        const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
        g.addColorStop(0, dark ? 'rgba(90,90,86,0.09)' : 'rgba(255,255,255,0.14)');
        g.addColorStop(1, 'rgba(128,128,128,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x + dx - r, y + dy - r, r * 2, r * 2);
      });
    }
  });
  // wood: grain lines running one way
  const grain = canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = '#f3ece2';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 260; i++) {
      const y = rand() * s;
      ctx.strokeStyle = `rgba(${90 + rand() * 50},${60 + rand() * 30},${30 + rand() * 20},${0.05 + rand() * 0.16})`;
      ctx.lineWidth = 0.6 + rand() * 1.8;
      const wob = rand() * 5;
      wrap(ctx, s, (dx, dy) => {
        ctx.beginPath();
        ctx.moveTo(dx, y + dy);
        ctx.bezierCurveTo(dx + s * 0.33, y + dy + wob, dx + s * 0.66, y + dy - wob, dx + s, y + dy);
        ctx.stroke();
      });
    }
  });
  // sheathing board: short strands laid every way
  const board = canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = '#efeae0';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 1500; i++) {
      ctx.save();
      ctx.translate(rand() * s, rand() * s);
      ctx.rotate(rand() * Math.PI);
      ctx.fillStyle = rand() > 0.5 ? `rgba(120,96,60,${0.06 + rand() * 0.1})` : `rgba(255,250,235,${0.12 + rand() * 0.14})`;
      ctx.fillRect(-7, -1.2, 14 + rand() * 8, 2.4);
      ctx.restore();
    }
  });
  // insulation and planting: a mat of short fibres
  const fibre = canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = '#eeeae2';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 4200; i++) {
      const x = rand() * s;
      const y = rand() * s;
      const a = rand() * Math.PI * 2;
      const l = 3 + rand() * 6;
      ctx.strokeStyle = rand() > 0.5 ? `rgba(60,60,40,${0.07 + rand() * 0.12})` : `rgba(255,255,245,${0.14 + rand() * 0.2})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      ctx.stroke();
    }
  });
  // the soft dark where a model meets its base (drawn as the blurred shadow of the footprint)
  const contact = canvasTexture(256, (ctx, s) => {
    ctx.clearRect(0, 0, s, s);
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 26;
    ctx.shadowOffsetX = s * 2;
    ctx.fillStyle = '#000';
    // footprint 13 x 9 on a 34 x 28 plane, drawn off-canvas so only its shadow lands
    const w = (13.4 / 34) * s;
    const h = (9.4 / 28) * s;
    for (let i = 0; i < 2; i++) ctx.fillRect(s / 2 - w / 2 - s * 2, s / 2 - h / 2, w, h);
  });
  contact.wrapS = contact.wrapT = THREE.ClampToEdgeWrapping;
  return { stone, grit, mottle, grain, board, fibre, contact };
}

/**
 * Lays a material's maps in world space instead of per box: every piece is the same unit cube
 * scaled, so its own UVs would stretch the grain differently on each. `tile` is repeats per metre.
 */
export function worldUv(m: THREE.MeshStandardMaterial, tile: number) {
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTile = { value: tile };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTile;')
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        {
          vec4 wp = vec4( transformed, 1.0 );
          #ifdef USE_INSTANCING
            wp = instanceMatrix * wp;
          #else
            wp = modelMatrix * wp;
          #endif
          vec3 an = abs( normal );
          vec2 wuv = ( an.y > 0.5 ? wp.xz : ( an.x > 0.5 ? wp.zy : wp.xy ) ) * uTile;
          #ifdef USE_MAP
            vMapUv = wuv;
          #endif
          #ifdef USE_BUMPMAP
            vBumpMapUv = wuv;
          #endif
          #ifdef USE_ROUGHNESSMAP
            vRoughnessMapUv = wuv;
          #endif
        }`,
      );
  };
  m.customProgramCacheKey = () => `worldUv${tile}`;
}
