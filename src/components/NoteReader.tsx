import { useEffect, useState } from "react";
import { Clock3, X } from "lucide-react";
import { messageRemainingMs, readableOn, type TreeMessage } from "@/lib/messages";

const TITLES = { card: "Um cartão para você", bauble: "Dentro desta bola", mini_gift: "Um presentinho" } as const;

export function NoteReader({ msg, onClose }: { msg: TreeMessage; onClose: () => void }) {
  const tone = readableOn(msg.ornament_color);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(timer);
  }, []);
  const remainingMinutes = Math.ceil(messageRemainingMs(msg, now) / 60000);
  return (
    <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <article
        className="paper-panel animate-rise w-full max-w-md overflow-hidden rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* user-chosen color band; text color picked for contrast */}
        <header className="flex items-center justify-between px-6 py-4" style={{ background: msg.ornament_color, color: tone === "dark" ? "var(--ink)" : "var(--paper)" }}>
          <h2 className="font-display text-2xl font-semibold">{TITLES[msg.ornament_type]}</h2>
          <button onClick={onClose} aria-label="Fechar bilhete" className="rounded-full p-1.5 opacity-80 hover:opacity-100"><X className="h-5 w-5" /></button>
        </header>
        <div className="h-1" style={{ background: msg.secondary_color }} />
        <p className="whitespace-pre-wrap break-words px-6 py-7 font-display text-2xl leading-snug">{msg.message}</p>
        <footer className="flex items-center justify-between gap-3 px-6 pb-5 text-sm text-muted-foreground">
          <span>— alguém que passou por aqui</span>
          <span className="flex shrink-0 items-center gap-1 text-xs" aria-live="polite">
            <Clock3 className="h-3.5 w-3.5" />
            {remainingMinutes > 0 ? `Some em ${remainingMinutes} min` : "Bilhete expirado"}
          </span>
        </footer>
      </article>
    </div>
  );
}
