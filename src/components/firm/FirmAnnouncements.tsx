import { Megaphone, ArrowUpRight, Calendar, Sparkles, Bell, Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { fetchPublicAnnouncements, type Announcement } from "@/lib/admin-api";

export function FirmAnnouncements({ firmName }: { firmName: string }) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadAnnouncements() {
      setLoading(true);
      try {
        const rows = await fetchPublicAnnouncements();
        if (!cancelled) setItems(rows);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadAnnouncements();
    return () => {
      cancelled = true;
    };
  }, []);

  const normalized = firmName.trim().toLowerCase();
  const list = useMemo(
    () =>
      items.filter(
        (a) =>
          a.category === "Brand" &&
          a.approval === "approved" &&
          a.status !== "expired" &&
          a.brandName?.trim().toLowerCase() === normalized,
      ),
    [items, normalized],
  );

  // Sort: active first, then scheduled
  const sorted = [...list].sort((a, b) => {
    const order = { active: 0, scheduled: 1, expired: 2 } as const;
    return order[a.status] - order[b.status];
  });

  const liveCount = sorted.filter((a) => a.status === "active").length;
  const upcomingCount = sorted.filter((a) => a.status === "scheduled").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="glass relative overflow-hidden rounded-3xl p-5 ring-1 ring-fuchsia-300/20 sm:p-6">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500/40 to-violet-600/40 ring-1 ring-fuchsia-300/40">
              <Bell className="h-5 w-5 text-fuchsia-100" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white sm:text-xl">
                Announcements from {firmName}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Promotions, updates, and offers — straight from the brand.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1.5 text-[11px] font-bold text-emerald-200 ring-1 ring-emerald-300/30">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              {liveCount} Live
            </span>
            {upcomingCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-400/15 px-3 py-1.5 text-[11px] font-bold text-sky-200 ring-1 ring-sky-300/30">
                <Clock className="h-3 w-3" /> {upcomingCount} Upcoming
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {loading && (
        <div className="glass rounded-3xl p-12 text-center text-sm text-muted-foreground ring-1 ring-white/10">
          Loading announcements...
        </div>
      )}
      {!loading && sorted.length === 0 && (
        <div className="glass rounded-3xl p-12 text-center ring-1 ring-white/10">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-violet-600/20 ring-1 ring-fuchsia-300/20">
            <Megaphone className="h-7 w-7 text-fuchsia-300" />
          </div>
          <div className="text-base font-bold text-white">No announcements yet</div>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            {firmName} hasn't posted any active announcements. Follow the brand to be notified when
            new offers go live.
          </p>
        </div>
      )}

      {/* Featured first announcement (if any active) */}
      {!loading && sorted.length > 0 && sorted[0].status === "active" && (
        <FeaturedCard a={sorted[0]} firmName={firmName} />
      )}

      {/* Grid for the rest */}
      {!loading && sorted.length > 1 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {sorted.slice(sorted[0].status === "active" ? 1 : 0).map((a) => (
            <AnnouncementCard key={a.id} a={a} firmName={firmName} />
          ))}
          {sorted[0].status !== "active" && (
            // ensure first is rendered when there's no featured active
            <></>
          )}
        </div>
      )}
      {!loading && sorted.length === 1 && sorted[0].status !== "active" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <AnnouncementCard a={sorted[0]} firmName={firmName} />
        </div>
      )}
    </div>
  );
}

function FeaturedCard({ a, firmName }: { a: Announcement; firmName: string }) {
  return (
    <article className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-fuchsia-500/15 via-violet-600/10 to-sky-500/10 p-5 ring-1 ring-fuchsia-300/30 transition hover:ring-fuchsia-300/50 sm:p-6">
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-fuchsia-500/25 blur-3xl transition group-hover:bg-fuchsia-500/35" />
      <div className="absolute -bottom-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />

      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-fuchsia-500/30">
            <Sparkles className="h-3 w-3" /> Featured
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-200 ring-1 ring-emerald-300/30">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            Live now
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-200">
            {firmName}
          </span>
        </div>

        <h3 className="mt-4 text-xl font-bold leading-tight text-white sm:text-2xl">{a.message}</h3>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> {a.start} – {a.end}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Megaphone className="h-3.5 w-3.5" /> Posted by brand
          </span>
        </div>

        {a.cta && a.link && (
          <a
            href={a.link}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-fuchsia-500/30 transition hover:brightness-110 hover:shadow-fuchsia-500/50"
          >
            {a.cta}
            <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        )}
      </div>
    </article>
  );
}

function AnnouncementCard({ a, firmName }: { a: Announcement; firmName: string }) {
  const isLive = a.status === "active";
  return (
    <article className="group glass flex flex-col rounded-2xl p-4 ring-1 ring-white/10 transition hover:ring-fuchsia-300/30">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500/30 to-violet-600/30 ring-1 ring-fuchsia-300/30">
          <Megaphone className="h-4 w-4 text-fuchsia-200" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {isLive ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-200 ring-1 ring-emerald-300/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-400/15 px-2 py-0.5 text-[9px] font-bold uppercase text-sky-200 ring-1 ring-sky-300/30">
                <Clock className="h-2.5 w-2.5" /> Upcoming
              </span>
            )}
            <span className="text-[9px] font-bold uppercase tracking-wider text-fuchsia-300/80">
              {firmName}
            </span>
          </div>
          <p className="mt-1.5 text-sm font-medium leading-snug text-white">{a.message}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/5 pt-3">
        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
          <Calendar className="h-3 w-3" /> {a.start} – {a.end}
        </span>
        {a.cta && a.link && (
          <a
            href={a.link}
            className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white ring-1 ring-white/10 transition hover:bg-fuchsia-500/20 hover:ring-fuchsia-300/40"
          >
            {a.cta}
            <ArrowUpRight className="h-3 w-3" />
          </a>
        )}
      </div>
    </article>
  );
}
