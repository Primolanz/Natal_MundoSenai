import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import logoAsset from "@/assets/senai_logo.webp.asset.json";

let cached: THREE.Texture | null = null;

/** SENAI logo texture, loaded once without suspending the scene. */
export function useSenaiLogo() {
  const [tex, setTex] = useState<THREE.Texture | null>(cached);
  useEffect(() => {
    if (cached) return;
    new THREE.TextureLoader().load(logoAsset.url, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      cached = t;
      setTex(t);
    });
  }, []);
  return tex;
}

/** Round SENAI medallion stuck on the front and back of the tree star. */
export function StarSenaiBadge() {
  const logo = useSenaiLogo();
  if (!logo) return null;
  return (
    <group>
      {[0.075, -0.075].map((z) => (
        <group key={z} position={[0, 0, z]} rotation-y={z < 0 ? Math.PI : 0}>
          <mesh>
            <circleGeometry args={[0.135, 40]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
          <mesh position={[0, 0, 0.003]}>
            <planeGeometry args={[0.23, 0.059]} />
            <meshBasicMaterial map={logo} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Compact framed SENAI sign for the room wall, facing the room interior. */
export function SenaiWallBadge({ position, rotationY }: { position: [number, number, number]; rotationY: number }) {
  const logo = useSenaiLogo();
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh castShadow>
        <boxGeometry args={[1.35, 0.82, 0.1]} />
        <meshStandardMaterial color="#9a6b32" metalness={0.62} roughness={0.34} />
      </mesh>
      <mesh position-z={0.055}>
        <planeGeometry args={[1.22, 0.69]} />
        <meshStandardMaterial color="#f5eddc" roughness={0.85} />
      </mesh>
      {logo && (
        <mesh position={[0, 0, 0.061]}>
          <planeGeometry args={[0.94, 0.24]} />
          <meshBasicMaterial map={logo} toneMapped={false} />
        </mesh>
      )}
      <mesh position={[0, -0.23, 0.062]}>
        <boxGeometry args={[0.48, 0.018, 0.012]} />
        <meshStandardMaterial color="#a3201d" metalness={0.35} roughness={0.4} />
      </mesh>
    </group>
  );
}

/** Static, softly rounded Santa assembled from lightweight procedural meshes. */
export function Santa({ position = [5.55, 0, -6.25] }: { position?: [number, number, number] }) {
  return (
    <group position={position} scale={1.08}>
      {/* Rounded boots and legs; the soles sit directly on the floor. */}
      <mesh position={[-0.13, 0.105, 0.09]} scale={[1, 0.62, 1.35]} castShadow><sphereGeometry args={[0.16, 24, 18]} /><meshStandardMaterial color="#28201d" roughness={0.54} /></mesh>
      <mesh position={[0.13, 0.105, 0.09]} scale={[1, 0.62, 1.35]} castShadow><sphereGeometry args={[0.16, 24, 18]} /><meshStandardMaterial color="#28201d" roughness={0.54} /></mesh>
      <mesh position={[-0.13, 0.41, 0]} castShadow><capsuleGeometry args={[0.125, 0.34, 8, 20]} /><meshStandardMaterial color="#941b20" roughness={0.74} /></mesh>
      <mesh position={[0.13, 0.41, 0]} castShadow><capsuleGeometry args={[0.125, 0.34, 8, 20]} /><meshStandardMaterial color="#941b20" roughness={0.74} /></mesh>
      {/* A soft, pear-shaped coat with a fur hem and rounded belt. */}
      <mesh position={[0, 0.98, 0]} scale={[0.39, 0.58, 0.3]} castShadow><sphereGeometry args={[1, 32, 24]} /><meshStandardMaterial color="#bd2026" roughness={0.72} /></mesh>
      <mesh position={[0, 0.67, 0]} rotation-x={Math.PI / 2}><torusGeometry args={[0.28, 0.045, 12, 32]} /><meshStandardMaterial color="#211d1b" roughness={0.56} /></mesh>
      <mesh position={[0, 0.67, 0.29]}><boxGeometry args={[0.14, 0.16, 0.055, 3, 3, 2]} /><meshStandardMaterial color="#d8ad58" metalness={0.55} roughness={0.32} /></mesh>
      <mesh position={[0, 0.43, 0.12]} scale={[0.78, 0.24, 0.36]}><sphereGeometry args={[0.3, 24, 16]} /><meshStandardMaterial color="#f6eee0" roughness={0.96} /></mesh>
      {/* Sleeves, fluffy cuffs and mittens. */}
      <mesh position={[-0.4, 0.94, 0.01]} rotation-z={-0.52} castShadow><capsuleGeometry args={[0.13, 0.4, 8, 20]} /><meshStandardMaterial color="#bd2026" roughness={0.72} /></mesh>
      <mesh position={[0.4, 0.94, 0.01]} rotation-z={0.52} castShadow><capsuleGeometry args={[0.13, 0.4, 8, 20]} /><meshStandardMaterial color="#bd2026" roughness={0.72} /></mesh>
      <mesh position={[-0.54, 0.67, 0.04]} rotation-z={-0.52}><torusGeometry args={[0.105, 0.035, 10, 20]} /><meshStandardMaterial color="#f6eee0" roughness={0.96} /></mesh>
      <mesh position={[0.54, 0.67, 0.04]} rotation-z={0.52}><torusGeometry args={[0.105, 0.035, 10, 20]} /><meshStandardMaterial color="#f6eee0" roughness={0.96} /></mesh>
      <mesh position={[-0.56, 0.52, 0.08]}><sphereGeometry args={[0.12, 24, 18]} /><meshStandardMaterial color="#d19370" roughness={0.82} /></mesh>
      <mesh position={[0.56, 0.52, 0.08]}><sphereGeometry args={[0.12, 24, 18]} /><meshStandardMaterial color="#d19370" roughness={0.82} /></mesh>
      {/* Face framed by a layered beard and soft moustache. */}
      <mesh position={[0, 1.54, 0.015]} scale={[0.28, 0.31, 0.25]} castShadow><sphereGeometry args={[1, 32, 24]} /><meshStandardMaterial color="#d69a73" roughness={0.78} /></mesh>
      <mesh position={[0, 1.36, 0.12]} scale={[0.29, 0.28, 0.22]}><sphereGeometry args={[1, 32, 24]} /><meshStandardMaterial color="#f7f1e7" roughness={0.98} /></mesh>
      <mesh position={[-0.17, 1.37, 0.19]} scale={[0.13, 0.17, 0.14]}><sphereGeometry args={[1, 20, 16]} /><meshStandardMaterial color="#fffaf0" roughness={1} /></mesh>
      <mesh position={[0.17, 1.37, 0.19]} scale={[0.13, 0.17, 0.14]}><sphereGeometry args={[1, 20, 16]} /><meshStandardMaterial color="#fffaf0" roughness={1} /></mesh>
      <mesh position={[-0.08, 1.58, 0.245]}><sphereGeometry args={[0.027, 16, 12]} /><meshBasicMaterial color="#281c19" /></mesh>
      <mesh position={[0.08, 1.58, 0.245]}><sphereGeometry args={[0.027, 16, 12]} /><meshBasicMaterial color="#281c19" /></mesh>
      <mesh position={[0, 1.49, 0.28]}><sphereGeometry args={[0.06, 20, 16]} /><meshStandardMaterial color="#d78268" roughness={0.7} /></mesh>
      <mesh position={[-0.105, 1.44, 0.285]} rotation-z={-0.16} scale={[1.15, 0.55, 0.7]}><sphereGeometry args={[0.12, 24, 18]} /><meshStandardMaterial color="#fffaf0" roughness={0.98} /></mesh>
      <mesh position={[0.105, 1.44, 0.285]} rotation-z={0.16} scale={[1.15, 0.55, 0.7]}><sphereGeometry args={[0.12, 24, 18]} /><meshStandardMaterial color="#fffaf0" roughness={0.98} /></mesh>
      {/* Curved cap, plush brim and pom-pom. */}
      <mesh position={[0, 1.78, -0.015]} rotation-z={-0.14} castShadow><coneGeometry args={[0.25, 0.46, 24, 4]} /><meshStandardMaterial color="#b91f25" roughness={0.72} /></mesh>
      <mesh position={[0, 1.65, 0]}><torusGeometry args={[0.22, 0.065, 14, 32]} /><meshStandardMaterial color="#fffaf0" roughness={0.98} /></mesh>
      <mesh position={[-0.06, 2.015, -0.07]}><sphereGeometry args={[0.078, 24, 18]} /><meshStandardMaterial color="#fffaf0" roughness={0.98} /></mesh>
      {/* Rounded gift sack resting behind the shoulder. */}
      <mesh position={[-0.4, 1.26, -0.16]} rotation-z={-0.15} scale={[1, 1.15, 0.9]} castShadow><sphereGeometry args={[0.3, 24, 18]} /><meshStandardMaterial color="#31583e" roughness={0.9} /></mesh>
      <mesh position={[-0.4, 1.53, -0.15]}><torusGeometry args={[0.13, 0.035, 10, 24]} /><meshStandardMaterial color="#d0a14b" metalness={0.4} roughness={0.44} /></mesh>
    </group>
  );
}

const RED = "#d01818";
const WHITE = "#f3f3f3";
const SKIN = "#c98d63";
const PANTS = "#2c3550";
const HAIR = "#2a1a10";

function Part({ p, s, c, rot, round }: { p: [number, number, number]; s: [number, number, number]; c: string; rot?: [number, number, number]; round?: boolean }) {
  return (
    <mesh position={p} rotation={rot ?? [0, 0, 0]} castShadow>
      {round ? <capsuleGeometry args={[s[0], s[1], 4, 10]} /> : <boxGeometry args={s} />}
      <meshStandardMaterial color={c} roughness={0.75} flatShading />
    </mesh>
  );
}

/**
 * Low-poly SENAI student seated in the armchair (local armchair coordinates:
 * seat top ≈ y 0.65, backrest at -z, facing +z). Shirt mirrors the SESI/SENAI
 * uniform: red top half, white bottom half, logo on the chest.
 */
export function SenaiStudent() {
  const logo = useSenaiLogo();
  const head = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (head.current) head.current.rotation.y = Math.sin(clock.elapsedTime * 0.35) * 0.35;
  });
  return (
    <group position={[0, 0.66, -0.05]}>
      {/* hips + thighs */}
      <Part p={[0, 0.08, 0]} s={[0.36, 0.14, 0.24]} c={PANTS} />
      <Part p={[-0.1, 0.09, 0.2]} s={[0.14, 0.13, 0.42]} c={PANTS} />
      <Part p={[0.1, 0.09, 0.2]} s={[0.14, 0.13, 0.42]} c={PANTS} />
      {/* shins + shoes */}
      <Part p={[-0.1, -0.2, 0.4]} s={[0.12, 0.5, 0.12]} c={PANTS} />
      <Part p={[0.1, -0.2, 0.4]} s={[0.12, 0.5, 0.12]} c={PANTS} />
      <Part p={[-0.1, -0.47, 0.45]} s={[0.13, 0.08, 0.24]} c="#f5f5f5" />
      <Part p={[0.1, -0.47, 0.45]} s={[0.13, 0.08, 0.24]} c="#f5f5f5" />
      {/* torso: white lower, red upper */}
      <Part p={[0, 0.27, -0.02]} s={[0.4, 0.24, 0.22]} c={WHITE} rot={[-0.08, 0, 0]} />
      <Part p={[0, 0.5, -0.04]} s={[0.42, 0.24, 0.23]} c={RED} rot={[-0.08, 0, 0]} />
      {logo && (
        <mesh position={[0.1, 0.52, 0.08]} rotation={[-0.08, 0, 0]}>
          <planeGeometry args={[0.12, 0.031]} />
          <meshStandardMaterial map={logo} toneMapped={false} />
        </mesh>
      )}
      {/* arms: red sleeves, forearms resting on armrests */}
      <Part p={[-0.27, 0.5, -0.04]} s={[0.12, 0.16, 0.14]} c={RED} />
      <Part p={[0.27, 0.5, -0.04]} s={[0.12, 0.16, 0.14]} c={RED} />
      <Part p={[-0.29, 0.33, 0.0]} s={[0.09, 0.22, 0.1]} c={SKIN} />
      <Part p={[0.29, 0.33, 0.0]} s={[0.09, 0.22, 0.1]} c={SKIN} />
      <Part p={[-0.3, 0.2, 0.14]} s={[0.09, 0.08, 0.26]} c={SKIN} />
      <Part p={[0.3, 0.2, 0.14]} s={[0.09, 0.08, 0.26]} c={SKIN} />
      {/* neck + head */}
      <Part p={[0, 0.66, -0.04]} s={[0.1, 0.08, 0.1]} c={SKIN} />
      <group ref={head} position={[0, 0.8, -0.03]}>
        <Part p={[0, 0, 0]} s={[0.24, 0.26, 0.24]} c={SKIN} />
        <Part p={[0, 0.12, -0.02]} s={[0.26, 0.07, 0.26]} c={HAIR} />
        <Part p={[0, 0.02, -0.11]} s={[0.26, 0.2, 0.05]} c={HAIR} />
        <Part p={[-0.06, 0.02, 0.121]} s={[0.035, 0.035, 0.01]} c="#1a1a1a" />
        <Part p={[0.06, 0.02, 0.121]} s={[0.035, 0.035, 0.01]} c="#1a1a1a" />
        <Part p={[0, -0.07, 0.121]} s={[0.08, 0.02, 0.01]} c="#7a3b2a" />
        {/* Santa hat */}
        <mesh position={[0, 0.25, -0.02]} rotation={[-0.3, 0, 0.15]} castShadow>
          <coneGeometry args={[0.14, 0.3, 8]} />
          <meshStandardMaterial color={RED} roughness={0.8} flatShading />
        </mesh>
        <mesh position={[0, 0.16, -0.02]}>
          <torusGeometry args={[0.13, 0.035, 6, 14]} />
          <meshStandardMaterial color="#ffffff" roughness={1} />
        </mesh>
        <mesh position={[0.06, 0.38, -0.1]}>
          <sphereGeometry args={[0.04, 8, 6]} />
          <meshStandardMaterial color="#ffffff" roughness={1} />
        </mesh>
      </group>
    </group>
  );
}
