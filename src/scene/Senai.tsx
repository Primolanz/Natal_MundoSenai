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
