import { describe, it, expect } from "vitest";
import { computeAnchors, isActive, validateMessage, ZONES, VISIBLE_MS } from "./messages";

describe("messages rules", () => {
  it("visible window is one hour", () => {
    expect(VISIBLE_MS).toBe(3600000);
  });
  it("message expired after its expiry time", () => {
    const now = Date.now();
    expect(isActive({ expires_at: new Date(now - 1000).toISOString() }, now)).toBe(false);
    expect(isActive({ expires_at: new Date(now + 1000).toISOString() }, now)).toBe(true);
  });
  it("rejects empty and over-long messages", () => {
    expect(validateMessage("   ")).not.toBeNull();
    expect(validateMessage("a".repeat(501))).not.toBeNull();
    expect(validateMessage("Feliz Natal")).toBeNull();
  });
  it("anchors stay in the chosen height zone and don't overlap", () => {
    const msgs = Array.from({ length: 6 }, (_, i) => ({
      id: `id-${i}`,
      tree_height_zone: "middle" as const,
      tree_angular_position: 90,
    }));
    const a = [...computeAnchors(msgs).values()];
    for (const p of a) {
      expect(p.y).toBeGreaterThanOrEqual(ZONES.middle[0]);
      expect(p.y).toBeLessThanOrEqual(ZONES.middle[1]);
    }
    for (let i = 0; i < a.length; i++)
      for (let j = i + 1; j < a.length; j++) {
        const p = a[i]!, q = a[j]!;
        const d = Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
        expect(d).toBeGreaterThan(0.3);
      }
  });
});
