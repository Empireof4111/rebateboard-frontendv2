import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, Panel, DataTable, StatCard, StatusPill, Toolbar, Pill } from "@/components/superadmin/AdminUI";
import { Modal, Field, fieldCls, toast } from "@/components/superadmin/AdminActions";
import { inboxAdminApi, type AdminInboxMessage } from "@/lib/admin-api";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { Search, Filter, Mail, Reply, Archive, RefreshCw, Send } from "lucide-react";

export const Route = createFileRoute("/superadmin/inbox")({
  component: InboxPage,
});

function InboxPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<AdminInboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "new" | "open" | "replied" | "closed">("all");
  const [stats, setStats] = useState({ total: 0, pending: 0, open: 0, replied: 0, closed: 0 });
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [viewing, setViewing] = useState<AdminInboxMessage | null>(null);
  const [replying, setReplying] = useState<AdminInboxMessage | null>(null);
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async (nextPage = 0) => {
    if (!token) return;
    setLoading(true);
    try {
      const response = q.trim()
        ? await inboxAdminApi.search(token, q, nextPage, 50)
        : await inboxAdminApi.list(token, nextPage, 50);

      if (response.payload) {
        setItems(nextPage === 0 ? response.payload.page : (prev) => [...prev, ...response.payload!.page]);
        setTotalPages(response.payload.totalPages);
        setPage(nextPage);
        if (response.payload.stats) setStats(response.payload.stats);
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load inbox messages");
    } finally {
      setLoading(false);
    }
  }, [token, q]);

  useEffect(() => {
    void load(0);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => items.filter((item) => {
    const status = item.status.toUpperCase();
    if (filter === "all") return true;
    if (filter === "new") return status === "PENDING";
    if (filter === "open") return status === "ACTIVE";
    if (filter === "replied") return status === "REPLIED";
    if (filter === "closed") return status === "INACTIVE";
    return true;
  }), [items, filter]);

  const counts = {
    total: stats.total,
    new: stats.pending,
    open: stats.open,
    replied: stats.replied,
    closed: stats.closed,
  };

  const refreshCurrent = async () => {
    await load(0);
  };

  const updateStatus = async (message: AdminInboxMessage, status: string, successMessage: string) => {
    if (!token) return;
    try {
      const response = await inboxAdminApi.updateStatus(token, message.id, status);
      if (response.payload) {
        setItems((prev) => prev.map((item) => item.id === message.id ? response.payload! : item));
        await refreshCurrent();
      }
      toast.success(successMessage);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unable to update message status");
    }
  };

  const openReply = (message: AdminInboxMessage) => {
    setReplying(message);
    setReplySubject(message.subject ? `Re: ${message.subject}` : "Re: Your message");
    setReplyBody("");
  };

  const submitReply = async () => {
    if (!token || !replying) return;
    setSending(true);
    try {
      const response = await inboxAdminApi.reply(token, replying.id, replySubject, replyBody);
      if (response.payload) {
        setItems((prev) => prev.map((item) => item.id === replying.id ? response.payload! : item));
        setViewing(response.payload);
        await refreshCurrent();
      }
      toast.success("Reply sent");
      setReplying(null);
      setReplySubject("");
      setReplyBody("");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unable to send reply");
    } finally {
      setSending(false);
    }
  };

  function statusLabel(message: AdminInboxMessage) {
    const status = message.status.toUpperCase();
    if (status === "PENDING") return "open";
    if (status === "ACTIVE") return "reviewing";
    if (status === "REPLIED") return "responded";
    if (status === "INACTIVE") return "resolved";
    return status.toLowerCase();
  }

  return (
    <div>
      <PageHeader
        title="Inbox"
        subtitle="Every message users send from the dashboard contact form."
        actions={
          <button onClick={() => void load(0)} className="grid h-7 w-7 place-items-center rounded-md bg-white/5 text-white ring-1 ring-white/10">
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total messages" value={String(counts.total)} delta="all time" tone="flat" />
        <StatCard label="New" value={String(counts.new)} delta="awaiting triage" tone="up" />
        <StatCard label="Open" value={String(counts.open)} delta="being handled" tone="flat" />
        <StatCard label="Closed" value={String(counts.closed)} delta="resolved" tone="up" />
      </div>

      <Panel title={`All messages - ${q.trim() ? filtered.length : (counts.total || filtered.length)}`}>
        <Toolbar>
          <div className="glass flex flex-1 items-center gap-2 rounded-full px-3 py-1.5 text-xs">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && void load(0)}
              placeholder="Search subject, user, email..."
              className="w-full bg-transparent text-white outline-none placeholder:text-muted-foreground"
            />
          </div>
          <select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-white ring-1 ring-white/10">
            <option value="all">All</option>
            <option value="new">New</option>
            <option value="open">Open</option>
            <option value="replied">Replied</option>
            <option value="closed">Closed</option>
          </select>
          <button className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white"><Filter className="h-3.5 w-3.5" /> Filters</button>
        </Toolbar>
        <DataTable head={<><th>From</th><th>Subject</th><th>Type</th><th>Status</th><th>Replies</th><th>Received</th><th></th></>}>
          {loading && items.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">Loading...</td></tr>}
          {!loading && filtered.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">No inbox messages yet.</td></tr>}
          {filtered.map((message) => (
            <tr key={message.id}>
              <td>
                <div className="font-semibold">{message.name}</div>
                <div className="text-[10px] text-muted-foreground">{message.email || message.phoneNumber || "No contact"}</div>
              </td>
              <td>
                <div className="font-medium">{message.subject}</div>
                <div className="line-clamp-1 text-[11px] text-muted-foreground">{message.preview}</div>
              </td>
              <td><Pill>{message.userId ? "dashboard" : "public"}</Pill></td>
              <td><StatusPill status={statusLabel(message)} /></td>
              <td className="text-muted-foreground text-xs">{message.replyCount || 0}</td>
              <td className="text-muted-foreground text-xs">{message.received ? new Date(message.received).toLocaleString() : "-"}</td>
              <td className="text-right">
                <div className="flex justify-end gap-2">
                  <button onClick={() => setViewing(message)} title="Open"><Mail className="h-3.5 w-3.5 text-fuchsia-300" /></button>
                  <button onClick={() => openReply(message)} title="Reply"><Reply className="h-3.5 w-3.5 text-emerald-300" /></button>
                  <button onClick={() => void updateStatus(message, "ACTIVE", "Message marked as open")} title="Mark open"><Pill tone="warn">Open</Pill></button>
                  <button onClick={() => void updateStatus(message, "INACTIVE", "Message closed")} title="Close"><Archive className="h-3.5 w-3.5 text-muted-foreground" /></button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>

        {totalPages > 1 && page < totalPages - 1 && (
          <div className="mt-4 flex justify-center">
            <button onClick={() => void load(page + 1)} disabled={loading} className="rounded-full bg-white/10 px-4 py-1.5 text-xs text-white disabled:opacity-40">
              {loading ? "Loading..." : "Load more"}
            </button>
          </div>
        )}
      </Panel>

      {viewing && (
        <Modal
          open
          onClose={() => setViewing(null)}
          title={viewing.subject || "Inbox message"}
          subtitle={`${viewing.name} | ${viewing.email || viewing.phoneNumber || "No contact"}`}
          size="lg"
          footer={<>
            <button onClick={() => { setViewing(null); openReply(viewing); }} className="rounded-xl rb-gradient-primary px-4 py-2 text-xs font-bold text-white">Reply</button>
            <button onClick={() => void updateStatus(viewing, "INACTIVE", "Message closed")} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white">Close thread</button>
          </>}
        >
          <div className="space-y-4 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Sender"><div className="rounded-lg bg-white/5 px-3 py-2 text-white ring-1 ring-white/10">{viewing.name}</div></Field>
              <Field label="Status"><div className="rounded-lg bg-white/5 px-3 py-2 text-white ring-1 ring-white/10"><StatusPill status={statusLabel(viewing)} /></div></Field>
              <Field label="Email"><div className="rounded-lg bg-white/5 px-3 py-2 text-white ring-1 ring-white/10">{viewing.email || "-"}</div></Field>
              <Field label="Phone"><div className="rounded-lg bg-white/5 px-3 py-2 text-white ring-1 ring-white/10">{viewing.phoneNumber || "-"}</div></Field>
            </div>
            <Field label="Original message" span={2}>
              <div className="rounded-xl bg-white/5 px-4 py-3 text-white ring-1 ring-white/10 whitespace-pre-wrap">{viewing.message}</div>
            </Field>
            {viewing.lastReply && (
              <Field label="Latest admin reply" span={2}>
                <div className="rounded-xl bg-emerald-500/10 px-4 py-3 text-white ring-1 ring-emerald-400/20 whitespace-pre-wrap">
                  <div className="mb-1 text-xs font-semibold text-emerald-300">{viewing.lastReply.subject}</div>
                  {viewing.lastReply.message}
                </div>
              </Field>
            )}
          </div>
        </Modal>
      )}

      {replying && (
        <Modal
          open
          onClose={() => setReplying(null)}
          title={`Reply to ${replying.name}`}
          subtitle={replying.email || replying.phoneNumber || "No contact"}
          size="lg"
          footer={<>
            <button onClick={() => setReplying(null)} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white">Cancel</button>
            <button onClick={() => void submitReply()} disabled={sending || !replySubject.trim() || !replyBody.trim()} className="inline-flex items-center gap-1 rounded-xl rb-gradient-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-40"><Send className="h-3 w-3" /> {sending ? "Sending..." : "Send reply"}</button>
          </>}
        >
          <div className="grid gap-3">
            <Field label="Subject"><input className={fieldCls} value={replySubject} onChange={(event) => setReplySubject(event.target.value)} /></Field>
            <Field label="Message"><textarea className={`${fieldCls} min-h-40`} value={replyBody} onChange={(event) => setReplyBody(event.target.value)} /></Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
