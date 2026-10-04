'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer, MeshTransmissionMaterial, PerformanceMonitor, Float } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Natural quartz point: an irregular six-sided prism (unequal face widths, slight taper,
 * subtle mid-body kink) with an off-centre rhombohedral termination. Flat-shaded faces,
 * UVs run along the length so striations can wrap horizontally.
 */
function makeQuartz(seed: number, radius: number, height: number, term: number) {
  const rnd = seeded(seed);
  const n = 6;
  const angles: number[] = [];
  const radii: number[] = [];
  for (let i = 0; i < n; i++) {
    angles.push((i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.22);
    radii.push(radius * (0.82 + rnd() * 0.32));
  }
  const ring = (y: number, scale: number, jitter = 0) =>
    angles.map((a, i) => new THREE.Vector3(Math.cos(a) * radii[i] * scale, y + (rnd() - 0.5) * jitter, Math.sin(a) * radii[i] * scale));

  const rings = [
    ring(0, 0.97, 0.06), // rough broken base (sits in the matrix)
    ring(height * 0.48, 0.985, 0.02),
    ring(height, 0.93, 0.0),
  ];
  const apex = new THREE.Vector3((rnd() - 0.5) * radius * 0.35, height + term, (rnd() - 0.5) * radius * 0.35);
  const total = height + term;

  const pos: number[] = [];
  const uv: number[] = [];
  const push = (v: THREE.Vector3, u: number) => {
    pos.push(v.x, v.y, v.z);
    uv.push(u, v.y / total);
  };
  for (let r = 0; r < rings.length - 1; r++) {
    const a = rings[r];
    const b = rings[r + 1];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const u0 = i / n;
      const u1 = (i + 1) / n;
      push(a[i], u0); push(b[i], u0); push(b[j], u1);
      push(a[i], u0); push(b[j], u1); push(a[j], u1);
    }
  }
  const top = rings[rings.length - 1];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    push(top[i], i / n); push(apex, (i + 0.5) / n); push(top[j], (i + 1) / n);
  }
  const bottomC = new THREE.Vector3(0, -0.05, 0);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    push(rings[0][j], 0); push(bottomC, 0); push(rings[0][i], 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

/** Horizontal growth striations (bump) + faint frosted bands (roughness) — what makes quartz read as mineral. */
function makeStriationMaps() {
  const h = 512;
  const mk = (draw: (ctx: CanvasRenderingContext2D) => void) => {
    const c = document.createElement('canvas');
    c.width = 8;
    c.height = h;
    const ctx = c.getContext('2d')!;
    draw(ctx);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  };
  const rnd = seeded(11);
  const bump = mk((ctx) => {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 8, h);
    for (let y = 0; y < h; y++) {
      if (rnd() < 0.18) {
        const v = 128 + (rnd() - 0.5) * 50;
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(0, y, 8, 1 + Math.floor(rnd() * 2));
      }
    }
  });
  const rough = mk((ctx) => {
    ctx.fillStyle = 'rgb(12,12,12)';
    ctx.fillRect(0, 0, 8, h);
    for (let k = 0; k < 14; k++) {
      const y = rnd() * h;
      const hh = 2 + rnd() * 10;
      const v = 30 + rnd() * 70;
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(0, y, 8, hh);
    }
    // frosted, broken base
    const grad = ctx.createLinearGradient(0, 0, 0, h * 0.12);
    grad.addColorStop(0, 'rgb(150,150,150)');
    grad.addColorStop(1, 'rgba(150,150,150,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 8, h * 0.12);
  });
  return { bump, rough };
}

/** Soft wispy texture for internal veils / fractures. */
function makeVeilTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  const rnd = seeded(23);
  for (let i = 0; i < 60; i++) {
    const x = 20 + rnd() * 88;
    const y = 20 + rnd() * 88;
    const r = 6 + rnd() * 26;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,255,255,${0.05 + rnd() * 0.12})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  }
  return new THREE.CanvasTexture(c);
}

/** Lumpy host rock (matrix) with mottled vertex colour. */
function makeRock(seed: number) {
  const rnd = seeded(seed);
  const o = Array.from({ length: 9 }, () => rnd() * 10);
  const fbm = (v: THREE.Vector3) =>
    Math.sin(v.x * 2.1 + o[0]) * Math.sin(v.y * 2.7 + o[1]) * Math.sin(v.z * 2.3 + o[2]) * 0.55 +
    Math.sin(v.x * 5.3 + o[3]) * Math.sin(v.y * 4.9 + o[4]) * Math.sin(v.z * 5.7 + o[5]) * 0.3 +
    Math.sin(v.x * 11.1 + o[6]) * Math.sin(v.y * 12.7 + o[7]) * Math.sin(v.z * 10.3 + o[8]) * 0.15;
  const g = mergeVertices(new THREE.IcosahedronGeometry(1, 5).deleteAttribute('normal').deleteAttribute('uv'));
  const p = g.attributes.position;
  const colors = new Float32Array(p.count * 3);
  const v = new THREE.Vector3();
  const dark = new THREE.Color('#110e0c');
  const tan = new THREE.Color('#3b3029');
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    const n = fbm(v);
    v.multiplyScalar(1 + n * 0.34);
    p.setXYZ(i, v.x, v.y, v.z);
    c.copy(dark).lerp(tan, THREE.MathUtils.clamp(0.5 + n * 0.9, 0, 1));
    colors.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return { geo: g, surface: (dir: THREE.Vector3) => 1 + fbm(dir.clone().normalize()) * 0.34 };
}

/* ------------------------------------------------------------------ */
/* background + particles                                              */
/* ------------------------------------------------------------------ */

/** Night sky with lapis / teal haze and a warm lantern glow — gives the quartz something to refract. */
function Backdrop() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame((state) => {
    if (mat.current) mat.current.uniforms.uTime.value = state.clock.elapsedTime;
  });
  return (
    <mesh position={[0, 0, -5]} scale={[22, 14, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        depthWrite={false}
        vertexShader={`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`}
        fragmentShader={`
          varying vec2 vUv; uniform float uTime;
          float blob(vec2 uv, vec2 c, float r){ return smoothstep(r, 0.0, distance(uv, c)); }
          void main(){
            vec2 uv = vUv; uv.x *= 1.57;
            float t = uTime * 0.1;
            vec3 col  = vec3(0.0035, 0.0038, 0.0085);
            vec3 lapis = vec3(0.10, 0.12, 0.48);
            vec3 teal  = vec3(0.02, 0.22, 0.22);
            vec3 amber = vec3(0.42, 0.22, 0.06);
            vec3 plum  = vec3(0.22, 0.07, 0.20);
            col += lapis * pow(blob(uv, vec2(1.05 + sin(t)*0.12, 0.62 + cos(t*1.3)*0.08), 0.45), 1.6) * 0.55;
            col += teal  * pow(blob(uv, vec2(0.45 + cos(t*0.8)*0.15, 0.30 + sin(t)*0.10), 0.40), 1.6) * 0.45;
            col += amber * pow(blob(uv, vec2(1.22 + sin(t*1.1)*0.08, 0.24 + cos(t*0.7)*0.06), 0.32), 1.8) * 0.55;
            col += plum  * pow(blob(uv, vec2(0.25 + sin(t*0.6)*0.10, 0.85), 0.35), 1.6) * 0.25;
            gl_FragColor = vec4(col, 1.0);
          }
        `}
      />
    </mesh>
  );
}

/** Additive twinkling particles — the fairy dust (now partly gold, like lantern light). */
function FairyDust({ count, radius, size, colors, speed = 0.3, center = [0, 0, 0] as [number, number, number] }: {
  count: number; radius: [number, number, number]; size: number; colors: string[]; speed?: number; center?: [number, number, number];
}) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const geo = useMemo(() => {
    const rnd = seeded(count * 31 + Math.round(size * 10));
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rnd() - 0.5) * radius[0];
      pos[i * 3 + 1] = (rnd() - 0.5) * radius[1];
      pos[i * 3 + 2] = (rnd() - 0.5) * radius[2];
      c.set(colors[i % colors.length]);
      col.set([c.r, c.g, c.b], i * 3);
      seed[i] = rnd() * 100;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    return g;
  }, [count, radius, size, colors]);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uSize: { value: size }, uSpeed: { value: speed } }), [size, speed]);
  useFrame((state) => {
    if (mat.current) mat.current.uniforms.uTime.value = state.clock.elapsedTime;
  });
  return (
    <points geometry={geo} position={center}>
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors
        vertexShader={`
          uniform float uTime; uniform float uSize; uniform float uSpeed;
          attribute float aSeed; varying vec3 vColor; varying float vTw;
          void main(){
            vec3 p = position;
            p.y += sin(uTime * uSpeed + aSeed) * 0.15;
            p.x += cos(uTime * uSpeed * 0.7 + aSeed * 1.3) * 0.1;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            vTw = 0.45 + 0.55 * pow(0.5 + 0.5 * sin(uTime * 2.2 + aSeed * 7.0), 3.0);
            vColor = color;
            gl_PointSize = uSize * (0.6 + vTw) * (10.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }`}
        fragmentShader={`
          varying vec3 vColor; varying float vTw;
          void main(){
            float d = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.0, d);
            a = pow(a, 2.2);
            gl_FragColor = vec4(vColor * a * vTw * 1.5, a);
          }`}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* the specimen                                                        */
/* ------------------------------------------------------------------ */

type Point = {
  geo: THREE.BufferGeometry;
  pos: [number, number, number];
  rot: [number, number, number];
  tint: string;
  atten: string;
  rough: number;
  milky: boolean;
};

const SATELLITE_TINTS: Array<[string, string]> = [
  ['#ffffff', '#f3efe8'], // clear
  ['#f4eee6', '#d8c3a5'], // light smoky / citrine
  ['#f6f0ff', '#cdb8f2'], // pale amethyst
  ['#ffffff', '#eaf2f4'], // clear
  ['#f6f0ff', '#c4adf0'],
  ['#f4eee6', '#e3cfae'],
  ['#ffffff', '#f1ece4'],
];

const ROCK_POS = new THREE.Vector3(0, -1.15, 0);
const ROCK_SCALE = new THREE.Vector3(0.95, 0.42, 0.85);

function CrystalCluster({ quality, scrollRef }: { quality: number; scrollRef: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);

  const maps = useMemo(() => makeStriationMaps(), []);
  const veilTex = useMemo(() => makeVeilTexture(), []);
  const rock = useMemo(() => makeRock(5), []);

  const mainGeo = useMemo(() => makeQuartz(3, 0.5, 2.3, 0.75), []);

  const veils = useMemo(() => {
    const rnd = seeded(41);
    return Array.from({ length: 4 }, () => ({
      pos: [(rnd() - 0.5) * 0.35, 0.4 + rnd() * 1.6, (rnd() - 0.5) * 0.35] as [number, number, number],
      rot: [rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI] as [number, number, number],
      s: 0.35 + rnd() * 0.45,
      o: 0.25 + rnd() * 0.3,
    }));
  }, []);

  const points = useMemo<Point[]>(() => {
    const rnd = seeded(7);
    const list: Point[] = [];
    const n = 7;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rnd() * 0.5;
      const r = 0.35 + rnd() * 0.45;
      const tilt = 0.35 + rnd() * 0.5;
      const h = 0.7 + rnd() * 1.0;
      const [tint, atten] = SATELLITE_TINTS[i % SATELLITE_TINTS.length];
      list.push({
        geo: makeQuartz(100 + i, 0.13 + rnd() * 0.1, h, 0.25 + rnd() * 0.2),
        pos: [Math.cos(a) * r, -0.85, Math.sin(a) * r * 0.8],
        rot: [Math.sin(a) * tilt, rnd() * Math.PI, -Math.cos(a) * tilt],
        tint,
        atten,
        rough: i % 2 === 0 ? 0.32 + rnd() * 0.15 : 0.05 + rnd() * 0.06,
        milky: i % 2 === 0,
      });
    }
    return list;
  }, []);

  // druzy: tiny crystal points sparkling over the matrix
  const druzy = useMemo(() => {
    const count = quality > 0.6 ? 220 : 90;
    const rnd = seeded(77);
    const geo = new THREE.ConeGeometry(0.022, 0.065, 6);
    geo.translate(0, 0.022, 0);
    const mats: THREE.Matrix4[] = [];
    const up = new THREE.Vector3(0, 1, 0);
    const o = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const dir = new THREE.Vector3((rnd() * 2 - 1) * 0.8, 0.55 + rnd() * 0.6, (rnd() * 2 - 1) * 0.8).normalize();
      const p = dir.clone().multiplyScalar(rock.surface(dir) * 0.97).multiply(ROCK_SCALE).add(ROCK_POS);
      const nrm = dir.clone().divide(ROCK_SCALE).normalize();
      o.position.copy(p);
      o.quaternion.setFromUnitVectors(up, nrm.lerp(up, 0.3).normalize());
      o.rotateY(rnd() * Math.PI);
      o.scale.setScalar(0.4 + rnd() * 0.9);
      o.updateMatrix();
      mats.push(o.matrix.clone());
    }
    return { geo, mats };
  }, [quality, rock]);

  const druzyRef = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    if (!druzyRef.current) return;
    druzy.mats.forEach((m, i) => druzyRef.current!.setMatrixAt(i, m));
    druzyRef.current.instanceMatrix.needsUpdate = true;
  }, [druzy]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const p = scrollRef.current;
    if (group.current) {
      const wide = state.viewport.aspect > 1;
      const startX = wide ? 1.35 : 0;
      const endX = wide ? 2.1 : 1.25;
      const targetX = THREE.MathUtils.lerp(startX, endX, Math.min(p * 2.2, 1));
      const baseY = wide ? 0.2 : 0.55;
      const sc = wide ? 0.6 : p > 0.4 ? 0.4 : 0.48;
      group.current.scale.setScalar(THREE.MathUtils.damp(group.current.scale.x, sc, 4, delta));
      const targetY = state.pointer.x * 0.35 + t * 0.1 + p * Math.PI * 1.4;
      group.current.position.x = THREE.MathUtils.damp(group.current.position.x, targetX, 3, delta);
      group.current.position.y = THREE.MathUtils.damp(group.current.position.y, baseY - p * 0.5, 3, delta);
      group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, targetY, 4, delta);
      group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, -state.pointer.y * 0.15 + 0.12, 4, delta);
    }
  });

  return (
    <group ref={group} position={[1.35, 0.25, 0]} scale={0.6}>
      <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.45}>
        {/* matrix rock */}
        <mesh geometry={rock.geo} position={ROCK_POS} scale={ROCK_SCALE}>
          <meshStandardMaterial vertexColors roughness={1} metalness={0} envMapIntensity={0.25}/>
        </mesh>
        <instancedMesh ref={druzyRef} args={[druzy.geo, undefined, druzy.mats.length]}>
          <meshPhysicalMaterial
            color="#f7f1e8"
            roughness={0.12}
            transmission={0.7}
            thickness={0.15}
            ior={1.544}
            clearcoat={1}
            envMapIntensity={2.2}
            flatShading
          />
        </instancedMesh>

        {/* main quartz point, slightly leaning like a real specimen */}
        <group position={[0.02, -0.95, 0]} rotation={[0.06, 0.4, -0.08]}>
          <mesh geometry={mainGeo}>
            <MeshTransmissionMaterial
              backside
              backsideThickness={0.35}
              samples={quality > 0.6 ? 8 : 4}
              resolution={quality > 0.6 ? 768 : 384}
              thickness={0.9}
              roughness={0.02}
              roughnessMap={maps.rough}
              bumpMap={maps.bump}
              bumpScale={0.25}
              ior={1.544}
              chromaticAberration={0.12}
              anisotropicBlur={0.08}
              distortion={0.04}
              distortionScale={0.3}
              temporalDistortion={0}
              iridescence={0.12}
              iridescenceIOR={1.3}
              clearcoat={0.6}
              clearcoatRoughness={0.05}
              specularIntensity={1}
              attenuationDistance={1.6}
              attenuationColor="#e6d9f7"
              color="#fbf8ff"
              envMapIntensity={1.3}
            />
          </mesh>

          {/* veils / healed fractures */}
          {veils.map((v, i) => (
            <mesh key={i} position={v.pos} rotation={v.rot} scale={v.s}>
              <planeGeometry args={[1, 1]} />
              <meshBasicMaterial map={veilTex} transparent opacity={v.o} depthWrite={false} side={THREE.DoubleSide} />
            </mesh>
          ))}

          {/* the fairy light: tiny sparks sleeping inside the stone */}
          <FairyDust count={22} radius={[0.45, 1.8, 0.45]} size={2.2} colors={['#ffffff', '#ffe7b8', '#e6dcff']} speed={0.5} center={[0, 1.2, 0]} />
        </group>

        {/* satellite points */}
        {points.map((s, i) => (
          <group key={i} position={s.pos} rotation={s.rot}>
            <mesh geometry={s.geo}>
              <meshPhysicalMaterial
                color={s.tint}
                transmission={s.milky ? 0.55 : 1}
                thickness={0.35}
                roughness={s.rough}
                roughnessMap={maps.rough}
                bumpMap={maps.bump}
                bumpScale={0.2}
                ior={1.544}
                dispersion={0.4}
                attenuationColor={s.atten}
                attenuationDistance={1.6}
                clearcoat={0.5}
                specularIntensity={1}
                envMapIntensity={1.8}
              />
            </mesh>
          </group>
        ))}

        <FairyDust count={quality > 0.6 ? 100 : 45} radius={[6, 5, 5]} size={3.6} colors={['#f1e6c8', '#e8dcff', '#d9b77a', '#ffffff']} />
      </Float>
    </group>
  );
}

export default function CrystalScene() {
  const scrollRef = useRef(0);
  const [quality, setQuality] = useState(1);
  const [dpr, setDpr] = useState(1.5);

  useEffect(() => {
    const onScroll = () => {
      scrollRef.current = window.scrollY / Math.max(window.innerHeight * 1.2, 1);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    if (window.matchMedia('(max-width: 768px)').matches) {
      setQuality(0.5);
      setDpr(1.25);
    }
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <Canvas
      dpr={dpr}
      camera={{ position: [0, 0.2, 6], fov: 38 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      aria-hidden
    >
      <PerformanceMonitor
        onDecline={() => {
          setQuality(0.5);
          setDpr(1);
        }}
      />
      <color attach="background" args={['#0a0b14']} />
      <Backdrop />
      <ambientLight intensity={0.2} />
      <directionalLight position={[3, 4, 2]} intensity={1.6} color="#fff4e2" />
      <directionalLight position={[-4, 0.5, -3]} intensity={0.9} color="#e0a85c" />
      <directionalLight position={[-2, -2, 3]} intensity={0.35} color="#8fa6ff" />

      <CrystalCluster quality={quality} scrollRef={scrollRef} />

      {/* studio environment: warm lantern key, gold rim, lapis fill — no external HDR */}
      <Environment resolution={256} frames={1}>
        <color attach="background" args={['#1b1814']} />
        <Lightformer form="rect" intensity={0.9} color="#ffffff" position={[0, 0, -6]} scale={[12, 8, 1]} />
        <Lightformer form="rect" intensity={5} color="#fff6e8" position={[0, 5, -2]} scale={[7, 1, 1]} />
        <Lightformer form="rect" intensity={2.2} color="#ffffff" position={[2, 1, 5]} scale={[1.2, 5, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#ffffff" position={[-2.5, 0, 5]} scale={[0.5, 4, 1]} />
        <Lightformer form="rect" intensity={3} color="#e2a65a" position={[-5, 0.5, 0]} rotation-y={Math.PI / 2} scale={[6, 2.5, 1]} />
        <Lightformer form="rect" intensity={1.6} color="#5c78d6" position={[5, 0, 0]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} />
        <Lightformer form="circle" intensity={1.2} color="#ffe2b0" position={[0, -4, 2]} scale={2} />
      </Environment>

      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur luminanceThreshold={1} intensity={quality > 0.6 ? 0.7 : 0.55} radius={0.7} />
        <Vignette eskil={false} offset={0.2} darkness={0.7} />
      </EffectComposer>
    </Canvas>
  );
}
