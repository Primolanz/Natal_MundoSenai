import { supabase } from "@/integrations/supabase/client";

export type OrnamentType = "card" | "bauble" | "mini_gift";
export type HeightZone = "top" | "middle" | "bottom";
export type Finish = "glossy" | "matte" | "metallic";
export type Sticker = "none" | "star" | "snowflake" | "heart" | "holly";

export interface TreeMessage {
  id: string;
  message: string;
  ornament_type: OrnamentType;
  ornament_color: string;
  secondary_color: string;
  ornament_finish: Finish;
  sticker: Sticker;
  tree_height_zone: HeightZone;
  tree_angular_position: number;
  expires_at: string;
}

export type NewMessage = Omit<TreeMessage, "id" | "expires_at">;

export const MAX_MESSAGE_LENGTH = 500;
export const VISIBLE_MS = 60 * 60 * 1000;

const COLUMNS =
  "id,message,ornament_type,ornament_color,secondary_color,ornament_finish,sticker,tree_height_zone,tree_angular_position,expires_at";

export async function fetchActiveMessages(): Promise<TreeMessage[]> {
  const { data, error } = await supabase
    .from("tree_messages")
    .select(COLUMNS)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(400);
  if (error) throw error;
  return (data ?? []) as TreeMessage[];
}

export function validateMessage(text: string): string | null {
  const t = text.trim();
  if (!t) return "Escreva uma mensagem antes de publicar.";
  if (t.length > MAX_MESSAGE_LENGTH) return `A mensagem pode ter até ${MAX_MESSAGE_LENGTH} caracteres.`;
  return null;
}

export async function publishMessage(m: NewMessage): Promise<TreeMessage> {
  const err = validateMessage(m.message);
  if (err) throw new Error(err);
  const id = crypto.randomUUID();
  const row = { ...m, id, message: m.message.trim() };
  const { error } = await supabase.from("tree_messages").insert(row);
  if (error) throw error;
  return { ...row, expires_at: new Date(Date.now() + VISIBLE_MS).toISOString() };
}

export function isActive(m: Pick<TreeMessage, "expires_at">, now = Date.now()) {
  return new Date(m.expires_at).getTime() > now;
}

/* ---------- Tree geometry shared by tree + anchors ---------- */
export const TREE_BASE_Y = 0.55;
export const TREE_TOP_Y = 5.3;
export const TREE_BASE_RADIUS = 2.1;

export function treeRadiusAt(y: number) {
  const t = Math.min(1, Math.max(0, (y - TREE_BASE_Y) / (TREE_TOP_Y - TREE_BASE_Y)));
  return TREE_BASE_RADIUS * Math.pow(1 - t, 0.95);
}

export const ZONES: Record<HeightZone, [number, number]> = {
  top: [3.7, 4.5],
  middle: [2.4, 3.6],
  bottom: [1.1, 2.3],
};

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

export interface Anchor {
  x: number;
  y: number;
  z: number;
  angle: number; // radians
}

/** Converts a zone + angle choice into a point on the tree surface, nudging away from taken spots. */
export function computeAnchors(messages: Pick<TreeMessage, "id" | "tree_height_zone" | "tree_angular_position">[]) {
  const placed: Anchor[] = [];
  const out = new Map<string, Anchor>();
  for (const m of messages) {
    const [lo, hi] = ZONES[m.tree_height_zone];
    const h = hash(m.id);
    let y = lo + (hi - lo) * h;
    let deg = m.tree_angular_position;
    for (let tries = 0; tries < 24; tries++) {
      const a = (deg * Math.PI) / 180;
      const r = treeRadiusAt(y) * 0.92 + 0.08;
      const p = { x: Math.sin(a) * r, y, z: Math.cos(a) * r, angle: a };
      const clash = placed.some((q) => (q.x - p.x) ** 2 + (q.y - p.y) ** 2 + (q.z - p.z) ** 2 < 0.36 * 0.36);
      if (!clash || tries === 23) {
        placed.push(p);
        out.set(m.id, p);
        break;
      }
      deg = (deg + (tries % 2 ? -1 : 1) * (14 + tries * 4) + 360) % 360;
      y = Math.min(hi, Math.max(lo, y + (tries % 3 === 0 ? 0.18 : -0.12)));
    }
  }
  return out;
}

/** Chooses a readable text color for a background hex. */
export function readableOn(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.6 ? "dark" : "light";
}
