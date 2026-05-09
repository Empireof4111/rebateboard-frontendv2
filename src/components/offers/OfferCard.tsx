import { Flame, Copy, Check, Calendar, Gift, Sparkles, ExternalLink } from "lucide-react";
import { useState } from "react";
import type { AdminOffer } from "@/lib/admin-data";

const tagStyles: Record<string, string> = {
  exclusive: "bg-fuchsia-500/15 text-fuchsia-200 ring-fuchsia-400/30",
  new: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30",
  limited: "bg-amber-500/15 text-amber-200 ring-amber-400/30",
  trending: "bg-sky-500/15 text-sky-200 ring-sky-400/30",
  "free-account": "bg-yellow-500/15 text-yellow-200 ring-yellow-400/30",
};

const tagLabel: Record<string, string> = {
  exclusive: "EXCLUSIVE",
  new: "+ NEW OFFER",
  limited: "LIMITED",
  trending: "🔥 TRENDING",
  "free-account": "🎁 + FREE ACCOUNT",
};

function brandInitial(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function OfferCard({ offer, onOpen }: { offer: AdminOffer; onOpen?: (o: AdminOffer) => void }) {
  const [copied, setCopied] = useState(false);
  const from = offer.accentFrom ?? "#a855f7";
  const to = offer.accentTo ?? "#ec4899";

  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!offer.code) return;
    navigator.clipboard?.writeText(offer.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (offer.mode === "flyer" && offer.flyerUrl) {
    return (
      <button
        onClick={() => onOpen?.(offer)}
        className="group relative block w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left transition hover:border-white/20"
      >
        <div className="aspect-[4/3] w-full overflow-hidden">
          <img src={offer.flyerUrl} alt={offer.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3">
          <div className="text-xs text-white/70">{offer.brand}</div>
          <div className="text-sm font-semibold text-white">{offer.title}</div>
        </div>
        {offer.tags?.[0] && (
          <span className={`absolute left-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${tagStyles[offer.tags[0]] ?? ""}`}>
            {tagLabel[offer.tags[0]] ?? offer.tags[0]}
          </span>
        )}
      </button>
    );
  }

  return (
    <article
      onClick={() => onOpen?.(offer)}
      className="group relative grid cursor-pointer grid-cols-12 items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:border-white/20 sm:p-4"
    >
      {/* Discount block */}
      <div
        className="col-span-12 flex items-center justify-center gap-3 rounded-xl p-4 sm:col-span-3 sm:flex-col sm:gap-2"
        style={{ backgroundImage: `linear-gradient(135deg, ${from}33, ${to}33)`, boxShadow: `inset 0 0 0 1px ${from}40` }}
      >
        <Flame className="h-5 w-5 text-fuchsia-300 sm:absolute sm:left-2 sm:top-2" />
        <div className="text-2xl font-extrabold text-white sm:text-3xl">{offer.discount ?? "OFFER"}</div>
        {offer.tags?.includes("free-account") && (
          <div className="hidden rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold text-yellow-200 ring-1 ring-yellow-400/30 sm:inline-flex">
            <Gift className="mr-1 h-3 w-3" /> + FREE ACCOUNT
          </div>
        )}
      </div>

      {/* Brand + content */}
      <div className="col-span-12 sm:col-span-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white shadow-lg"
            style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
          >
            {brandInitial(offer.brand)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="truncate text-sm font-bold text-white">{offer.brand}</h3>
              {offer.tags?.map((t) => (
                <span key={t} className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ring-1 ${tagStyles[t] ?? ""}`}>
                  {tagLabel[t] ?? t}
                </span>
              ))}
            </div>
            <p className="mt-0.5 line-clamp-2 text-xs text-white/70">{offer.description ?? offer.title}</p>
          </div>
        </div>
      </div>

      {/* Code + CTA */}
      <div className="col-span-12 flex items-center justify-end gap-2 sm:col-span-3">
        {offer.code && (
          <button
            onClick={copy}
            className="group/code flex items-center overflow-hidden rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 text-xs font-semibold text-fuchsia-200 transition hover:border-fuchsia-400/60"
          >
            <span className="px-2 py-1.5">Code</span>
            <span className="border-l border-fuchsia-400/30 bg-fuchsia-500/15 px-2 py-1.5 font-mono">{offer.code}</span>
            <span className="px-2 py-1.5">{copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}</span>
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); if (offer.ctaUrl) window.open(offer.ctaUrl, "_blank"); else onOpen?.(offer); }}
          className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-fuchsia-500/30 transition hover:scale-105"
        >
          Apply
        </button>
      </div>

      {offer.expires && offer.expires !== "—" && (
        <div className="col-span-12 -mt-1 flex items-center justify-end gap-1 text-[10px] text-white/50 sm:col-span-12">
          <Calendar className="h-3 w-3" /> Ends: {offer.expires}
        </div>
      )}
    </article>
  );
}

export function OfferDetailModal({ offer, onClose }: { offer: AdminOffer | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  if (!offer) return null;
  const from = offer.accentFrom ?? "#a855f7";
  const to = offer.accentTo ?? "#ec4899";

  const copy = () => {
    if (!offer.code) return;
    navigator.clipboard?.writeText(offer.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur" onClick={onClose}>
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/15 bg-[#0a0418] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-40 overflow-hidden" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
          {offer.mode === "flyer" && offer.flyerUrl ? (
            <img src={offer.flyerUrl} alt={offer.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-5xl font-extrabold text-white drop-shadow">{offer.discount ?? "OFFER"}</div>
            </div>
          )}
          <button onClick={onClose} className="absolute right-3 top-3 rounded-full bg-black/40 px-2 py-1 text-xs text-white">✕</button>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <div className="text-xs uppercase tracking-wider text-fuchsia-300">{offer.category}</div>
            <h2 className="mt-1 text-2xl font-bold text-white">{offer.brand}</h2>
            <p className="text-sm text-white/70">{offer.title}</p>
          </div>

          <p className="text-sm leading-relaxed text-white/80">{offer.description}</p>

          {offer.tags && offer.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {offer.tags.map((t) => (
                <span key={t} className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${tagStyles[t] ?? ""}`}>
                  {tagLabel[t] ?? t}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs">
            {offer.startDate && (
              <div className="rounded-xl bg-white/5 p-3">
                <div className="text-white/50">Started</div>
                <div className="font-semibold text-white">{offer.startDate}</div>
              </div>
            )}
            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-white/50">Expires</div>
              <div className="font-semibold text-white">{offer.expires}</div>
            </div>
          </div>

          {offer.terms && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/70">
              <div className="mb-1 font-semibold text-white/90">Terms & conditions</div>
              {offer.terms}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            {offer.code && (
              <button
                onClick={copy}
                className="flex flex-1 items-center justify-between overflow-hidden rounded-full border-2 border-dashed border-fuchsia-400/40 bg-fuchsia-500/10 px-4 py-2.5 text-sm font-bold text-fuchsia-200"
              >
                <span className="text-xs uppercase tracking-wider text-fuchsia-300/70">Code</span>
                <span className="font-mono text-base">{offer.code}</span>
                <span>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</span>
              </button>
            )}
            <a
              href={offer.ctaUrl ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-fuchsia-500/30"
            >
              Apply <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-white/10 bg-white/5 px-6 py-3 text-[11px] text-white/50">
          <Sparkles className="h-3 w-3 text-fuchsia-400" /> Verified offer from RebateBoard
        </div>
      </div>
    </div>
  );
}
