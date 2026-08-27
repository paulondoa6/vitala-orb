import { describe, expect, it } from "vitest";
import { runScan, DEFAULT_CONFIG, type ScanInput } from "./engine";
import type { Flash, Zone } from "@/core/db";

const NOW = 1_700_000_000_000;
const origin = { lat: 48.8532, lng: 2.3692 };

const flash = (over: Partial<Flash>): Flash => ({
  id: "f1",
  authorId: "a1",
  authorName: "Lina",
  text: "Besoin d'un coup de main",
  category: "aide",
  urgency: "normal",
  zoneId: "zn-1",
  position: origin,
  createdAt: NOW - 60_000,
  expiresAt: NOW + 600_000,
  replies: 0,
  ...over,
});

const zone: Zone = {
  id: "zn-1",
  name: "Bastille",
  city: "Paris",
  description: "",
  center: origin,
  radiusM: 900,
  tags: [],
  opportunities: [],
};

const input = (over: Partial<ScanInput>): ScanInput => ({
  config: DEFAULT_CONFIG,
  origin,
  flashes: [],
  zones: [],
  espaces: [],
  ...over,
});

describe("runScan", () => {
  it("ignores expired and closed flashes", () => {
    const results = runScan(
      input({
        flashes: [
          flash({ id: "expired", expiresAt: NOW - 1 }),
          flash({ id: "closed", closedAt: NOW - 10 }),
        ],
      }),
      NOW,
    );
    expect(results).toHaveLength(0);
  });

  it("marks the top result as 'meilleur'", () => {
    const results = runScan(input({ flashes: [flash({})], zones: [zone] }), NOW);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].bucket).toBe("meilleur");
  });

  it("keeps only urgent flashes in urgence mode", () => {
    const results = runScan(
      input({
        config: { ...DEFAULT_CONFIG, mode: "urgence" },
        flashes: [flash({ id: "a" }), flash({ id: "b", urgency: "urgent" })],
        zones: [zone],
      }),
      NOW,
    );
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("flash-b");
  });

  it("filters by category", () => {
    const results = runScan(
      input({
        config: { ...DEFAULT_CONFIG, categories: ["transport"] },
        flashes: [flash({ id: "a", category: "aide" }), flash({ id: "b", category: "transport" })],
      }),
      NOW,
    );
    expect(results.map((r) => r.id)).toEqual(["flash-b"]);
  });

  it("excludes flashes beyond the radius", () => {
    const results = runScan(
      input({
        config: { ...DEFAULT_CONFIG, radiusM: 300 },
        flashes: [flash({ id: "far", position: { lat: 48.9, lng: 2.5 } })],
      }),
      NOW,
    );
    expect(results).toHaveLength(0);
  });

  it("de-duplicates identical ids and returns radar points inside the circle", () => {
    const results = runScan(input({ flashes: [flash({}), flash({})], zones: [zone] }), NOW);
    const ids = results.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of results) {
      expect(Math.hypot(r.radar.x, r.radar.y)).toBeLessThanOrEqual(1);
    }
  });

  it("ranks results by descending score", () => {
    const results = runScan(
      input({
        flashes: [flash({ id: "a" }), flash({ id: "b", urgency: "urgent" })],
        zones: [zone],
      }),
      NOW,
    );
    const scores = results.map((r) => r.score);
    expect([...scores].sort((x, y) => y - x)).toEqual(scores);
  });
});
