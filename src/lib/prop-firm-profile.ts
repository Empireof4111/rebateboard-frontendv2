import { API_BASE_URL } from "@/lib/api";
import { resolveCountryDisplay } from "@/lib/country-format";

const EMPTY = "Not provided";

export type ProfileLogoItem = {
  id: string;
  name: string;
  logo?: string;
};

export type ProfileCountry = {
  name: string;
  code: string;
  flag: string;
};

export type ProfileCard = {
  title: string;
  body: string;
  meta?: string;
};

export type ProfileRow = {
  label: string;
  value: string;
};

export type ProfileRule = {
  question: string;
  answer: string;
};

export type ProfileChallenge = {
  id: string;
  title: string;
  badge?: string;
  lines: string[];
  price?: string;
};

export type NormalizedPropFirmProfile = {
  name: string;
  slug: string;
  overview: {
    tagline: string;
    description: string;
    founded: string;
    hq: string;
    supportEmail: string;
    country: ProfileCountry;
    videoReviewUrl: string;
  };
  fundingPrograms: ProfileChallenge[];
  accountRows: ProfileRow[];
  tradingRules: ProfileRow[];
  customRules: ProfileRule[];
  scalingCards: ProfileCard[];
  payoutCards: ProfileCard[];
  payoutMethods: ProfileLogoItem[];
  cashbackRows: ProfileRow[];
  cashbackCards: ProfileCard[];
  pricingCards: ProfileCard[];
  instrumentRows: ProfileRow[];
  platformCards: ProfileCard[];
  tradingPlatforms: ProfileLogoItem[];
  paymentMethods: ProfileLogoItem[];
  withdrawalMethods: ProfileLogoItem[];
  communityCards: ProfileCard[];
  regulationCards: ProfileCard[];
  supportRows: ProfileRow[];
  restrictedCountries: ProfileCountry[];
  pros: string[];
  cons: string[];
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw || /^(null|undefined|n\/a|na|none|false|-|\u2014)$/i.test(raw)) return "";
  return raw;
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const clean = text(value);
    if (clean) return clean;
  }
  return "";
}

function valueOrFallback(value: unknown, fallback = EMPTY) {
  return text(value) || fallback;
}

function mediaUrl(value: unknown) {
  const raw = text(value);
  if (!raw) return "";
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;

  const apiOrigin = API_BASE_URL.replace(/\/api\/v1$/i, "");
  if (raw.startsWith("/api/v1/")) return `${apiOrigin}${raw}`;
  if (raw.startsWith("/file/")) return `${API_BASE_URL}${raw}`;
  if (raw.startsWith("/")) return `${apiOrigin}${raw}`;

  return `${API_BASE_URL}/file/view?key=${encodeURIComponent(raw)}`;
}

function splitList(...values: unknown[]) {
  return values
    .flatMap((value) =>
      text(value)
        .split(/\r?\n|,|;|\|/)
        .map((item) => item.trim())
        .filter(Boolean),
    )
    .filter(
      (item, index, all) =>
        all.findIndex((candidate) => candidate.toLowerCase() === item.toLowerCase()) === index,
    );
}

function splitParagraphLines(value: unknown) {
  return text(value)
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function namedLogoItems(value: unknown, fallbackText = ""): ProfileLogoItem[] {
  if (Array.isArray(value)) {
    const items = value
      .map((item, index) => {
        if (typeof item === "string") {
          const name = text(item);
          return name
            ? {
                id: `logo_${index}_${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
                name,
              }
            : null;
        }

        const row = asRecord(item);
        const name = text(row.name);
        const logo = mediaUrl(firstText(row.logo, row.logoUrl, row.url, row.src, row.key));
        if (!name && !logo) return null;
        return {
          id: text(row.id) || `logo_${index}`,
          name: name || `Item ${index + 1}`,
          logo,
        };
      })
      .filter((item): item is ProfileLogoItem => Boolean(item));

    if (items.length) return items;
  }

  return splitList(fallbackText).map((name, index) => ({
    id: `fallback_logo_${index}_${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name,
  }));
}

function regionName(code: string, fallback: string) {
  if (/^[A-Z]{2}$/i.test(code) && typeof Intl !== "undefined" && "DisplayNames" in Intl) {
    try {
      return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) || fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function countryFromText(value: string): ProfileCountry {
  const display = resolveCountryDisplay(value);
  const raw = text(value);
  const code = display.code || raw.slice(0, 3).toUpperCase();
  const name = /^[A-Z]{2}$/i.test(raw) ? regionName(raw, raw.toUpperCase()) : raw;

  return {
    name: name || regionName(code, code),
    code,
    flag: display.flag,
  };
}

function countriesFromText(...values: unknown[]) {
  return splitList(...values).map(countryFromText);
}

function challengePrice(row: Record<string, unknown>) {
  const price = row.price;
  if (typeof price === "number" && Number.isFinite(price)) return `$${price.toLocaleString()}`;
  return text(price);
}

function percentValue(value: unknown) {
  const clean = text(value);
  if (!clean) return "";
  return clean.includes("%") ? clean : `${clean}%`;
}

function normalizeChallenges(value: unknown): ProfileChallenge[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => {
      const row = asRecord(item);
      if (row.active === false) return null;

      const title = firstText(row.program, row.accountStep, `Account ${index + 1}`);
      const lines = [
        firstText(row.accountStep) && `Step: ${row.accountStep}`,
        firstText(row.size) && `Size: ${row.size}`,
        firstText(row.asset) && `Asset: ${row.asset}`,
        firstText(row.profitTarget) && `Profit target: ${row.profitTarget}`,
        firstText(row.dailyLoss) && `Daily loss: ${row.dailyLoss}`,
        firstText(row.maxLoss) && `Max loss: ${row.maxLoss}`,
        firstText(row.ptdd) && `PT:DD: ${row.ptdd}`,
        firstText(row.profitSplit) && `Profit split: ${percentValue(row.profitSplit)}`,
        firstText(row.payoutFreq) && `Payout: ${row.payoutFreq}`,
        firstText(row.discountCode) && `Code: ${row.discountCode}`,
      ].filter(Boolean) as string[];

      return {
        id: text(row.id) || `challenge_${index}`,
        title,
        badge: text(row.badge),
        lines,
        price: challengePrice(row),
      };
    })
    .filter((item): item is ProfileChallenge => Boolean(item));
}

function normalizeRules(prop: Record<string, unknown>) {
  const rules = prop.rules;
  if (!Array.isArray(rules)) return [];

  return rules
    .map((item) => {
      const row = asRecord(item);
      const question = firstText(row.question, row.title);
      const answer = firstText(row.answer, row.body, row.description);
      if (!question && !answer) return null;
      return { question: question || "Rule", answer: answer || EMPTY };
    })
    .filter((item): item is ProfileRule => Boolean(item));
}

function card(title: string, body: unknown, meta?: unknown): ProfileCard | null {
  const clean = text(body);
  if (!clean) return null;
  return { title, body: clean, meta: text(meta) };
}

function row(label: string, value: unknown): ProfileRow | null {
  const clean = text(value);
  if (!clean) return null;
  return { label, value: clean };
}

function rowsWithFallback(rows: Array<ProfileRow | null>) {
  const clean = rows.filter((item): item is ProfileRow => Boolean(item));
  return clean.length ? clean : [{ label: "Status", value: "Not available" }];
}

function cardsWithFallback(cards: Array<ProfileCard | null>) {
  const clean = cards.filter((item): item is ProfileCard => Boolean(item));
  return clean.length ? clean : [{ title: "Status", body: "Not available" }];
}

function challengeSizeSummary(challenges: ProfileChallenge[]) {
  const sizes = challenges
    .flatMap((challenge) =>
      challenge.lines
        .filter((line) => line.toLowerCase().startsWith("size:"))
        .map((line) => line.replace(/^size:\s*/i, "")),
    )
    .filter(Boolean);
  return sizes.length ? sizes.join(", ") : "";
}

export function normalizePropFirmProfile(
  rawBrand: unknown,
  fallbackName: string,
): NormalizedPropFirmProfile {
  const brand = asRecord(rawBrand);
  const identity = asRecord(brand.identity);
  const founder = asRecord(brand.founder);
  const broker = asRecord(brand.broker);
  const prop = asRecord(brand.prop);
  const exchange = asRecord(brand.exchange);
  const tool = asRecord(brand.tool);
  const editorial = asRecord(brand.editorial);
  const profile = asRecord(brand.profile);
  const cashback = asRecord(brand.cashback);
  const trust = asRecord(brand.trust);
  const challenges = normalizeChallenges(brand.challenges);

  const payoutMethods = namedLogoItems(prop.payoutMethodItems, firstText(prop.payoutMethods));
  const propPlatforms = namedLogoItems(prop.tradingPlatformItems, firstText(prop.platform));
  const brokerPlatforms = namedLogoItems(broker.tradingPlatformItems, firstText(broker.platforms));
  const depositMethods = namedLogoItems(broker.depositMethodItems, firstText(broker.deposits));
  const withdrawalMethods = namedLogoItems(
    broker.withdrawalMethodItems,
    firstText(broker.withdrawals, exchange.withdrawals),
  );
  const tradingPlatforms = [...propPlatforms, ...brokerPlatforms].filter(
    (item, index, all) =>
      all.findIndex((candidate) => candidate.name.toLowerCase() === item.name.toLowerCase()) ===
      index,
  );

  const country = countriesFromText(identity.country, identity.hq, profile.country)[0] ?? {
    name: "Global",
    code: "GLB",
    flag: "",
  };

  const rules = rowsWithFallback([
    row("Time Limit", profile.timeLimit),
    row("Minimum Trading Days", prop.minDays),
    row("Profit Target", prop.profitTarget),
    row("Daily Drawdown", prop.dailyDD),
    row("Max Drawdown", prop.maxDD),
    row("News Trading", prop.news),
    row("Weekend Holding", prop.weekend),
    row("Overnight Holding", profile.overnightHolding),
    row("Expert Advisors", prop.ea),
    row("Copy Trading", firstText(prop.copyTrading, broker.copyTrading, exchange.copyTrading)),
    row("Consistency Rule", prop.consistency),
    row("Prohibited Activity", prop.prohibited),
    row("Scalping", broker.scalping),
    row("Hedging", broker.hedging),
  ]);

  const leverageRows = splitList(profile.leverageByAsset).map((entry) => {
    const [label, ...rest] = entry.split(/[:-]/);
    return {
      label: text(label) || "Leverage",
      value: text(rest.join("-")) || entry,
    };
  });

  const challengePriceCards = challenges
    .filter((challenge) => challenge.price)
    .slice(0, 6)
    .map((challenge) => ({
      title: challenge.title,
      body: challenge.price || EMPTY,
      meta: challenge.badge,
    }));
  const proofRequired = asRecord(cashback.proofRequired);
  const requiredProof = [
    proofRequired.screenshot && "Screenshot / receipt",
    proofRequired.registeredEmail && "Registered email",
    proofRequired.accountId && "Account ID",
    proofRequired.orderId && "Order / Tx ID",
  ].filter(Boolean) as string[];
  const cashbackEligible = firstText(cashback.eligible) || firstText(cashback.maxPct, cashback.defaultPct)
    ? firstText(cashback.eligible, "Yes")
    : "";

  return {
    name: firstText(brand.name, fallbackName),
    slug: firstText(brand.slug, fallbackName.toLowerCase().replace(/[^a-z0-9]+/g, "-")),
    overview: {
      tagline: firstText(identity.tagline, editorial.bestFor),
      description: valueOrFallback(identity.description || identity.editorial || editorial.verdict),
      founded: valueOrFallback(identity.founded),
      hq: valueOrFallback(identity.hq || identity.country || profile.country),
      supportEmail: valueOrFallback(identity.supportEmail),
      country,
      videoReviewUrl: firstText(founder.yt, profile.videoReviewUrl, editorial.videoReviewUrl),
    },
    fundingPrograms: challenges.length
      ? challenges
      : [
          {
            id: "funding-summary",
            title: firstText(prop.evalType, "Funding Program"),
            lines: [
              row("Account sizes", prop.sizes)?.value && `Account sizes: ${prop.sizes}`,
              row("Profit target", prop.profitTarget)?.value &&
                `Profit target: ${prop.profitTarget}`,
              row("Daily drawdown", prop.dailyDD)?.value && `Daily drawdown: ${prop.dailyDD}`,
              row("Max drawdown", prop.maxDD)?.value && `Max drawdown: ${prop.maxDD}`,
            ].filter(Boolean) as string[],
          },
        ].filter((item) => item.lines.length),
    accountRows: rowsWithFallback([
      row("Evaluation Type", prop.evalType),
      row(
        "Sizes Available",
        firstText(prop.sizes, challengeSizeSummary(challenges), broker.accountTypes),
      ),
      row("Max Allocation", prop.maxAlloc),
      row("Leverage", firstText(profile.leverageOverall, broker.maxLeverage, exchange.maxLeverage)),
      row("Platform", firstText(prop.platform, broker.platforms, tool.platforms)),
      row("Instruments", firstText(prop.instruments, broker.assets, exchange.supportedAssets)),
    ]),
    tradingRules: rules,
    customRules: normalizeRules(prop),
    scalingCards: cardsWithFallback([
      card("Scaling Plan", prop.scaling),
      card("Maximum Allocation", prop.maxAlloc),
      card("Profit Split", prop.profitSplit),
    ]),
    payoutCards: cardsWithFallback([
      card("Profit Split", prop.profitSplit),
      card("Payout Schedule", prop.payoutSchedule),
      card("Withdrawal Speed", broker.withdrawalSpeed),
    ]),
    payoutMethods,
    cashbackRows: rowsWithFallback([
      row("Supported", cashbackEligible),
      row("Cashback Type", cashback.type),
      row("Default Rate", cashback.defaultPct ? `${cashback.defaultPct}%` : ""),
      row("Maximum Rate", cashback.maxPct ? `Up to ${cashback.maxPct}%` : ""),
      row("How RebateBoard Earns", cashback.howRBEarns),
      row("How Traders Earn", cashback.howTraderEarns),
      row("Terms", cashback.terms),
    ]),
    cashbackCards: cardsWithFallback([
      card(
        "Distribution",
        cashback.supportsApiAuto
          ? "Automatic partner/API verification"
          : cashback.requiresManualClaim
            ? "Manual claim review with proof"
            : "",
      ),
      card("Rebate Wallet", cashback.supportsRebateWallet ? "Supported" : "Not supported"),
      card("Manual Claim", cashback.requiresManualClaim ? "Required" : "Not required"),
      card("Required Proof", requiredProof.join("; ")),
    ]),
    pricingCards: challengePriceCards.length
      ? challengePriceCards
      : cardsWithFallback([
          card("Pricing", prop.pricing || tool.pricing),
          card("Discount Code", firstText(prop.discountCode, tool.discountCode)),
          card("Discount", firstText(prop.discountPercentage, tool.discountPercentage)),
          card("Broker Commission", broker.commission),
          card("Spreads", broker.spreads),
          card("Exchange Fees", exchange.fees),
        ]),
    instrumentRows: leverageRows.length
      ? leverageRows
      : rowsWithFallback([
          row(
            "Allowed Instruments",
            firstText(prop.instruments, broker.assets, exchange.supportedAssets),
          ),
          row(
            "Overall Leverage",
            firstText(profile.leverageOverall, broker.maxLeverage, exchange.maxLeverage),
          ),
          row("Spot Support", exchange.spot),
          row("Futures Support", exchange.futures),
        ]),
    platformCards: cardsWithFallback([
      card("Execution", broker.execution),
      card("Security", exchange.security),
      card("Integrations", tool.integrations),
      card("Features", tool.features),
      card("API Trading", exchange.apiTrading),
      card("Web3 Integration", exchange.web3Integration),
    ]),
    tradingPlatforms,
    paymentMethods: depositMethods,
    withdrawalMethods,
    communityCards: cardsWithFallback([
      card("Community", profile.supportCommunity || profile.community),
      card("Education", editorial.keyFeatures),
      card("Best For", firstText(editorial.bestFor, tool.bestFor)),
      card("Trial", tool.trial),
    ]),
    regulationCards: cardsWithFallback([
      card("Legal Entity", firstText(trust.legalEntity, profile.legalEntity)),
      card("License", firstText(trust.licenseNo, broker.regulations, exchange.licenses)),
      card("KYB Document", trust.kybDoc ? "Attached" : ""),
      card("Transparency", firstText(trust.transparencyNote, profile.transparencyNote)),
      card("Public Feedback", firstText(trust.publicFeedback, profile.publicFeedback)),
    ]),
    supportRows: rowsWithFallback([
      row("Channels", profile.supportChannels),
      row("Response Time", profile.supportResponse),
      row("Community Support", profile.supportCommunity),
      row("Support Email", identity.supportEmail),
    ]),
    restrictedCountries: countriesFromText(profile.restrictedCountries, broker.restrictedCountries),
    pros: splitParagraphLines(editorial.pros),
    cons: splitParagraphLines(editorial.cons),
  };
}
