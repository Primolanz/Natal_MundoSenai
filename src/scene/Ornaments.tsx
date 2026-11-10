import { useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { Finish, OrnamentType, Sticker, TreeMessage } from "@/lib/messages";
import { computeAnchors } from "@/lib/messages";

export interface OrnamentLook {
  ornament_type: OrnamentType;
  ornament_color: string;
  secondary_color: string;
  ornament_finish: Finish;
  sticker: Sticker;
}

function Mat({ color, finish }: { color: string; finish: Finish }) {
  const p =
    finish === "metallic" ? { metalness: 0.9, roughness: 0.22, clearcoat: 0 } :
    finish === "matte" ? { metalness: 0, roughness: 0.85, clearcoat: 0 } :
    { metalness: 0.1, roughness: 0.12, clearcoat: 1 };
  return <meshPhysicalMaterial color={color} {...p} clearcoatRoughness={0.1} />;
}

const starShape = (() => {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.4 : 1;
    const a = (i / 10) * Math.PI * 2;
    i ? s.lineTo(Math.sin(a) * r, Math.cos(a) * r) : s.moveTo(0, r);
  }
  return s;
})();
const heartShape = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, -0.9);
  s.bezierCurveTo(-1.2, 0, -0.9, 1, 0, 0.45);
  s.bezierCurveTo(0.9, 1, 1.2, 0, 0, -0.9);
  return s;
})();
const extr = { depth: 0.25, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 2 };

export function StickerMesh({ kind, color, scale = 0.05 }: { kind: Sticker; color: string; scale?: number }) {
  if (kind === "none") return null;
  const mat = <meshStandardMaterial color={color} metalness={0.4} roughness={0.35} />;
  if (kind === "star" || kind === "heart")
    return (
      <mesh scale={scale}>
        <extrudeGeometry args={[kind === "star" ? starShape : heartShape, extr]} />
        {mat}
      </mesh>
    );
  if (kind === "snowflake")
    return (
      <group scale={scale}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation-z={(i * Math.PI) / 3}>
            <boxGeometry args={[2, 0.22, 0.2]} />
            {mat}
          </mesh>
        ))}
      </group>
    );
  return (
    <group scale={scale}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.55, 0.1, 0]} rotation-z={s * 0.6} scale={[0.75, 0.35, 0.12]}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color="#2f6b3a" roughness={0.5} />
        </mesh>
      ))}
      {([[-0.15, -0.2], [0.15, -0.2], [0, 0.05]] as [number, number][]).map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.15]}>
          <sphereGeometry args={[0.22, 10, 8]} />
          <meshStandardMaterial color="#c4161c" roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

export function OrnamentModel({ look }: { look: OrnamentLook }) {
  const { ornament_type: type, ornament_color: c, secondary_color: c2, ornament_finish: f, sticker } = look;
  if (type === "bauble")
    return (
      <group>
        <mesh castShadow position-y={-0.13}>
          <sphereGeometry args={[0.13, 32, 24]} />
          <Mat color={c} finish={f} />
        </mesh>
        <mesh position-y={-0.13} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.131, 0.008, 8, 48]} />
          <meshStandardMaterial color={c2} metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position-y={0.005}>
          <cylinderGeometry args={[0.03, 0.035, 0.04, 16]} />
          <meshStandardMaterial color="#d3a94e" metalness={0.9} roughness={0.25} />
        </mesh>
        <mesh position-y={0.035}>
          <torusGeometry args={[0.016, 0.004, 6, 16]} />
          <meshStandardMaterial color="#d3a94e" metalness={0.9} roughness={0.25} />
        </mesh>
        <group position={[0, -0.13, 0.135]}>
          <StickerMesh kind={sticker} color={c2} />
        </group>
      </group>
    );
  if (type === "card")
    return (
      <group position-y={-0.14} rotation-x={-0.08}>
        <mesh castShadow>
          <boxGeometry args={[0.28, 0.2, 0.012]} />
          <meshStandardMaterial color={c} roughness={f === "glossy" ? 0.35 : f === "metallic" ? 0.3 : 0.9} metalness={f === "metallic" ? 0.6 : 0} />
        </mesh>
        {([[0, 0.088, 0.25, 0.008], [0, -0.088, 0.25, 0.008], [0.123, 0, 0.008, 0.18], [-0.123, 0, 0.008, 0.18]] as [number, number, number, number][]).map(([x, y, w, h], i) => (
          <mesh key={i} position={[x, y, 0.008]}>
            <boxGeometry args={[w, h, 0.004]} />
            <meshStandardMaterial color={c2} metalness={0.5} roughness={0.3} />
          </mesh>
        ))}
        {[-0.03, -0.05].map((y, i) => (
          <mesh key={i} position={[0.04, y, 0.008]}>
            <boxGeometry args={[0.1 - i * 0.03, 0.006, 0.002]} />
            <meshStandardMaterial color={c2} />
          </mesh>
        ))}
        <group position={[-0.06, 0.02, 0.012]}>
          <StickerMesh kind={sticker === "none" ? "star" : sticker} color={c2} scale={0.035} />
        </group>
        <mesh position={[0, 0.13, 0]} rotation-z={Math.PI / 4}>
          <torusGeometry args={[0.04, 0.003, 6, 4]} />
          <meshStandardMaterial color={c2} />
        </mesh>
      </group>
    );
  return (
    <group position-y={-0.11}>
      <mesh castShadow>
        <boxGeometry args={[0.17, 0.15, 0.17]} />
        <Mat color={c} finish={f === "metallic" ? "metallic" : f} />
      </mesh>
      <mesh><boxGeometry args={[0.035, 0.152, 0.172]} /><meshStandardMaterial color={c2} roughness={0.4} metalness={0.2} /></mesh>
      <mesh><boxGeometry args={[0.172, 0.152, 0.035]} /><meshStandardMaterial color={c2} roughness={0.4} metalness={0.2} /></mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.03, 0.09, 0]} rotation={[0, 0, s * 0.6]} scale={[1, 0.6, 1]}>
          <torusGeometry args={[0.03, 0.01, 8, 16]} />
          <meshStandardMaterial color={c2} roughness={0.4} />
        </mesh>
      ))}
      <mesh position-y={0.11}>
        <cylinderGeometry args={[0.002, 0.002, 0.05]} />
        <meshStandardMaterial color="#c9a14a" />
      </mesh>
      <group position={[0, 0, 0.088]} rotation-z={0.2}>
        <StickerMesh kind={sticker} color="#f5ecd8" scale={0.03} />
      </group>
    </group>
  );
}

function HangingOrnament({ msg, pos, angle, onPick, selected }: { msg: TreeMessage; pos: THREE.Vector3; angle: number; onPick: (m: TreeMessage) => void; selected: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const phase = useMemo(() => Math.random() * 6, []);
  const appear = useRef(0);
  useFrame(({ clock }, dt) => {
    const g = ref.current;
    if (!g) return;
    appear.current = Math.min(1, appear.current + dt * 1.5);
    const t = clock.elapsedTime;
    g.rotation.z = Math.sin(t * 1.1 + phase) * 0.05;
    g.rotation.x = Math.sin(t * 0.8 + phase) * 0.03;
    const target = (selected ? 1.5 + Math.sin(t * 6) * 0.06 : 1) * appear.current;
    const s = THREE.MathUtils.damp(g.scale.x, target, 8, dt);
    g.scale.setScalar(s);
  });
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onPick(msg);
  };
  return (
    <group position={pos} rotation-y={angle}>
      {/* thread to branch */}
      <mesh position-y={0.06}>
        <cylinderGeometry args={[0.0025, 0.0025, 0.12]} />
        <meshStandardMaterial color="#d6c49a" />
      </mesh>
      <group ref={ref} scale={0} onClick={click} onPointerOver={() => (document.body.style.cursor = "pointer")} onPointerOut={() => (document.body.style.cursor = "")}>
        <OrnamentModel look={msg} />
        {/* larger invisible hit area for touch */}
        <mesh position-y={-0.12} visible={false}>
          <sphereGeometry args={[0.2, 8, 6]} />
        </mesh>
      </group>
    </group>
  );
}

export function MessageOrnaments({ messages, onPick, selectedId, ghost }: { messages: TreeMessage[]; onPick: (m: TreeMessage) => void; selectedId?: string | undefined; ghost?: TreeMessage | null | undefined }) {
  const all = ghost ? [...messages, ghost] : messages;
  const anchors = useMemo(() => computeAnchors(all), [all]);
  return (
    <group>
      {all.map((m) => {
        const a = anchors.get(m.id);
        if (!a) return null;
        return (
          <HangingOrnament key={m.id} msg={m} pos={new THREE.Vector3(a.x, a.y, a.z)} angle={a.angle} onPick={m.id === ghost?.id ? () => {} : onPick} selected={m.id === selectedId || m.id === ghost?.id} />
        );
      })}
    </group>
  );
}

const GIFTS = [
  [0.95, 0.2, "#a3201d", "#e9c46a", 0.38], [1.25, 1.4, "#1f5a3d", "#f1e3c6", 0.3], [1.1, 2.6, "#e9dcc3", "#a3201d", 0.42],
  [1.5, 3.4, "#24476b", "#d9b45a", 0.32], [0.9, 4.2, "#c9a14a", "#7d1f1f", 0.28], [1.4, 5.1, "#8a2332", "#f5ecd8", 0.4],
  [1.75, 0.8, "#f0e6d4", "#2f6b3a", 0.26], [1.9, 2.0, "#b5562e", "#f5ecd8", 0.34], [1.8, 3.9, "#2f6b3a", "#c4161c", 0.3],
  [1.7, 5.7, "#5b3a6b", "#e9c46a", 0.27], [2.05, 4.6, "#d9776a", "#ffffff", 0.24],
] as const;

export function FloorGifts() {
  return (
    <group>
      {GIFTS.map(([r, a, c, c2, s], i) => {
        const h = s * (0.75 + (i % 3) * 0.2);
        return (
          <group key={i} position={[Math.sin(a) * r, h / 2 + 0.04, Math.cos(a) * r]} rotation-y={a * 1.7}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[s, h, s * 0.9]} />
              <meshPhysicalMaterial color={c} roughness={0.55} clearcoat={0.3} />
            </mesh>
            <mesh><boxGeometry args={[s * 0.16, h + 0.005, s * 0.9 + 0.005]} /><meshStandardMaterial color={c2} roughness={0.4} metalness={0.2} /></mesh>
            <mesh><boxGeometry args={[s + 0.005, h + 0.005, s * 0.14]} /><meshStandardMaterial color={c2} roughness={0.4} metalness={0.2} /></mesh>
            {[-1, 1].map((k) => (
              <mesh key={k} position={[k * s * 0.13, h / 2 + s * 0.08, 0]} rotation={[Math.PI / 2, k * 0.5, 0]} scale={[1, 1, 0.5]}>
                <torusGeometry args={[s * 0.13, s * 0.04, 8, 20]} />
                <meshStandardMaterial color={c2} roughness={0.4} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}
