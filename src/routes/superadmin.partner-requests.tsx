import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Inbox, Search, Mail, Send, CheckCircle2, XCircle, Copy, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { financeApi, type PartnerRequestRecord, type PartnerRequestStats } from "@/lib/finance-api";
import { ApiError } from "@/lib/api";
import { toast } from "@/components/superadmin/AdminActions";

export const Route = createFileRoute("/superadmin/partner-requests")({
  head: () => ({
    meta: [
      { title: "Partner Requests — Superadmin" },
      { name: "description", content: "Inbox of account-attach requests sent to broker / exchange partners on behalf of users." },
    ],
  }),
  component: PartnerRequestsInbox,
});

type FilterStatus = "all" | "queued" | "sent" | "acknowledged" | "rejected";

function PartnerRequestsInbox() {
  const { token } = useAuth();
  const [items, setItems] = useState<PartnerRequestRecord[]>([]);
  const [stats, setStats] = useState<PartnerRequestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<FilterStatus>("all");
  const [openId, setOpenId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        financeApi.getAllPartnerRequests(token, { size: 100 }),
        financeApi.getPartnerRequestStats(token),
      ]);
      if (listRes.payload) {
        setItems(listRes.payload.page);
        if (!openId && listRes.payload.page.length > 0) setOpenId(listRes.payload.page[0].id);
      }
      if (statsRes.payload) setStats(statsRes.payload);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to load partner requests");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => items.filter((r) =>
    (status === "all" || r.status === status) &&
    (q.trim() === "" ||
      r.brand.toLowerCase().includes(q.toLowerCase()) ||
      (r.user?.name ?? "").toLowerCase().includes(q.toLowerCase()) ||
      r.toEmail.toLowerCase().includes(q.toLowerCase()))
  ), [items, q, status]);

  const open = openId ? items.find((r) => r.id === openId) : null;

  const setStatusOf = async (id: number, next: string) => {
    if (!token) return;
    try {
      await financeApi.updatePartnerRequestStatus(token, id, { status: next });
      toast.success(`Request → ${next}`);
      load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Update failed");
    }
  };

  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Inbox className="h-6 w-6 text-accent" /> Partner attach requests
          </h1>
          <p className="mt-1 text-sm text-white/60">Outbound emails to broker / exchange partner inboxes asking them to attach a trader's account under our affiliate code.</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Pill tone="amber">{stats?.queued ?? 0} queued</Pill>
          <Pill tone="sky">{stats?.sent ?? 0} sent</Pill>
          <Pill tone="emerald">{stats?.acknowledged ?? 0} done</Pill>
          <button onClick={load} className="grid h-7 w-7 place-items-center rounded-md bg-white/5 text-white ring-1 ring-white/10">
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search brand, user, email…"
                className="w-full rounded-lg border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/40 focus:border-accent focus:outline-none" />
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {(["all", "queued", "sent", "acknowledged", "rejected"] as const).map((s) => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`rounded-full px-2.5 py-1 text-[11px] ${status === s ? "bg-accent text-black" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
            {loading && <div className="p-6 text-center text-sm text-white/50">Loading…</div>}
            {!loading && filtered.length === 0 && <div className="p-6 text-center text-sm text-white/50">Nothing here.</div>}
            {filtered.map((r) => (
              <button key={r.id} onClick={() => setOpenId(r.id)}
                className={`flex w-full flex-col gap-1 border-b border-white/5 px-3 py-3 text-left text-sm hover:bg-white/5 ${openId === r.id ? "bg-white/10" : ""}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">{r.brand}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${
                    r.status === "acknowledged" ? "bg-emerald-500/15 text-emerald-300"
                    : r.status === "sent" ? "bg-sky-500/15 text-sky-300"
                    : r.status === "rejected" ? "bg-rose-500/15 text-rose-300"
                    : "bg-amber-500/15 text-amber-300"
                  }`}>{r.status}</span>
                </div>
                <div className="text-xs text-white/60">{r.user?.name ?? `User #${r.userId}`} · acct {r.accountId}</div>
                <div className="truncate text-[11px] text-white/40">→ {r.toEmail}</div>
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-xl border border-white/10 bg-white/5">
          {!open && <div className="p-12 text-center text-sm text-white/50">Select a request to preview.</div>}
          {open && (
            <div className="p-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <div className="text-xs uppercase tracking-wide text-white/50">{open.brandCategory}</div>
                  <h2 className="mt-0.5 text-lg font-bold text-white">{open.brand}</h2>
                  <div className="mt-1 text-xs text-white/60">
                    From: <span className="text-white/80">{open.user?.name ?? `User #${open.userId}`}</span> · To: <span className="text-white/80">{open.toEmail}</span>
                  </div>
                  <div className="text-[11px] text-white/40">
                    Created {fmt(open.createdAt)}{open.sentAt ? ` · sent ${fmt(open.sentAt)}` : ""}
                  </div>
                </div>
                <div className="flex gap-2">
                  {open.status === "queued" && (
                    <button onClick={() => setStatusOf(open.id, "sent")}
                      className="inline-flex items-center gap-1 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-400">
                      <Send className="h-3 w-3" /> Mark sent
                    </button>
                  )}
                  {open.status !== "acknowledged" && open.status !== "rejected" && (
                    <button onClick={() => setStatusOf(open.id, "acknowledged")}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> Acknowledged
                    </button>
                  )}
                  {open.status !== "rejected" && (
                    <button onClick={() => setStatusOf(open.id, "rejected")}
                      className="inline-flex items-center gap-1 rounded-lg bg-rose-500/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500">
                      <XCircle className="h-3 w-3" /> Reject
                    </button>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Meta label="Account ID">{open.accountId}</Meta>
                <Meta label="Registered email">{open.registeredEmail ?? "—"}</Meta>
                <Meta label="Partner code">{open.partnerCode ?? "—"}</Meta>
                <Meta label="Affiliate link">
                  {open.affiliateLink ? (
                    <a href={open.affiliateLink} target="_blank" rel="noreferrer" className="text-accent hover:underline">{open.affiliateLink}</a>
                  ) : "—"}
                </Meta>
              </div>

              <div className="mt-5 rounded-lg border border-white/10 bg-black/30 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-white/50"><Mail className="h-3 w-3" /> Email body</div>
                  <button onClick={() => navigator.clipboard?.writeText(`Subject: ${open.subject}\n\n${open.body}`)}
                    className="inline-flex items-center gap-1 text-[11px] text-white/60 hover:text-white">
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                </div>
                <div className="text-sm font-semibold text-white">{open.subject}</div>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-white/80">{open.body}</pre>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Pill({ children, tone }: { children: React.ReactNode; tone: "amber" | "sky" | "emerald" }) {
  const cls = tone === "emerald" ? "bg-emerald-500/15 text-emerald-300"
    : tone === "sky" ? "bg-sky-500/15 text-sky-300"
    : "bg-amber-500/15 text-amber-300";
  return <span className={`rounded-full px-2.5 py-1 ${cls}`}>{children}</span>;
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="text-[11px] uppercase tracking-wide text-white/50">{label}</div>
      <div className="mt-1 text-sm text-white">{children}</div>
    </div>
  );
}
