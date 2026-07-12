import {
  ArrowUpRight,
  Calendar,
  Check,
  Copy,
  ExternalLink,
  Flame,
  Gift,
  Image as ImageIcon,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { useState } from "react";
import type { AdminOffer } from "@/lib/admin-data";
import type { OfferBrandFields } from "@/lib/offer-brand-assets";

type DisplayOffer = AdminOffer & OfferBrandFields;

const tagStyles: Record<string, string> = {
  exclusive: "bg-fuchsia-500/15 text-fuchsia-100 ring-fuchsia-400/30",
  new: "bg-emerald-500/15 text-emerald-100 ring-emerald-400/30",
  limited: "bg-fuchsia-500/15 text-fuchsia-100 ring-fuchsia-400/25",
  trending: "bg-sky-500/15 text-sky-100 ring-sky-400/30",
  "free-account": "bg-fuchsia-500/15 text-fuchsia-100 ring-fuchsia-400/25",
};

const tagLabel: Record<string, string> = {
  exclusive: "Exclusive",
  new: "New",
  limited: "Limited",
  trending: "Trending",
  "free-account": "Free account",
};

function brandInitial(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function BrandLogo({
  offer,
  className = "h-11 w-11 rounded-2xl",
}: {
  offer: DisplayOffer;
  className?: string;
}) {
  const from = offer.brandPrimaryColor ?? offer.accentFrom ?? "#a855f7";
  const to = offer.accentTo ?? "#ec4899";

  return (
    <div
      className={`grid shrink-0 place-items-center overflow-hidden bg-white/[0.06] text-[10px] font-black text-white shadow-lg ring-1 ring-white/10 ${className}`}
      style={
        !offer.brandLogo ? { background: `linear-gradient(135deg, ${from}, ${to})` } : undefined
      }
    >
      {offer.brandLogo ? (
        <img
          src={offer.brandLogo}
          alt={`${offer.brand} logo`}
          className="h-full w-full object-contain"
          loading="lazy"
        />
      ) : (
        <span className="text-white">{brandInitial(offer.brand)}</span>
      )}
    </div>
  );
}

function OfferTag({ tag }: { tag: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${tagStyles[tag] ?? "bg-white/10 text-white/70 ring-white/15"}`}
    >
      {tag === "free-account" && <Gift className="h-3 w-3" />}
      {tagLabel[tag] ?? tag}
    </span>
  );
}

function hasExpiry(offer: DisplayOffer) {
  return Boolean(offer.expires && offer.expires !== "—");
}

function offerDiscount(offer: DisplayOffer) {
  return offer.discount && offer.discount !== "—" ? offer.discount : "Exclusive Deal";
}

function openOffer(offer: DisplayOffer, onOpen?: (o: DisplayOffer) => void) {
  onOpen?.(offer);
}

export function OfferCard({
  offer,
  onOpen,
}: {
  offer: DisplayOffer;
  onOpen?: (o: DisplayOffer) => void;
}) {
  const [copied, setCopied] = useState(false);
  const from = offer.brandPrimaryColor ?? offer.accentFrom ?? "#a855f7";
  const to = offer.accentTo ?? "#ec4899";
  const isFlyer = offer.mode === "flyer" && Boolean(offer.flyerUrl);
  const discount = offerDiscount(offer);

  const copy = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!offer.code) return;
    void navigator.clipboard?.writeText(offer.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <article
      onClick={() => onOpen?.(offer)}
      className="group relative flex h-full min-h-[360px] cursor-pointer flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0d0618]/85 text-left shadow-[0_18px_50px_rgba(5,1,14,0.28)] transition hover:border-fuchsia-300/30 hover:bg-[#120821]/90 hover:shadow-[0_22px_70px_rgba(168,85,247,0.18)]"
    >
      <div
        className="relative aspect-[16/9] overflow-hidden bg-white/[0.035]"
        style={{
          backgroundImage: isFlyer
            ? `linear-gradient(135deg, ${from}18, ${to}18)`
            : `radial-gradient(circle at 22% 24%, ${from}66, transparent 32%), radial-gradient(circle at 86% 18%, ${to}66, transparent 30%), linear-gradient(135deg, ${from}24, ${to}24)`,
        }}
      >
        {isFlyer && offer.flyerUrl ? (
          <img
            src={offer.flyerUrl}
            alt={offer.title}
            className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1 text-[10px] font-semibold text-white/80 ring-1 ring-white/12">
                <Flame className="h-3 w-3 text-fuchsia-200" />
                Featured promo
              </div>
              <div className="mt-3 max-w-[12rem] text-3xl font-black leading-none text-white sm:text-4xl">
                {discount}
              </div>
              {offer.code && (
                <div className="mt-2 inline-flex rounded-full bg-black/25 px-2.5 py-1 font-mono text-[11px] font-bold text-white ring-1 ring-white/15">
                  {offer.code}
                </div>
              )}
            </div>
            <Sparkles className="h-16 w-16 text-white/25 sm:h-20 sm:w-20" />
          </div>
        )}

        <div className="absolute left-3 top-3 flex max-w-[70%] flex-wrap gap-1.5">
          {offer.tags?.slice(0, 2).map((tag) => (
            <OfferTag key={tag} tag={tag} />
          ))}
        </div>

        <span className="absolute bottom-3 right-3 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-semibold text-white/85 ring-1 ring-white/15 backdrop-blur">
          {offer.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start gap-3">
          <BrandLogo offer={offer} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate text-base font-bold text-white">{offer.brand}</h3>
              <span className="shrink-0 text-xs font-black text-white">{discount}</span>
            </div>
            <p className="mt-1 line-clamp-2 text-sm leading-snug text-white/72">{offer.title}</p>
          </div>
        </div>

        {offer.description && (
          <p className="mt-4 line-clamp-3 text-xs leading-relaxed text-white/58">
            {offer.description}
          </p>
        )}

        <div className="mt-auto pt-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            {offer.code ? (
              <button
                type="button"
                onClick={copy}
                className="flex min-w-0 items-center justify-between gap-2 overflow-hidden rounded-2xl bg-white/[0.055] px-3 py-2 text-left ring-1 ring-white/10 transition hover:bg-white/[0.08]"
              >
                <span className="min-w-0">
                  <span className="block text-[9px] font-semibold uppercase tracking-wider text-white/45">
                    Promo code
                  </span>
                  <span className="block truncate font-mono text-sm font-black text-white">
                    {offer.code}
                  </span>
                </span>
                {copied ? (
                  <Check className="h-4 w-4 shrink-0 text-emerald-300" />
                ) : (
                  <Copy className="h-4 w-4 shrink-0 text-fuchsia-200" />
                )}
              </button>
            ) : (
              <div className="flex min-w-0 items-center gap-2 rounded-2xl bg-white/[0.045] px-3 py-2 ring-1 ring-white/10">
                <Tag className="h-4 w-4 shrink-0 text-fuchsia-200" />
                <span className="truncate text-sm font-semibold text-white">{discount}</span>
              </div>
            )}

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openOffer(offer, onOpen);
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-white px-4 py-2 text-sm font-black text-[#13051f] transition hover:scale-[1.02]"
            >
              View Offer
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-white/45">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {hasExpiry(offer) ? `Ends ${offer.expires}` : "Open ended"}
              </span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-fuchsia-200/80">
              <Sparkles className="h-3.5 w-3.5" />
              Verified
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export function OfferDetailModal({
  offer,
  onClose,
}: {
  offer: DisplayOffer | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  if (!offer) return null;

  const from = offer.brandPrimaryColor ?? offer.accentFrom ?? "#a855f7";
  const to = offer.accentTo ?? "#ec4899";
  const isFlyer = offer.mode === "flyer" && Boolean(offer.flyerUrl);
  const discount = offerDiscount(offer);

  const copy = () => {
    if (!offer.code) return;
    void navigator.clipboard?.writeText(offer.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-4 backdrop-blur"
      onClick={onClose}
    >
      <div
        className="relative grid max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/15 bg-[#090414] shadow-2xl lg:grid-cols-[1.05fr_0.95fr]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/45 text-white ring-1 ring-white/15 backdrop-blur transition hover:bg-white/10"
          aria-label="Close offer"
        >
          <X className="h-4 w-4" />
        </button>

        <div
          className="relative min-h-[280px] overflow-hidden"
          style={{
            backgroundImage: isFlyer
              ? `linear-gradient(135deg, ${from}18, ${to}18)`
              : `radial-gradient(circle at 22% 20%, ${from}70, transparent 34%), radial-gradient(circle at 82% 16%, ${to}70, transparent 32%), linear-gradient(135deg, ${from}26, ${to}26)`,
          }}
        >
          {isFlyer && offer.flyerUrl ? (
            <img src={offer.flyerUrl} alt={offer.title} className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-full min-h-[340px] flex-col justify-between p-6">
              <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-black/25 px-3 py-1 text-[11px] font-semibold text-white/80 ring-1 ring-white/15">
                <ImageIcon className="h-3.5 w-3.5" />
                RebateBoard offer
              </div>
              <div>
                <BrandLogo offer={offer} className="h-20 w-20 rounded-3xl" />
                <div className="mt-5 max-w-sm text-5xl font-black leading-none text-white">
                  {discount}
                </div>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">{offer.title}</p>
              </div>
            </div>
          )}

          <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-2xl bg-black/40 p-2.5 pr-4 ring-1 ring-white/15 backdrop-blur">
            <BrandLogo offer={offer} className="h-11 w-11 rounded-2xl" />
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-white">{offer.brand}</div>
              <div className="truncate text-[11px] text-white/55">
                {offer.brandCategory ?? offer.category}
              </div>
            </div>
          </div>
        </div>

        <div className="max-h-[92vh] overflow-y-auto p-5 sm:p-6">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full bg-white/8 px-2.5 py-1 text-[10px] font-bold text-white/70 ring-1 ring-white/10">
              {offer.offerType || offer.category}
            </span>
            {offer.tags?.map((tag) => (
              <OfferTag key={tag} tag={tag} />
            ))}
          </div>

          <div className="mt-4">
            <h2 className="text-2xl font-black text-white sm:text-3xl">{offer.brand}</h2>
            <p className="mt-1 text-sm font-semibold text-fuchsia-100">{offer.title}</p>
          </div>

          {offer.description && (
            <p className="mt-4 text-sm leading-relaxed text-white/72">{offer.description}</p>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/[0.045] p-4 ring-1 ring-white/10">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
                Discount
              </div>
              <div className="mt-1 text-xl font-black text-white">{discount}</div>
            </div>
            <div className="rounded-2xl bg-white/[0.045] p-4 ring-1 ring-white/10">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
                Expires
              </div>
              <div className="mt-1 text-xl font-black text-white">
                {hasExpiry(offer) ? offer.expires : "Open ended"}
              </div>
            </div>
          </div>

          {offer.startDate && (
            <div className="mt-3 rounded-2xl bg-white/[0.035] p-3 text-xs text-white/65 ring-1 ring-white/10">
              Started {offer.startDate}
            </div>
          )}

          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl bg-white/[0.04] p-4 text-xs leading-relaxed text-white/65 ring-1 ring-white/10">
              <div className="mb-1 font-semibold text-white/90">Eligibility</div>
              {offer.eligibility || "Eligibility is confirmed during partner checkout."}
            </div>
            <div className="rounded-2xl bg-white/[0.04] p-4 text-xs leading-relaxed text-white/65 ring-1 ring-white/10">
              <div className="mb-1 font-semibold text-white/90">How to claim</div>
              {offer.howToClaim ||
                "Open the tracked partner page, apply the promo code when available, and complete the required signup or purchase."}
            </div>
            <details className="rounded-2xl bg-white/[0.04] p-4 text-xs leading-relaxed text-white/65 ring-1 ring-white/10">
              <summary className="cursor-pointer font-semibold text-white/90">
                Terms and conditions
              </summary>
              <p className="mt-2">
                {offer.terms ||
                  "No additional terms have been provided for this offer. Please confirm final eligibility on the partner checkout page."}
              </p>
            </details>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            {offer.code && (
              <button
                type="button"
                onClick={copy}
                className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-dashed border-fuchsia-300/35 bg-fuchsia-500/10 px-4 py-3 text-left text-fuchsia-100"
              >
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-fuchsia-200/70">
                    Promo code
                  </span>
                  <span className="block truncate font-mono text-lg font-black">{offer.code}</span>
                </span>
                {copied ? (
                  <Check className="h-5 w-5 shrink-0" />
                ) : (
                  <Copy className="h-5 w-5 shrink-0" />
                )}
              </button>
            )}

            {offer.partnerTrackingUrl || offer.ctaUrl ? (
              <a
                href={offer.partnerTrackingUrl || offer.ctaUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#13051f] transition hover:scale-[1.02]"
              >
                Claim offer
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/15"
              >
                Close
              </button>
            )}
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-white/[0.035] px-4 py-3 text-[11px] text-white/50 ring-1 ring-white/10">
            <Sparkles className="h-3.5 w-3.5 text-fuchsia-300" />
            Verified offer from RebateBoard
          </div>
        </div>
      </div>
    </div>
  );
}
