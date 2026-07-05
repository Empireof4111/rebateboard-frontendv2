import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import {
  fetchTbiExplore,
  type TbiConfidence,
  type TbiProfile,
  type TbiState,
  tbiConfidenceTone,
  tbiStateLabel,
  tbiStateTone,
} from "@/lib/tbi-api";
import { ArrowRight, Filter, Search } from "lucide-react";

export const Route = createFileRoute("/tbi/explore")({
  head: () => ({
    meta: [
      { title: "Explore Trusted Brand Profiles - TBI" },
      {
        name: "description",
        content:
          "Explore every TBI profile across preliminary, partial, and full trust states.",
      },
    ],
  }),
  component: ExplorePage,
});

const CATEGORIES = ["All", "Prop Firm", "Broker", "Exchange", "Tool"] as const;
const STATES: Array<TbiState | "all"> = ["all", "preliminary", "partial", "full"];
const CONFIDENCE: Array<TbiConfidence | "all"> = ["all", "Low", "Medium", "High"];

function ExplorePage() {
  const [profiles, setProfiles] = useState<TbiProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [state, setState] = useState<(typeof STATES)[number]>("all");
  const [confidence, setConfidence] = useState<(typeof CONFIDENCE)[number]>("all");
  const [minScore, setMinScore] = useState(0);
  const [region, setRegion] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchTbiExplore()
      .then((payload) => {
        if (!active) return;
        setProfiles(payload);
        setError(null);
      })
      .catch((err: Error) => {
        if (!active) return;
        setError(err.message || "Unable to load trust profiles.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const regions = useMemo(
    () => Array.from(new Set(profiles.map((profile) => profile.region).filter(Boolean))).sort(),
    [profiles],
  );

  const filtered = useMemo(() => {
    return profiles.filter((profile) => {
      if (category !== "All" && profile.category !== category) return false;
      if (state !== "all" && profile.state !== state) return false;
      if (confidence !== "all" && profile.confidence !== confidence) return false;
      if (profile.finalScore < minScore) return false;
      if (region && profile.region !== region) return false;
      if (query) {
        const haystack = `${profile.name} ${profile.fullCategory} ${profile.region}`.toLowerCase();
        if (!haystack.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [profiles, query, category, state, confidence, minScore, region]);

  return (
    <div className="min-h-screen bg-[#0b0418] text-foreground">
      <SiteHeader />
      <main className="container-app py-6 sm:py-8">
        <div className="mb-6">
          <div className="text-xs text-muted-foreground">
            <Link to="/tbi" className="hover:text-foreground">TBI</Link> · Explore
          </div>
          <h1 className="mt-2 text-3xl font-bold">Explore Trust Profiles</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            This is the trust exploration layer. It includes preliminary, partial, and full profiles without turning every
            brand into a recommendation.
          </p>
        </div>

        <div className="glass rounded-3xl p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex flex-1 items-center gap-2 rounded-full bg-white/5 px-4 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search brands, category, or region..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {CATEGORIES.map((entry) => (
                <button
                  key={entry}
                  onClick={() => setCategory(entry)}
                  className={`rounded-full px-3 py-1.5 text-xs transition ${
                    category === entry
                      ? "bg-fuchsia-500/20 text-fuchsia-200 ring-1 ring-fuchsia-400/40"
                      : "bg-white/5 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {entry}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-3 border-t border-white/5 pt-4 md:grid-cols-4">
            <div>
              <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Filter className="h-3 w-3" /> Trust state
              </div>
              <div className="flex flex-wrap gap-2">
                {STATES.map((entry) => (
                  <button
                    key={entry}
                    onClick={() => setState(entry)}
                    className={`rounded-full px-3 py-1 text-xs transition ${
                      state === entry ? "bg-white/10 text-white ring-1 ring-white/20" : "bg-white/5 text-muted-foreground"
                    }`}
                  >
                    {entry === "all" ? "All" : tbiStateLabel(entry)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs text-muted-foreground">Confidence</div>
              <div className="flex flex-wrap gap-2">
                {CONFIDENCE.map((entry) => (
                  <button
                    key={entry}
                    onClick={() => setConfidence(entry)}
                    className={`rounded-full px-3 py-1 text-xs transition ${
                      confidence === entry ? "bg-white/10 text-white ring-1 ring-white/20" : "bg-white/5 text-muted-foreground"
                    }`}
                  >
                    {entry}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs text-muted-foreground">Region</div>
              <select
                value={region}
                onChange={(event) => setRegion(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#160924] px-3 py-2 text-sm text-white outline-none"
              >
                <option value="">All regions</option>
                {regions.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-2 text-xs text-muted-foreground">
                Min score: <span className="font-semibold text-white">{minScore.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                step={0.1}
                value={minScore}
                onChange={(event) => setMinScore(Number(event.target.value))}
                className="w-full accent-fuchsia-500"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs text-muted-foreground">
          {filtered.length} profile{filtered.length === 1 ? "" : "s"}
        </div>

        {loading ? (
          <div className="glass mt-4 rounded-3xl p-8 text-sm text-muted-foreground">Loading trust profiles...</div>
        ) : error ? (
          <div className="mt-4 rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-200">{error}</div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((profile) => (
              <Link
                key={profile.id}
                to="/tbi/brand/$slug"
                params={{ slug: profile.slug }}
                className="glass group rounded-3xl p-5 transition hover:border-fuchsia-400/40"
              >
                <div className="flex items-start gap-3">
                  {profile.logo ? (
                    <img
                      src={profile.logo}
                      alt={profile.name}
                      className="h-12 w-12 rounded-2xl object-cover ring-1 ring-white/10"
                    />
                  ) : (
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600 text-sm font-bold text-white">
                      {profile.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold">{profile.name}</div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${tbiStateTone(profile.state)}`}>
                        {tbiStateLabel(profile.state)}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {profile.fullCategory} {profile.region ? `· ${profile.region}` : ""}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {profile.state === "preliminary"
                        ? profile.preliminaryScore.toFixed(1)
                        : profile.finalScore.toFixed(1)}
                      <span className="text-xs text-muted-foreground">
                        /{profile.state === "preliminary" ? "6.5" : "10"}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">{profile.trustLabel}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-fuchsia-300" />
                </div>

                <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className={tbiConfidenceTone(profile.confidence)}>{profile.confidence} confidence</span>
                  <span>{profile.reviewCount} reviews</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
