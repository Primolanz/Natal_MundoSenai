import { supabase } from "@/lib/supabase";

export type OrnamentType = "card" | "bauble" | "mini_gift";
export type HeightZone = "top" | "middle" | "bottom";
export type Finish = "glossy" | "matte" | "metallic";
export type Sticker = "none" | "star" | "snowflake" | "heart" | "holly";

export interface TreeMessage {
  id: string;
  author?: string;
  created_at?: string;
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
export const ACTIVE_MESSAGE_MS = 40 * 60 * 1000;

const FALLBACKS = {
  ornament_type: "bauble" as OrnamentType,
  ornament_color: "#a3201d",
  secondary_color: "#d3a94e",
  ornament_finish: "glossy" as Finish,
  sticker: "none" as Sticker,
  tree_height_zone: "middle" as HeightZone,
  tree_angular_position: 0,
};

function fromRow(row: Record<string, unknown>): TreeMessage {
  const createdAt = typeof row["created_at"] === "string" ? row["created_at"] : new Date().toISOString();
  return {
    ...FALLBACKS,
    id: String(row["id"]),
    message: String(row["content"] ?? ""),
    author: typeof row["author"] === "string" ? row["author"] : "Anônimo",
    created_at: createdAt,
    expires_at: typeof row["expires_at"] === "string"
      ? row["expires_at"]
      : new Date(new Date(createdAt).getTime() + 40 * 60 * 1000).toISOString(),
    ...((row["shape"] ?? row["ornament_type"]) ? { ornament_type: (row["shape"] ?? row["ornament_type"]) as OrnamentType } : {}),
    ...((row["color"] ?? row["ornament_color"]) ? { ornament_color: String(row["color"] ?? row["ornament_color"]) } : {}),
    ...(row["secondary_color"] ? { secondary_color: String(row["secondary_color"]) } : {}),
    ...((row["finish"] ?? row["ornament_finish"]) ? { ornament_finish: (row["finish"] ?? row["ornament_finish"]) as Finish } : {}),
    ...(row["sticker"] ? { sticker: row["sticker"] as Sticker } : {}),
    ...(row["tree_height_zone"] ? { tree_height_zone: row["tree_height_zone"] as HeightZone } : {}),
    ...(typeof row["tree_angular_position"] === "number" ? { tree_angular_position: row["tree_angular_position"] } : {}),
  };
}

export async function fetchActiveMessages(): Promise<TreeMessage[]> {
  const activeSince = new Date(Date.now() - 40 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .gte("created_at", activeSince)
    .order("created_at", { ascending: true })
    .limit(400);
  if (error) throw error;
  return (data ?? []).map((row) => fromRow(row as Record<string, unknown>));
}

export async function fetchMessageHistory(): Promise<TreeMessage[]> {
  const pageSize = 1000;
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const page = (data ?? []) as Record<string, unknown>[];
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows.map(fromRow);
}

export function validateMessage(text: string): string | null {
  const t = text.trim();
  if (!t) return "Escreva uma mensagem antes de publicar.";
  if (t.length > MAX_MESSAGE_LENGTH) return `A mensagem pode ter até ${MAX_MESSAGE_LENGTH} caracteres.`;
  const normalized = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
  const blockedWords = ["arrombado", "arrombada", "bosta", "buceta", "caralho", "desgracado", "foda-se", "foder", "fodido", "merda", "puta", "puto", "porra", "retardado", "retardada", "viado", "vagabunda", "vagabundo"];
  const hasBlockedWord = blockedWords.some((word) => {
    const normalizedWord = word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return new RegExp(`(^|[^\\p{L}\\p{N}])${normalizedWord}(?=$|[^\\p{L}\\p{N}])`, "u").test(normalized);
  });
  if (hasBlockedWord) return "Por favor, mantenha a mensagem respeitosa para o clima natalino ✨";
  return null;
}

export async function publishMessage(m: NewMessage): Promise<TreeMessage> {
  const err = validateMessage(m.message);
  if (err) throw new Error(err);
  const { data, error } = await supabase
    .from("messages")
    .insert({
      content: m.message.trim(),
      author: m.author ?? "Anônimo",
      shape: m.ornament_type ?? FALLBACKS.ornament_type,
      color: m.ornament_color ?? FALLBACKS.ornament_color,
      secondary_color: m.secondary_color ?? FALLBACKS.secondary_color,
      finish: m.ornament_finish ?? FALLBACKS.ornament_finish,
      sticker: m.sticker ?? FALLBACKS.sticker,
      tree_height_zone: m.tree_height_zone ?? FALLBACKS.tree_height_zone,
      tree_angular_position: m.tree_angular_position ?? FALLBACKS.tree_angular_position,
    })
    .select("*")
    .single();
  if (error) throw error;
  const saved = fromRow(data as Record<string, unknown>);
  return { ...saved, ...m, id: saved.id, author: m.author ?? saved.author ?? "Anônimo", expires_at: saved.expires_at, message: saved.message };
}

export function messageRemainingMs(m: Pick<TreeMessage, "created_at" | "expires_at">, now = Date.now()) {
  const startsAt = m.created_at ? new Date(m.created_at).getTime() : new Date(m.expires_at).getTime() - ACTIVE_MESSAGE_MS;
  return Math.max(0, startsAt + ACTIVE_MESSAGE_MS - now);
}

export function isActive(m: Pick<TreeMessage, "expires_at" | "created_at">, now = Date.now()) {
  return messageRemainingMs(m, now) > 0;
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
