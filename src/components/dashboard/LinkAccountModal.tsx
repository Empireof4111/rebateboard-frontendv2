import { useEffect, useMemo, useState } from "react";
import { X, ChevronRight, ChevronLeft, Search, Mail, CheckCircle2, ExternalLink, Building2, Sparkles, Banknote, Coins, AlertTriangle, Send } from "lucide-react";
import { fetchPublicAdminBrands, type AdminBrandRecord } from "@/lib/admin-brands-api";
import { ApiError } from "@/lib/api";
import { financeApi, type PartnerRequestRecord } from "@/lib/finance-api";

type PayoutTarget = "rr-wallet" | "rebate-wallet" | "revete-wallet" | "broker-wallet";

type BrandLike = {
  name: string;
  category: string;
  website?: string;
  supportEmail?: string;
  cashback?: {
    supportsApiAuto?: boolean;
    supportsRebateWallet?: boolean;
    supportsReveteWallet?: boolean;
    requiresManualClaim?: boolean;
    partnerCode?: string;
    partnerEmail?: string;
    affiliateLink?: string;
    emailSubjectTpl?: string;
    emailBodyTpl?: string;
  };
};

const CATEGORIES = ["Forex Broker", "Crypto Exchange"] as const;
type Step = "category" | "brand" | "mode" | "details" | "preference" | "email" | "done";

const DEFAULT_SUBJECT = "Account attach request — RebateBoard";
const DEFAULT_BODY =
  "Dear Partner team,\n\nKindly attach my trading account {{accountId}} to RebateBoard's IB structure (partner code: {{partnerCode}}).\n\nRegistered email: {{registeredEmail}}\nTrader name: {{traderName}}\n\nThank you,\n{{traderName}}";

function fillTpl(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}

function mapBrand(b: AdminBrandRecord): BrandLike {
  return {
    name: b.name,
    category: b.category,
    website: b.website,
    supportEmail: b.supportEmail,
    cashback: b.cashback as BrandLike["cashback"],
  };
}

export function LinkAccountModal({
  onClose,
  onLinked,
  token,
  currentUser = "RebateBoard user",
}: {
  onClose: () => void;
  onLinked?: (request: PartnerRequestRecord) => void;
  token: string;
  currentUser?: string;
}) {
  const [allBrands, setAllBrands] = useState<BrandLike[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [brandError, setBrandError] = useState("");

  const [step, setStep] = useState<Step>("category");
  const [category, setCategory] = useState<typeof CATEGORIES[number]>("Forex Broker");
  const [query, setQuery] = useState("");
  const [brandName, setBrandName] = useState<string>("");
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [accountId, setAccountId] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [pref, setPref] = useState<PayoutTarget>("rebate-wallet");
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    let alive = true;
    setLoadingBrands(true);
    fetchPublicAdminBrands(undefined, token)
      .then((brands) => {
        if (!alive) return;
        const supported = brands
          .filter((b) => CATEGORIES.includes(b.category as (typeof CATEGORIES)[number]))
          .map(mapBrand);
        setAllBrands(supported);
        setBrandError("");
      })
      .catch((error) => {
        if (!alive) return;
        setAllBrands([]);
        setBrandError(error instanceof Error ? error.message : "Unable to load supported partners");
      })
      .finally(() => {
        if (alive) setLoadingBrands(false);
      });
    return () => {
      alive = false;
    };
  }, [token]);

  // Filter brands by category + cashback support
  const filtered = useMemo(() => {
    const list = allBrands.filter((b) => b.category === category);
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((b) => b.name.toLowerCase().includes(q));
  }, [allBrands, category, query]);

  const top10 = useMemo(() => filtered.slice(0, 10), [filtered]);
  const brand = allBrands.find((b) => b.name === brandName);
  const cb = brand?.cashback ?? {};
  const supportsRebateWallet = cb.supportsRebateWallet ?? cb.supportsReveteWallet ?? true;
  const supportsApiAuto = cb.supportsApiAuto ?? true;

  const partnerCode = cb.partnerCode || "";
  const partnerEmail = cb.partnerEmail || brand?.supportEmail || "partners@rebateboard.com";
  const affiliateLink = cb.affiliateLink || brand?.website || "";

  // When entering email step, hydrate template from brand config
  const enterEmailStep = () => {
    setSubject(cb.emailSubjectTpl || DEFAULT_SUBJECT);
    setBody(
      fillTpl(cb.emailBodyTpl || DEFAULT_BODY, {
        accountId: accountId || "{{accountId}}",
        partnerCode,
        registeredEmail: registeredEmail || "{{registeredEmail}}",
        traderName: currentUser,
        affiliateLink,
      })
    );
    setStep("email");
  };

  const finalize = async () => {
    if (!brandName) return;
    if (!accountId.trim()) {
      setSubmitError("Account ID is required.");
      return;
    }

    const requestSubject = subject || DEFAULT_SUBJECT;
    const requestBody = body || fillTpl(DEFAULT_BODY, {
      accountId: accountId.trim(),
      partnerCode,
      registeredEmail: registeredEmail.trim() || "Not provided",
      traderName: currentUser,
      affiliateLink,
    });

    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await financeApi.createPartnerRequest(token, {
        brand: brandName,
        brandCategory: category,
        toEmail: partnerEmail,
        subject: requestSubject,
        body: requestBody,
        partnerCode: partnerCode || undefined,
        affiliateLink: affiliateLink || undefined,
        registeredEmail: registeredEmail.trim() || undefined,
        accountId: accountId.trim(),
        payoutTarget: pref,
      });
      if (response.payload) onLinked?.(response.payload);

      if (mode === "existing") {
        try {
          const mailto = `mailto:${encodeURIComponent(partnerEmail)}?subject=${encodeURIComponent(requestSubject)}&body=${encodeURIComponent(requestBody)}`;
          window.open(mailto, "_blank");
        } catch {}
      }
      setStep("done");
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : "Unable to submit account link request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="glass w-full max-w-lg rounded-2xl p-5 ring-1 ring-white/10" onClick={(e) => e.stopPropagation()}>
        {/* Header + progress */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Link an account · start earning</h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Connect your broker / exchange account to receive cashback automatically.</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white"><X className="h-4 w-4" /></button>
        </div>

        <Stepper step={step} mode={mode} />

        <div className="mt-3 max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          {/* 1. Category */}
          {step === "category" && (
            <div>
              <Label>Pick the type of account you want to link</Label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setCategory(c); setStep("brand"); }}
                    className={`rounded-xl px-3 py-4 text-left ring-1 transition ${category === c ? "bg-gradient-to-br from-fuchsia-500/15 to-violet-600/10 ring-fuchsia-400/40" : "bg-white/5 ring-white/10 hover:ring-white/20"}`}
                  >
                    <div className="text-sm font-bold text-white">{c}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{c === "Forex Broker" ? "MT4 / MT5 / cTrader brokers" : "Spot & perpetual crypto exchanges"}</div>
                  </button>
                ))}
              </div>
              <p className="mt-3 rounded-lg bg-fuchsia-500/10 px-3 py-2 text-[11px] text-fuchsia-100 ring-1 ring-fuchsia-400/20">
                Prop firms, tools and education don't need linking — just use our official link, then claim cashback after purchase.
              </p>
            </div>
          )}

          {/* 2. Brand search + filter */}
          {step === "brand" && (
            <div>
              <Label>Pick your {category.toLowerCase()}</Label>
              <div className="glass-pill mb-3 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-white">
                <Search className="h-3 w-3 text-muted-foreground" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${category.toLowerCase()}…`} className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground" />
              </div>

              {!query && (
                <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">Top supported partners</div>
              )}
              <div className="grid grid-cols-2 gap-1.5">
                {loadingBrands && (
                  <div className="col-span-2 rounded-lg border border-white/10 bg-white/5 p-4 text-center text-[11px] text-muted-foreground">
                    Preparing supported partners...
                  </div>
                )}
                {!loadingBrands && brandError && (
                  <div className="col-span-2 rounded-lg border border-rose-400/20 bg-rose-500/10 p-4 text-center text-[11px] text-rose-200">
                    {brandError}
                  </div>
                )}
                {(query ? filtered : top10).map((b) => (
                  <button
                    key={b.name}
                    onClick={() => { setBrandName(b.name); setStep("mode"); }}
                    className={`rounded-lg px-3 py-2 text-left text-xs ring-1 transition ${brandName === b.name ? "bg-fuchsia-500/15 ring-fuchsia-400/40" : "bg-white/5 ring-white/10 hover:ring-white/20"}`}
                  >
                    <div className="font-semibold text-white">{b.name}</div>
                    <div className="text-[10px] text-muted-foreground">{b.category}</div>
                  </button>
                ))}
                {!loadingBrands && !brandError && filtered.length === 0 && (
                  <div className="col-span-2 rounded-lg border-2 border-dashed border-white/10 bg-white/5 p-4 text-center text-[11px] text-muted-foreground">
                    No published {category.toLowerCase()} partners are available yet.
                  </div>
                )}
              </div>

              <div className="mt-3 flex justify-between">
                <BackBtn onClick={() => setStep("category")} />
              </div>
            </div>
          )}

          {/* 3. Existing vs new */}
          {step === "mode" && brand && (
            <div>
              <Label>Do you already have an account at <b className="text-white">{brand.name}</b>?</Label>
              <div className="grid gap-2">
                <ChoiceCard
                  active={mode === "existing"}
                  onClick={() => setMode("existing")}
                  title="I already have an account"
                  desc="We'll generate an attach-account request to the partner so they move you under our IB structure."
                />
                <ChoiceCard
                  active={mode === "new"}
                  onClick={() => setMode("new")}
                  title="Create a new account"
                  desc="Open the official partner link, create your account, then submit the account ID here so our team can verify tracking."
                />
              </div>
              <div className="mt-3 flex justify-between">
                <BackBtn onClick={() => setStep("brand")} />
                <NextBtn onClick={() => setStep("details")} />
              </div>
            </div>
          )}

          {/* 4. Details */}
          {step === "details" && brand && (
            <div className="space-y-3">
              {mode === "new" && (
                <div className="rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/10 p-3">
                  <div className="text-xs font-semibold text-white">Step 1 — Sign up at {brand.name}</div>
                  <p className="mt-1 text-[11px] text-white/80">Use the official partner link if available, then return with your account ID for verification.</p>
                  {affiliateLink ? (
                    <a href={affiliateLink} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-bold text-white">
                      <ExternalLink className="h-3 w-3" /> Open {brand.name}
                    </a>
                  ) : (
                    <div className="mt-2 rounded-lg bg-white/5 px-3 py-2 text-[11px] text-muted-foreground">
                      Official signup link is not available for this partner yet.
                    </div>
                  )}
                </div>
              )}
              <Label>Your account ID at {brand.name}</Label>
              <input value={accountId} onChange={(e) => setAccountId(e.target.value)} placeholder="e.g. 12345678" className={inputCls} />
              <Label>Email used to register at {brand.name}</Label>
              <input value={registeredEmail} onChange={(e) => setRegisteredEmail(e.target.value)} placeholder="you@example.com" className={inputCls} />

              <div className="flex justify-between pt-1">
                <BackBtn onClick={() => setStep("mode")} />
                <NextBtn disabled={!accountId.trim()} onClick={() => setStep("preference")} />
              </div>
            </div>
          )}

          {/* 5. Preference */}
          {step === "preference" && brand && (
            <div className="space-y-2">
              <Label>Where should your cashback go by default?</Label>
              <PrefRow
                active={pref === "rebate-wallet"} onClick={() => setPref("rebate-wallet")}
                disabled={!supportsRebateWallet}
                icon={<Banknote className="h-4 w-4 text-emerald-300" />}
                title="My Rebate USD wallet"
                desc={supportsRebateWallet ? "Auto-credited to your RebateBoard wallet when supported. Withdrawable to USDT / Bank." : "Not supported by this partner — pick another."}
              />
              <PrefRow
                active={pref === "broker-wallet"} onClick={() => setPref("broker-wallet")}
                disabled={!supportsApiAuto}
                icon={<Building2 className="h-4 w-4 text-fuchsia-300" />}
                title="Back to my broker trading account"
                desc={supportsApiAuto ? "Auto-credited into your trading balance when supported." : "Direct partner credit is not available for this partner."}
              />
              <PrefRow
                active={pref === "rr-wallet"} onClick={() => setPref("rr-wallet")}
                icon={<Coins className="h-4 w-4 text-fuchsia-300" />}
                title="RR (Reward) points"
                desc="Earn RR toward Trader Levels, unlocks, and platform rewards."
              />

              <div className="flex justify-between pt-2">
                <BackBtn onClick={() => setStep("details")} />
                {mode === "existing"
                  ? <NextBtn onClick={enterEmailStep}>Compose attach email</NextBtn>
                  : <NextBtn onClick={finalize} disabled={submitting}>{submitting ? "Submitting..." : "Submit for tracking"}</NextBtn>}
              </div>
              {submitError && <p className="text-[11px] text-rose-300">{submitError}</p>}
            </div>
          )}

          {/* 6. Email composer (existing only) */}
          {step === "email" && brand && (
            <div className="space-y-3">
              <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Sending to</div>
                <div className="text-sm font-semibold text-white">{partnerEmail}</div>
              </div>
              <Label>Subject</Label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} />
              <Label>Body</Label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} className={inputCls + " font-mono text-[12px]"} />
              <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-200 ring-1 ring-emerald-400/20">
                We'll record this request and also try to open your mail app as a backup. Once the partner confirms, your account moves to <b>Active</b>.
              </p>
              <div className="flex justify-between pt-1">
                <BackBtn onClick={() => setStep("preference")} />
                <button onClick={finalize} disabled={submitting} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
                  <Send className="h-3 w-3" /> {submitting ? "Submitting..." : "Send & link"}
                </button>
              </div>
              {submitError && <p className="text-[11px] text-rose-300">{submitError}</p>}
            </div>
          )}

          {/* 7. Done */}
          {step === "done" && (
            <div className="grid place-items-center gap-3 py-6 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/30">
                <CheckCircle2 className="h-6 w-6 text-emerald-300" />
              </div>
              <div className="text-base font-bold text-white">Request queued!</div>
              <p className="max-w-sm text-[12px] text-muted-foreground">
                We've recorded your {brandName} account request. You can track status in Wallet - Linked accounts. Most partners confirm within 24-72h.
              </p>
              <button onClick={onClose} className="mt-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-bold text-white">Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Small UI helpers ---------- */
const inputCls = "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-fuchsia-400/50";
function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{children}</div>;
}
function NextBtn({ children = "Continue", onClick, disabled }: { children?: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-1.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
      {children} <ChevronRight className="h-3 w-3" />
    </button>
  );
}
function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white">
      <ChevronLeft className="h-3 w-3" /> Back
    </button>
  );
}
function ChoiceCard({ active, onClick, title, desc }: { active: boolean; onClick: () => void; title: string; desc: string }) {
  return (
    <button onClick={onClick} className={`text-left rounded-xl p-3 ring-1 transition ${active ? "bg-gradient-to-br from-fuchsia-500/15 to-violet-600/10 ring-fuchsia-400/40" : "bg-white/[0.03] ring-white/10 hover:ring-white/20"}`}>
      <div className="text-sm font-bold text-white">{title}</div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{desc}</div>
    </button>
  );
}
function PrefRow({ active, onClick, disabled, icon, title, desc }: { active: boolean; onClick: () => void; disabled?: boolean; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <button disabled={disabled} onClick={onClick} className={`w-full text-left rounded-xl p-3 ring-1 transition disabled:cursor-not-allowed disabled:opacity-40 ${active ? "bg-gradient-to-br from-fuchsia-500/15 to-violet-600/10 ring-fuchsia-400/40" : "bg-white/[0.03] ring-white/10 hover:ring-white/20"}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-semibold text-white">{title}</span>
        {active && <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-300" />}
        {disabled && <AlertTriangle className="ml-auto h-3.5 w-3.5 text-fuchsia-300" />}
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">{desc}</div>
    </button>
  );
}
function Stepper({ step, mode }: { step: Step; mode: "existing" | "new" }) {
  const all: { id: Step; label: string }[] = [
    { id: "category", label: "Type" },
    { id: "brand", label: "Brand" },
    { id: "mode", label: "Mode" },
    { id: "details", label: "Account" },
    { id: "preference", label: "Payout" },
    ...(mode === "existing" ? [{ id: "email" as Step, label: "Email" }] : []),
  ];
  const idx = all.findIndex((s) => s.id === step);
  return (
    <div className="flex items-center gap-1">
      {all.map((s, i) => (
        <div key={s.id} className="flex flex-1 items-center gap-1">
          <div className={`h-1 flex-1 rounded-full ${i <= idx ? "bg-gradient-to-r from-fuchsia-500 to-violet-600" : "bg-white/10"}`} />
        </div>
      ))}
    </div>
  );
}
