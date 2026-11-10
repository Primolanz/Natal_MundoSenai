import { useEffect, useMemo, useState } from "react";
import { BookOpen, Clock3, Search } from "lucide-react";
import { ACTIVE_MESSAGE_MS, fetchMessageHistory, type TreeMessage } from "@/lib/messages";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const ACTIVE_MS = ACTIVE_MESSAGE_MS;
type StatusFilter = "all" | "active" | "expired";

function isActiveMessage(message: TreeMessage, now: number) {
  return now - new Date(message.created_at ?? message.expires_at).getTime() < ACTIVE_MS;
}

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

function formatSentAt(value: string) {
  const date = new Date(value);
  const now = new Date();
  const elapsed = Date.now() - date.getTime();
  if (elapsed < 60 * 60 * 1000) {
    const minutes = Math.max(0, Math.floor(elapsed / 60000));
    return new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" }).format(-minutes, "minute");
  }
  const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(date);
  if (date.toDateString() === now.toDateString()) return `hoje às ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `ontem às ${time}`;
  return `${new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(date)} às ${time}`;
}

export function MessageWall() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<TreeMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const filteredMessages = useMemo(() => {
    const term = normalizeSearch(search.trim());
    return messages.filter((message) => {
      const active = isActiveMessage(message, now);
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? active : !active);
      const matchesSearch = !term || normalizeSearch(`${message.message} ${message.author ?? "Anônimo"}`).includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [messages, now, search, statusFilter]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) return;
    setLoading(true);
    setError(null);
    fetchMessageHistory()
      .then(setMessages)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Não foi possível carregar os bilhetes."))
      .finally(() => setLoading(false));
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <button
        type="button"
        onClick={() => handleOpenChange(true)}
        className="glass pointer-events-auto absolute right-4 top-4 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm text-glass-foreground transition hover:bg-glass-foreground/10"
      >
        <BookOpen className="h-4 w-4" />
        <span className="hidden sm:inline">Ver todos os bilhetes</span>
        <span className="sm:hidden">Mural</span>
      </button>
      <SheetContent side="right" className="flex h-full w-full flex-col overflow-hidden border-l border-gold/20 bg-background/95 p-0 backdrop-blur-xl sm:max-w-md">
        <SheetHeader className="border-b border-gold/20 bg-pine px-6 py-6 pr-14 text-left text-pine-foreground">
          <SheetTitle className="font-display text-3xl text-inherit">Mural de Mensagens</SheetTitle>
          <SheetDescription className="text-pine-foreground/75">Todos os bilhetes da nossa árvore, do mais recente ao mais antigo.</SheetDescription>
        </SheetHeader>
        <div className="space-y-3 border-b border-border px-4 py-4 sm:px-6">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar mensagem ou autor"
              aria-label="Buscar mensagens por conteúdo ou autor"
              className="w-full rounded-xl border border-input bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <div className="flex gap-2 overflow-x-auto" role="group" aria-label="Filtrar bilhetes por status">
            {([
              ["all", "Todas"],
              ["active", "Ativas na árvore"],
              ["expired", "Expiradas"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                aria-pressed={statusFilter === value}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${statusFilter === value ? "bg-pine text-pine-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">
          {loading && <p className="py-8 text-center text-sm text-muted-foreground">Carregando bilhetes…</p>}
          {error && <p role="alert" className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
          {!loading && !error && filteredMessages.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">{messages.length ? "Nenhum bilhete corresponde à busca e ao filtro." : "Ainda não há bilhetes no mural."}</p>
          )}
          {filteredMessages.map((message) => {
            const active = isActiveMessage(message, now);
            return <MessageCard key={message.id} message={message} active={active} />;
          })}
        </div>
        <p className="border-t border-border px-6 py-3 text-center text-xs text-muted-foreground">Bilhetes ficam ativos na árvore por 40 minutos.</p>
      </SheetContent>
    </Sheet>
  );
}

function MessageCard({ message, active }: { message: TreeMessage; active: boolean }) {
  return (
    <article className="rounded-2xl border border-gold/20 bg-card p-4 shadow-sm" style={{ borderLeftWidth: 4, borderLeftColor: message.ornament_color }}>
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-card-foreground">{message.message}</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-foreground">{message.author || "Anônimo"}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="h-3 w-3" />{formatSentAt(message.created_at ?? message.expires_at)}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${active ? "bg-pine/10 text-pine" : "bg-muted text-muted-foreground"}`}>
          {active ? "Ativa na árvore" : "Expirada"}
        </span>
      </div>
    </article>
  );
}
