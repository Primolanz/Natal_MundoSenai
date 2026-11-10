import { X } from "lucide-react";
import { readableOn, type TreeMessage } from "@/lib/messages";

const TITLES = { card: "Um cartão para você", bauble: "Dentro desta bola", mini_gift: "Um presentinho" } as const;

export function NoteReader({ msg, onClose }: { msg: TreeMessage; onClose: () => void }) {
  const tone = readableOn(msg.ornament_color);
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
        <footer className="px-6 pb-5 text-sm text-muted-foreground">— alguém que passou por aqui</footer>
      </article>
    </div>
  );
}
