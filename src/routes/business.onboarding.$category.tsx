import { createFileRoute, useNavigate, notFound, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  StepProgressBar, StepTitleBlock, TrustScoreCard, TrustBreakdownCard, ImprovementSuggestions,
  InfoNoteCard, FieldShell, TextField, TextAreaField, SelectField, NumericStepperField,
  ToggleChoiceGroup, CardChoiceGroup, MultiTagInput, FileUploadBlock,
} from "@/components/tbi/OnboardingPrimitives";
import {
  CATEGORY_META, STEP_DEFS, createSubmission, submitForReview, computeBreakdown, computeScore,
  computeCompletion, improvementSuggestions, buildMagicLink, type BrandCategory, type UploadedFile,
  getApplicationDraft, saveApplicationDraft, clearApplicationDraft, useBrandApplicationSettings,
} from "@/lib/tbi-onboarding";
import { fetchBrandApplicationSettings } from "@/lib/brand-application-settings-api";
import { ArrowLeft, ArrowRight, Check, Send, Copy, Save, Shield } from "lucide-react";

const CATEGORY_ALIASES: Record<string, BrandCategory> = {
  prop_firm: "prop_firm",
  "prop-firm": "prop_firm",
  propfirm: "prop_firm",
  "forex-prop-firm": "prop_firm",
  "futures-prop-firm": "prop_firm",
  "crypto-prop-firm": "prop_firm",
  broker: "broker",
  "forex-broker": "broker",
  exchange: "exchange",
  "crypto-exchange": "exchange",
  crypto: "exchange",
  tool: "tool",
  "trading-tool": "tool",
  software: "tool",
  education: "tool",
};

function normalizeBrandCategoryParam(value?: string): BrandCategory | null {
  const raw = String(value || "").trim().toLowerCase();
  const dashed = raw.replace(/\s+/g, "-");
  return CATEGORY_ALIASES[dashed] ?? CATEGORY_ALIASES[dashed.replace(/-/g, "_")] ?? null;
}

export const Route = createFileRoute("/business/onboarding/$category")({
  loader: ({ params }) => {
    const cat = normalizeBrandCategoryParam(params.category);
    if (!cat || !(cat in CATEGORY_META)) throw notFound();
    return { category: cat };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${CATEGORY_META[loaderData!.category].label} Onboarding — RebateBoard for Business` },
      { name: "description", content: `Build your trust profile as a ${CATEGORY_META[loaderData!.category].label.toLowerCase()}.` },
    ],
  }),
  component: OnboardingFlow,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center bg-[var(--rb-bg-canvas)] text-foreground">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Unknown category</h1>
        <Link to="/business/join" className="mt-4 inline-block text-violet-300">← Back to categories</Link>
      </div>
    </div>
  ),
});

type FormData = Record<string, any>;

function defaultApplicationData(): FormData {
  return {
    identity: {
      brandName: "",
      website: "",
      yearFounded: "",
      country: "",
      entityName: "",
      regulation: "",
      logo: [],
      coverImage: [],
    },
    model: {},
    proof: { registrationDocs: [], payoutProof: [], reserveProof: [], activeTraders: 0, fundedTraders: 0 },
    infra: { platforms: [], liquidityProviders: [], technologyProvider: "" },
    community: {},
    economics: {},
    rebateboard: {},
    contact: { name: "", email: "" },
  };
}

function OnboardingFlow() {
  const { category } = Route.useLoaderData();
  const navigate = useNavigate();
  const meta = CATEGORY_META[category as BrandCategory];
  const localApplicationSettings = useBrandApplicationSettings();
  const [applicationSettings, setApplicationSettings] = useState(localApplicationSettings);
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>(() => getApplicationDraft(category) ?? defaultApplicationData());
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [magicLink, setMagicLink] = useState<string | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  const setStepData = (stepId: string, patch: Record<string, any>) => {
    setData((d: FormData) => ({ ...d, [stepId]: { ...d[stepId], ...patch } }));
  };

  const breakdown = useMemo(() => computeBreakdown(data, 0), [data]);
  const { score, mode, cap } = useMemo(() => computeScore(breakdown, 0), [breakdown]);
  const completion = useMemo(() => computeCompletion(data), [data]);

  useEffect(() => {
    if (!submittedId) saveApplicationDraft(category, data);
  }, [category, data, submittedId]);

  const handleSaveDraft = () => {
    saveApplicationDraft(category, data);
    setDraftSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  };

  const handleSubmit = () => {
    if (!data.identity.brandName || !data.contact.email || !(data.identity.logo ?? []).length || !(data.identity.coverImage ?? []).length) {
      alert("Please add your brand name, contact email, logo, and cover image before submitting.");
      return;
    }
    const sub = createSubmission({
      category,
      brandName: data.identity.brandName,
      contactEmail: data.contact.email,
      contactName: data.contact.name || data.identity.brandName,
      data,
    });
    submitForReview(sub.id);
    clearApplicationDraft(category);
    setSubmittedId(sub.id);
    setMagicLink(buildMagicLink(sub));
  };

  const totalSteps = STEP_DEFS.length;
  const stepDef = STEP_DEFS[step - 1];

  const goNext = () => setStep((s) => Math.min(totalSteps, s + 1));
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  useEffect(() => {
    setApplicationSettings(localApplicationSettings);
  }, [localApplicationSettings.enabled, localApplicationSettings.updatedAt]);

  useEffect(() => {
    let active = true;
    fetchBrandApplicationSettings()
      .then((settings) => {
        if (active) setApplicationSettings(settings);
      })
      .catch(() => {
        // Keep the local snapshot if the public setting endpoint is unavailable.
      });
    return () => {
      active = false;
    };
  }, []);

  if (submittedId) return <SuccessScreen brandName={data.identity.brandName} magicLink={magicLink!} onGoToDashboard={() => navigate({ to: magicLink! })} />;

  if (!applicationSettings.enabled) {
    return (
      <div className="min-h-screen bg-[var(--rb-bg-canvas)] text-foreground">
        <SiteHeader />
        <main className="container-app max-w-3xl py-12 sm:py-16">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center backdrop-blur-xl md:p-12">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-violet-200">
              <Shield className="h-6 w-6" />
            </div>
            <h1 className="mt-5 text-3xl font-bold">Brand Applications Are Temporarily Closed</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
              We're currently reviewing submitted applications. Your saved progress will remain available when applications reopen.
            </p>
            <Link to="/business/join" className="mt-6 inline-flex items-center gap-2 rounded-full rb-gradient-primary px-5 py-3 text-sm font-bold text-white">
              Back to List Your Brand <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--rb-bg-canvas)] text-foreground">
      <SiteHeader />
      <main className="container-app py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <Link to="/business/join" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3 w-3" /> Change category
            </Link>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-2xl">{meta.emoji}</span>
              <h1 className="text-xl font-bold md:text-2xl">{meta.label} Onboarding</h1>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
          {/* LEFT — Step content */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
              <StepProgressBar totalSteps={totalSteps} currentStep={step} />
              <UnlockJourney currentStep={step} />
              <div className="mt-6">
                <StepTitleBlock title={stepDef.title} subtitle={stepDef.subtitle} description={stepDef.description} />
              </div>

              <div className="mt-6 space-y-5">
                {step === 1 && <IdentityStep data={data.identity} setData={(p) => setStepData("identity", p)} category={category} />}
                {step === 2 && <ModelStep data={data.model} setData={(p) => setStepData("model", p)} category={category} />}
                {step === 3 && <ProofStep data={data.proof} setData={(p) => setStepData("proof", p)} />}
                {step === 4 && <InfraStep data={data.infra} setData={(p) => setStepData("infra", p)} category={category} />}
                {step === 5 && <CommunityStep data={data.community} setData={(p) => setStepData("community", p)} />}
                {step === 6 && <EconomicsStep data={data.economics} setData={(p) => setStepData("economics", p)} category={category} />}
                {step === 7 && <RebateBoardStep data={data.rebateboard} setData={(p) => setStepData("rebateboard", p)} />}
                {step === 8 && (
                  <ReviewStep
                    data={data}
                    setContact={(p: Record<string, any>) => setStepData("contact", p)}
                    contact={data.contact}
                    score={score}
                    cap={cap}
                    mode={mode}
                    breakdown={breakdown}
                    onSubmit={handleSubmit}
                  />
                )}
              </div>
            </div>

            {/* Nav footer */}
            <div className="sticky bottom-3 z-10 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[rgba(18,18,25,0.90)] p-3 backdrop-blur-xl">
              <button
                onClick={goBack}
                disabled={step === 1}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40 hover:bg-white/10"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                className="hidden items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-violet-300/30 sm:inline-flex"
              >
                <Save className="h-3.5 w-3.5 text-violet-200" /> Save Progress
              </button>
              <div className="hidden text-[11px] text-muted-foreground sm:block">
                {draftSavedAt ? `Draft saved ${draftSavedAt}` : `${completion}% complete`}
              </div>
              {step < totalSteps ? (
                <button
                  onClick={goNext}
                  className="inline-flex items-center gap-1.5 rounded-xl rb-gradient-primary px-5 py-2 text-xs font-bold text-white shadow-[0_0_20px_rgba(192,132,252,0.4)] hover:brightness-110"
                >
                  Continue <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-xs font-bold text-white shadow-[0_0_20px_rgba(45,212,180,0.5)] hover:brightness-110"
                >
                  <Send className="h-3.5 w-3.5" /> Submit for review
                </button>
              )}
            </div>
          </div>

          {/* RIGHT — Score panel */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <TrustScoreCard
              score={score}
              maxScore={cap}
              status={mode}
              helperText={
                mode === "none" ? "Start filling fields to see your live score." :
                mode === "preliminary" ? `Capped at ${cap}/10 until you receive verified trader reviews.` :
                "Live preview based on your inputs."
              }
            />
            <TrustBreakdownCard breakdown={breakdown} />
            <ImprovementSuggestions
              items={improvementSuggestions({
                id: "preview", category, brandName: data.identity.brandName, contactEmail: "", contactName: "",
                status: "pending", onboardingStatus: "draft", submittedAt: "", data, preliminaryScore: null,
                trustScore: score, trustScoreMode: mode, reviewCount: 0, completionPercent: completion,
                brandToken: "", breakdown,
              })}
            />
            <InfoNoteCard
              title="Live scoring"
              body="Your score updates as you fill out each step. Trader experience unlocks after review threshold is met."
              variant="info"
            />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

/* ============================================================
 * STEP COMPONENTS
 * ============================================================ */

function UnlockJourney({ currentStep }: { currentStep: number }) {
  const milestones = [
    "Identity",
    "Contact Information",
    "Verification",
    "Public Transparency",
    "Trust Signals",
    "Ready For Review",
  ];

  return (
    <div className="mt-5 grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
      {milestones.map((item, index) => {
        const done = currentStep > index + 1;
        const active = currentStep === index + 1;
        return (
          <div
            key={item}
            className={`rounded-xl border px-3 py-2 text-[10px] font-semibold transition ${
              done
                ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
                : active
                ? "border-violet-300/35 bg-violet-500/10 text-violet-100"
                : "border-white/10 bg-white/[0.03] text-muted-foreground"
            }`}
          >
            <span className="mr-1">{done ? "✓" : active ? "•" : "○"}</span>
            {item}
          </div>
        );
      })}
    </div>
  );
}

function IdentityStep({ data, setData, category }: { data: any; setData: (p: any) => void; category: BrandCategory }) {
  const handleAdd = (key: "logo" | "coverImage") => (files: File[]) => {
    const next: UploadedFile[] = files.slice(0, 1).map((f) => ({
      id: Math.random().toString(36).slice(2, 10),
      name: f.name,
      size: f.size,
      status: "uploaded" as const,
    }));
    setData({ [key]: next });
  };
  const handleRemove = (key: "logo" | "coverImage") => () => setData({ [key]: [] });

  return (
    <>
      <InfoNoteCard
        title="Why this matters"
        body="Your logo and cover image become the first trust signals traders see on your public profile after approval."
        variant="info"
      />
      <FieldShell label="Brand name" required>
        <TextField value={data.brandName ?? ""} onChange={(v) => setData({ brandName: v })} placeholder="e.g. PrimeEdge Capital" />
      </FieldShell>
      <div className="grid gap-4 md:grid-cols-2">
        <FieldShell label="Company logo" required helper="Used on listings, search, and your public profile">
          <FileUploadBlock files={data.logo ?? []} onAdd={handleAdd("logo")} onRemove={handleRemove("logo")} />
        </FieldShell>
        <FieldShell label="Company cover image" required helper="Used as your public brand profile hero">
          <FileUploadBlock files={data.coverImage ?? []} onAdd={handleAdd("coverImage")} onRemove={handleRemove("coverImage")} />
        </FieldShell>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FieldShell label="Official website" required>
          <TextField value={data.website ?? ""} onChange={(v) => setData({ website: v })} placeholder="https://" />
        </FieldShell>
        <FieldShell label="Year founded">
          <TextField value={data.yearFounded ?? ""} onChange={(v) => setData({ yearFounded: v })} placeholder="2023" />
        </FieldShell>
        <FieldShell label="Headquarters country">
          <TextField value={data.country ?? ""} onChange={(v) => setData({ country: v })} placeholder="Estonia" />
        </FieldShell>
        <FieldShell label="Legal entity name">
          <TextField value={data.entityName ?? ""} onChange={(v) => setData({ entityName: v })} placeholder="PrimeEdge OÜ" />
        </FieldShell>
      </div>
      <FieldShell label="Regulation / Registration" helper="License number, jurisdiction, or 'Private entity'">
        <TextField value={data.regulation ?? ""} onChange={(v) => setData({ regulation: v })} placeholder="FCA #123456 / Private Entity" />
      </FieldShell>
      {category === "exchange" && (
        <InfoNoteCard title="Exchanges note" body="VARA / MiCA / FinCEN registrations dramatically increase transparency score." variant="info" />
      )}
    </>
  );
}

function ModelStep({ data, setData, category }: { data: any; setData: (p: any) => void; category: BrandCategory }) {
  if (category === "prop_firm") {
    return (
      <>
        <FieldShell label="Challenge type">
          <CardChoiceGroup value={data.challengeType ?? null} onChange={(v) => setData({ challengeType: v })} options={[
            { value: "one_step", label: "1-Step", description: "Single phase to funding", emoji: "🎯" },
            { value: "two_step", label: "2-Step", description: "Classic challenge + verification", emoji: "🪜" },
            { value: "instant", label: "Instant Funding", description: "No challenge required", emoji: "⚡" },
            { value: "subscription", label: "Subscription", description: "Monthly access model", emoji: "🔁" },
          ]} />
        </FieldShell>
        <FieldShell label="Account model">
          <CardChoiceGroup value={data.accountModel ?? null} onChange={(v) => setData({ accountModel: v })} options={[
            { value: "scaled", label: "Scaling Plan", description: "Account grows with performance" },
            { value: "fixed", label: "Fixed Account", description: "Static size, fixed targets" },
          ]} />
        </FieldShell>
        <FieldShell label="Payout type">
          <ToggleChoiceGroup value={data.payoutType ?? null} onChange={(v) => setData({ payoutType: v })} options={[
            { label: "Real Market", value: "real" },
            { label: "Simulated", value: "simulated" },
            { label: "Hybrid", value: "hybrid" },
          ]} />
        </FieldShell>
      </>
    );
  }
  if (category === "broker") {
    return (
      <>
        <FieldShell label="Broker type">
          <CardChoiceGroup value={data.brokerType ?? null} onChange={(v) => setData({ brokerType: v })} options={[
            { value: "ecn", label: "ECN", description: "Direct market access" },
            { value: "stp", label: "STP", description: "Straight-through processing" },
            { value: "market_maker", label: "Market Maker", description: "Internal liquidity" },
            { value: "hybrid", label: "Hybrid", description: "Mixed model" },
          ]} />
        </FieldShell>
        <FieldShell label="Account types offered">
          <MultiTagInput value={data.accountTypes ?? []} onChange={(v) => setData({ accountTypes: v })} suggestions={["Standard", "Raw Spread", "Pro", "VIP", "Islamic"]} />
        </FieldShell>
      </>
    );
  }
  if (category === "exchange") {
    return (
      <>
        <FieldShell label="Exchange type">
          <CardChoiceGroup value={data.exchangeType ?? null} onChange={(v) => setData({ exchangeType: v })} options={[
            { value: "cex", label: "Centralized (CEX)", description: "Custodial spot/derivatives" },
            { value: "dex", label: "Decentralized (DEX)", description: "On-chain, non-custodial" },
            { value: "hybrid", label: "Hybrid", description: "CEX + DEX rails" },
          ]} />
        </FieldShell>
        <FieldShell label="Products offered">
          <MultiTagInput value={data.products ?? []} onChange={(v) => setData({ products: v })} suggestions={["Spot", "Perpetuals", "Futures", "Options", "Margin", "Staking"]} />
        </FieldShell>
      </>
    );
  }
  // tool
  return (
    <>
      <FieldShell label="Tool category">
        <CardChoiceGroup value={data.toolType ?? null} onChange={(v) => setData({ toolType: v })} options={[
          { value: "analytics", label: "Analytics", description: "Performance, journaling" },
          { value: "signals", label: "Signals", description: "Trade ideas / alerts" },
          { value: "automation", label: "Automation / EAs", description: "Bots, copy trading" },
          { value: "education", label: "Education", description: "Courses, mentoring" },
        ]} />
      </FieldShell>
      <FieldShell label="Pricing model">
        <ToggleChoiceGroup value={data.pricing ?? null} onChange={(v) => setData({ pricing: v })} options={[
          { label: "Free", value: "free" }, { label: "Freemium", value: "freemium" }, { label: "Subscription", value: "sub" }, { label: "One-time", value: "one_time" },
        ]} />
      </FieldShell>
    </>
  );
}

function ProofStep({ data, setData }: { data: any; setData: (p: any) => void }) {
  const handleAdd = (key: string) => (files: File[]) => {
    const next: UploadedFile[] = files.map((f) => ({
      id: Math.random().toString(36).slice(2, 10),
      name: f.name,
      size: f.size,
      status: "uploaded" as const,
    }));
    setData({ [key]: [...(data[key] ?? []), ...next] });
  };
  const handleRemove = (key: string) => (id: string) => setData({ [key]: (data[key] ?? []).filter((f: UploadedFile) => f.id !== id) });

  return (
    <>
      <InfoNoteCard title="This step has the biggest impact" body="Verified payout proofs and registration documents push your score the most." variant="success" />
      <FieldShell label="Company registration documents" required helper="Strongest impact">
        <FileUploadBlock files={data.registrationDocs ?? []} onAdd={handleAdd("registrationDocs")} onRemove={handleRemove("registrationDocs")} />
      </FieldShell>
      <FieldShell label="Payout proof (last 3 months)" helper="+0.6 to score">
        <FileUploadBlock files={data.payoutProof ?? []} onAdd={handleAdd("payoutProof")} onRemove={handleRemove("payoutProof")} />
      </FieldShell>
      <FieldShell label="Reserve / liquidity proof" helper="+0.4 to score">
        <FileUploadBlock files={data.reserveProof ?? []} onAdd={handleAdd("reserveProof")} onRemove={handleRemove("reserveProof")} />
      </FieldShell>
      <div className="grid gap-4 md:grid-cols-2">
        <FieldShell label="Active traders (approx)">
          <NumericStepperField value={Number(data.activeTraders) || 0} onChange={(v) => setData({ activeTraders: v })} step={50} />
        </FieldShell>
        <FieldShell label="Funded / paying users">
          <NumericStepperField value={Number(data.fundedTraders) || 0} onChange={(v) => setData({ fundedTraders: v })} step={10} />
        </FieldShell>
      </div>
    </>
  );
}

function InfraStep({ data, setData, category }: { data: any; setData: (p: any) => void; category: BrandCategory }) {
  const platformSugg =
    category === "prop_firm" ? ["MT4", "MT5", "cTrader", "TradeLocker", "Match-Trade", "DXtrade"] :
    category === "broker" ? ["MT4", "MT5", "cTrader", "TradingView", "Proprietary"] :
    category === "exchange" ? ["Web", "iOS", "Android", "Desktop", "API"] :
    ["Web", "Desktop", "Mobile", "API", "MT4 Plugin", "TradingView Plugin"];

  return (
    <>
      <FieldShell label="Platforms supported">
        <MultiTagInput value={data.platforms ?? []} onChange={(v) => setData({ platforms: v })} suggestions={platformSugg} />
      </FieldShell>
      {category !== "tool" && (
        <FieldShell label="Liquidity providers / matching engine">
          <MultiTagInput value={data.liquidityProviders ?? []} onChange={(v) => setData({ liquidityProviders: v })} suggestions={["LMAX", "Match-Trade", "Saxo", "B2C2", "GTN", "Internal"]} />
        </FieldShell>
      )}
      <FieldShell label="Technology source">
        <ToggleChoiceGroup value={data.technologyProvider ?? null} onChange={(v) => setData({ technologyProvider: v })} options={[
          { label: "Proprietary tech", value: "proprietary" },
          { label: "White-label", value: "white_label" },
          { label: "Hybrid", value: "hybrid" },
        ]} />
      </FieldShell>
    </>
  );
}

function CommunityStep({ data, setData }: { data: any; setData: (p: any) => void }) {
  const channels: { key: string; label: string; placeholder: string }[] = [
    { key: "trustpilot", label: "Trustpilot URL", placeholder: "https://trustpilot.com/…" },
    { key: "discord", label: "Discord invite", placeholder: "https://discord.gg/…" },
    { key: "telegram", label: "Telegram", placeholder: "https://t.me/…" },
    { key: "twitter", label: "X (Twitter)", placeholder: "https://x.com/…" },
    { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@…" },
    { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/…" },
  ];
  return (
    <>
      <InfoNoteCard title="Why this matters" body="Verifiable community presence proves you're real and accessible." variant="info" />
      <div className="grid gap-4 md:grid-cols-2">
        {channels.map((c) => (
          <FieldShell key={c.key} label={c.label}>
            <TextField value={data[c.key] ?? ""} onChange={(v) => setData({ [c.key]: v })} placeholder={c.placeholder} />
          </FieldShell>
        ))}
      </div>
    </>
  );
}

function EconomicsStep({ data, setData, category }: { data: any; setData: (p: any) => void; category: BrandCategory }) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {category === "prop_firm" && (
          <>
            <FieldShell label="Average challenge cost">
              <TextField value={data.avgChallengeCost ?? ""} onChange={(v) => setData({ avgChallengeCost: v })} placeholder="$199" />
            </FieldShell>
            <FieldShell label="Profit split (trader)">
              <TextField value={data.profitSplit ?? ""} onChange={(v) => setData({ profitSplit: v })} placeholder="80%" />
            </FieldShell>
          </>
        )}
        {category === "broker" && (
          <>
            <FieldShell label="Min deposit">
              <TextField value={data.minDeposit ?? ""} onChange={(v) => setData({ minDeposit: v })} placeholder="$100" />
            </FieldShell>
            <FieldShell label="Typical EUR/USD spread (pips)">
              <TextField value={data.spread ?? ""} onChange={(v) => setData({ spread: v })} placeholder="0.6" />
            </FieldShell>
          </>
        )}
        {category === "exchange" && (
          <>
            <FieldShell label="Maker fee">
              <TextField value={data.makerFee ?? ""} onChange={(v) => setData({ makerFee: v })} placeholder="0.02%" />
            </FieldShell>
            <FieldShell label="Taker fee">
              <TextField value={data.takerFee ?? ""} onChange={(v) => setData({ takerFee: v })} placeholder="0.05%" />
            </FieldShell>
          </>
        )}
        {category === "tool" && (
          <>
            <FieldShell label="Starting price">
              <TextField value={data.startPrice ?? ""} onChange={(v) => setData({ startPrice: v })} placeholder="$29 / mo" />
            </FieldShell>
            <FieldShell label="Free trial">
              <ToggleChoiceGroup value={data.freeTrial ?? null} onChange={(v) => setData({ freeTrial: v })} options={[{ label: "Yes", value: "yes" }, { label: "No", value: "no" }]} />
            </FieldShell>
          </>
        )}
        <FieldShell label="Payout / payment frequency">
          <SelectField value={data.payoutFrequency ?? ""} onChange={(v) => setData({ payoutFrequency: v })} options={[
            { label: "Instant", value: "instant" },
            { label: "Daily", value: "daily" },
            { label: "Weekly", value: "weekly" },
            { label: "Bi-weekly", value: "biweekly" },
            { label: "Monthly", value: "monthly" },
          ]} />
        </FieldShell>
        <FieldShell label="Refund policy">
          <ToggleChoiceGroup value={data.refundPolicy ?? null} onChange={(v) => setData({ refundPolicy: v })} options={[{ label: "Yes", value: "yes" }, { label: "No", value: "no" }]} />
        </FieldShell>
      </div>
      <FieldShell label="Hidden fees?" helper="Honest answer scores higher than missing data">
        <ToggleChoiceGroup value={data.hiddenFees ?? null} onChange={(v) => setData({ hiddenFees: v })} options={[
          { label: "No hidden fees", value: "no" },
          { label: "Some — disclosed below", value: "yes" },
        ]} />
      </FieldShell>
      {data.hiddenFees === "yes" && (
        <FieldShell label="Disclose fees">
          <TextAreaField value={data.feeExplanation ?? ""} onChange={(v) => setData({ feeExplanation: v })} placeholder="Withdrawal fee 1.5%, inactivity fee after 90 days…" />
        </FieldShell>
      )}
    </>
  );
}

function RebateBoardStep({ data, setData }: { data: any; setData: (p: any) => void }) {
  return (
    <>
      <FieldShell label="Will you offer cashback to RebateBoard users?">
        <ToggleChoiceGroup value={data.offerCashback ?? null} onChange={(v) => setData({ offerCashback: v })} options={[
          { label: "Yes — let's discuss terms", value: "yes" },
          { label: "Not yet", value: "no" },
          { label: "Maybe later", value: "maybe" },
        ]} />
      </FieldShell>
      <FieldShell label="Discount code for RebateBoard traders" helper="Optional">
        <TextField value={data.discountCode ?? ""} onChange={(v) => setData({ discountCode: v })} placeholder="REBATE15" />
      </FieldShell>
      <div className="grid gap-4 md:grid-cols-2">
        <FieldShell label="Interested in featured placement?">
          <ToggleChoiceGroup value={data.featuredInterest ?? null} onChange={(v) => setData({ featuredInterest: v })} options={[{ label: "Yes", value: "yes" }, { label: "No", value: "no" }]} />
        </FieldShell>
        <FieldShell label="Interested in affiliate / IB integration?">
          <ToggleChoiceGroup value={data.affiliateInterest ?? null} onChange={(v) => setData({ affiliateInterest: v })} options={[{ label: "Yes", value: "yes" }, { label: "No", value: "no" }]} />
        </FieldShell>
      </div>
      <InfoNoteCard title="Partnership perks" body="Verified brands offering cashback get priority placement and a 'Recommended' badge after full unlock." variant="success" />
    </>
  );
}

function ReviewStep({ contact, setContact, data, score, cap, mode, breakdown, onSubmit }: any) {
  const [agree, setAgree] = useState(false);
  return (
    <>
      <InfoNoteCard
        title="One last thing"
        body="Your score below is preliminary — based only on submitted data. Full TBI unlocks after verified trader reviews accumulate."
        variant="info"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <FieldShell label="Your name (contact)" required>
          <TextField value={contact.name ?? ""} onChange={(v) => setContact({ name: v })} placeholder="Jane Doe" />
        </FieldShell>
        <FieldShell label="Contact email" required helper="We'll send the magic link here">
          <TextField type="email" value={contact.email ?? ""} onChange={(v) => setContact({ email: v })} placeholder="ceo@brand.com" />
        </FieldShell>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TrustScoreCard score={score} maxScore={cap} status={mode} helperText="Based on submitted data only" />
        <TrustBreakdownCard breakdown={breakdown} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="text-sm font-bold">Submission summary</div>
        <ul className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
          <li>Brand: <span className="text-white">{data.identity?.brandName || "—"}</span></li>
          <li>Website: <span className="text-white">{data.identity?.website || "—"}</span></li>
          <li>Country: <span className="text-white">{data.identity?.country || "—"}</span></li>
          <li>Regulation: <span className="text-white">{data.identity?.regulation || "—"}</span></li>
          <li>Platforms: <span className="text-white">{(data.infra?.platforms ?? []).join(", ") || "—"}</span></li>
          <li>Documents: <span className="text-white">{((data.proof?.registrationDocs?.length ?? 0) + (data.proof?.payoutProof?.length ?? 0) + (data.proof?.reserveProof?.length ?? 0))} uploaded</span></li>
        </ul>
      </div>

      <label className="flex items-start gap-3 rounded-xl bg-white/5 p-4 text-xs">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-violet-500" />
        <span>
          I confirm the information provided is accurate and I am authorised to represent this brand. I agree to RebateBoard's brand listing terms.
        </span>
      </label>
      <button
        onClick={() => agree && onSubmit()}
        disabled={!agree}
        className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-sm font-bold text-white shadow-[0_0_24px_rgba(45,212,180,0.5)] transition disabled:opacity-50 hover:brightness-110"
      >
        <Send className="mr-1 inline h-4 w-4" /> Submit application for review
      </button>
    </>
  );
}

function SuccessScreen({ brandName, magicLink, onGoToDashboard }: { brandName: string; magicLink: string; onGoToDashboard: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="min-h-screen bg-[var(--rb-bg-canvas)] text-foreground">
      <SiteHeader />
      <main className="container-app max-w-3xl py-12 sm:py-16">
        <div className="rounded-3xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/15 to-teal-500/5 p-10 text-center backdrop-blur-xl">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-[0_0_30px_rgba(45,212,180,0.6)]">
            <Check className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-3xl font-bold md:text-4xl">Welcome aboard, {brandName}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your application has been received. We'll verify your documents and contact details, then convert the approved application into your public brand profile and Brand Dashboard.
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-emerald-300">Your secure dashboard link</div>
            <div className="mt-2 flex items-center gap-2">
              <input readOnly value={magicLink} className="flex-1 rounded-lg bg-black/40 px-3 py-2 font-mono text-[11px] text-white/80 outline-none ring-1 ring-white/10" />
              <button
                onClick={() => { navigator.clipboard.writeText(magicLink); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/15"
              >
                <Copy className="h-3 w-3" /> {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">In production this link is sent via email after approval. It opens the brand workspace for profile, reviews, complaints, announcements, and trust data.</p>
          </div>

          <button
            onClick={onGoToDashboard}
            className="mt-6 inline-flex items-center gap-2 rounded-xl rb-gradient-primary px-6 py-3 text-sm font-bold shadow-[0_0_24px_rgba(192,132,252,0.4)] hover:brightness-110"
          >
            Go to Trust Dashboard <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
