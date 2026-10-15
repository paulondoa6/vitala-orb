import { db, type Flash, type FlashReply } from "@/core/db";
import { createId } from "@/core/ids";
import { emit } from "@/core/events";
import { supabase } from "@/integrations/supabase/client";
import { ensureSeeded } from "@/core/seed";

export const getFlash = async (id: string): Promise<Flash | undefined> => {
  await ensureSeeded();
  return db.flashes.get(id);
};

/** Réponses d'un flash : locales + distantes si disponibles, triées chronologiquement. */
export const listReplies = async (flashId: string): Promise<FlashReply[]> => {
  const local = await db.flashReplies.where("flashId").equals(flashId).toArray();
  let remote: FlashReply[] = [];
  try {
    const { data, error } = await supabase
      .from("flash_replies")
      .select("id, flash_id, author_id, body, created_at")
      .eq("flash_id", flashId)
      .order("created_at", { ascending: true });
    if (!error && data) {
      remote = data.map((r) => ({
        id: r.id,
        flashId: r.flash_id,
        authorId: r.author_id,
        authorName: "Voisin",
        text: r.body,
        createdAt: new Date(r.created_at).getTime(),
      }));
    }
  } catch {
    /* hors ligne : on garde le local */
  }
  const seen = new Set(local.map((r) => r.id));
  return [...local, ...remote.filter((r) => !seen.has(r.id))].sort(
    (a, b) => a.createdAt - b.createdAt,
  );
};

export const postReply = async (input: {
  flashId: string;
  authorId: string;
  authorName: string;
  text: string;
}): Promise<FlashReply> => {
  const text = input.text.trim();
  if (text.length < 2) throw new Error("Écris au moins quelques mots.");
  if (text.length > 280) throw new Error("280 caractères maximum.");
  const reply: FlashReply = { id: createId(), ...input, text, createdAt: Date.now() };
  await db.transaction("rw", db.flashReplies, db.flashes, async () => {
    await db.flashReplies.put(reply);
    const f = await db.flashes.get(input.flashId);
    if (f) await db.flashes.update(f.id, { replies: f.replies + 1 });
  });
  emit({ type: "flash:published", id: input.flashId });
  return reply;
};
