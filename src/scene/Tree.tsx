import { useLayoutEffect, useMemo, useRef } from "react";
import { StarSenaiBadge } from "./Senai";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { TREE_BASE_Y, TREE_TOP_Y, treeRadiusAt } from "@/lib/messages";

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const UP = new THREE.Vector3(0, 1, 0);

interface Seg { a: THREE.Vector3; b: THREE.Vector3; r: number }
interface Needle { p: THREE.Vector3; d: THREE.Vector3; s: number; c: THREE.Color }

function buildTree(density: number) {
  const rand = rng(1225);
  const segs: Seg[] = [];
  const needles: Needle[] = [];
  const deep = new THREE.Color("#15361f");
  const mid = new THREE.Color("#245a2e");
  const tip = new THREE.Color("#5a9a3c");
  const tmp = new THREE.Vector3();

  const addNeedles = (a: THREE.Vector3, b: THREE.Vector3, count: number, outer: number) => {
    const dir = tmp.copy(b).sub(a).normalize().clone();
    const side = new THREE.Vector3().crossVectors(dir, UP).normalize();
    if (side.lengthSq() < 0.01) side.set(1, 0, 0);
    const up2 = new THREE.Vector3().crossVectors(side, dir).normalize();
    for (let i = 0; i < count; i++) {
      const t = Math.pow(rand(), 0.8);
      const p = a.clone().lerp(b, t);
      const ang = rand() * Math.PI * 2;
      const d = dir.clone().multiplyScalar(0.9 + rand() * 0.6)
        .addScaledVector(side, Math.cos(ang))
        .addScaledVector(up2, Math.sin(ang) * 0.8 + 0.25)
        .normalize();
      const lightness = Math.min(1, t * 0.6 + outer * 0.55 + (rand() - 0.5) * 0.3);
      const c = lightness < 0.5 ? deep.clone().lerp(mid, lightness * 2) : mid.clone().lerp(tip, (lightness - 0.5) * 2);
      c.offsetHSL((rand() - 0.5) * 0.03, (rand() - 0.5) * 0.08, (rand() - 0.5) * 0.04);
      needles.push({ p, d, s: 0.7 + rand() * 0.6 + (1 - t) * 0.15, c });
    }
  };

  const whorls = 26;
  for (let w = 0; w < whorls; w++) {
    const f = w / (whorls - 1);
    const y = TREE_BASE_Y + 0.35 + f * (TREE_TOP_Y - TREE_BASE_Y - 0.55) + (rand() - 0.5) * 0.06;
    const R = treeRadiusAt(y) + 0.12;
    const n = Math.max(4, Math.round(5 + R * 5.5 + rand() * 2));
    const offset = rand() * Math.PI * 2;
    for (let k = 0; k < n; k++) {
      const a = offset + (k / n) * Math.PI * 2 + (rand() - 0.5) * 0.45;
      const len = R * (0.82 + rand() * 0.3);
      const droop = 0.12 + len * 0.18 + rand() * 0.08;
      const start = new THREE.Vector3(0, y + 0.1, 0);
      const midP = new THREE.Vector3(Math.sin(a) * len * 0.55, y - droop * 0.75, Math.cos(a) * len * 0.55);
      const end = new THREE.Vector3(Math.sin(a + (rand() - 0.5) * 0.15) * len, y - droop + 0.07, Math.cos(a) * len);
      const thick = 0.012 + len * 0.012;
      segs.push({ a: start, b: midP, r: thick }, { a: midP, b: end, r: thick * 0.6 });
      addNeedles(start.clone().lerp(midP, 0.25), midP, Math.round(len * 26 * density), 0.15);
      addNeedles(midP, end, Math.round(len * 34 * density), 0.6);
      // side twigs
      const twigs = 2 + Math.round(len * 2.2);
      for (let s = 0; s < twigs; s++) {
        const t = 0.3 + (s / twigs) * 0.65;
        const base = start.clone().lerp(end, t);
        base.y = THREE.MathUtils.lerp(start.y, end.y, t) - Math.sin(t * Math.PI) * droop * 0.25;
        const sideA = a + (s % 2 ? 1 : -1) * (0.5 + rand() * 0.35);
        const tl = len * (0.22 + rand() * 0.16) * (1 - t * 0.4);
        const tEnd = base.clone().add(new THREE.Vector3(Math.sin(sideA) * tl, -0.02 - rand() * 0.05, Math.cos(sideA) * tl));
        segs.push({ a: base, b: tEnd, r: thick * 0.35 });
        addNeedles(base, tEnd, Math.round(tl * 55 * density), 0.45 + t * 0.5);
      }
    }
  }
  // leader at top
  const top = new THREE.Vector3(0, TREE_TOP_Y + 0.05, 0);
  addNeedles(new THREE.Vector3(0, TREE_TOP_Y - 0.5, 0), top, Math.round(60 * density), 0.9);
  return { segs, needles };
}

export function ChristmasTree({ density = 1 }: { density?: number }) {
  const { segs, needles } = useMemo(() => buildTree(density), [density]);
  const needleRef = useRef<THREE.InstancedMesh>(null);
  const branchRef = useRef<THREE.InstancedMesh>(null);

  const needleGeo = useMemo(() => {
    const g = new THREE.ConeGeometry(0.011, 0.15, 3, 1);
    g.translate(0, 0.075, 0);
    return g;
  }, []);
  const branchGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.7, 1, 1, 5, 1);
    g.translate(0, 0.5, 0);
    return g;
  }, []);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    needles.forEach((n, i) => {
      q.setFromUnitVectors(UP, n.d);
      s.set(n.s, n.s, n.s);
      m.compose(n.p, q, s);
      needleRef.current!.setMatrixAt(i, m);
      needleRef.current!.setColorAt(i, n.c);
    });
    needleRef.current!.instanceMatrix.needsUpdate = true;
    if (needleRef.current!.instanceColor) needleRef.current!.instanceColor.needsUpdate = true;
    segs.forEach((g, i) => {
      const d = g.b.clone().sub(g.a);
      const len = d.length();
      q.setFromUnitVectors(UP, d.normalize());
      s.set(g.r, len, g.r);
      m.compose(g.a, q, s);
      branchRef.current!.setMatrixAt(i, m);
    });
    branchRef.current!.instanceMatrix.needsUpdate = true;
  }, [needles, segs]);

  return (
    <group>
      {/* trunk */}
      <mesh position={[0, (TREE_TOP_Y - 0.2) / 2, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.13, TREE_TOP_Y - 0.2, 10]} />
        <meshStandardMaterial color="#3b2416" roughness={0.95} />
      </mesh>
      {/* dark inner core so light doesn't leak through the foliage */}
      <mesh position={[0, (TREE_BASE_Y + TREE_TOP_Y) / 2 + 0.1, 0]}>
        <coneGeometry args={[treeRadiusAt(TREE_BASE_Y) * 0.6, TREE_TOP_Y - TREE_BASE_Y - 0.4, 14, 1, true]} />
        <meshStandardMaterial color="#0c2414" roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <instancedMesh ref={branchRef} args={[branchGeo, undefined, segs.length]} castShadow>
        <meshStandardMaterial color="#4a3020" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={needleRef} args={[needleGeo, undefined, needles.length]} castShadow receiveShadow>
        <meshStandardMaterial roughness={0.62} metalness={0.02} />
      </instancedMesh>
      <TreeLights />
      <Star />
    </group>
  );
}

function TreeLights() {
  const COUNT = 120;
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => {
    const out: { p: THREE.Vector3; phase: number; hue: THREE.Color }[] = [];
    const turns = 6.5;
    for (let i = 0; i < COUNT; i++) {
      const t = i / COUNT;
      const y = TREE_BASE_Y + 0.5 + t * (TREE_TOP_Y - TREE_BASE_Y - 0.9);
      const a = t * turns * Math.PI * 2;
      const r = treeRadiusAt(y) * 0.9 + 0.05;
      out.push({
        p: new THREE.Vector3(Math.sin(a) * r, y - 0.05, Math.cos(a) * r),
        phase: (i * 2.399) % (Math.PI * 2),
        hue: new THREE.Color(i % 3 === 0 ? "#ffb347" : "#ffd27a"),
      });
    }
    return out;
  }, []);
  const c = useMemo(() => new THREE.Color(), []);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    data.forEach((d, i) => {
      m.makeTranslation(d.p.x, d.p.y, d.p.z);
      ref.current!.setMatrixAt(i, m);
      ref.current!.setColorAt(i, d.hue);
    });
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [data]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    data.forEach((d, i) => {
      const k = 1.4 + 1.6 * (0.5 + 0.5 * Math.sin(t * 1.3 + d.phase));
      c.copy(d.hue).multiplyScalar(k);
      ref.current!.setColorAt(i, c);
    });
    ref.current!.instanceColor!.needsUpdate = true;
  });
  return (
    <>
      <instancedMesh ref={ref} args={[undefined, undefined, COUNT]}>
        <sphereGeometry args={[0.032, 10, 8]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <pointLight position={[0, 1.6, 0]} intensity={4} distance={4} color="#ffb060" />
      <pointLight position={[0, 3.4, 0]} intensity={3} distance={3.5} color="#ffc070" />
    </>
  );
}

function Star() {
  const geo = useMemo(() => {
    const shape = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 0.3 : 0.13;
      const a = (i / 10) * Math.PI * 2;
      const x = Math.sin(a) * r, y = Math.cos(a) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 4 });
    g.center();
    return g;
  }, []);
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.4) * 0.25;
  });
  return (
    <group position={[0, TREE_TOP_Y + 0.3, 0]}>
      <mesh ref={ref} geometry={geo}>
        <meshStandardMaterial color="#f4c35a" emissive="#d99a2b" emissiveIntensity={1.4} metalness={0.8} roughness={0.25} toneMapped={false} />
        <StarSenaiBadge />
      </mesh>
      <pointLight intensity={2.5} distance={3} color="#ffd38a" />
    </group>
  );
}
