import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import type * as THREE from "three";
import { X } from "lucide-react";
import { OrnamentModel, type OrnamentLook } from "@/scene/Ornaments";
import { MAX_MESSAGE_LENGTH, type Finish, type HeightZone, type NewMessage, type OrnamentType, type Sticker, validateMessage } from "@/lib/messages";

const TYPES: { v: OrnamentType; label: string }[] = [
  { v: "card", label: "Cartão" },
  { v: "bauble", label: "Bola" },
  { v: "mini_gift", label: "Presentinho" },
];
const COLORS = ["#a3201d", "#c9a14a", "#1f5a3d", "#24476b", "#e9dcc3", "#8a2332", "#5b3a6b", "#d9776a"];
const SECONDARY = ["#d3a94e", "#f5ecd8", "#c4161c", "#2f6b3a", "#c0c6cf", "#1a1a1a"];
const FINISHES: { v: Finish; label: string }[] = [
  { v: "glossy", label: "Brilhante" },
  { v: "matte", label: "Fosco" },
  { v: "metallic", label: "Metálico" },
];
const STICKERS: { v: Sticker; label: string }[] = [
  { v: "none", label: "Nenhum" },
  { v: "star", label: "Estrela" },
  { v: "snowflake", label: "Floco" },
  { v: "heart", label: "Coração" },
  { v: "holly", label: "Azevinho" },
];
const ZONES: { v: HeightZone; label: string }[] = [
  { v: "top", label: "Topo" },
  { v: "middle", label: "Meio" },
  { v: "bottom", label: "Base" },
];

function Spin({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.8;
  });
  return <group ref={ref}>{children}</group>;
}

function Preview({ look }: { look: OrnamentLook }) {
  return (
    <div className="h-40 w-full overflow-hidden rounded-xl bg-pine">
      <Canvas camera={{ position: [0, 0, 0.75], fov: 35 }} dpr={[1, 2]}>
        <ambientLight intensity={0.6} />
        <pointLight position={[1, 1, 1.5]} intensity={6} color="#ffd9a8" />
        <Environment resolution={32} frames={1}>
          <Lightformer intensity={2} color="#ffe2b8" position={[0, 2, 2]} scale={[3, 3, 1]} />
          <Lightformer intensity={1} color="#9fb8e8" position={[-2, 0, 1]} scale={[2, 2, 1]} />
        </Environment>
        <group position-y={0.12}>
          <Spin><OrnamentModel look={look} /></Spin>
        </group>
      </Canvas>
    </div>
  );
}

function AngleDial({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const ref = useRef<SVGSVGElement>(null);
  const set = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    // top of dial = front of tree (0°), clockwise
    let deg = (Math.atan2(x, y) * 180) / Math.PI;
    deg = (deg + 360) % 360;
    onChange(Math.round(deg) % 360);
  };
  const a = (value * Math.PI) / 180;
  return (
    <svg
      ref={ref}
      viewBox="-50 -50 100 100"
      className="h-28 w-28 cursor-pointer touch-none select-none"
      onPointerDown={(e) => { (e.target as Element).setPointerCapture?.(e.pointerId); set(e); }}
      onPointerMove={(e) => e.buttons && set(e)}
      role="slider"
      aria-label="Posição ao redor da árvore"
      aria-valuenow={value}
    >
      <circle r="44" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="6" />
      <path d="M0,-22 L16,16 L-16,16 Z" fill="var(--pine)" opacity="0.85" />
      <circle cx={Math.sin(a) * 44} cy={Math.cos(a) * 44} r="8" fill="var(--primary)" stroke="var(--paper)" strokeWidth="2" />
      <text y="42" textAnchor="middle" fontSize="8" fill="currentColor" opacity="0.6">frente</text>
    </svg>
  );
}

export interface Draft extends OrnamentLook {
  message: string;
  tree_height_zone: HeightZone;
  tree_angular_position: number;
}

export const DEFAULT_DRAFT: Draft = {
  message: "",
  ornament_type: "bauble",
  ornament_color: COLORS[0]!,
  secondary_color: SECONDARY[0]!,
  ornament_finish: "glossy",
  sticker: "none",
  tree_height_zone: "middle",
  tree_angular_position: 0,
};

export function Composer({ draft, setDraft, onClose, onPublish }: { draft: Draft; setDraft: (d: Draft) => void; onClose: () => void; onPublish: (m: NewMessage) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const upd = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft({ ...draft, [k]: v });

  const submit = async () => {
    const err = validateMessage(draft.message);
    if (err) return setError(err);
    setError(null);
    setBusy(true);
    try {
      await onPublish({ ...draft });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível publicar agora. Tente de novo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside className="paper-panel animate-rise pointer-events-auto absolute inset-x-0 bottom-0 max-h-[78vh] overflow-y-auto rounded-t-3xl p-5 md:inset-x-auto md:bottom-auto md:right-4 md:top-4 md:max-h-[calc(100vh-2rem)] md:w-[380px] md:rounded-3xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-3xl font-semibold">Seu bilhete</h2>
        <button onClick={onClose} aria-label="Fechar" className="rounded-full p-2 hover:bg-muted"><X className="h-5 w-5" /></button>
      </div>

      <Preview look={draft} />

      <label className="mt-4 block text-sm font-semibold">Mensagem</label>
      <textarea
        value={draft.message}
        onChange={(e) => upd("message", e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
        rows={4}
        placeholder="Um desejo, um carinho, uma lembrança de Natal..."
        className="mt-1 w-full resize-none rounded-xl border border-input bg-card p-3 text-base outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="text-right text-xs text-muted-foreground">{draft.message.length}/{MAX_MESSAGE_LENGTH}</div>

      <Section title="Enfeite">
        {TYPES.map((t) => <Chip key={t.v} on={draft.ornament_type === t.v} onClick={() => upd("ornament_type", t.v)}>{t.label}</Chip>)}
      </Section>
      <Section title="Cor principal">
        {COLORS.map((c) => <Swatch key={c} c={c} on={draft.ornament_color === c} onClick={() => upd("ornament_color", c)} />)}
      </Section>
      <Section title={draft.ornament_type === "bauble" ? "Cor dos detalhes" : "Cor da fita e detalhes"}>
        {SECONDARY.map((c) => <Swatch key={c} c={c} on={draft.secondary_color === c} onClick={() => upd("secondary_color", c)} />)}
      </Section>
      <Section title="Acabamento">
        {FINISHES.map((f) => <Chip key={f.v} on={draft.ornament_finish === f.v} onClick={() => upd("ornament_finish", f.v)}>{f.label}</Chip>)}
      </Section>
      <Section title="Adesivo">
        {STICKERS.map((s) => <Chip key={s.v} on={draft.sticker === s.v} onClick={() => upd("sticker", s.v)}>{s.label}</Chip>)}
      </Section>
      <Section title="Altura na árvore">
        {ZONES.map((z) => <Chip key={z.v} on={draft.tree_height_zone === z.v} onClick={() => upd("tree_height_zone", z.v)}>{z.label}</Chip>)}
      </Section>
      <div className="mt-4 flex items-center gap-4">
        <AngleDial value={draft.tree_angular_position} onChange={(v) => upd("tree_angular_position", v)} />
        <p className="text-sm text-muted-foreground">Arraste o ponto para escolher o lado da árvore. A prévia brilha no lugar escolhido.</p>
      </div>

      {error && <p className="mt-3 rounded-lg bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}
      <button className="btn-festive mt-4 w-full" onClick={submit} disabled={busy}>
        {busy ? "Pendurando..." : "Publicar bilhete"}
      </button>
      <p className="mt-2 text-center text-xs text-muted-foreground">Anônimo. Fica na árvore por uma hora.</p>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <div className="mb-2 text-sm font-semibold">{title}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" className="chip" data-active={on} onClick={onClick}>{children}</button>;
}
function Swatch({ c, on, onClick }: { c: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Cor ${c}`}
      className={`h-8 w-8 rounded-full border-2 transition-transform ${on ? "scale-110 border-ink" : "border-border"}`}
      style={{ background: c }}
    />
  );
}
