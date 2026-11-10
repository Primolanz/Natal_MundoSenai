import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, PerformanceMonitor } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import type { OrbitControls as OC } from "three-stdlib";
import { ChristmasTree } from "./Tree";
import { Room } from "./Room";
import { Exterior } from "./Exterior";
import { FloorGifts, MessageOrnaments } from "./Ornaments";
import type { TreeMessage } from "@/lib/messages";

function Ready({ onReady }: { onReady: () => void }) {
  const done = useRef(false);
  useFrame(() => {
    if (!done.current) {
      done.current = true;
      onReady();
    }
  });
  return null;
}

/** Smoothly resumes auto-rotation after the visitor stops dragging. */
function AutoRotate({ controls }: { controls: React.RefObject<OC | null> }) {
  const idle = useRef(10);
  const speed = useRef(0.35);
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const start = () => (idle.current = 0);
    c.addEventListener("start", start);
    return () => c.removeEventListener("start", start);
  }, [controls]);
  useFrame((_, dt) => {
    const c = controls.current;
    if (!c) return;
    idle.current += dt;
    const target = idle.current > 3 ? 0.35 : 0;
    speed.current = THREE.MathUtils.damp(speed.current, target, 1.2, Math.min(dt, 0.05));
    c.autoRotateSpeed = speed.current;
  });
  return null;
}

export function ChristmasScene({ messages, onPick, selectedId, ghost }: { messages: TreeMessage[]; onPick: (m: TreeMessage) => void; selectedId?: string | undefined; ghost?: TreeMessage | null | undefined }) {
  const [ready, setReady] = useState(false);
  const [low, setLow] = useState(false);
  const [dpr, setDpr] = useState(1.5);
  const controls = useRef<OC | null>(null);
  useEffect(() => {
    if (window.matchMedia("(max-width: 768px)").matches) {
      setLow(true);
      setDpr(1.25);
    }
  }, []);
  return (
    <div className="absolute inset-0" data-scene-ready={ready ? "true" : undefined}>
      <Canvas
        shadows
        dpr={dpr}
        camera={{ position: [0, 3.0, 7.0], fov: 60, near: 0.05, far: 120 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      >
        <PerformanceMonitor onDecline={() => { setDpr(1); setLow(true); }} />
        <color attach="background" args={["#0d1426"]} />
        <ambientLight intensity={0.35} color="#ffe7c4" />
        <directionalLight
          position={[3, 6, 5]}
          intensity={0.9}
          color="#ffe1b5"
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-6}
          shadow-camera-right={6}
          shadow-camera-top={7}
          shadow-camera-bottom={-2}
          shadow-bias={-0.0005}
        />
        <Environment resolution={64} frames={1}>
          <Lightformer intensity={1.2} color="#ffd9a8" position={[0, 6, 0]} scale={[10, 10, 1]} rotation-x={Math.PI / 2} />
          <Lightformer intensity={0.6} color="#9fb8e8" position={[0, 3, -8]} scale={[8, 3, 1]} />
          <Lightformer intensity={0.8} color="#ff9a4a" position={[-8, 1, 1]} rotation-y={Math.PI / 2} scale={[3, 2, 1]} />
        </Environment>
        <Room />
        <Exterior snowCount={low ? 1200 : 2600} />
        <ChristmasTree density={low ? 0.6 : 1} />
        <FloorGifts />
        <Suspense fallback={null}>
          <MessageOrnaments messages={messages} onPick={onPick} selectedId={selectedId} ghost={ghost} />
        </Suspense>
        <OrbitControls
          ref={controls as never}
          makeDefault
          target={[0, 2.8, 0]}
          enableDamping
          dampingFactor={0.06}
          autoRotate
          autoRotateSpeed={0.35}
          enablePan={false}
          minDistance={3.2}
          maxDistance={7.2}
          minPolarAngle={0.75}
          maxPolarAngle={1.62}
          rotateSpeed={0.6}
          zoomSpeed={0.7}
        />
        <AutoRotate controls={controls} />
        <EffectComposer multisampling={low ? 0 : 4}>
          <Bloom intensity={0.75} luminanceThreshold={0.9} luminanceSmoothing={0.2} mipmapBlur />
          <Vignette offset={0.3} darkness={0.55} />
        </EffectComposer>
        <Ready onReady={() => setReady(true)} />
      </Canvas>
    </div>
  );
}
