import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BRANDS, TRANSACTIONS, GLOBAL_STATS, fmtUsd, fmtMins } from "@/lib/payouts-data";
import {
  Activity, ShieldCheck, Zap, TrendingUp, Clock, Trophy, Search,
  AlertTriangle, CheckCircle2, Hourglass, ChevronRight, Send, BarChart3, Globe,
} from "lucide-react";

export const Route = createFileRoute("/payouts/")({
  head: () => ({
    meta: [
      { title: "Prop Firm Payout Tracker — RebateBoard" },
      { name: "description", content: "Track real crypto payouts from prop firms, verified on-chain and ranked by activity, speed, and reliability." },
      { property: "og:title", content: "Prop Firm Payout Tracker — RebateBoard" },
      { property: "og:description", content: "Real on-chain payout intelligence for the prop firm industry." },
    ],
  }),
  component: PayoutsPage,
});

function StatCard({ icon: Icon, label, value, hint }: any) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <Icon className="h-4 w-4 text-fuchsia-400" /> {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function VerifBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: any; label: string }> = {
    verified: { cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", icon: CheckCircle2, label: "Verified" },
    pending: { cls: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30", icon: Hourglass, label: "Pending" },
    flagged: { cls: "bg-red-500/15 text-red-300 border-red-500/30", icon: AlertTriangle, label: "Flagged" },
  };
  const v = map[status] ?? map.verified;
  const Icon = v.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${v.cls}`}>
      <Icon className="h-3 w-3" /> {v.label}
    </span>
  );
}

function PayoutsPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [chain, setChain] = useState("All");
  const [tf, setTf] = useState("7D");
  const [currency, setCurrency] = useState("All");
  const [verification, setVerification] = useState("All");
  const [region, setRegion] = useState("Global");
  const [sortBy, setSortBy] = useState<"total" | "latest" | "speed" | "reliability" | "tbi">("total");

  const brands = useMemo(() => {
    const filtered = BRANDS.filter((b) => b.name.toLowerCase().includes(q.toLowerCase()));
    const sorters: Record<typeof sortBy, (a: typeof BRANDS[number], b: typeof BRANDS[number]) => number> = {
      total: (a, b) => b.totalPaidUsd - a.totalPaidUsd,
      latest: (a, b) => a.lastPayoutAt.localeCompare(b.lastPayoutAt),
      speed: (a, b) => a.averagePayoutTimeMinutes - b.averagePayoutTimeMinutes,
      reliability: (a, b) => b.payoutReliabilityScore - a.payoutReliabilityScore,
      tbi: (a, b) => b.tbiScore - a.tbiScore,
    };
    return filtered.sort(sorters[sortBy]);
  }, [q, sortBy]);

  const feed = useMemo(() => {
    return TRANSACTIONS
      .filter((t) => chain === "All" || t.chain === chain)
      .filter((t) => currency === "All" || t.currency === currency)
      .filter((t) => verification === "All" || t.verificationStatus === verification.toLowerCase())
      .filter((t) => region === "Global" || t.region === region)
      .sort((a, b) => a.minutesAgo - b.minutesAgo);
  }, [chain, currency, verification, region]);

  const fastest = [...BRANDS].sort((a, b) => a.averagePayoutTimeMinutes - b.averagePayoutTimeMinutes)[0];
  const reliable = [...BRANDS].sort((a, b) => b.payoutReliabilityScore - a.payoutReliabilityScore)[0];
  const biggest = [...TRANSACTIONS].sort((a, b) => b.amountUsd - a.amountUsd)[0];

  return (
    <div className="min-h-screen bg-[#0c0418] text-white">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 space-y-10">
        {/* HERO */}
        <section className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              {["Live On-Chain Data", "Crypto Payouts Only", "TX Hash Verified", "Not Financial Advice"].map((b) => (
                <span key={b} className="glass-pill rounded-full px-3 py-1 text-[11px] text-muted-foreground">{b}</span>
              ))}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-white via-fuchsia-200 to-violet-300 bg-clip-text text-transparent">
              Prop Firm Payout Tracker
            </h1>
            <p className="mt-4 text-muted-foreground max-w-xl">
              Track real crypto payouts from prop firms — verified on-chain and ranked by payout activity, speed, and reliability.
            </p>
            <div className="mt-6 flex gap-3">
              <a href="#brands" className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-2.5 text-sm font-semibold shadow-[0_0_30px_rgba(192,132,252,0.4)]">Explore Payouts</a>
              <a href="#submit" className="glass rounded-full px-5 py-2.5 text-sm">Submit Payout</a>
            </div>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>
              Live Mini Feed
            </div>
            <div className="space-y-2">
              {feed.slice(0, 5).map((t) => (
                <Link key={t.id} to="/payouts/$brandSlug" params={{ brandSlug: t.brandSlug }} className="flex items-center justify-between rounded-xl border border-white/5 px-3 py-2 hover:bg-white/5">
                  <div className="text-sm">
                    <span className="text-emerald-300 font-semibold">{fmtUsd(t.amountUsd)}</span>
                    <span className="text-muted-foreground"> paid by </span>
                    <span className="text-white">{t.brandName}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{fmtMins(t.minutesAgo)} ago</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* GLOBAL STATS */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard icon={TrendingUp} label="Total Paid" value={fmtUsd(GLOBAL_STATS.totalPaidUsd)} hint="All-time verified" />
          <StatCard icon={Activity} label="Total Payouts" value={GLOBAL_STATS.totalPayouts.toLocaleString()} />
          <StatCard icon={ShieldCheck} label="Verified TXs" value={`${GLOBAL_STATS.verifiedPercent}%`} />
          <StatCard icon={Clock} label="Avg Payout Time" value={GLOBAL_STATS.avgPayoutTime} />
          <StatCard icon={Zap} label="Active Firms" value={GLOBAL_STATS.activeFirms} />
          <StatCard icon={Trophy} label="Largest Payout" value={fmtUsd(GLOBAL_STATS.largestPayout)} />
        </section>

        {/* FILTERS */}
        <section className="glass rounded-2xl p-4 sticky top-2 z-30">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 glass-pill rounded-full px-3 py-1.5 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search firm" className="bg-transparent outline-none text-sm flex-1" />
            </div>
            <div className="flex gap-1">
              {["24H", "7D", "30D", "90D", "All"].map((t) => (
                <button key={t} onClick={() => setTf(t)} className={`rounded-full px-3 py-1.5 text-xs ${tf === t ? "bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-500/40" : "glass-pill text-muted-foreground"}`}>{t}</button>
              ))}
            </div>
            <select value={chain} onChange={(e) => setChain(e.target.value)} className="glass-pill rounded-full px-3 py-1.5 text-xs bg-transparent">
              {["All", "TRC20", "ERC20", "BEP20", "BTC"].map((c) => <option key={c} value={c} className="bg-[#150829]">Chain: {c}</option>)}
            </select>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="glass-pill rounded-full px-3 py-1.5 text-xs bg-transparent">
              {["All", "USDT", "USDC", "BTC", "ETH"].map((c) => <option key={c} value={c} className="bg-[#150829]">Currency: {c}</option>)}
            </select>
            <select value={verification} onChange={(e) => setVerification(e.target.value)} className="glass-pill rounded-full px-3 py-1.5 text-xs bg-transparent">
              {["All", "Verified", "Pending", "Flagged"].map((c) => <option key={c} value={c} className="bg-[#150829]">{c}</option>)}
            </select>
            <select value={region} onChange={(e) => setRegion(e.target.value)} className="glass-pill rounded-full px-3 py-1.5 text-xs bg-transparent">
              {["Global", "Africa", "Asia", "Europe", "North America"].map((c) => <option key={c} value={c} className="bg-[#150829]">{c}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="glass-pill rounded-full px-3 py-1.5 text-xs bg-transparent">
              <option value="total" className="bg-[#150829]">Sort: Total Paid</option>
              <option value="latest" className="bg-[#150829]">Sort: Latest Payout</option>
              <option value="speed" className="bg-[#150829]">Sort: Speed</option>
              <option value="reliability" className="bg-[#150829]">Sort: Reliability</option>
              <option value="tbi" className="bg-[#150829]">Sort: TBI Score</option>
            </select>
          </div>
        </section>

        {/* RANKING TABLE — desktop */}
        <section id="brands">
          <h2 className="text-2xl font-semibold mb-4">Brand Ranking</h2>
          <div className="hidden md:block glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b border-white/5">
                  <tr>
                    {["#", "Brand", "Total Paid", "Payouts", "Latest", "Avg Time", "Largest", "Reliability", "TBI", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {brands.map((b, i) => (
                    <tr key={b.id} className="border-b border-white/5 hover:bg-white/5 cursor-pointer" onClick={() => navigate({ to: "/payouts/$brandSlug", params: { brandSlug: b.slug } })}>
                      <td className="px-4 py-3 text-muted-foreground">#{i + 1}</td>
                      <td className="px-4 py-3">
                        <Link to="/payouts/$brandSlug" params={{ brandSlug: b.slug }} className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                          <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${b.logoColor}`} />
                          <div>
                            <div className="text-white font-medium">{b.name}</div>
                            <div className="flex gap-1 mt-0.5">
                              {b.badges.slice(0, 2).map((bd) => (
                                <span key={bd} className="text-[9px] rounded-full bg-white/5 px-1.5 py-0.5 text-muted-foreground">{bd}</span>
                              ))}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-semibold">{fmtUsd(b.totalPaidUsd)}</td>
                      <td className="px-4 py-3">{b.totalPayoutCount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-emerald-300">{b.lastPayoutAt}</td>
                      <td className="px-4 py-3">{fmtMins(b.averagePayoutTimeMinutes)}</td>
                      <td className="px-4 py-3">{fmtUsd(b.largestPayoutUsd)}</td>
                      <td className="px-4 py-3"><span className="text-emerald-300">{b.payoutReliabilityScore}%</span></td>
                      <td className="px-4 py-3">{b.tbiScore}/10</td>
                      <td className="px-4 py-3">
                        <Link to="/payouts/$brandSlug" params={{ brandSlug: b.slug }} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 rounded-full bg-fuchsia-500/20 border border-fuchsia-500/40 text-fuchsia-200 px-3 py-1 text-xs font-medium">
                          View Details <ChevronRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden grid gap-3">
            {brands.map((b, i) => (
              <Link key={b.id} to="/payouts/$brandSlug" params={{ brandSlug: b.slug }} className="glass rounded-2xl p-4 block">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-muted-foreground">#{i + 1}</div>
                    <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${b.logoColor}`} />
                    <div>
                      <div className="font-medium">{b.name}</div>
                      <div className="text-[10px] text-muted-foreground">TBI {b.tbiScore} · {b.payoutReliabilityScore}% reliable</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-fuchsia-300" />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                  <div><div className="text-muted-foreground text-[10px]">Total Paid</div><div className="font-semibold">{fmtUsd(b.totalPaidUsd)}</div></div>
                  <div><div className="text-muted-foreground text-[10px]">Avg Time</div><div>{fmtMins(b.averagePayoutTimeMinutes)}</div></div>
                  <div><div className="text-muted-foreground text-[10px]">Latest</div><div className="text-emerald-300">{b.lastPayoutAt}</div></div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* LIVE FEED */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Live Payout Feed</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {feed.map((t) => {
              const brand = BRANDS.find((b) => b.slug === t.brandSlug)!;
              return (
                <div key={t.id} className="glass rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${brand.logoColor}`} />
                      <div>
                        <div className="text-sm font-medium">{t.brandName}</div>
                        <div className="text-[10px] text-muted-foreground">{t.chain} · {t.region}</div>
                      </div>
                    </div>
                    <VerifBadge status={t.verificationStatus} />
                  </div>
                  <div className="text-2xl font-semibold text-emerald-300">{fmtUsd(t.amountUsd)} <span className="text-xs text-muted-foreground">{t.currency}</span></div>
                  <div className="text-[11px] text-muted-foreground mt-1">Paid {fmtMins(t.minutesAgo)} ago · in {fmtMins(t.payoutTimeMinutes)}</div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="font-mono text-muted-foreground">TX: {t.txHash.slice(0, 6)}...{t.txHash.slice(-4)}</span>
                    <Link to="/payouts/$brandSlug/transaction/$txId" params={{ brandSlug: t.brandSlug, txId: t.id }} className="text-fuchsia-300">View TX</Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* INTELLIGENCE */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Payout Intelligence</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="glass rounded-2xl p-5">
              <div className="text-xs text-muted-foreground flex items-center gap-2"><Zap className="h-4 w-4 text-yellow-400" /> Fastest Paying Firm</div>
              <div className="mt-2 text-xl font-semibold">{fastest.name}</div>
              <div className="text-sm text-emerald-300">Avg {fmtMins(fastest.averagePayoutTimeMinutes)}</div>
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="text-xs text-muted-foreground flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Most Reliable</div>
              <div className="mt-2 text-xl font-semibold">{reliable.name}</div>
              <div className="text-sm text-emerald-300">{reliable.payoutReliabilityScore}% reliability</div>
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="text-xs text-muted-foreground flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-400" /> Biggest Payout</div>
              <div className="mt-2 text-xl font-semibold">{fmtUsd(biggest.amountUsd)}</div>
              <div className="text-sm text-muted-foreground">{biggest.brandName}</div>
            </div>
            <div className="glass rounded-2xl p-5 md:col-span-2">
              <div className="text-xs text-muted-foreground flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-400" /> Delay Alert</div>
              <div className="mt-2 text-sm">Alpha Capital average payout time increased by <span className="text-red-300 font-semibold">42%</span> over the last 7 days.</div>
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="text-xs text-muted-foreground flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Newly Verified</div>
              <div className="mt-2 text-sm">3 firms onboarded this week</div>
            </div>
          </div>
        </section>

        {/* CHARTS */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-fuchsia-300" /> Payout Analytics</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              { title: "Payout Volume Over Time", bars: [40, 55, 48, 70, 62, 88, 95] },
              { title: "Number of Payouts Over Time", bars: [30, 45, 55, 50, 72, 68, 90] },
              { title: "Avg Payout Time by Firm", bars: [80, 65, 92, 70, 55, 88, 60] },
              { title: "Distribution by Chain", bars: [70, 50, 35, 20] },
              { title: "Payouts by Region", bars: [60, 75, 45, 30, 50] },
              { title: "Top 10 Largest Payouts", bars: [100, 88, 76, 70, 65, 60, 55, 50, 45, 40] },
            ].map((c) => (
              <div key={c.title} className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-medium flex items-center gap-2"><Globe className="h-3 w-3 text-fuchsia-300" />{c.title}</div>
                  <div className="text-[10px] text-muted-foreground">7D</div>
                </div>
                <div className="flex items-end gap-1 h-24">
                  {c.bars.map((v, i) => (
                    <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-fuchsia-600/40 to-violet-400/80" style={{ height: `${v}%` }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* HOW WE VERIFY */}
        <section className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-2"><ShieldCheck className="h-5 w-5 text-emerald-400" /><h2 className="text-2xl font-semibold">How RebateBoard Verifies Payouts</h2></div>
          <p className="text-sm text-muted-foreground mb-5">Every public payout passes a strict on-chain verification process before appearing on the tracker.</p>
          <ol className="grid gap-3 md:grid-cols-5">
            {[
              "Trader submits TX hash",
              "Blockchain confirmation check",
              "Match amount, chain, timestamp, and firm wallet",
              "Verified payouts added to public tracker",
              "Suspicious or incomplete submissions are flagged",
            ].map((step, i) => (
              <li key={step} className="rounded-xl border border-white/5 p-4">
                <div className="text-fuchsia-300 text-xs font-semibold">Step {i + 1}</div>
                <div className="text-sm mt-1">{step}</div>
              </li>
            ))}
          </ol>
        </section>

        {/* SUBMIT */}
        <section id="submit" className="glass rounded-2xl p-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold">Help Traders Verify Real Payouts</h2>
              <p className="mt-2 text-muted-foreground text-sm">Submit your crypto payout TX hash and help improve transparency across the prop firm industry.</p>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <p>1. Submit TX hash</p>
                <p>2. We verify on-chain</p>
                <p>3. Match firm wallet, amount, timestamp</p>
                <p>4. Verified payouts appear publicly</p>
              </div>
            </div>
            <form className="grid gap-3 grid-cols-2">
              <input placeholder="Brand" className="glass rounded-xl px-3 py-2 text-sm bg-transparent col-span-2" />
              <input placeholder="Amount" className="glass rounded-xl px-3 py-2 text-sm bg-transparent" />
              <select className="glass rounded-xl px-3 py-2 text-sm bg-transparent">
                <option className="bg-[#150829]">USDT</option><option className="bg-[#150829]">USDC</option><option className="bg-[#150829]">BTC</option><option className="bg-[#150829]">ETH</option>
              </select>
              <select className="glass rounded-xl px-3 py-2 text-sm bg-transparent col-span-2">
                <option className="bg-[#150829]">TRC20</option><option className="bg-[#150829]">ERC20</option><option className="bg-[#150829]">BEP20</option><option className="bg-[#150829]">BTC</option>
              </select>
              <input placeholder="TX Hash" className="glass rounded-xl px-3 py-2 text-sm bg-transparent col-span-2 font-mono" />
              <input type="date" className="glass rounded-xl px-3 py-2 text-sm bg-transparent" />
              <input type="date" className="glass rounded-xl px-3 py-2 text-sm bg-transparent" />
              <label className="text-xs text-muted-foreground col-span-2 flex items-center gap-2"><input type="checkbox" /> Hide my identity</label>
              <button type="button" className="col-span-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2"><Send className="h-4 w-4" /> Submit for Verification</button>
            </form>
          </div>
        </section>

        <p className="text-[11px] text-muted-foreground text-center">
          RebateBoard tracks publicly verifiable crypto payout data only. Listings are informational and not endorsements.
        </p>
      </main>
    <SiteFooter />
    </div>
  );
}
