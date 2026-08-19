import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api";
import { track } from "../lib/track";

type Hit = { n: number; title: string; subtitle?: string; passage: string };
type Source = { n: number; title: string };
type Reply =
  | { kind: "answer"; answer: string; sources?: Source[] }
  | { kind: "passages"; hits: Hit[]; degraded?: boolean }
  | { kind: "definition"; term: string; answer: string; degraded?: boolean }
  | { kind: "limit"; reason?: string }
  | { kind: "none"; degraded?: boolean };
type Turn = { who: "you"; text: string } | { who: "report"; reply: Reply };
type Stored = { role: "user" | "assistant"; content: string; kind?: string; sources?: Source[] };

/**
 * The assistant is instructed to send plain text, but instructions are not
 * guarantees — a stray **bold** would otherwise print its asterisks. Render the
 * handful of marks a model reaches for, and strip the rest.
 */
function Rich({ text }: { text: string }) {
  const clean = text
    .replace(/^#{1,6}\s+/gm, "")        // headings
    .replace(/^\s*[-*•]\s+/gm, "· ");   // list markers
  return (
    <>
      {clean.split(/\n{2,}/).filter(Boolean).map((para, i) => (
        <p key={i} className={i ? "mt-3" : ""}>
          {para.split(/(\*\*[^*]+\*\*)/g).map((chunk, j) =>
            /^\*\*[^*]+\*\*$/.test(chunk)
              ? <strong key={j} className="font-semibold text-fg">{chunk.slice(2, -2)}</strong>
              : <span key={j}>{chunk.replace(/\*/g, "")}</span>)}
        </p>
      ))}
    </>
  );
}

/**
 * Ask your report — a conversation with an assistant that has read this
 * buyer's own chapters.
 *
 * The model is grounded on their actual report server-side, so it answers about
 * their chart rather than about astrology in general. If no model is configured
 * or it is unreachable, the same box quotes the matching passages instead of
 * failing — the buyer still gets an answer, just a blunter one.
 */
export default function AskReport({ publicId, language = "en" }: {
  publicId: string; language?: string;
}) {
  const [log, setLog] = useState<Turn[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [suggested, setSuggested] = useState<string[]>([]);
  const feed = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get(`/noauth-api/v1/shop/order/${publicId}/ask?lang=${language}`)
      .then((r: { suggestions?: string[] }) => setSuggested(r.suggestions ?? []))
      .catch(() => {});
  }, [publicId, language]);

  // The conversation lives in the database, not in this component. Reloading
  // the page, or opening the order link on another device, picks it up where it
  // was left — the buyer keeps this link for months.
  useEffect(() => {
    let live = true;
    api.get(`/noauth-api/v1/shop/order/${publicId}/chat`)
      .then((r: { messages?: Stored[] }) => {
        if (!live || !r.messages?.length) return;
        setLog(r.messages.map((m): Turn =>
          m.role === "user"
            ? { who: "you", text: m.content }
            : { who: "report",
                reply: { kind: "answer", answer: m.content, sources: m.sources } }));
      })
      .catch(() => {});
    return () => { live = false; };
  }, [publicId]);

  useEffect(() => {
    feed.current?.scrollTo({ top: feed.current.scrollHeight, behavior: "smooth" });
  }, [log.length, busy]);

  const send = async (text: string) => {
    const query = text.trim();
    if (!query || busy) return;
    setQ(""); setBusy(true);

    setLog((l) => [...l, { who: "you", text: query }]);
    // The question itself is worth keeping: what buyers actually want to know
    // is the clearest signal we have about what the reports are missing.
    track("chat_question", { order_id: publicId, q: query.slice(0, 200), lang: language });
    try {
      const reply: Reply = await api.post(
        `/noauth-api/v1/shop/order/${publicId}/chat`, { q: query, lang: language });
      setLog((l) => [...l, { who: "report", reply }]);
    } catch {
      setLog((l) => [...l, { who: "report", reply: { kind: "none" } }]);
    } finally { setBusy(false); }
  };

  const Card = ({ children }: { children: React.ReactNode }) => (
    <div className="rounded-[3px] border border-line bg-sunken px-4 py-3">{children}</div>
  );

  return (
    <div className="rounded-[4px] border border-line bg-raised ring-1 ring-brass/15 overflow-hidden">
      <div className="px-6 py-5 border-b border-line bg-sunken">
        <p className="caps text-brass">Ask your report</p>
        <p className="text-[13.5px] text-muted mt-1.5 leading-relaxed">
          Stuck on a chapter, or not sure what a term means? Ask in English, Hindi or
          Hinglish. Answers come from your own reading, with the chapter to turn to.
        </p>
      </div>

      <div ref={feed} className="max-h-[460px] overflow-y-auto px-6 py-5 space-y-4">
        {!log.length && (
          <p className="text-[14px] text-faint">
            Nothing asked yet. Try one of these, or write your own.
          </p>
        )}

        {log.map((turn, i) =>
          turn.who === "you" ? (
            <div key={i} className="flex justify-end">
              <span className="inline-block max-w-[85%] rounded-[3px] bg-brass text-surface
                               px-3.5 py-2 text-[14px] leading-snug">{turn.text}</span>
            </div>
          ) : (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        className="space-y-2.5">
              {turn.reply.kind === "answer" && (
                <>
                  <div className="text-[14.5px] text-fg leading-relaxed">
                    <Rich text={turn.reply.answer} />
                  </div>

                </>
              )}

              {turn.reply.kind === "definition" && (
                <div className="rounded-[3px] border-l-2 border-brass bg-sunken px-4 py-3">
                  <p className="caps text-brass">{turn.reply.term}</p>
                  <p className="text-[14px] text-fg mt-1.5 leading-relaxed">{turn.reply.answer}</p>
                </div>
              )}

              {turn.reply.kind === "passages" && turn.reply.hits.map((h) => (
                <Card key={h.n}>
                  <p className="caps text-brass">Chapter {h.n} · {h.title}</p>
                  <p className="text-[14px] text-fg mt-2 leading-relaxed">{h.passage}</p>
                </Card>
              ))}

              {turn.reply.kind === "limit" && (
                <Card>
                  <p className="text-[14px] text-muted leading-relaxed">
                    You have reached the question limit for this report. Everything it says is
                    still in the book above — and you can write to us any time.
                  </p>
                </Card>
              )}

              {turn.reply.kind === "none" && (
                <Card>
                  <p className="text-[14px] text-muted leading-relaxed">
                    Your report does not cover that. Try naming a life area — marriage, career,
                    money, health — or ask what a term means.
                  </p>
                </Card>
              )}
            </motion.div>
          ))}

        {busy && (
          <div className="flex items-center gap-2 text-[13.5px] text-faint">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-brass border-t-transparent animate-spin" />
            Reading your chapters…
          </div>
        )}
      </div>

      {!log.length && !!suggested.length && (
        <div className="px-6 pb-4 flex flex-wrap gap-2">
          {suggested.map((sg) => (
            <button key={sg} onClick={() => send(sg)} disabled={busy}
              className="rounded-full border border-line px-3.5 h-9 text-[13px] text-muted
                         transition hover:border-brass hover:text-brass disabled:opacity-40">
              {sg}
            </button>
          ))}
        </div>
      )}

      <div className="px-6 py-4 border-t border-line flex gap-3">
        <input className="field flex-1" value={q} placeholder="Ask anything about this report…"
               aria-label="Ask your report" disabled={busy}
               onChange={(e) => setQ(e.target.value)}
               onKeyDown={(e) => { if (e.key === "Enter") send(q); }} />
        <button className="btn-brass px-6" onClick={() => send(q)} disabled={busy || !q.trim()}>
          Ask
        </button>
      </div>

      <p className="px-6 pb-5 text-[11.5px] text-faint leading-relaxed">
        Answers are drawn from your report and are for guidance and reflection — not medical,
        legal or financial advice.
      </p>
    </div>
  );
}
