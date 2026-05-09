import { useMemo, useState } from "react";
import {
  Filter, Search, Bookmark, Sparkles, ChevronDown, X, Check, Star,
  Zap, Shield, Clock, TrendingUp, Award, Info, Mail, ArrowRight,
  Tag, Gift, Coins,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types & mock data                                                  */
/* ------------------------------------------------------------------ */
type Challenge = {
  id: string;
  program: "1-Step" | "2-Step" | "Instant";
  size: "10K" | "25K" | "50K" | "100K" | "200K";
  asset: "FX" | "Futures" | "Crypto";
  profitTarget: string;        // step1/step2 or single
  dailyLoss: string;
  maxLoss: string;
  ptdd: string;                // PT:DD ratio
  profitSplit: number;         // %
  payoutFreq: string;
  rrPoints: number;            // our Rebate Rewards Points
  price: number;
  originalPrice: number;
  badge?: "Top" | "New" | "Best Value";
};

const CHALLENGES: Challenge[] = [
  { id: "c1", program: "2-Step", size: "100K", asset: "FX", profitTarget: "8% / 5%", dailyLoss: "5%", maxLoss: "10%", ptdd: "1:0.77", profitSplit: 80, payoutFreq: "On Demand",          rrPoints: 216, price: 431.20, originalPrice: 539.00, badge: "Top" },
  { id: "c2", program: "2-Step", size: "100K", asset: "FX", profitTarget: "10% / 5%", dailyLoss: "5%", maxLoss: "10%", ptdd: "1:0.67", profitSplit: 90, payoutFreq: "14 Days",            rrPoints: 472, price: 214.50, originalPrice: 429.00, badge: "Best Value" },
  { id: "c3", program: "2-Step", size: "100K", asset: "FX", profitTarget: "10% / 5%", dailyLoss: "5%", maxLoss: "10%", ptdd: "1:0.67", profitSplit: 80, payoutFreq: "14 days from 1st trade", rrPoints: 176, price: 439.00, originalPrice: 540.00 },
  { id: "c4", program: "2-Step", size: "100K", asset: "FX", profitTarget: "10% / 5%", dailyLoss: "5%", maxLoss: "10%", ptdd: "1:0.67", profitSplit: 80, payoutFreq: "14 days from 1st trade", rrPoints: 216, price: 540.00, originalPrice: 540.00 },
  { id: "c5", program: "1-Step", size: "50K",  asset: "FX", profitTarget: "8%",       dailyLoss: "4%", maxLoss: "8%",  ptdd: "1:1.00", profitSplit: 85, payoutFreq: "Bi-Weekly",          rrPoints: 328, price: 298.20, originalPrice: 497.00, badge: "New" },
  { id: "c6", program: "Instant", size: "25K", asset: "FX", profitTarget: "—",        dailyLoss: "3%", maxLoss: "6%",  ptdd: "—",      profitSplit: 70, payoutFreq: "On Demand",          rrPoints: 531, price: 482.30, originalPrice: 689.00 },
  { id: "c7", program: "2-Step", size: "200K", asset: "FX", profitTarget: "10% / 5%", dailyLoss: "5%", maxLoss: "10%", ptdd: "1:0.67", profitSplit: 80, payoutFreq: "30 Days",            rrPoints: 845, price: 384.30, originalPrice: 549.00 },
];

const SIZES = ["All", "10K", "25K", "50K", "100K", "200K"] as const;
const PROGRAMS = ["All", "1-Step", "2-Step", "Instant"] as const;
const ASSETS = ["All", "FX", "Futures", "Crypto"] as const;

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export function FirmChallenges({ firmName }: { firmName: string }) {
  const [size, setSize] = useState<typeof SIZES[number]>("All");
  const [program, setProgram] = useState<typeof PROGRAMS[number]>("All");
  const [asset, setAsset] = useState<typeof ASSETS[number]>("All");
  const [discount, setDiscount] = useState(true);
  const [q, setQ] = useState("");
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<Challenge | null>(null);

  const list = useMemo(() => {
    return CHALLENGES.filter((c) => {
      if (size !== "All" && c.size !== size) return false;
      if (program !== "All" && c.program !== program) return false;
      if (asset !== "All" && c.asset !== asset) return false;
      if (q && !`${c.program} ${c.size} ${c.asset}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [size, program, asset, q]);

  const toggleBookmark = (id: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* ------------ Filter bar ------------- */}
      <div className="glass rounded-2xl p-4 ring-1 ring-violet-400/20">
        <div className="flex flex-wrap items-center gap-2">
          <button className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold">
            <Filter className="h-3 w-3" /> Filter
          </button>

          <PillSelect label="Assets" value={asset} options={ASSETS as unknown as string[]} onChange={(v) => setAsset(v as typeof ASSETS[number])} />
          <PillSelect label="Size"   value={size}   options={SIZES   as unknown as string[]} onChange={(v) => setSize(v as typeof SIZES[number])} />
          <PillSelect label="Program" value={program} options={PROGRAMS as unknown as string[]} onChange={(v) => setProgram(v as typeof PROGRAMS[number])} />

          <div className="mx-1 h-5 w-px bg-white/15" />

          <button
            onClick={() => setDiscount((d) => !d)}
            className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold ring-1 ring-white/10"
          >
            <span className={`relative inline-block h-4 w-7 rounded-full transition ${discount ? "bg-gradient-to-r from-fuchsia-500 to-violet-500" : "bg-white/15"}`}>
              <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition ${discount ? "left-3.5" : "left-0.5"}`} />
            </span>
            Apply Discount
          </button>

          <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] text-muted-foreground ring-1 ring-white/10">
            <span className="font-semibold text-white">{list.length}</span> Challenges
          </span>

          <div className="ml-auto flex items-center gap-2">
            <div className="glass-pill flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px]">
              <Search className="h-3 w-3 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="w-28 bg-transparent outline-none placeholder:text-muted-foreground"
              />
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_0_18px_rgba(192,132,252,0.4)]">
              <Sparkles className="h-3 w-3" /> Customize
            </button>
          </div>
        </div>

        {/* Live indicator */}
        <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Live data · synced 2 min ago · prices verified by RebateBoard
        </div>
      </div>

      {/* ------------ Table (desktop) ------------- */}
      <div className="hidden md:block glass rounded-2xl ring-1 ring-violet-400/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-white/[0.04] text-[10px] uppercase text-muted-foreground tracking-wider">
                <Th>Program</Th>
                <Th>Size</Th>
                <Th>Profit Target</Th>
                <Th>Daily Loss</Th>
                <Th>Max Loss</Th>
                <Th>PT:DD</Th>
                <Th>Profit Split</Th>
                <Th>Payout Freq.</Th>
                <Th>
                  <span className="inline-flex items-center gap-1">
                    <Coins className="h-3 w-3 text-amber-300" /> RR Points
                  </span>
                </Th>
                <Th className="text-right">Price</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {list.map((c) => {
                const off = Math.round(((c.originalPrice - c.price) / c.originalPrice) * 100);
                const bookmarked = bookmarks.has(c.id);
                return (
                  <tr key={c.id} className="border-t border-white/5 transition hover:bg-fuchsia-500/[0.06]">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleBookmark(c.id)} className="text-muted-foreground hover:text-fuchsia-300">
                          <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? "fill-fuchsia-400 text-fuchsia-400" : ""}`} />
                        </button>
                        <div>
                          <div className="font-semibold text-white">{c.program}</div>
                          {c.badge && (
                            <span className="mt-0.5 inline-block rounded-full bg-gradient-to-r from-amber-400 to-fuchsia-500 px-1.5 py-0.5 text-[8px] font-bold uppercase text-white">
                              {c.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-semibold text-white">{c.size}</td>
                    <td className="px-3 py-3 text-white">{c.profitTarget}</td>
                    <td className="px-3 py-3">{c.dailyLoss}</td>
                    <td className="px-3 py-3">{c.maxLoss}</td>
                    <td className="px-3 py-3">{c.ptdd}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-white">{c.profitSplit}%</span>
                        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full bg-gradient-to-r from-fuchsia-400 to-violet-500"
                            style={{ width: `${c.profitSplit}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground max-w-[140px]">{c.payoutFreq}</td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-0.5 text-amber-200 ring-1 ring-amber-400/30">
                        <Coins className="h-3 w-3" /> {c.rrPoints}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="font-bold text-white">${c.price.toFixed(2)}</div>
                      {discount && off > 0 && (
                        <div className="text-[10px] text-muted-foreground line-through">${c.originalPrice.toFixed(2)}</div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => setActive(c)}
                        className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:shadow-[0_0_18px_rgba(192,132,252,0.5)]"
                      >
                        Buy <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------ Mobile cards ------------- */}
      <div className="grid gap-3 md:hidden">
        {list.map((c) => {
          const off = Math.round(((c.originalPrice - c.price) / c.originalPrice) * 100);
          return (
            <div key={c.id} className="glass rounded-2xl p-4 ring-1 ring-violet-400/20">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">{c.program} · {c.size}</div>
                  {c.badge && (
                    <span className="mt-1 inline-block rounded-full bg-gradient-to-r from-amber-400 to-fuchsia-500 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                      {c.badge}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-bold text-white">${c.price.toFixed(2)}</div>
                  {discount && off > 0 && <div className="text-[10px] text-muted-foreground line-through">${c.originalPrice.toFixed(2)}</div>}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                <Stat label="Profit Target" value={c.profitTarget} />
                <Stat label="Profit Split" value={`${c.profitSplit}%`} />
                <Stat label="Daily / Max Loss" value={`${c.dailyLoss} / ${c.maxLoss}`} />
                <Stat label="Payout" value={c.payoutFreq} />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-200 ring-1 ring-amber-400/30">
                  <Coins className="h-3 w-3" /> {c.rrPoints} RR
                </span>
                <button
                  onClick={() => setActive(c)}
                  className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-[11px] font-semibold text-white"
                >
                  Buy <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ------------ Checkout modal ------------- */}
      {active && (
        <CheckoutModal
          firmName={firmName}
          challenge={active}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2.5 text-left font-medium ${className}`}>{children}</th>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/[0.04] px-2 py-1.5 ring-1 ring-white/5">
      <div className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-semibold text-white">{value}</div>
    </div>
  );
}

function PillSelect({
  label, value, options, onChange,
}: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold"
      >
        <span className="text-muted-foreground">{label}:</span>
        <span className="text-white">{value}</span>
        <ChevronDown className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-40 mt-1 min-w-[120px] overflow-hidden rounded-xl border border-white/15 bg-[#1f0d3d]/95 p-1 backdrop-blur">
            {options.map((o) => (
              <button
                key={o}
                onClick={() => { onChange(o); setOpen(false); }}
                className={`block w-full rounded-lg px-3 py-1.5 text-left text-[11px] transition ${
                  o === value ? "bg-fuchsia-500/30 text-white" : "text-muted-foreground hover:bg-white/10 hover:text-white"
                }`}
              >
                {o}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Checkout Modal                                                     */
/* ------------------------------------------------------------------ */
function CheckoutModal({
  firmName, challenge, onClose,
}: { firmName: string; challenge: Challenge; onClose: () => void }) {
  const [tab, setTab] = useState<"details" | "offers">("details");
  const [email, setEmail] = useState("");
  const [agreeMarketing, setAgreeMarketing] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const off = Math.round(((challenge.originalPrice - challenge.price) / challenge.originalPrice) * 100);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center px-4 py-6 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-[#0b0517]/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border border-violet-400/30 bg-gradient-to-br from-[#26113f] via-[#1f0d3d] to-[#150829] p-5 shadow-[0_30px_80px_rgba(120,30,180,0.5)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Checkout</h3>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Firm card */}
        <div className="mt-4 rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-xs font-bold text-violet-700">
              {firmName.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">{firmName}</div>
              <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-[10px] font-semibold ring-1 ring-fuchsia-300/30">
                <Star className="h-3 w-3 fill-amber-300 text-amber-300" /> 4.6 · 191 reviews
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">
                {challenge.program} · {challenge.size} · {challenge.asset}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-white">${challenge.price.toFixed(2)}</div>
              {off > 0 && <div className="text-[11px] text-muted-foreground line-through">${challenge.originalPrice.toFixed(2)}</div>}
            </div>
          </div>

          {/* Discount block */}
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2 rounded-xl bg-gradient-to-br from-fuchsia-500/15 to-violet-500/10 p-3 ring-1 ring-fuchsia-300/30">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-fuchsia-400 to-violet-500">
                <Tag className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-base font-bold leading-none">
                  <span className="text-fuchsia-300">{off}%</span> <span className="text-white">OFF</span>
                </div>
                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-200 ring-1 ring-amber-400/30">
                  <Gift className="h-2.5 w-2.5" /> + {challenge.rrPoints} RR Points
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end">
              <div className="rounded-lg bg-white/10 px-2 py-1.5 text-center ring-1 ring-white/15">
                <div className="text-[8px] uppercase text-muted-foreground">Code</div>
                <div className="font-mono text-[11px] font-bold text-white">REBATE{off}</div>
              </div>
            </div>
            <p className="col-span-2 text-[10px] leading-relaxed text-muted-foreground">
              {off}% off this challenge. RR Points unlock cashback, prop-firm discounts, and partner rewards across RebateBoard.
            </p>
          </div>

          {/* Tabs */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => setTab("details")}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ring-1 transition ${
                tab === "details" ? "bg-white text-[#1a0b2e] ring-white/40" : "bg-white/5 text-white ring-white/10 hover:bg-white/10"
              }`}
            >
              Challenge Details
            </button>
            <button
              onClick={() => setTab("offers")}
              className={`inline-flex items-center justify-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold ring-1 transition ${
                tab === "offers" ? "bg-white text-[#1a0b2e] ring-white/40" : "bg-white/5 text-white ring-white/10 hover:bg-white/10"
              }`}
            >
              All Offers <span className="rounded-full bg-fuchsia-500/40 px-1.5 text-[9px]">3</span>
            </button>
          </div>

          {/* Tab body */}
          <div className="mt-3">
            {tab === "details" ? (
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <DetailRow icon={TrendingUp} label="Profit Target" value={challenge.profitTarget} />
                <DetailRow icon={Shield} label="Max Loss" value={challenge.maxLoss} />
                <DetailRow icon={Award} label="Profit Split" value={`${challenge.profitSplit}%`} />
                <DetailRow icon={Clock} label="Payout" value={challenge.payoutFreq} />
                <DetailRow icon={Zap} label="PT:DD" value={challenge.ptdd} />
                <DetailRow icon={Coins} label="RR Points" value={`${challenge.rrPoints}`} />
              </div>
            ) : (
              <div className="space-y-2">
                {[
                  { name: "Bi-Weekly Boost", off: "+10% RR", desc: "Extra rewards on weekly payouts" },
                  { name: "First-Time Buyer", off: "5% OFF", desc: "Applies automatically at checkout" },
                  { name: "Reset Discount", off: "20% OFF", desc: "On future resets — auto-stacked" },
                ].map((o) => (
                  <div key={o.name} className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2 ring-1 ring-white/10">
                    <div>
                      <div className="text-[11px] font-semibold text-white">{o.name}</div>
                      <div className="text-[9px] text-muted-foreground">{o.desc}</div>
                    </div>
                    <span className="rounded-full bg-fuchsia-500/30 px-2 py-0.5 text-[10px] font-bold text-white ring-1 ring-fuchsia-300/30">{o.off}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="mt-4">
          <label className="text-[11px] font-semibold text-white">Email</label>
          <div className="mt-1 flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2.5 ring-1 ring-white/10 focus-within:ring-fuchsia-400/40">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              type="email"
              className="w-full bg-transparent text-[12px] text-white outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Consents */}
        <div className="mt-3 space-y-2 text-[10px] text-muted-foreground">
          <label className="flex items-start gap-2 cursor-pointer">
            <Checkbox checked={agreeMarketing} onChange={setAgreeMarketing} />
            <span>I'd like to receive exclusive offers and RR-points updates.</span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer">
            <Checkbox checked={agreeTerms} onChange={setAgreeTerms} />
            <span>
              I agree to RebateBoard's{" "}
              <a className="text-fuchsia-300 underline">Terms of Use</a> and{" "}
              <a className="text-fuchsia-300 underline">Privacy Policy</a>.
            </span>
          </label>
        </div>

        {/* CTAs */}
        <button
          disabled={!agreeTerms}
          className="mt-4 w-full rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 py-3 text-sm font-bold text-white shadow-[0_10px_30px_rgba(192,132,252,0.4)] transition hover:shadow-[0_14px_40px_rgba(192,132,252,0.6)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Proceed to Checkout · ${challenge.price.toFixed(2)}
        </button>
        <button
          onClick={onClose}
          className="mt-2 w-full rounded-full bg-white/5 py-2.5 text-[12px] font-semibold text-white ring-1 ring-white/10 hover:bg-white/10"
        >
          Continue without email
        </button>

        {/* Trust strip */}
        <div className="mt-4 flex items-center justify-center gap-3 text-[9px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Shield className="h-2.5 w-2.5" /> Secure checkout</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1"><Check className="h-2.5 w-2.5" /> Instant activation</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1"><Info className="h-2.5 w-2.5" /> 24h support</span>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/[0.04] px-2.5 py-2 ring-1 ring-white/5">
      <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wide text-muted-foreground">
        <Icon className="h-2.5 w-2.5" /> {label}
      </div>
      <div className="mt-0.5 text-[11px] font-semibold text-white">{value}</div>
    </div>
  );
}

function Checkbox({ checked, onChange }: { checked: boolean; onChange: (b: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded ring-1 transition ${
        checked
          ? "bg-gradient-to-br from-fuchsia-500 to-violet-600 ring-fuchsia-300/40"
          : "bg-white/5 ring-white/20"
      }`}
    >
      {checked && <Check className="h-2.5 w-2.5 text-white" />}
    </button>
  );
}
