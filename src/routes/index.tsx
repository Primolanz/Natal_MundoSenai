import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Volume2, VolumeX, PenLine, Home } from "lucide-react";
import { ChristmasScene } from "@/scene/ChristmasScene";
import { Composer, DEFAULT_DRAFT, type Draft } from "@/components/Composer";
import { NoteReader } from "@/components/NoteReader";
import { MessageWall } from "@/components/MessageWall";
import { fetchActiveMessages, isActive, mapMessageRow, publishMessage, type NewMessage, type TreeMessage } from "@/lib/messages";
import { supabase } from "@/lib/supabase";
import { music } from "@/lib/music";
import senaiLogo from "@/assets/senai_logo.webp.asset.json";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Árvore de Natal 3D — bilhetes anônimos" },
      { name: "description", content: "Explore uma sala natalina em 3D, abra bilhetes escondidos nos enfeites e pendure o seu na árvore." },
      { property: "og:title", content: "Árvore de Natal 3D — bilhetes anônimos" },
      { property: "og:description", content: "Cada cartão, bola ou presentinho guarda uma mensagem de Natal. Deixe a sua." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Experience,
});

type Mode = "home" | "view" | "add";

function Experience() {
  const [mode, setMode] = useState<Mode>("home");
  const [messages, setMessages] = useState<TreeMessage[]>([]);
  const [reading, setReading] = useState<TreeMessage | null>(null);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState<Draft>(DEFAULT_DRAFT);
  const [muted, setMuted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchActiveMessages().then(setMessages).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("realtime-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        console.log("Novo enfeite recebido:", payload.new);
        const message = mapMessageRow(payload.new as Record<string, unknown>);
        if (!isActive(message)) return;
        setMessages((current) => {
          const updated = [...current.filter((item) => item.id !== message.id), message];
          return updated.sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));
        });
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages" }, (payload) => {
        const deletedId = payload.old["id"];
        if (typeof deletedId === "string") {
          setMessages((current) => current.filter((message) => message.id !== deletedId));
        } else {
          load();
        }
      })
      .subscribe((status) => {
        console.log("Status do Supabase Realtime:", status);
        if (status === "SUBSCRIBED") load();
      });
    const iv = window.setInterval(load, 30000);
    return () => {
      clearInterval(iv);
      void supabase.removeChannel(channel);
    };
  }, [load]);

  const enter = (m: Mode) => {
    music.start();
    setMode(m);
    if (m === "add") setComposing(true);
  };

  const pick = (m: TreeMessage) => {
    if (!isActive(m)) return;
    window.setTimeout(() => setReading(m), 350);
  };

  const ghost = useMemo<TreeMessage | null>(
    () => (composing ? { ...draft, id: "ghost-preview", expires_at: new Date(Date.now() + 3600000).toISOString() } : null),
    [composing, draft],
  );

  const publish = async (m: NewMessage) => {
    const saved = await publishMessage(m);
    setMessages((ms) => [...ms.filter((x) => x.id !== saved.id), saved]);
    setComposing(false);
    setDraft(DEFAULT_DRAFT);
    setToast("Seu bilhete foi pendurado na árvore.");
    window.setTimeout(() => setToast(null), 3500);
  };

  return (
    <main className="fixed inset-0 overflow-hidden bg-background">
      <ChristmasScene messages={messages} onPick={pick} selectedId={reading?.id} ghost={ghost} />

      <div className="pointer-events-none absolute inset-0">
        <MessageWall />
        {mode === "home" && (
          <div className="home-veil pointer-events-auto absolute inset-0 flex items-center justify-center p-6">
            <div className="animate-rise max-w-xl text-center">
              <img src={senaiLogo.url} alt="SENAI" className="mx-auto mb-5 h-10 w-auto rounded-sm shadow-lg md:h-12" />
              <p className="animate-shimmer mb-3 text-sm uppercase tracking-[0.3em] text-gold">Educação · Tecnologia · Inovação</p>
              <h1 className="font-display text-5xl font-semibold leading-tight text-glass-foreground md:text-7xl">
                Natal no SENAI
              </h1>
              <p className="mx-auto mt-5 max-w-md text-lg text-glass-foreground/85">
                Alunos, professores e toda a comunidade SENAI constroem juntos esta árvore. Escreva sua mensagem, personalize seu enfeite e pendure no galho que quiser.
              </p>
              <p className="mx-auto mt-3 max-w-md text-sm text-glass-foreground/70">
                Do chão de fábrica ao código: que o próximo ano seja de muito aprendizado, conquistas e futuro.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button className="btn-ghost-light" onClick={() => enter("view")}>Somente visualizar</button>
                <button className="btn-festive" onClick={() => enter("add")}>Visualizar e adicionar bilhetes</button>
              </div>
            </div>
          </div>
        )}

        {mode !== "home" && (
          <>
            <div className="glass pointer-events-auto absolute left-4 top-4 flex items-center gap-1 rounded-full p-1.5">
              <IconBtn label="Início" onClick={() => { setMode("home"); setComposing(false); }}><Home className="h-5 w-5" /></IconBtn>
              <span className="px-2 font-display text-lg">{mode === "view" ? "Explorando" : "Explorando e escrevendo"}</span>
            </div>
            {!composing && (
              <p className="glass absolute bottom-24 left-1/2 md:bottom-6 -translate-x-1/2 rounded-full px-4 py-2 text-center text-sm">
                {messages.length ? "Toque em um enfeite para ler o bilhete" : "Ainda não há bilhetes na árvore"}
              </p>
            )}
            {mode === "add" && !composing && (
              <button className="btn-festive pointer-events-auto absolute bottom-20 right-4 md:bottom-6" onClick={() => setComposing(true)}>
                <PenLine className="h-5 w-5" /> Deixar bilhete
              </button>
            )}
          </>
        )}

        <div className="glass pointer-events-auto absolute bottom-6 left-4 rounded-full p-1.5 md:bottom-6">
          <IconBtn label={muted ? "Ativar música" : "Silenciar música"} onClick={() => { const m = !muted; setMuted(m); music.setMuted(m); }}>
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </IconBtn>
        </div>

        {composing && mode === "add" && (
          <Composer draft={draft} setDraft={setDraft} onClose={() => setComposing(false)} onPublish={publish} />
        )}
        {reading && <NoteReader msg={reading} onClose={() => setReading(null)} />}
        {toast && (
          <div className="glass animate-rise absolute left-1/2 top-20 -translate-x-1/2 rounded-full px-5 py-2.5 text-sm">{toast}</div>
        )}
      </div>
    </main>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button aria-label={label} title={label} onClick={onClick} className="rounded-full p-2 text-glass-foreground hover:bg-glass-foreground/10">
      {children}
    </button>
  );
}
