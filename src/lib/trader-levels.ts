export type TraderLevel = {
  id: string;
  name: string;
  minRr: number;
  summary: string;
};

export type TraderLevelProgress = {
  current: TraderLevel;
  next: TraderLevel | null;
  rr: number;
  remaining: number;
  progress: number;
  rangeStart: number;
  rangeEnd: number;
};

export type NextUnlock = {
  title: string;
  subtitle: string;
  targetRr: number;
  remaining: number;
  progress: number;
};

export type UnlockRuleLike = {
  label?: string;
  description?: string;
  cost?: number;
  enabled?: boolean;
};

export const TRADER_LEVELS: TraderLevel[] = [
  { id: "explorer", name: "Explorer", minRr: 0, summary: "Start building your RebateBoard identity." },
  { id: "bronze", name: "Bronze Trader", minRr: 100, summary: "Unlock early cashback and review benefits." },
  { id: "silver", name: "Silver Trader", minRr: 500, summary: "Access stronger partner rewards and boosted visibility." },
  { id: "gold", name: "Gold Trader", minRr: 1_500, summary: "Priority rewards, richer perks, and stronger trust signals." },
  { id: "platinum", name: "Platinum Trader", minRr: 5_000, summary: "Premium marketplace access and exclusive campaigns." },
  { id: "elite", name: "Elite Trader", minRr: 15_000, summary: "Top-level recognition across the RebateBoard ecosystem." },
];

export const PROGRESSION_TASKS = [
  { label: "Complete Profile", reward: 25, href: "/dashboard/profile" },
  { label: "Write Review", reward: 50, href: "/dashboard/reviews" },
  { label: "Link Trading Account", reward: 40, href: "/dashboard/wallet" },
  { label: "Invite Friend", reward: 100, href: "/dashboard/referrals" },
];

const FALLBACK_UNLOCKS = [
  { title: "Profile Credibility Badge", subtitle: "Finish setup and start building public trust.", targetRr: 100 },
  { title: "5K Trading Challenge", subtitle: "Redeem with any eligible participating partner.", targetRr: 500 },
  { title: "Cashback Boost", subtitle: "Unlock a temporary cashback multiplier.", targetRr: 1_500 },
  { title: "Premium Academy Access", subtitle: "Open advanced training and templates.", targetRr: 5_000 },
  { title: "Elite Giveaway Access", subtitle: "Enter exclusive partner campaigns.", targetRr: 15_000 },
];

export function getTraderLevelProgress(value: number | null | undefined): TraderLevelProgress {
  const rr = Math.max(0, Math.round(Number(value ?? 0)));
  const current = [...TRADER_LEVELS].reverse().find((level) => rr >= level.minRr) ?? TRADER_LEVELS[0];
  const next = TRADER_LEVELS.find((level) => level.minRr > rr) ?? null;
  const rangeStart = current.minRr;
  const rangeEnd = next?.minRr ?? current.minRr;
  const span = Math.max(1, rangeEnd - rangeStart);
  const progress = next ? Math.min(100, Math.max(0, ((rr - rangeStart) / span) * 100)) : 100;
  const remaining = next ? Math.max(0, next.minRr - rr) : 0;

  return { current, next, rr, remaining, progress, rangeStart, rangeEnd };
}

export function getNextUnlock(value: number | null | undefined, rules: UnlockRuleLike[] = []): NextUnlock {
  const rr = Math.max(0, Math.round(Number(value ?? 0)));
  const configuredRule = rules
    .filter((rule) => rule.enabled !== false && Number(rule.cost ?? 0) > rr)
    .sort((a, b) => Number(a.cost ?? 0) - Number(b.cost ?? 0))[0];

  const target = configuredRule
    ? {
        title: configuredRule.label || "Next Reward",
        subtitle: configuredRule.description || "Redeem with any eligible participating partner.",
        targetRr: Math.round(Number(configuredRule.cost ?? 0)),
      }
    : FALLBACK_UNLOCKS.find((unlock) => unlock.targetRr > rr) ?? FALLBACK_UNLOCKS[FALLBACK_UNLOCKS.length - 1];

  const progress = Math.min(100, Math.max(0, (rr / Math.max(1, target.targetRr)) * 100));
  return {
    ...target,
    remaining: Math.max(0, target.targetRr - rr),
    progress,
  };
}
