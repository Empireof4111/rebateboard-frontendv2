/**
 * 4-step Review Wizard — matches uploaded screenshots:
 *   1. Firm Selection (skipped if brand prefilled)
 *   2. Your Details (account size, experience, eval steps)
 *   3. Rating (5 dimensions + overall + body)
 *   4. Additional Info (proofs + liked most/least)
 *
 * Used inside /review route AND directly inline if needed.
 */
import { useMemo, useState, useCallback, useEffect, type ChangeEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Star,
  Search,
  Upload,
  X,
  Info,
  BadgeCheck,
  Gift,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { type ReviewProviderType, type ReviewProof, type ReviewRatings } from "@/lib/reviews-store";
import { formatUploadLimit, validateFileSize } from "@/lib/upload-limits";
import { fetchPublicAdminBrands } from "@/lib/admin-brands-api";
import { submitPublicReview } from "@/lib/reviews-api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

const PROVIDER_TYPES: ReviewProviderType[] = ["Prop Firm", "Broker", "Exchange", "Tool"];
const ACCOUNT_SIZES = ["$10k", "$25k", "$50k", "$100k", "$200k"];
const EXPERIENCES = [
  "Less than 1 month",
  "1-3 months",
  "3-6 months",
  "6-12 months",
  "More than 1 year",
];
const EVAL_STEPS = ["Instant", "1 Step", "2 Step", "3 Step", "4 Step"];
const REVIEW_TYPES = [
  "Trading Experience",
  "Payout Experience",
  "Support Experience",
  "Platform Experience",
  "Cashback Experience",
  "Complaint / Issue Experience",
] as const;

type Props = {
  initialProviderType?: ReviewProviderType;
  initialBrandSlug?: string;
};

type ReviewBrandOption = {
  slug: string;
  name: string;
  category: ReviewProviderType;
  score: number;
  maxScore: number;
  logoColor: string;
  logo?: string;
  country?: string;
  reviewCount: number;
};

const CATEGORY_GRADIENTS: Record<ReviewProviderType, string> = {
  "Prop Firm": "from-fuchsia-400 to-violet-600",
  Broker: "from-sky-400 to-indigo-600",
  Exchange: "from-amber-400 to-orange-600",
  Tool: "from-emerald-400 to-teal-600",
};

function reviewCategoryForBrand(category?: string): ReviewProviderType {
  const value = (category || "").toLowerCase();
  if (value.includes("broker")) return "Broker";
  if (value.includes("exchange")) return "Exchange";
  if (value.includes("software") || value.includes("tool") || value.includes("education")) {
    return "Tool";
  }
  return "Prop Firm";
}

function normalizeTbiScore(value?: number) {
  if (!value || Number.isNaN(value)) return 0;
  if (value > 100) return 10;
  return value > 10 ? value / 10 : value;
}

function stringField(source: unknown, key: string) {
  if (!source || typeof source !== "object") return "";
  const value = (source as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

type ReviewType = (typeof REVIEW_TYPES)[number];
type RatingQuestion = { key: string; label: string; pillar: "UT" | "PR" | "TS" | "RC" | "TC" | "CX" };

const CATEGORY_QUESTIONS: Record<ReviewProviderType, RatingQuestion[]> = {
  Broker: [
    { key: "spreadsFees", label: "Spreads & Fees", pillar: "TC" },
    { key: "executionQuality", label: "Execution Quality", pillar: "TC" },
    { key: "depositsWithdrawals", label: "Deposits & Withdrawals", pillar: "PR" },
    { key: "customerCare", label: "Customer Support", pillar: "CX" },
    { key: "platformStability", label: "Platform Stability", pillar: "CX" },
    { key: "regulationTrust", label: "Regulation & Trust", pillar: "RC" },
  ],
  "Prop Firm": [
    { key: "challengeRules", label: "Challenge Rules", pillar: "TC" },
    { key: "evaluationFairness", label: "Evaluation Fairness", pillar: "UT" },
    { key: "payoutSpeed", label: "Payout Reliability", pillar: "PR" },
    { key: "customerCare", label: "Support Experience", pillar: "CX" },
    { key: "userFriendliness", label: "Dashboard Experience", pillar: "CX" },
    { key: "transparency", label: "Transparency", pillar: "TS" },
  ],
  Exchange: [
    { key: "security", label: "Security", pillar: "RC" },
    { key: "liquidity", label: "Liquidity", pillar: "TC" },
    { key: "tradingFees", label: "Trading Fees", pillar: "TC" },
    { key: "payoutSpeed", label: "Withdrawals", pillar: "PR" },
    { key: "userFriendliness", label: "App / Platform Experience", pillar: "CX" },
    { key: "customerCare", label: "Support", pillar: "CX" },
  ],
  Tool: [
    { key: "easeOfUse", label: "Ease of Use", pillar: "CX" },
    { key: "reliability", label: "Reliability", pillar: "UT" },
    { key: "featureQuality", label: "Feature Quality", pillar: "TC" },
    { key: "value", label: "Value", pillar: "UT" },
    { key: "customerCare", label: "Support", pillar: "CX" },
  ],
};

function questionsFor(category: ReviewProviderType, reviewType: ReviewType) {
  const questions = CATEGORY_QUESTIONS[category];
  if (reviewType === "Payout Experience") {
    return questions.filter((item) => item.pillar === "PR" || item.pillar === "TS" || item.pillar === "CX");
  }
  if (reviewType === "Support Experience") return questions.filter((item) => item.pillar === "CX");
  if (reviewType === "Platform Experience") {
    return questions.filter((item) => ["platformStability", "userFriendliness", "easeOfUse", "reliability", "featureQuality", "executionQuality"].includes(item.key));
  }
  if (reviewType === "Cashback Experience") {
    return [
      { key: "cashbackAccuracy", label: "Cashback Accuracy", pillar: "TS" as const },
      { key: "cashbackSpeed", label: "Cashback Speed", pillar: "PR" as const },
      { key: "cashbackSupport", label: "Cashback Support", pillar: "CX" as const },
    ];
  }
  if (reviewType === "Complaint / Issue Experience") {
    return [
      { key: "issueTransparency", label: "Issue Transparency", pillar: "TS" as const },
      { key: "resolutionFairness", label: "Resolution Fairness", pillar: "UT" as const },
      { key: "resolutionSupport", label: "Resolution Support", pillar: "CX" as const },
    ];
  }
  return questions;
}

export function ReviewWizard({ initialProviderType, initialBrandSlug }: Props) {
  const { user } = useAuth();

  // step 1 state
  const [providerType, setProviderType] = useState<ReviewProviderType | "">(
    initialProviderType ?? "",
  );
  const [brandSlug, setBrandSlug] = useState<string>(initialBrandSlug ?? "");
  const [search, setSearch] = useState("");
  const [adminBrandOptions, setAdminBrandOptions] = useState<ReviewBrandOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reviewType, setReviewType] = useState<ReviewType>("Trading Experience");

  // step 2 state
  const [fullName, setFullName] = useState(user?.fullName ?? user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [accountSize, setAccountSize] = useState<string>("");
  const [customSize, setCustomSize] = useState("");
  const [experience, setExperience] = useState<string>("");
  const [evalSteps, setEvalSteps] = useState<string>("");

  // step 3 state
  const [ratings, setRatings] = useState<ReviewRatings>({
    customerCare: 0,
    tradingConditions: 0,
    paymentSpeed: 0,
    userFriendliness: 0,
    payoutSpeed: 0,
    overall: 0,
  });
  const [body, setBody] = useState("");

  // step 4 state
  const [proofs, setProofs] = useState<ReviewProof[]>([]);
  const [likedMost, setLikedMost] = useState("");
  const [likedLeast, setLikedLeast] = useState("");

  const startStep = initialBrandSlug ? 2 : 1;
  const [step, setStep] = useState<1 | 2 | 3 | 4>(startStep as 1 | 2 | 3 | 4);

  useEffect(() => {
    let active = true;

    fetchPublicAdminBrands()
      .then((brands) => {
        if (!active) return;
        setAdminBrandOptions(
          brands.map((brand) => {
            const category = reviewCategoryForBrand(brand.category);
            return {
              slug: brand.slug,
              name: brand.name,
              category,
              score: normalizeTbiScore(
                Number(brand.trust?.tbiScore ?? brand.trust?.tbi ?? brand.tbi),
              ),
              maxScore: 10,
              logoColor: CATEGORY_GRADIENTS[category],
              logo: brand.thumbnail,
              country: stringField(brand.identity, "country") || stringField(brand.profile, "country"),
              reviewCount: Number(brand.reviewsCount ?? 0),
            };
          }),
        );
      })
      .catch(() => {
        if (active) setAdminBrandOptions([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const brandOptions = useMemo(() => {
    return adminBrandOptions;
  }, [adminBrandOptions]);

  const selectedBrand = useMemo(
    () => brandOptions.find((b) => b.slug === brandSlug),
    [brandOptions, brandSlug],
  );

  const filteredBrands = useMemo(() => {
    const list = providerType
      ? brandOptions.filter((b) => b.category === providerType)
      : brandOptions;
    return list.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));
  }, [providerType, search, brandOptions]);

  const ratingQuestions = useMemo(
    () => questionsFor(selectedBrand?.category ?? (providerType || "Prop Firm"), reviewType),
    [providerType, reviewType, selectedBrand],
  );

  const tbiPillars = useMemo(() => {
    const grouped: Record<string, number[]> = {};
    ratingQuestions.forEach((question) => {
      const value = Number(ratings[question.key] || 0);
      if (value > 0) (grouped[question.pillar] ||= []).push(value);
    });
    return Object.fromEntries(
      Object.entries(grouped).map(([pillar, values]) => [
        pillar,
        Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)),
      ]),
    );
  }, [ratingQuestions, ratings]);

  /* ---------- validation ---------- */
  const canContinue = useMemo(() => {
    if (step === 1) return Boolean(providerType && brandSlug);
    if (step === 2) return Boolean(fullName && email && experience);
    if (step === 3) {
      return ratingQuestions.every(({ key }) => Number(ratings[key]) > 0) &&
        ratings.overall > 0 &&
        body.trim().length >= 100;
    }
    return true;
  }, [
    step,
    providerType,
    brandSlug,
    fullName,
    email,
    accountSize,
    customSize,
    experience,
    ratings,
    ratingQuestions,
    body,
    proofs,
  ]);

  /* ---------- file upload ---------- */
  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const remaining = 5 - proofs.length;
      const arr = Array.from(files).slice(0, remaining);
      arr.forEach((file) => {
        const sizeError = validateFileSize(file);
        if (sizeError) {
          toast.error(sizeError);
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          setProofs((prev) => [
            ...prev,
            {
              id: Math.random().toString(36).slice(2, 9),
              name: file.name,
              size: file.size,
              type: file.type,
              dataUrl: reader.result as string,
            },
          ]);
        };
        reader.readAsDataURL(file);
      });
    },
    [proofs.length],
  );

  /* ---------- submit ---------- */
  const handleSubmit = async () => {
    if (!selectedBrand) {
      toast.error("Select a published brand before submitting.");
      return;
    }
    const finalSize =
      accountSize === "custom" ? `Custom: ${customSize}` : accountSize || `Custom: ${customSize}`;

    setSubmitting(true);
    try {
      await submitPublicReview({
        providerType: selectedBrand.category,
        reviewType,
        brandSlug: selectedBrand.slug,
        brandName: selectedBrand.name,
        userId: user?.id,
        userName: fullName,
        userEmail: email,
        country: user?.country,
        accountSize: finalSize,
        experience,
        experienceDuration: experience,
        evaluationSteps: evalSteps || undefined,
        eveluationStep: evalSteps || undefined,
        ratings,
        tbiPillars,
        body,
        title: `${selectedBrand.name} review`,
        category: selectedBrand.category,
        proofOfUse: proofs.length ? "Attached" : "Not provided",
        attachments: proofs.map((proof) => proof.dataUrl),
        likedMost: likedMost || undefined,
        likedLeast: likedLeast || undefined,
        proofs,
      });
      setSubmitted(true);
      toast.success("Review submitted successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Review submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted && selectedBrand) {
    const seriousIssue = ratings.overall <= 2 || reviewType === "Complaint / Issue Experience";
    return (
      <div className="glass mx-auto max-w-3xl rounded-2xl p-6 text-center ring-1 ring-white/10 sm:p-10">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-300/30">
          <Check className="h-7 w-7 text-emerald-300" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-white">Review Submitted Successfully</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Thank you for helping improve transparency on RebateBoard. Your review is pending verification. Once approved, it can contribute to {selectedBrand.name}'s Trusted Brand Index.
        </p>
        <div className="mx-auto mt-5 flex max-w-sm items-center justify-center gap-2 rounded-xl bg-fuchsia-500/10 p-3 text-sm text-fuchsia-100 ring-1 ring-fuchsia-300/25">
          <Gift className="h-4 w-4" />
          <span><strong>Possible RR reward</strong> after verification</span>
        </div>
        {seriousIssue && (
          <div className="mx-auto mt-5 max-w-xl rounded-xl bg-rose-500/10 p-4 text-left ring-1 ring-rose-300/25">
            <div className="font-semibold text-white">Need help resolving this issue?</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Open a formal complaint and attach supporting evidence for a structured review.
            </p>
            <Link
              to="/firm/$firmId"
              params={{ firmId: selectedBrand.slug }}
              hash="complaints"
              className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/15"
            >
              Open Complaint
            </Link>
          </div>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link to="/dashboard/reviews" className="rounded-full rb-gradient-primary px-4 py-2 text-xs font-semibold text-white">View My Reviews</Link>
          <Link to="/programs" className="rounded-full bg-white/5 px-4 py-2 text-xs font-semibold text-white ring-1 ring-white/15">Browse More Brands</Link>
          <button type="button" onClick={() => window.location.reload()} className="rounded-full bg-white/5 px-4 py-2 text-xs font-semibold text-white ring-1 ring-white/15">Submit Another Review</button>
        </div>
      </div>
    );
  }

  /* ---------- render ---------- */
  return (
    <div className="space-y-6">
      <Stepper step={step} />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* LEFT — main panel */}
        <div className="glass rounded-2xl p-5 ring-1 ring-white/10 sm:p-6">
          {step === 1 && (
            <Step1
              providerType={providerType}
              setProviderType={(t) => {
                setProviderType(t);
                setBrandSlug("");
              }}
              brandSlug={brandSlug}
              setBrandSlug={setBrandSlug}
              search={search}
              setSearch={setSearch}
              filteredBrands={filteredBrands}
            />
          )}
          {step === 2 && (
            <Step2
              fullName={fullName}
              setFullName={setFullName}
              email={email}
              setEmail={setEmail}
              accountSize={accountSize}
              setAccountSize={setAccountSize}
              customSize={customSize}
              setCustomSize={setCustomSize}
              experience={experience}
              setExperience={setExperience}
              evalSteps={evalSteps}
              setEvalSteps={setEvalSteps}
            />
          )}
          {step === 3 && (
            <Step3
              reviewType={reviewType}
              setReviewType={(value) => {
                setReviewType(value);
                setRatings({ ...ratings, overall: 0 });
              }}
              questions={ratingQuestions}
              ratings={ratings}
              setRatings={setRatings}
              body={body}
              setBody={setBody}
            />
          )}
          {step === 4 && (
            <Step4
              proofs={proofs}
              onUpload={handleFiles}
              onRemove={(id) => setProofs((p) => p.filter((x) => x.id !== id))}
              likedMost={likedMost}
              setLikedMost={setLikedMost}
              likedLeast={likedLeast}
              setLikedLeast={setLikedLeast}
            />
          )}
        </div>

        {/* RIGHT — context sidebar */}
        <aside className="space-y-4">
          {selectedBrand && (
            <div className="glass rounded-2xl p-4 ring-1 ring-white/10">
              <div className="flex items-center gap-3">
                <BrandMark brand={selectedBrand} className="h-10 w-10" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-white">{selectedBrand.name}</div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {selectedBrand.category}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-white/[0.04] p-2.5 ring-1 ring-white/10">
                <div className="text-[10px] uppercase text-muted-foreground">Current TBI</div>
                <div className="text-base font-bold text-white">
                  {selectedBrand.score.toFixed(1)}
                  <span className="text-[10px] text-muted-foreground">
                    /{selectedBrand.maxScore}
                  </span>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-fuchsia-200">
                <BadgeCheck className="h-3.5 w-3.5" />
                Approved reviews may contribute to TBI
              </div>
            </div>
          )}

          <SidebarNote step={step} />
        </aside>
      </div>

      {/* footer nav */}
      <div className="flex items-center justify-between gap-3 rounded-2xl glass p-4 ring-1 ring-white/10">
        <div className="text-[11px] text-muted-foreground">
          <Info className="mr-1 inline h-3.5 w-3.5" />
          Need help? <a className="text-fuchsia-300 underline">Contact support</a>
        </div>
        <div className="flex gap-2">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3 | 4)}
              className="inline-flex items-center gap-1 rounded-full bg-white/5 px-4 py-2 text-xs font-semibold text-white ring-1 ring-white/10 hover:bg-white/10"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Back
            </button>
          )}
          {step < 4 ? (
            <button
              disabled={!canContinue}
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3 | 4)}
              className="inline-flex items-center gap-1 rounded-full rb-gradient-primary px-5 py-2 text-xs font-semibold text-white shadow-[0_0_20px_rgba(192,132,252,0.45)] disabled:opacity-40 disabled:shadow-none"
            >
              Continue <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              disabled={!canContinue || submitting || !selectedBrand}
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 rounded-full rb-gradient-primary px-5 py-2 text-xs font-semibold text-white shadow-[0_0_20px_rgba(192,132,252,0.45)] disabled:opacity-40"
            >
              {submitting ? "Submitting..." : "Submit Review"} <Check className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================ Subcomponents ============================ */

function Stepper({ step }: { step: 1 | 2 | 3 | 4 }) {
  const labels = ["Firm Selection", "Your Details", "Rating", "Additional Info"];
  return (
    <div className="glass rounded-2xl p-4 ring-1 ring-white/10">
      <div className="relative flex items-center justify-between gap-2">
        <div className="absolute left-4 right-4 top-1/2 h-px -translate-y-1/2 bg-white/10" />
        <div
          className="absolute left-4 top-1/2 h-px -translate-y-1/2 rb-gradient-primary transition-all"
          style={{ width: `calc((100% - 32px) * ${(step - 1) / 3})` }}
        />
        {labels.map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3 | 4;
          const active = n === step;
          const done = n < step;
          return (
            <div key={label} className="relative z-10 flex flex-col items-center gap-1">
              <div
                className={
                  "grid h-8 w-8 place-items-center rounded-full text-[11px] font-bold ring-2 transition " +
                  (done
                    ? "rb-gradient-primary text-white ring-fuchsia-400/50"
                    : active
                      ? "rb-gradient-primary text-white ring-fuchsia-300/60 shadow-[0_0_18px_rgba(192,132,252,0.6)]"
                      : "bg-white/10 text-muted-foreground ring-white/10")
                }
              >
                {done ? <Check className="h-3.5 w-3.5" /> : n}
              </div>
              <div
                className={
                  "text-[10px] font-medium sm:text-[11px] " +
                  (active || done ? "text-white" : "text-muted-foreground")
                }
              >
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Step1({
  providerType,
  setProviderType,
  brandSlug,
  setBrandSlug,
  search,
  setSearch,
  filteredBrands,
}: {
  providerType: ReviewProviderType | "";
  setProviderType: (t: ReviewProviderType | "") => void;
  brandSlug: string;
  setBrandSlug: (s: string) => void;
  search: string;
  setSearch: (s: string) => void;
  filteredBrands: ReviewBrandOption[];
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">Choose a Provider Type</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Select the type of provider you want to review to get started.
        </p>
        <select
          value={providerType}
          onChange={(e) => setProviderType(e.target.value as ReviewProviderType | "")}
          className="mt-3 w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-fuchsia-400/40"
        >
          <option value="" className="bg-[var(--rb-bg-elevated)]">
            Select a provider type
          </option>
          {PROVIDER_TYPES.map((t) => (
            <option key={t} value={t} className="bg-[var(--rb-bg-elevated)]">
              {t}
            </option>
          ))}
        </select>
      </div>

      {providerType && (
        <div>
          <h3 className="text-base font-bold text-white">
            Which {providerType.toLowerCase()} are you reviewing?
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Select the {providerType.toLowerCase()} you want to review
          </p>

          <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${providerType.toLowerCase()}s…`}
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {filteredBrands.map((b) => (
              <button
                key={b.slug}
                onClick={() => setBrandSlug(b.slug)}
                className={
                  "group flex items-center gap-2 rounded-xl p-2.5 text-left ring-1 transition " +
                  (brandSlug === b.slug
                    ? "bg-fuchsia-500/15 ring-fuchsia-300/40 shadow-[0_0_18px_rgba(192,132,252,0.35)]"
                    : "bg-white/[0.03] ring-white/10 hover:bg-white/[0.06]")
                }
              >
                <BrandMark brand={b} className="h-9 w-9" />
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-white">{b.name}</div>
                  <div className="truncate text-[10px] text-muted-foreground">
                    {b.country ? `${b.country} · ` : ""}
                    {b.score > 0 ? `TBI ${b.score.toFixed(1)}` : "TBI Pending"} · {b.reviewCount} reviews
                  </div>
                </div>
              </button>
            ))}
            {filteredBrands.length === 0 && (
              <div className="col-span-full rounded-xl bg-white/[0.03] p-6 text-center text-xs text-muted-foreground ring-1 ring-white/10">
                No {providerType.toLowerCase()}s match "{search}".
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Step2({
  fullName,
  setFullName,
  email,
  setEmail,
  accountSize,
  setAccountSize,
  customSize,
  setCustomSize,
  experience,
  setExperience,
  evalSteps,
  setEvalSteps,
}: {
  fullName: string;
  setFullName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  accountSize: string;
  setAccountSize: (value: string) => void;
  customSize: string;
  setCustomSize: (value: string) => void;
  experience: string;
  setExperience: (value: string) => void;
  evalSteps: string;
  setEvalSteps: (value: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">Your details</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Provide your account information for verification.
        </p>
      </div>

      <Field label="Full Name">
        <input
          value={fullName}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
          className="w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-fuchsia-400/40"
        />
      </Field>
      <Field label="Email">
        <input
          type="email"
          value={email}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          className="w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-fuchsia-400/40"
        />
      </Field>

      <Field label="Account Size">
        <div className="flex flex-wrap gap-2">
          {ACCOUNT_SIZES.map((s) => (
            <ChipBtn
              key={s}
              active={accountSize === s}
              onClick={() => {
                setAccountSize(s);
                setCustomSize("");
              }}
            >
              {s}
            </ChipBtn>
          ))}
          <ChipBtn active={accountSize === "custom"} onClick={() => setAccountSize("custom")}>
            Custom size
          </ChipBtn>
        </div>
        {accountSize === "custom" && (
          <input
            placeholder="e.g. $7,500"
            value={customSize}
            onChange={(e) => setCustomSize(e.target.value)}
            className="mt-2 w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-fuchsia-400/40"
          />
        )}
      </Field>

      <Field label="Experience Duration">
        <div className="flex flex-wrap gap-2">
          {EXPERIENCES.map((s) => (
            <ChipBtn key={s} active={experience === s} onClick={() => setExperience(s)}>
              {s}
            </ChipBtn>
          ))}
        </div>
      </Field>

      <Field label="Evaluation Steps (optional)">
        <div className="flex flex-wrap gap-2">
          {EVAL_STEPS.map((s) => (
            <ChipBtn key={s} active={evalSteps === s} onClick={() => setEvalSteps(s)}>
              {s}
            </ChipBtn>
          ))}
        </div>
      </Field>
    </div>
  );
}

function Step3({
  reviewType,
  setReviewType,
  questions,
  ratings,
  setRatings,
  body,
  setBody,
}: {
  reviewType: ReviewType;
  setReviewType: (value: ReviewType) => void;
  questions: RatingQuestion[];
  ratings: ReviewRatings;
  setRatings: (r: ReviewRatings) => void;
  body: string;
  setBody: (s: string) => void;
}) {
  const items = [
    ...questions,
    { key: "overall", label: "Overall Experience", pillar: "UT" as const },
  ];
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">Rate your experience</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Please provide honest ratings based on your experience. Approved reviews may affect TBI, and verified or proof-backed reviews carry stronger credibility.
        </p>
      </div>

      <Field label="What experience are you reviewing?">
        <div className="flex flex-wrap gap-2">
          {REVIEW_TYPES.map((type) => (
            <ChipBtn key={type} active={reviewType === type} onClick={() => setReviewType(type)}>
              {type}
            </ChipBtn>
          ))}
        </div>
      </Field>

      <div className="space-y-3">
        {items.map(({ key, label, pillar }) => (
          <div key={key} className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-white">{label}</div>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-semibold text-fuchsia-200 ring-1 ring-white/10">
                {pillar}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRatings({ ...ratings, [key]: n })}
                  className="transition hover:scale-110"
                  aria-label={`${n} stars`}
                >
                  <Star
                    className={`h-5 w-5 ${n <= Number(ratings[key] || 0) ? "fill-fuchsia-400 text-fuchsia-400" : "text-white/20"}`}
                  />
                </button>
              ))}
              <span className="ml-2 text-[11px] text-muted-foreground">
                {ratings[key] ? `${ratings[key]}/5` : "Not rated"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="font-semibold text-white">Detailed description (100+ characters)</span>
          <span className={body.length >= 100 ? "text-emerald-300" : "text-muted-foreground"}>
            {body.length}/100+
          </span>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          placeholder="Share your experience with trading conditions, customer service, payout process, etc."
          className="w-full rounded-xl bg-white/5 p-3 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-fuchsia-400/40"
        />
      </div>
    </div>
  );
}

function BrandMark({ brand, className }: { brand: ReviewBrandOption; className: string }) {
  return (
    <div className={`grid shrink-0 place-items-center overflow-hidden rounded-lg bg-gradient-to-br ${brand.logoColor} ${className}`}>
      {brand.logo ? (
        <img src={brand.logo} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <span className="text-xs font-bold text-white">{brand.name[0]}</span>
      )}
    </div>
  );
}

function Step4({
  proofs,
  onUpload,
  onRemove,
  likedMost,
  setLikedMost,
  likedLeast,
  setLikedLeast,
}: {
  proofs: ReviewProof[];
  onUpload: (files: FileList | null) => void;
  onRemove: (id: string) => void;
  likedMost: string;
  setLikedMost: (s: string) => void;
  likedLeast: string;
  setLikedLeast: (s: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">Additional information</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Provide your proof of use, e.g. Payout Certificate, Brokers/Exchangers Live Account
          Statement.
        </p>
      </div>

      <Field label={`Supporting evidence (optional) — ${proofs.length}/5`}>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/15 bg-white/[0.02] p-6 text-center transition hover:border-fuchsia-300/40 hover:bg-fuchsia-500/5">
          <Upload className="h-6 w-6 text-fuchsia-300" />
          <div className="text-sm font-semibold text-white">
            Drag & drop files here or click to browse
          </div>
          <div className="text-[11px] text-muted-foreground">
            Supports JPG, PNG, PDF (Max {formatUploadLimit()} each)
          </div>
          <input
            type="file"
            multiple
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => onUpload(e.target.files)}
          />
        </label>

        {proofs.length > 0 && (
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {proofs.map((p) => (
              <div
                key={p.id}
                className="relative overflow-hidden rounded-xl bg-white/[0.04] ring-1 ring-white/10"
              >
                {p.type.startsWith("image/") ? (
                  <img src={p.dataUrl} alt={p.name} className="h-24 w-full object-cover" />
                ) : (
                  <div className="grid h-24 place-items-center bg-fuchsia-500/10 text-[11px] font-semibold text-fuchsia-200">
                    PDF
                  </div>
                )}
                <div className="p-2">
                  <div className="truncate text-[11px] text-white">{p.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {(p.size / 1024).toFixed(0)} KB
                  </div>
                </div>
                <button
                  onClick={() => onRemove(p.id)}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white hover:bg-rose-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Field>

      <Field label="3. What do/did you like the most about the item? (optional)">
        <textarea
          value={likedMost}
          onChange={(e) => setLikedMost(e.target.value)}
          rows={3}
          placeholder="Summary here…"
          className="w-full rounded-xl bg-white/5 p-3 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-fuchsia-400/40"
        />
      </Field>
      <Field label="4. What do/did you like the least about the item? (optional)">
        <textarea
          value={likedLeast}
          onChange={(e) => setLikedLeast(e.target.value)}
          rows={3}
          placeholder="Summary here…"
          className="w-full rounded-xl bg-white/5 p-3 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-fuchsia-400/40"
        />
      </Field>
    </div>
  );
}

/* ============================ shared bits ============================ */

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold text-white">{label}</div>
      {children}
    </div>
  );
}

function ChipBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-xl px-3 py-2 text-xs font-medium ring-1 transition " +
        (active
          ? "bg-fuchsia-500/15 text-white ring-fuchsia-300/40"
          : "bg-white/[0.03] text-muted-foreground ring-white/10 hover:bg-white/[0.06] hover:text-white")
      }
    >
      {children}
    </button>
  );
}

function SidebarNote({ step }: { step: 1 | 2 | 3 | 4 }) {
  if (step === 1) {
    return (
      <NoteCard
        icon={<AlertCircle className="h-4 w-4 text-amber-300" />}
        title="Important Notes"
        tone="amber"
      >
        <li>You must have traded with the item for at least 2 weeks.</li>
        <li>No reviews from challenge phase accounts.</li>
        <li>Only approved reviews can contribute to the brand's TBI score.</li>
      </NoteCard>
    );
  }
  if (step === 2) {
    return (
      <NoteCard
        icon={<ShieldCheck className="h-4 w-4 text-cyan-300" />}
        title="Verification Requirements"
        tone="cyan"
      >
        <li>Must use registered email address.</li>
        <li>No challenge phase accounts review.</li>
        <li>All information must match records.</li>
      </NoteCard>
    );
  }
  if (step === 3) {
    return (
      <NoteCard
        icon={<Layers className="h-4 w-4 text-fuchsia-300" />}
        title="Rating Guidelines"
        tone="fuchsia"
      >
        <li>★ = Very poor experience</li>
        <li>★★ = Below average</li>
        <li>★★★ = Average / acceptable</li>
        <li>★★★★ = Good experience</li>
        <li>★★★★★ = Excellent in all aspects</li>
      </NoteCard>
    );
  }
  return (
    <NoteCard
      icon={<Bookmark className="h-4 w-4 text-emerald-300" />}
      title="Submission Guidelines"
      tone="emerald"
    >
      <li>Reviews must be factual and verifiable.</li>
      <li>Proof-backed reviews may receive higher credibility.</li>
      <li>No offensive language or personal attacks.</li>
      <li>Must have actual trading experience.</li>
      <li>False information may result in account suspension.</li>
    </NoteCard>
  );
}

function NoteCard({
  icon,
  title,
  children,
  tone,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  tone: "amber" | "cyan" | "fuchsia" | "emerald";
}) {
  const toneRing = {
    amber: "ring-amber-300/30 bg-amber-500/5",
    cyan: "ring-cyan-300/30 bg-cyan-500/5",
    fuchsia: "ring-fuchsia-300/30 bg-fuchsia-500/5",
    emerald: "ring-emerald-300/30 bg-emerald-500/5",
  }[tone];
  return (
    <div className={`rounded-2xl p-4 ring-1 ${toneRing}`}>
      <div className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-white">
        {icon} {title}
      </div>
      <ul className="space-y-1.5 text-[11px] leading-relaxed text-white/80 list-disc pl-4 marker:text-fuchsia-300/60">
        {children}
      </ul>
    </div>
  );
}
