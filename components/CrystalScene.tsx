'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import {
  Environment,
  Lightformer,
  MeshTransmissionMaterial,
  PerformanceMonitor,
  Float,
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

/** Hexagonal crystal with pointed terminations, built by lathing a profile with 6 segments. */
function makeCrystalGeometry(radius: number, height: number, tip: number, baseTip: number) {
  const pts = [
    new THREE.Vector2(0.0001, -height / 2 - baseTip),
    new THREE.Vector2(radius * 0.92, -height / 2),
    new THREE.Vector2(radius, height * 0.1),
    new THREE.Vector2(radius * 0.94, height / 2),
    new THREE.Vector2(0.0001, height / 2 + tip),
  ];
  const g = new THREE.LatheGeometry(pts, 6).toNonIndexed();
  g.computeVertexNormals();
  return g;
}

type Satellite = {
  h: number;
  pos: [number, number, number];
  rot: [number, number, number];
  scale: number;
  hue: string;
  geo: THREE.BufferGeometry;
};

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}


/** Soft, slowly drifting aurora behind the crystal — gives the glass something to refract. */
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
            float t = uTime * 0.12;
            vec3 base = vec3(0.0035, 0.0038, 0.0085);
            vec3 lav  = vec3(0.16, 0.10, 0.55);
            vec3 aqua = vec3(0.03, 0.26, 0.25);
            vec3 pink = vec3(0.32, 0.08, 0.20);
            vec3 col = base;
            col += lav  * pow(blob(uv, vec2(1.05 + sin(t)*0.12, 0.60 + cos(t*1.3)*0.08), 0.45), 1.6) * 0.55;
            col += aqua * pow(blob(uv, vec2(0.45 + cos(t*0.8)*0.15, 0.30 + sin(t)*0.10), 0.40), 1.6) * 0.45;
            col += pink * pow(blob(uv, vec2(1.25 + sin(t*1.1)*0.10, 0.28 + cos(t*0.7)*0.10), 0.30), 1.6) * 0.45;
            col += lav  * pow(blob(uv, vec2(0.25 + sin(t*0.6)*0.10, 0.85), 0.35), 1.6) * 0.20;
            gl_FragColor = vec4(col, 1.0);
          }
        `}
      />
    </mesh>
  );
}

/** Additive twinkling particles — the fairy dust. */
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
            gl_FragColor = vec4(vColor * a * vTw * 1.6, a);
          }`}
      />
    </points>
  );
}

function CrystalCluster({ quality, scrollRef }: { quality: number; scrollRef: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const coreLight = useRef<THREE.PointLight>(null);

  const mainGeo = useMemo(() => makeCrystalGeometry(0.62, 2.2, 0.9, 0.45), []);

  const satellites = useMemo<Satellite[]>(() => {
    const rnd = seeded(7);
    const hues = ['#c9b8ff', '#9ff5e8', '#ffd0ec', '#b8d8ff', '#e6d6ff', '#a8fff0', '#ffc2e2'];
    const list: Satellite[] = [];
    const n = 7;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rnd() * 0.5;
      const tilt = 0.35 + rnd() * 0.4;
      const r = 0.28 + rnd() * 0.22;
      const h = 0.9 + rnd() * 0.9;
      list.push({
        pos: [Math.cos(a) * r, -1.05 + rnd() * 0.15, Math.sin(a) * r],
        rot: [Math.sin(a) * tilt, 0, -Math.cos(a) * tilt],
        scale: 0.5 + rnd() * 0.35,
        h,
        hue: hues[i % hues.length],
        geo: makeCrystalGeometry(0.22 + rnd() * 0.12, h, 0.35 + rnd() * 0.2, 0.1),
      });
    }
    return list;
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const p = scrollRef.current; // 0..1+ across the page
    if (group.current) {
      const wide = state.viewport.aspect > 1;
      const startX = wide ? 1.35 : 0;
      const endX = wide ? 2.1 : 1.25;
      const targetX = THREE.MathUtils.lerp(startX, endX, Math.min(p * 2.2, 1));
      const baseY = wide ? 0.2 : 0.55;
      const sc = wide ? 0.62 : p > 0.4 ? 0.42 : 0.5;
      group.current.scale.setScalar(THREE.MathUtils.damp(group.current.scale.x, sc, 4, delta));
      const targetY = state.pointer.x * 0.35 + t * 0.12 + p * Math.PI * 1.4;
      group.current.position.x = THREE.MathUtils.damp(group.current.position.x, targetX, 3, delta);
      group.current.position.y = THREE.MathUtils.damp(group.current.position.y, baseY - p * 0.5, 3, delta);
      group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, targetY, 4, delta);
      group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, -state.pointer.y * 0.18 + 0.08, 4, delta);
    }
    // the fairy light breathing inside the crystal
    const pulse = 0.75 + Math.sin(t * 1.6) * 0.18 + Math.sin(t * 4.3) * 0.05;
    if (core.current) core.current.scale.setScalar(0.06 * pulse);
    if (coreLight.current) coreLight.current.intensity = 1.5 * pulse;
  });

  return (
    <group ref={group} position={[1.35, 0.25, 0]} scale={0.62}>
      <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.6}>
        {/* main crystal */}
        <mesh geometry={mainGeo} position={[0, 0.25, 0]}>
          <MeshTransmissionMaterial
            backside
            backsideThickness={0.4}
            samples={quality > 0.6 ? 8 : 4}
            resolution={quality > 0.6 ? 768 : 384}
            thickness={0.8}
            roughness={0.04}
            ior={1.55}
            chromaticAberration={0.9}
            anisotropicBlur={0.2}
            distortion={0.25}
            distortionScale={0.4}
            temporalDistortion={0.08}
            iridescence={1}
            iridescenceIOR={1.4}
            iridescenceThicknessRange={[100, 900]}
            clearcoat={1}
            attenuationDistance={2.2}
            attenuationColor="#efe8ff"
            color="#f3eeff"
          />
        </mesh>

        {/* fairy light: a soft core + dust living inside the crystal */}
        <mesh ref={core} position={[0, 0.2, 0]}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshBasicMaterial color="#e9e0ff" transparent opacity={0.9} />
        </mesh>
        <pointLight ref={coreLight} position={[0, 0.2, 0.6]} color="#cdb9ff" distance={3} />
        <FairyDust count={40} radius={[0.7, 1.9, 0.7]} size={3.2} colors={['#ffffff', '#e6dcff', '#bff8ef']} speed={0.6} center={[0, 0.25, 0]} />

        {/* satellites */}
        {satellites.map((s, i) => (
          <group key={i} position={s.pos} rotation={s.rot} scale={s.scale}>
          <mesh geometry={s.geo} position={[0, s.h / 2, 0]}>
            <meshPhysicalMaterial
              color={s.hue}
              transmission={1}
              thickness={0.6}
              roughness={0.08}
              ior={1.5}
              dispersion={5}
              iridescence={1}
              iridescenceIOR={1.3}
              clearcoat={1}
              envMapIntensity={1.4}
              flatShading
            />
          </mesh>
          </group>
        ))}

        <FairyDust count={quality > 0.6 ? 110 : 50} radius={[6, 5, 5]} size={4} colors={['#e8dcff', '#9ff5e8', '#ffd0ec', '#ffffff']} />
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
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollRef.current = max > 0 ? window.scrollY / Math.max(window.innerHeight * 1.2, 1) : 0;
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
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
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
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 4, 2]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-4, -1, -3]} intensity={0.8} color="#7ff0e0" />

      <CrystalCluster quality={quality} scrollRef={scrollRef} />

      {/* procedural studio environment — no external HDR needed */}
      <Environment resolution={256} frames={1}>
        <color attach="background" args={['#05060d']} />
        <Lightformer form="rect" intensity={4} color="#ffffff" position={[0, 4, -3]} scale={[8, 1.2, 1]} />
        <Lightformer form="rect" intensity={2.5} color="#ffffff" position={[0, 0, 5]} scale={[4, 4, 1]} />
        <Lightformer form="rect" intensity={2.4} color="#b8a6ff" position={[-5, 1, 1]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} />
        <Lightformer form="rect" intensity={2.4} color="#7ff0e0" position={[5, 0, 1]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} />
        <Lightformer form="ring" intensity={2} color="#ffc6e6" position={[0, -3, 4]} scale={3} />
      </Environment>

      {quality > 0.6 ? (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur luminanceThreshold={1} intensity={1.1} radius={0.75} />
          <Vignette eskil={false} offset={0.2} darkness={0.7} />
        </EffectComposer>
      ) : (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur luminanceThreshold={1} intensity={0.9} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
