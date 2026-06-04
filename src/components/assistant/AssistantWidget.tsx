import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Send, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Comment créer un Espace ?",
  "À quoi sert le scan QR ?",
  "Recommande-moi un Espace",
];

const WELCOME: Msg = {
  role: "assistant",
  content:
    "Bonjour ! Je suis **Vita**, ton assistant Vitalio. Je peux t'expliquer l'app, t'aider à créer un Espace ou te recommander des contenus. Que veux-tu faire ?",
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assistant-chat`;

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export const AssistantWidget = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const lastAssistantText = messages.filter((m) => m.role === "assistant").pop()?.content ?? "";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  /* ── open: store previous focus & move focus into dialog ── */
  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 250);
    return () => clearTimeout(timer);
  }, [open]);

  /* ── close: restore previous focus ── */
  useEffect(() => {
    if (open) return;
    previousFocusRef.current?.focus?.();
  }, [open]);

  /* ── focus trap + Escape ── */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => !el.hasAttribute("disabled") && el.offsetParent !== null,
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || !dialog.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !dialog.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [],
  );

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const userMsg: Msg = { role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last !== WELCOME && prev.length > next.length) {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m,
          );
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.filter((m) => m !== WELCOME).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (resp.status === 429) {
        toast.error("Trop de requêtes, réessaie dans un instant.");
        setLoading(false);
        return;
      }
      if (resp.status === 402) {
        toast.error("Crédits Lovable AI épuisés.");
        setLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) throw new Error("stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("L'assistant est indisponible. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* sr-only live region for streaming announcements */}
      <div aria-live="polite" aria-atomic="false" className="sr-only">
        {lastAssistantText}
      </div>

      {/* FAB */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 22, delay: 0.4 }}
        onClick={() => setOpen(true)}
        aria-label="Ouvrir l'assistant Vita"
        className={cn(
          "fixed z-40 right-4 flex h-14 w-14 items-center justify-center rounded-2xl",
          "bg-gradient-primary text-primary-foreground shadow-glow",
          "bottom-[calc(5.5rem+env(safe-area-inset-bottom))]",
          open && "pointer-events-none opacity-0",
        )}
      >
        <Sparkles className="h-5 w-5" />
        <span className="absolute -right-1 -top-1 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-accent" />
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
            />
            <motion.div
              ref={dialogRef}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
              role="dialog"
              aria-modal="true"
              aria-label="Assistant Vita"
              onKeyDown={handleKeyDown}
              className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-md flex-col rounded-t-[2rem] glass shadow-float"
              style={{ height: "min(82vh, 720px)" }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">Vita</p>
                  <p className="text-[11px] text-muted-foreground">Assistant Vitalio · en ligne</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Fermer"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted hover:bg-accent/20 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Messages */}
              <div
                ref={scrollRef}
                aria-live="off"
                aria-busy={loading}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
              >
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex",
                      m.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm",
                        m.role === "user"
                          ? "bg-gradient-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm",
                      )}
                    >
                      <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-a:text-primary prose-a:underline-offset-2 prose-strong:text-current">
                        <ReactMarkdown
                          components={{
                            a: ({ href, children }) => (
                              <a
                                href={href}
                                onClick={(e) => {
                                  if (href?.startsWith("/")) {
                                    e.preventDefault();
                                    setOpen(false);
                                    window.history.pushState({}, "", href);
                                    window.dispatchEvent(new PopStateEvent("popstate"));
                                  }
                                }}
                              >
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                {loading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {messages.length === 1 && !loading && (
                  <div className="flex flex-wrap gap-2 pt-2" role="list" aria-label="Suggestions">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        role="listitem"
                        onClick={() => send(s)}
                        className="rounded-full border border-border/60 bg-background/40 px-3 py-1.5 text-[11px] font-medium hover:bg-accent/10 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="border-t border-border/60 bg-background/60 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3"
              >
                <div className="flex items-end gap-2 rounded-2xl border border-border/60 bg-background px-3 py-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send(input);
                      }
                    }}
                    placeholder="Écris ta question…"
                    rows={1}
                    className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground max-h-32"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    aria-label="Envoyer"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow transition-opacity disabled:opacity-40"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
