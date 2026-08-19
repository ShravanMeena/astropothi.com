// Persisting a conversation, so it survives a reload and can be read back later.

import db from "../../database/index.js";

const MAX_TURNS = 200;   // a runaway client should not fill a table

/** Everything said in this conversation, oldest first. */
export async function history(publicId, limit = 60) {
  const rows = await db.ChatMessage.findAll({
    where: { public_id: publicId },
    order: [["id", "DESC"]], limit
  });
  return rows.reverse().map((m) => ({
    role: m.role, content: m.content, kind: m.kind || undefined,
    degraded: m.degraded || undefined, sources: m.sources || undefined,
    at: m.createdAt
  }));
}

/**
 * Record one exchange. Never throws — a logging failure must not cost the buyer
 * the answer they just waited for.
 */
export async function record(order, { question, reply, lang, model, latencyMs }) {
  try {
    if (!order) return;
    const n = await db.ChatMessage.count({ where: { order_id: order.id } });
    if (n >= MAX_TURNS) return;

    const text = reply?.answer
      ?? (reply?.kind === "passages"
            ? (reply.hits || []).map((h) => `Chapter ${h.n} — ${h.title}\n${h.passage}`).join("\n\n")
            : "");

    await db.ChatMessage.bulkCreate([
      { order_id: order.id, public_id: order.public_id, role: "user",
        content: String(question).slice(0, 2000), lang },
      { order_id: order.id, public_id: order.public_id, role: "assistant",
        content: String(text || "").slice(0, 8000),
        kind: reply?.kind, degraded: Boolean(reply?.degraded),
        sources: reply?.sources || (reply?.hits || []).map((h) => ({ n: h.n, title: h.title })),
        model, latency_ms: latencyMs, lang }
    ]);
  } catch (e) {
    console.warn("[chat-log] could not record:", e.message);
  }
}
