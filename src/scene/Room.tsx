import { useLayoutEffect, useMemo, useRef } from "react";
import { SenaiStudent } from "./Senai";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { brickTexture, fluffTexture, noiseTexture, paintingTexture, parquetTexture } from "./textures";

export const ROOM = 8;
export const ROOM_H = 6.4;
const WIN_X = [-3.7, 3.7];
const WIN_W = 2.2;
const WIN_Y0 = 1.3;
const WIN_Y1 = 4.3;

type V3 = [number, number, number];
function Box({ p, s, c, r = 0.7, m = 0, map, cast = true, rot }: { p: V3; s: V3; c?: string; r?: number; m?: number; map?: THREE.Texture; cast?: boolean; rot?: V3 }) {
  return (
    <mesh position={p} rotation={rot ?? [0, 0, 0]} castShadow={cast} receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c ?? "#ffffff"} roughness={r} metalness={m} map={map ?? null} />
    </mesh>
  );
}

function useMats() {
  return useMemo(
    () => ({
      floor: parquetTexture(),
      wall: noiseTexture("#efe2c9", 10, 3),
      fabric: noiseTexture("#cfc6b8", 22, 6),
      red: noiseTexture("#a8322d", 22, 4),
      green: noiseTexture("#1f4a33", 18, 4),
      brick: brickTexture(),
      painting: paintingTexture(),
      fluff: fluffTexture(),
    }),
    [],
  );
}

export function Room() {
  const t = useMats();
  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({ map: t.wall, roughness: 0.95 }), [t]);
  const wall = (p: V3, s: V3) => (
    <mesh position={p} material={wallMat} receiveShadow>
      <boxGeometry args={s} />
    </mesh>
  );
  const z = -ROOM - 0.1;
  return (
    <group>
      {/* floor */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[ROOM * 2, ROOM * 2]} />
        <meshStandardMaterial map={t.floor} roughness={0.38} metalness={0.05} />
      </mesh>
      {/* ceiling */}
      <mesh rotation-x={Math.PI / 2} position-y={ROOM_H}>
        <planeGeometry args={[ROOM * 2, ROOM * 2]} />
        <meshStandardMaterial color="#f3ead8" roughness={1} />
      </mesh>
      {/* back wall with two window openings */}
      {wall([-(ROOM + 4.8) / 2 - 0.0, ROOM_H / 2, z], [ROOM - 4.8 + 0.4, ROOM_H, 0.2])}
      {wall([(ROOM + 4.8) / 2, ROOM_H / 2, z], [ROOM - 4.8 + 0.4, ROOM_H, 0.2])}
      {wall([0, ROOM_H / 2, z], [WIN_X[1]! * 2 - WIN_W, ROOM_H, 0.2])}
      {WIN_X.map((x) => (
        <group key={x}>
          {wall([x, WIN_Y0 / 2, z], [WIN_W, WIN_Y0, 0.2])}
          {wall([x, (WIN_Y1 + ROOM_H) / 2, z], [WIN_W, ROOM_H - WIN_Y1, 0.2])}
          <Window x={x} z={z} />
          <Curtains x={x} z={z + 0.3} tex={t.green} />
        </group>
      ))}
      {/* side + front walls */}
      {wall([-ROOM - 0.1, ROOM_H / 2, 0], [0.2, ROOM_H, ROOM * 2])}
      {wall([ROOM + 0.1, ROOM_H / 2, 0], [0.2, ROOM_H, ROOM * 2])}
      {wall([0, ROOM_H / 2, ROOM + 0.1], [ROOM * 2, ROOM_H, 0.2])}
      {/* baseboards + crown */}
      {[
        [[0, 0.09, -ROOM + 0.02], [ROOM * 2, 0.18, 0.04]],
        [[0, 0.09, ROOM - 0.02], [ROOM * 2, 0.18, 0.04]],
        [[-ROOM + 0.02, 0.09, 0], [0.04, 0.18, ROOM * 2]],
        [[ROOM - 0.02, 0.09, 0], [0.04, 0.18, ROOM * 2]],
        [[0, ROOM_H - 0.08, -ROOM + 0.03], [ROOM * 2, 0.16, 0.06]],
        [[0, ROOM_H - 0.08, ROOM - 0.03], [ROOM * 2, 0.16, 0.06]],
        [[-ROOM + 0.03, ROOM_H - 0.08, 0], [0.06, 0.16, ROOM * 2]],
        [[ROOM - 0.03, ROOM_H - 0.08, 0], [0.06, 0.16, ROOM * 2]],
      ].map(([p, s], i) => (
        <Box key={i} p={p as V3} s={s as V3} c="#7a4b2b" r={0.6} cast={false} />
      ))}

      {/* rug */}
      <mesh position-y={0.02} receiveShadow>
        <cylinderGeometry args={[2.7, 2.75, 0.04, 64]} />
        <meshStandardMaterial map={t.fluff} roughness={1} bumpMap={t.fluff} bumpScale={2} />
      </mesh>

      <Fireplace brick={t.brick} />
      <Sofa fabric={t.fabric} red={t.red} />
      <Armchair red={t.red} />
      <FloorLamp p={[-6.9, 0, 5]} />
      <PinkShelf />
      <GeoShelf />
      <SideCabinet />
      <Painting map={t.painting} />
      <Plant p={[-7.2, 0, -7.2]} s={1.2} />
      <Plant p={[7.2, 0, 7.2]} s={1} />
      <Plant p={[-7.2, 0, 7.2]} s={0.9} />
      <StringLights />
    </group>
  );
}

function Window({ x, z }: { x: number; z: number }) {
  const wood = "#6b3f22";
  const h = WIN_Y1 - WIN_Y0;
  const cy = (WIN_Y0 + WIN_Y1) / 2;
  return (
    <group position={[x, cy, z]}>
      <Box p={[0, h / 2, 0]} s={[WIN_W + 0.1, 0.1, 0.3]} c={wood} />
      <Box p={[0, -h / 2, 0.08]} s={[WIN_W + 0.3, 0.1, 0.45]} c={wood} />
      <Box p={[-WIN_W / 2, 0, 0]} s={[0.1, h, 0.3]} c={wood} />
      <Box p={[WIN_W / 2, 0, 0]} s={[0.1, h, 0.3]} c={wood} />
      <Box p={[0, 0, 0]} s={[0.06, h, 0.12]} c={wood} />
      <Box p={[0, h / 6, 0]} s={[WIN_W, 0.05, 0.1]} c={wood} />
      <Box p={[0, -h / 6, 0]} s={[WIN_W, 0.05, 0.1]} c={wood} />
      <mesh>
        <planeGeometry args={[WIN_W, h]} />
        <meshPhysicalMaterial color="#cfe3ff" transparent opacity={0.12} roughness={0.05} metalness={0} />
      </mesh>
    </group>
  );
}

function Curtains({ x, z, tex }: { x: number; z: number; tex: THREE.Texture }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.75, 4.6, 24, 1);
    const pos = g.attributes["position"]!;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 26) * 0.05);
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <group>
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={geo} position={[x + s * (WIN_W / 2 + 0.22), 2.6, z]} castShadow>
          <meshStandardMaterial map={tex} roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
      ))}
      <mesh position={[x, 4.95, z + 0.05]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.03, 0.03, WIN_W + 1.4, 10]} />
        <meshStandardMaterial color="#b88a3e" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Fireplace({ brick }: { brick: THREE.Texture }) {
  const light = useRef<THREE.PointLight>(null);
  const flames = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (light.current) light.current.intensity = 9 + Math.sin(t * 7) * 1.4 + Math.sin(t * 13.3) * 0.9 + Math.sin(t * 3.1) * 1.2;
    flames.current?.children.forEach((f, i) => {
      const k = 1 + Math.sin(t * (6 + i * 1.7) + i) * 0.18 + Math.sin(t * 11 + i * 2) * 0.08;
      f.scale.set(1 - (k - 1) * 0.5, k, 1 - (k - 1) * 0.5);
      f.position.x = Math.sin(t * 3 + i) * 0.03 + (i - 2) * 0.16;
    });
  });
  return (
    <group position={[-ROOM + 0.45, 0, 1.4]} rotation-y={Math.PI / 2}>
      {/* surround */}
      <Box p={[-1.0, 0.75, 0]} s={[0.5, 1.5, 0.7]} c="#ffffff" map={brick} r={0.9} />
      <Box p={[1.0, 0.75, 0]} s={[0.5, 1.5, 0.7]} c="#ffffff" map={brick} r={0.9} />
      <Box p={[0, 1.3, 0]} s={[1.5, 0.4, 0.7]} c="#ffffff" map={brick} r={0.9} />
      <Box p={[0, 1.58, 0.06]} s={[2.8, 0.14, 0.9]} c="#5c341c" r={0.5} />
      <Box p={[0, 0.55, -0.3]} s={[1.5, 1.1, 0.1]} c="#1a120d" r={1} />
      <Box p={[0, 0.04, 0.35]} s={[2.8, 0.08, 0.6]} c="#8d8174" r={0.8} />
      <Box p={[0, 3.7, -0.2]} s={[2.0, 4.2, 0.35]} c="#ffffff" map={brick} r={0.9} />
      {/* logs */}
      {[-0.2, 0.2].map((x, i) => (
        <mesh key={x} position={[x, 0.16, 0]} rotation={[0, i ? 0.4 : -0.4, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.08, 0.09, 0.9, 10]} />
          <meshStandardMaterial color="#4b2c18" roughness={1} />
        </mesh>
      ))}
      <group ref={flames} position={[0, 0.22, 0]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[(i - 2) * 0.16, 0.25, (i % 2) * 0.06]}>
            <coneGeometry args={[0.1 + (i === 2 ? 0.05 : 0), 0.5 + (i === 2 ? 0.25 : (i % 2) * 0.1), 10]} />
            <meshBasicMaterial color={i % 2 ? "#ff8a2a" : "#ffc04a"} transparent opacity={0.85} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        ))}
      </group>
      <pointLight ref={light} position={[0, 0.6, 0.7]} color="#ff9440" distance={9} decay={1.6} castShadow={false} />
      {/* mantel candles */}
      {[-1.1, -0.85, 1.0].map((x, i) => (
        <group key={x} position={[x, 1.65, 0.15]}>
          <mesh position-y={0.1 + i * 0.03}>
            <cylinderGeometry args={[0.05, 0.05, 0.2 + i * 0.06, 12]} />
            <meshStandardMaterial color="#f5ecd8" roughness={0.6} />
          </mesh>
          <mesh position-y={0.24 + i * 0.06}>
            <sphereGeometry args={[0.022, 8, 8]} />
            <meshBasicMaterial color="#ffcf6a" toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Sofa({ fabric, red }: { fabric: THREE.Texture; red: THREE.Texture }) {
  const c = "#d8d0c4";
  return (
    <group position={[ROOM - 1.0, 0, 0.8]} rotation-y={-Math.PI / 2}>
      <Box p={[0, 0.3, 0]} s={[2.4, 0.4, 0.95]} c={c} map={fabric} r={1} />
      <Box p={[0, 0.85, -0.38]} s={[2.4, 0.8, 0.22]} c={c} map={fabric} r={1} />
      <Box p={[-1.2, 0.6, 0]} s={[0.22, 0.6, 0.95]} c={c} map={fabric} r={1} />
      <Box p={[1.2, 0.6, 0]} s={[0.22, 0.6, 0.95]} c={c} map={fabric} r={1} />
      <Box p={[-0.55, 0.58, 0.05]} s={[1.05, 0.16, 0.8]} c={c} map={fabric} r={1} />
      <Box p={[0.55, 0.58, 0.05]} s={[1.05, 0.16, 0.8]} c={c} map={fabric} r={1} />
      <Box p={[-0.8, 0.85, -0.18]} s={[0.45, 0.4, 0.14]} c="#ffffff" map={red} r={1} rot={[-0.2, 0.15, 0]} />
      {([[-1.1, 0.35], [1.1, 0.35], [-1.1, -0.35], [1.1, -0.35]] as [number, number][]).map(([x, z], i) => (
        <Box key={i} p={[x, 0.05, z]} s={[0.06, 0.1, 0.06]} c="#5a3a22" />
      ))}
    </group>
  );
}

function Armchair({ red }: { red: THREE.Texture }) {
  const w = "#d6b48a";
  return (
    <group position={[-5.2, 0, 4.4]} rotation-y={2.3}>
      {([[-0.38, 0.32], [0.38, 0.32], [-0.38, -0.32], [0.38, -0.32]] as [number, number][]).map(([x, z], i) => (
        <Box key={i} p={[x, 0.22, z]} s={[0.07, 0.44, 0.07]} c={w} r={0.55} />
      ))}
      <Box p={[0, 0.46, 0]} s={[0.9, 0.06, 0.8]} c={w} r={0.55} />
      <Box p={[0, 0.58, 0.02]} s={[0.8, 0.14, 0.72]} c="#ffffff" map={red} r={1} />
      <Box p={[0, 0.95, -0.38]} s={[0.9, 0.85, 0.06]} c={w} r={0.55} rot={[-0.12, 0, 0]} />
      <Box p={[0, 0.95, -0.3]} s={[0.7, 0.6, 0.14]} c="#ffffff" map={red} r={1} rot={[-0.12, 0, 0]} />
      <Box p={[-0.45, 0.7, 0]} s={[0.07, 0.06, 0.8]} c={w} />
      <Box p={[0.45, 0.7, 0]} s={[0.07, 0.06, 0.8]} c={w} />
      <SenaiStudent />
    </group>
  );
}

function FloorLamp({ p }: { p: V3 }) {
  return (
    <group position={p}>
      <Box p={[0, 0.03, 0]} s={[0.4, 0.06, 0.4]} c="#7b5232" />
      {[0, 2.09, 4.18].map((a) => (
        <mesh key={a} position={[Math.sin(a) * 0.08, 0.9, Math.cos(a) * 0.08]} rotation={[Math.cos(a) * 0.08, 0, -Math.sin(a) * 0.08]}>
          <cylinderGeometry args={[0.02, 0.025, 1.8, 8]} />
          <meshStandardMaterial color="#9a6a40" roughness={0.6} />
        </mesh>
      ))}
      <mesh position-y={1.95}>
        <cylinderGeometry args={[0.24, 0.36, 0.42, 24, 1, true]} />
        <meshStandardMaterial color="#f2c14e" emissive="#f2a93a" emissiveIntensity={0.9} side={THREE.DoubleSide} roughness={0.9} />
      </mesh>
      <pointLight position-y={1.85} intensity={3.5} distance={5} color="#ffc56b" />
    </group>
  );
}

function Books({ p, w, seed = 1 }: { p: V3; w: number; seed?: number }) {
  const cols = ["#7d2f2a", "#2d4f6b", "#c9a14a", "#3c6b48", "#8a4b6b", "#e6dccb", "#b8562e"];
  const items: React.ReactElement[] = [];
  let x = -w / 2;
  let i = seed;
  while (x < w / 2 - 0.06) {
    const bw = 0.04 + ((i * 37) % 5) * 0.012;
    const bh = 0.22 + ((i * 53) % 6) * 0.025;
    items.push(<Box key={i} p={[x + bw / 2, bh / 2, 0]} s={[bw, bh, 0.2]} c={cols[i % cols.length]!} r={0.8} cast={false} />);
    x += bw + 0.006;
    i++;
  }
  return <group position={p}>{items}</group>;
}

function PinkShelf() {
  const c = "#d9776a";
  return (
    <group position={[0, 0, -ROOM + 0.35]}>
      <Box p={[0, 0.5, 0]} s={[3.2, 1.0, 0.5]} c={c} r={0.6} />
      <Box p={[0, 0.5, 0.26]} s={[3.0, 0.03, 0.02]} c="#b85c50" />
      <Books p={[-0.9, 1.0, 0]} w={1.0} seed={3} />
      <group position={[0.6, 1.0, 0]}>
        <Box p={[0, 0.18, 0]} s={[0.3, 0.36, 0.03]} c="#c9a14a" m={0.6} r={0.3} rot={[-0.15, 0, 0]} />
        <Box p={[0, 0.18, 0.02]} s={[0.22, 0.28, 0.01]} c="#e8d9c0" rot={[-0.15, 0, 0]} />
      </group>
      <mesh position={[1.25, 1.12, 0]} castShadow>
        <sphereGeometry args={[0.12, 20, 16]} />
        <meshStandardMaterial color="#e8e2d6" roughness={0.3} />
      </mesh>
    </group>
  );
}

function GeoShelf() {
  const w = "#a87a4f";
  return (
    <group position={[ROOM - 0.3, 0, -4.8]} rotation-y={-Math.PI / 2}>
      {[0.5, 1.3, 2.1, 2.9].map((y, i) => (
        <group key={y}>
          <Box p={[(i % 2 ? 0.25 : -0.25), y, 0]} s={[1.3, 0.05, 0.4]} c={w} />
          <Books p={[(i % 2 ? 0.0 : -0.6), y + 0.03, 0]} w={0.6} seed={i * 5} />
        </group>
      ))}
      <Box p={[-0.9, 1.5, 0]} s={[0.05, 3.0, 0.4]} c={w} />
      <Box p={[0.9, 1.5, 0]} s={[0.05, 3.0, 0.4]} c={w} />
      <Box p={[0, 1.7, 0]} s={[0.05, 0.8, 0.4]} c={w} />
      <Plant p={[0.5, 2.13, 0]} s={0.35} />
      <Plant p={[-0.5, 3.0, 0]} s={0.3} />
    </group>
  );
}

function SideCabinet() {
  const lamp = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (lamp.current) lamp.current.intensity = 2.4 + Math.sin(clock.elapsedTime * 0.7) * 0.08;
  });
  return (
    <group position={[ROOM - 0.5, 0, 3.0]} rotation-y={-Math.PI / 2}>
      <Box p={[0, 0.35, 0]} s={[0.9, 0.7, 0.5]} c="#8a5a36" r={0.6} />
      <Books p={[0, 0.06, 0.05]} w={0.75} seed={11} />
      <mesh position={[0.2, 0.9, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.4, 16]} />
        <meshStandardMaterial color="#e9dcc3" roughness={0.3} />
      </mesh>
      <mesh position={[0.2, 1.22, 0]}>
        <cylinderGeometry args={[0.14, 0.22, 0.26, 20, 1, true]} />
        <meshStandardMaterial color="#f6e2b0" emissive="#f2b54a" emissiveIntensity={0.9} side={THREE.DoubleSide} />
      </mesh>
      <pointLight ref={lamp} position={[0.2, 1.15, 0.1]} distance={4} color="#ffc56b" />
    </group>
  );
}

function Painting({ map }: { map: THREE.Texture }) {
  return (
    <group position={[ROOM - 0.04, 2.7, 0.8]} rotation-y={-Math.PI / 2}>
      <Box p={[0, 0, 0]} s={[1.3, 1.6, 0.06]} c="#b8893a" m={0.6} r={0.35} />
      <mesh position-z={0.035}>
        <planeGeometry args={[1.1, 1.4]} />
        <meshStandardMaterial map={map} roughness={0.8} />
      </mesh>
    </group>
  );
}

export function Plant({ p, s = 1 }: { p: V3; s?: number }) {
  const leaves = useMemo(
    () => Array.from({ length: 9 }, (_, i) => ({ a: (i / 9) * Math.PI * 2, t: 0.5 + (i % 3) * 0.25 })),
    [],
  );
  return (
    <group position={p} scale={s}>
      <mesh position-y={0.25} castShadow>
        <cylinderGeometry args={[0.22, 0.16, 0.5, 20]} />
        <meshStandardMaterial color="#c9714a" roughness={0.75} />
      </mesh>
      {leaves.map(({ a, t }, i) => (
        <mesh key={i} position={[Math.sin(a) * 0.12, 0.6 + t * 0.3, Math.cos(a) * 0.12]} rotation={[Math.cos(a) * 0.7, a, -Math.sin(a) * 0.1]} scale={[0.12, 0.35 * t + 0.15, 0.04]} castShadow>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color={i % 2 ? "#3e7a45" : "#2f6638"} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function StringLights() {
  const pts = useMemo(() => {
    const out: THREE.Vector3[] = [];
    const y = ROOM_H - 0.35;
    const walls: [THREE.Vector3, THREE.Vector3][] = [
      [new THREE.Vector3(-ROOM + 0.1, y, -ROOM + 0.1), new THREE.Vector3(ROOM - 0.1, y, -ROOM + 0.1)],
      [new THREE.Vector3(ROOM - 0.1, y, -ROOM + 0.1), new THREE.Vector3(ROOM - 0.1, y, ROOM - 0.1)],
      [new THREE.Vector3(ROOM - 0.1, y, ROOM - 0.1), new THREE.Vector3(-ROOM + 0.1, y, ROOM - 0.1)],
      [new THREE.Vector3(-ROOM + 0.1, y, ROOM - 0.1), new THREE.Vector3(-ROOM + 0.1, y, -ROOM + 0.1)],
    ];
    for (const [a, b] of walls) {
      const swags = 4;
      for (let sIdx = 0; sIdx < swags; sIdx++)
        for (let i = 0; i < 9; i++) {
          const t = (sIdx + i / 9) / swags;
          const local = i / 9;
          const p = a.clone().lerp(b, t);
          p.y -= Math.sin(local * Math.PI) * 0.35;
          out.push(p);
        }
    }
    return out;
  }, []);
  const ref = useRef<THREE.InstancedMesh>(null);
  const cols = useMemo(() => ["#ffcf6a", "#ff9a4a", "#ffe6a8", "#ff7a5a"].map((c) => new THREE.Color(c)), []);
  const tmp = useMemo(() => new THREE.Color(), []);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    pts.forEach((p, i) => {
      m.makeTranslation(p.x, p.y, p.z);
      ref.current!.setMatrixAt(i, m);
      ref.current!.setColorAt(i, cols[i % cols.length]!);
    });
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [pts, cols]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    pts.forEach((_, i) => {
      tmp.copy(cols[i % cols.length]!).multiplyScalar(1.3 + 0.9 * (0.5 + 0.5 * Math.sin(t * 0.9 + i * 1.7)));
      ref.current!.setColorAt(i, tmp);
    });
    ref.current!.instanceColor!.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, pts.length]}>
      <sphereGeometry args={[0.045, 8, 6]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}
