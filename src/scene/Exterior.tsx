import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ROOM } from "./Room";

/** Everything here sits behind the back wall (z < -ROOM) and is only visible through the windows. */
export function Exterior({ snowCount = 2500 }: { snowCount?: number }) {
  return (
    <group>
      <Sky />
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.05, -ROOM - 25]}>
        <planeGeometry args={[120, 50]} />
        <meshStandardMaterial color="#e6eefb" roughness={1} />
      </mesh>
      <OutsideTrees />
      <Snow count={snowCount} />
      <Sleigh />
      <hemisphereLight args={["#9fb8e8", "#e6eefb", 0.3]} position={[0, 10, -20]} />
    </group>
  );
}

function Sky() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {},
        vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
        fragmentShader: `varying vec3 vP; void main(){ float h = clamp(normalize(vP).y*1.6+0.2,0.,1.);
          vec3 c = mix(vec3(0.55,0.65,0.85), vec3(0.09,0.14,0.32), h); gl_FragColor = vec4(c,1.); }`,
      }),
    [],
  );
  return (
    <mesh material={mat} position={[0, 0, -ROOM - 10]}>
      <sphereGeometry args={[60, 24, 16]} />
    </mesh>
  );
}

function OutsideTrees() {
  const trees = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        x: -30 + (i * 37) % 60 + Math.sin(i) * 2,
        z: -ROOM - 6 - ((i * 13) % 22),
        s: 1.4 + ((i * 7) % 5) * 0.35,
      })),
    [],
  );
  return (
    <group>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]} scale={t.s}>
          {[0, 1, 2].map((k) => (
            <mesh key={k} position-y={1 + k * 0.8}>
              <coneGeometry args={[1.1 - k * 0.3, 1.4, 8]} />
              <meshStandardMaterial color={k === 2 ? "#e8f0fb" : "#2b4a45"} roughness={1} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Snow({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const { geo, speeds } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = Math.random() * 14;
      pos[i * 3 + 2] = -ROOM - 0.8 - Math.random() * 28;
      sizes[i] = Math.random();
      speeds[i] = 0.4 + Math.random() * 0.9;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { geo, speeds };
  }, [count]);
  useFrame(({ clock }, dt) => {
    const d = Math.min(dt, 0.05);
    const p = geo.attributes["position"] as THREE.BufferAttribute;
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      let y = p.getY(i) - speeds[i]! * d;
      if (y < 0) y = 14;
      p.setY(i, y);
      p.setX(i, p.getX(i) + Math.sin(t * 0.6 + i) * 0.15 * d);
    }
    p.needsUpdate = true;
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color="#ffffff" size={0.09} sizeAttenuation transparent opacity={0.9} depthWrite={false} />
    </points>
  );
}

function Sleigh() {
  const ref = useRef<THREE.Group>(null);
  const PERIOD = 38;
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t = (clock.elapsedTime % PERIOD) / 12; // crosses in 12s, then waits
    g.visible = t < 1;
    g.position.x = -32 + t * 64;
    g.position.y = 8 + Math.sin(t * Math.PI) * 2.5;
    g.rotation.z = Math.cos(t * Math.PI) * 0.08;
  });
  const deer = (x: number) => (
    <group position={[x, 0, 0]} key={x}>
      <mesh scale={[0.45, 0.2, 0.18]}><sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color="#4a2e1f" /></mesh>
      <mesh position={[0.42, 0.22, 0]} scale={[0.14, 0.12, 0.1]}><sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color="#4a2e1f" /></mesh>
      {[-0.25, 0.25].map((lx) => (
        <mesh key={lx} position={[lx, -0.3, 0]} rotation-z={lx * 1.2}><cylinderGeometry args={[0.025, 0.025, 0.35]} /><meshStandardMaterial color="#3a2418" /></mesh>
      ))}
      <mesh position={[0.45, 0.42, 0]} rotation-z={-0.4}><cylinderGeometry args={[0.012, 0.012, 0.25]} /><meshStandardMaterial color="#c9a46a" /></mesh>
    </group>
  );
  return (
    <group ref={ref} position={[-32, 8, -ROOM - 24]} scale={0.9}>
      <mesh position={[-0.6, 0, 0]}>
        <boxGeometry args={[1.0, 0.45, 0.55]} />
        <meshStandardMaterial color="#a3201d" />
      </mesh>
      <mesh position={[-0.4, -0.32, 0]} scale={[1.2, 0.06, 0.5]}><boxGeometry /><meshStandardMaterial color="#d1a24a" metalness={0.6} /></mesh>
      <mesh position={[-0.75, 0.4, 0]}><sphereGeometry args={[0.18, 10, 8]} /><meshStandardMaterial color="#c02a24" /></mesh>
      {[1.0, 1.9, 2.8].map(deer)}
      <mesh position={[3.25, 0.22, 0]}><sphereGeometry args={[0.04, 8, 6]} /><meshBasicMaterial color="#ff4030" toneMapped={false} /></mesh>
    </group>
  );
}
