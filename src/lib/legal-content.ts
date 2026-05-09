// CMS-ready structured legal content for RebateBoard.
// Future: fetch from DB / headless CMS — keep the same shape.

export type LegalSection = {
  id: string;        // anchor slug
  heading: string;   // H2
  body: string[];    // paragraphs (string[])
  sub?: { id: string; heading: string; body: string[] }[]; // H3 list
};

export type LegalDoc = {
  slug: "terms" | "privacy" | "cookies" | "disclaimer" | "compliance";
  navLabel: string;
  title: string;
  tagline: string;
  metaTitle: string;
  metaDescription: string;
  lastUpdated: string;
  sections: LegalSection[];
};

const LAST_UPDATED = "May 2, 2026";

export const LEGAL_DOCS: LegalDoc[] = [
  {
    slug: "terms",
    navLabel: "Terms",
    title: "Terms & Conditions",
    tagline: "The rules that govern how you use RebateBoard.",
    metaTitle: "Terms & Conditions — RebateBoard | Forex Cashback & Trading Rebates",
    metaDescription:
      "Read RebateBoard's Terms & Conditions covering account usage, cashback policy, referrals, prohibited activities and platform liability for forex cashback and broker reviews.",
    lastUpdated: LAST_UPDATED,
    sections: [
      {
        id: "overview",
        heading: "1. Platform Overview",
        body: [
          "RebateBoard is an independent comparison and rewards platform. We help traders discover, evaluate and benefit from regulated brokers, prop firms and crypto exchanges through three core services: trading rebates and cashback, verified user reviews and our proprietary trading analytics.",
          "By accessing the platform, creating an account or using any feature offered on https://rebateboard.com, you agree to be bound by these Terms. If you do not agree, please discontinue use immediately.",
        ],
      },
      {
        id: "responsibilities",
        heading: "2. User Responsibilities",
        body: [
          "You are responsible for the accuracy of any information you submit, including your trading account IDs, referral information and contact details. You agree to keep your login credentials confidential and to notify us promptly of any unauthorized use.",
          "You must be at least 18 years old (or the legal age of majority in your jurisdiction) to use RebateBoard.",
        ],
      },
      {
        id: "account",
        heading: "3. Account Usage Rules",
        body: [
          "Each user is permitted one personal account. Multi-accounting, identity falsification, automated scraping and account sharing are strictly forbidden.",
          "We reserve the right to verify your identity at any time through KYC (Know Your Customer) processes before paying out rewards or cashback.",
        ],
      },
      {
        id: "cashback",
        heading: "4. Cashback Policy",
        body: [
          "Cashback is paid only on eligible trades or purchases tracked through our official affiliate links and codes. RebateBoard receives a commission from partner brokers and shares a portion with you, the trader.",
          "Cashback amounts, rates and payout schedules are displayed on each partner page and may change without prior notice. Disputed or reversed transactions (chargebacks, refunds, broker clawbacks) will be deducted from your cashback balance.",
        ],
      },
      {
        id: "rewards",
        heading: "5. Referral & Rewards Rules",
        body: [
          "Our referral program rewards you for inviting genuine new users. Self-referrals, fake accounts and incentivised sign-ups are prohibited and will result in forfeiture of rewards.",
          "RR Points and other in-platform rewards have no cash value outside RebateBoard and may not be sold, transferred or exchanged with other users.",
        ],
      },
      {
        id: "prohibited",
        heading: "6. Prohibited Activities",
        body: [
          "You may not use RebateBoard to engage in fraud, money laundering, market manipulation, abusive trading practices, posting fake reviews, scraping data, reverse engineering the platform or any activity that violates applicable laws.",
          "Violations may result in suspension, permanent ban, forfeiture of rewards and legal action.",
        ],
      },
      {
        id: "termination",
        heading: "7. Termination Rights",
        body: [
          "We may suspend or terminate your account at any time, with or without notice, for breach of these Terms or where required by law. You may close your account at any time from your dashboard settings.",
          "Outstanding cashback balances at the time of termination may be forfeited where termination results from a Terms violation.",
        ],
      },
      {
        id: "liability",
        heading: "8. Limitation of Liability",
        body: [
          "RebateBoard is provided “as is” and “as available”. To the maximum extent permitted by law, we disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose and non-infringement.",
          "We are not liable for any indirect, incidental, special, consequential or punitive damages arising from your use of the platform, third-party broker actions, market losses or service interruptions.",
        ],
      },
      {
        id: "law",
        heading: "9. Governing Law",
        body: [
          "These Terms shall be governed by and construed in accordance with the laws of [Jurisdiction Placeholder]. Any dispute shall be submitted to the exclusive jurisdiction of the competent courts located in [City Placeholder].",
        ],
      },
      {
        id: "changes",
        heading: "10. Changes to These Terms",
        body: [
          "We may revise these Terms from time to time. Material changes will be communicated via email or in-platform notice. Continued use after changes constitutes acceptance of the revised Terms.",
        ],
      },
    ],
  },
  {
    slug: "privacy",
    navLabel: "Privacy",
    title: "Privacy Policy",
    tagline: "How we collect, use and protect your personal data.",
    metaTitle: "Privacy Policy — RebateBoard | Trader Data Protection & GDPR",
    metaDescription:
      "Learn how RebateBoard collects, uses and protects your data when you use our forex cashback, trading rebates and broker review services. GDPR-aligned, transparent and trader-first.",
    lastUpdated: LAST_UPDATED,
    sections: [
      {
        id: "intro",
        heading: "1. Introduction",
        body: [
          "Your privacy matters. This Privacy Policy explains what personal information RebateBoard collects, why we collect it, how we use it and the rights you have over your data. We follow GDPR-style principles globally, regardless of where you trade from.",
        ],
      },
      {
        id: "collection",
        heading: "2. Data We Collect",
        body: [
          "We collect data you provide directly (email, name, country, broker accounts, trading preferences), data generated by your use of the platform (logins, clicks, dashboard activity, reviews you post) and technical data (IP address, browser, device, cookies).",
          "Sensitive financial credentials such as broker passwords are never requested or stored.",
        ],
      },
      {
        id: "use",
        heading: "3. How We Use Your Data",
        body: ["We use your data only for clearly defined purposes:"],
        sub: [
          { id: "use-personalization", heading: "Personalization", body: ["Tailoring offers, dashboards, broker recommendations and trading insights to your goals."] },
          { id: "use-rewards", heading: "Rewards & Cashback", body: ["Tracking eligible trades, calculating rebates and processing payouts to your wallet."] },
          { id: "use-analytics", heading: "Product Analytics", body: ["Understanding usage patterns to improve features, performance and security."] },
          { id: "use-marketing", heading: "Marketing", body: ["Sending product updates, broker promotions and newsletters — only with your opt-in consent. You can unsubscribe at any time."] },
        ],
      },
      {
        id: "third-parties",
        heading: "4. Third-Party Sharing",
        body: [
          "We share limited data with trusted partners that are essential to our service: brokers and prop firms (to track your eligible trades), payment processors, KYC providers and analytics tools (e.g., Google Analytics, Mixpanel).",
          "We never sell your personal data. All partners are bound by strict data-processing agreements.",
        ],
      },
      {
        id: "cookies",
        heading: "5. Cookies & Tracking",
        body: [
          "We use cookies and similar technologies to keep you logged in, remember preferences and measure performance. See our Cookie Policy for full details and controls.",
        ],
      },
      {
        id: "security",
        heading: "6. Data Protection",
        body: [
          "We apply industry-standard safeguards: TLS encryption in transit, encrypted database storage, role-based access controls, regular security audits and least-privilege access for employees.",
          "Despite our best efforts, no internet transmission is 100% secure. You should also protect your account by using a strong, unique password and enabling two-factor authentication.",
        ],
      },
      {
        id: "rights",
        heading: "7. Your Rights",
        body: [
          "You have the right to access the personal data we hold about you, request correction or deletion, restrict or object to processing, request data portability and withdraw consent at any time.",
          "To exercise these rights, contact privacy@rebateboard.com. We respond within 30 days.",
        ],
      },
      {
        id: "retention",
        heading: "8. Data Retention",
        body: [
          "We keep your data only for as long as needed to provide the service and to comply with legal, accounting and reporting obligations. Inactive accounts are reviewed periodically and may be deleted after a reasonable retention window.",
        ],
      },
      {
        id: "children",
        heading: "9. Children",
        body: ["RebateBoard is not intended for users under 18. We do not knowingly collect data from minors."],
      },
      {
        id: "updates",
        heading: "10. Changes to This Policy",
        body: ["When we update this Policy, we will revise the “Last updated” date and, for material changes, notify you in-app or by email."],
      },
    ],
  },
  {
    slug: "cookies",
    navLabel: "Cookies",
    title: "Cookie Policy",
    tagline: "How RebateBoard uses cookies — and how you stay in control.",
    metaTitle: "Cookie Policy — RebateBoard | Tracking, Analytics & Preferences",
    metaDescription:
      "Detailed Cookie Policy for RebateBoard explaining essential, analytics and marketing cookies used across our forex cashback, broker reviews and crypto exchange rebates platform.",
    lastUpdated: LAST_UPDATED,
    sections: [
      {
        id: "what-are-cookies",
        heading: "1. What Are Cookies?",
        body: [
          "Cookies are small text files stored on your device when you visit a website. They help the site remember information about your visit — such as your preferred language, login session and pages you've viewed — to make your next visit easier and the site more useful to you.",
        ],
      },
      {
        id: "types",
        heading: "2. Types of Cookies We Use",
        body: ["RebateBoard uses three categories of cookies:"],
        sub: [
          {
            id: "essential",
            heading: "Essential Cookies",
            body: ["Required for the platform to function — authentication, session security, fraud prevention. These cannot be disabled."],
          },
          {
            id: "analytics",
            heading: "Analytics Cookies",
            body: ["Help us understand how traders use the platform so we can improve dashboards, search and rebate tracking. Aggregated and anonymized."],
          },
          {
            id: "marketing",
            heading: "Marketing Cookies",
            body: ["Used to measure the effectiveness of campaigns and partner referrals, and to show relevant offers. Set only with your consent."],
          },
        ],
      },
      {
        id: "control",
        heading: "3. How to Control Cookies",
        body: [
          "You can manage cookie preferences at any time using the cookie banner or your dashboard settings. You can also clear or block cookies at the browser level — but doing so may break parts of the platform that depend on them (e.g., login and cashback tracking).",
        ],
      },
      {
        id: "third-party",
        heading: "4. Third-Party Cookies",
        body: [
          "Some cookies are set by trusted third parties such as Google Analytics, Meta Pixel, affiliate-tracking networks and customer-support widgets. These providers process data under their own privacy policies.",
        ],
      },
      {
        id: "updates",
        heading: "5. Updates",
        body: ["We may update this Cookie Policy as our use of cookies evolves. Material changes will be highlighted in the platform."],
      },
    ],
  },
  {
    slug: "disclaimer",
    navLabel: "Disclaimer",
    title: "Disclaimer",
    tagline: "Important risk and information notices for every RebateBoard user.",
    metaTitle: "Disclaimer — RebateBoard | Trading Risk & No Financial Advice",
    metaDescription:
      "Read RebateBoard's full disclaimer. Trading forex, CFDs and crypto is high risk. We are not a broker, do not provide financial advice and cashback does not reduce trading risk.",
    lastUpdated: LAST_UPDATED,
    sections: [
      {
        id: "no-advice",
        heading: "1. No Financial Advice",
        body: [
          "All content on RebateBoard — including reviews, ratings, guides, dashboards, analytics and rebate calculations — is provided for informational and educational purposes only. Nothing on this platform constitutes investment, financial, legal or tax advice.",
          "Always consult an independent, qualified professional before making any trading or investment decision.",
        ],
      },
      {
        id: "no-guarantee",
        heading: "2. No Guarantee of Profits",
        body: [
          "Past performance, leaderboard standings, demo results and back-tests are not indicative of future results. RebateBoard makes no representation or warranty that any strategy, broker, or product will be profitable.",
        ],
      },
      {
        id: "risk",
        heading: "3. Trading Risk Warning",
        body: [
          "Trading forex, CFDs, crypto-assets and other leveraged products carries a high level of risk and may not be suitable for all investors. You can lose all or more than your initial deposit. Only trade with capital you can afford to lose, and ensure you fully understand the risks involved.",
        ],
      },
      {
        id: "cashback",
        heading: "4. Cashback Does Not Reduce Trading Risk",
        body: [
          "Receiving cashback or rebates does not reduce the underlying market risk of your trades. A losing trade remains a loss even after a rebate is credited. Do not increase risk-taking on the assumption that cashback offsets losses.",
        ],
      },
      {
        id: "third-parties",
        heading: "5. Third-Party Platforms",
        body: [
          "Brokers, prop firms and crypto exchanges featured on RebateBoard are independent third parties. We do not control their services, regulation, execution quality, withdrawal policies or business practices. Any agreement you enter into with a partner is solely between you and that partner.",
        ],
      },
      {
        id: "accuracy",
        heading: "6. Accuracy of Information",
        body: [
          "We work hard to keep broker data, spreads, promotions and rebate rates accurate, but conditions change frequently. We make no warranty as to the completeness, accuracy or timeliness of any information published on the platform. Always verify details directly with the broker before trading.",
        ],
      },
    ],
  },
  {
    slug: "compliance",
    navLabel: "Compliance",
    title: "Compliance & Trust Statement",
    tagline: "Why traders trust RebateBoard — and how we keep it that way.",
    metaTitle: "Compliance & Trust — RebateBoard | Verified Broker Reviews & TBI",
    metaDescription:
      "RebateBoard is not a broker. Learn how we verify partners, run the Trusted Brand Index (TBI), prevent fraud and protect traders across forex cashback and crypto exchange rebates.",
    lastUpdated: LAST_UPDATED,
    sections: [
      {
        id: "not-a-broker",
        heading: "1. RebateBoard Is Not a Broker",
        body: [
          "RebateBoard does not provide brokerage, custody, execution or any regulated financial service. We do not hold client funds, place trades on your behalf or operate trading accounts.",
          "We are an independent comparison, rewards and analytics platform that connects traders with regulated brokers, prop firms and exchanges.",
        ],
      },
      {
        id: "role",
        heading: "2. Our Role as an Affiliate & Partner Platform",
        body: [
          "We earn revenue from commissions paid by partner brokers when you sign up or trade through our links. A meaningful share of that commission is returned to you as cashback. This commercial model is fully disclosed and is the foundation of how RebateBoard funds itself.",
          "Affiliate compensation never influences review scores or the Trusted Brand Index — see “Review integrity” below.",
        ],
      },
      {
        id: "transparency",
        heading: "3. Transparency Commitment",
        body: [
          "We commit to publishing rebate rates, partner relationships and methodology changes openly. Where commissions are paid by a partner, we say so. Where a brand is featured because of placement, we label it as “Sponsored”.",
        ],
      },
      {
        id: "review-integrity",
        heading: "4. Review Integrity",
        body: [
          "Every review must come from a real, verified user account. We do not buy, sell, fabricate or filter reviews based on partner status. Suspicious activity is detected through automated checks, IP/device fingerprinting and manual moderation.",
          "Brokers cannot pay to remove or hide negative reviews. They may officially respond, but they cannot delete trader feedback.",
        ],
      },
      {
        id: "tbi",
        heading: "5. The Trusted Brand Index (TBI)",
        body: [
          "The TBI is RebateBoard's proprietary trust score for brokers, prop firms and exchanges. It is calculated from regulation status, payout reliability, complaint volume, response speed, review sentiment and platform stability.",
          "Scores are recalculated regularly and changes are auditable. Any manual override is logged in our internal audit trail.",
        ],
      },
      {
        id: "anti-fraud",
        heading: "6. Anti-Fraud Policy",
        body: [
          "We actively monitor for fake reviews, multi-accounting, referral abuse, wash-trading aimed at inflating cashback and impersonation of partners. Confirmed violations result in account suspension, forfeiture of rewards and, where appropriate, escalation to law enforcement.",
        ],
      },
      {
        id: "partner-standards",
        heading: "7. Partner Selection Standards",
        body: [
          "Before listing a partner we review regulatory status, financial stability, withdrawal track record, terms transparency and trader feedback. Partners that fall below our standards are flagged, downgraded in TBI or removed.",
        ],
      },
      {
        id: "user-protection",
        heading: "8. User Protection Commitment",
        body: [
          "We will not sell your personal data. We provide a structured complaint system that escalates issues to brands, a public payout-tracking initiative (rolling out in upcoming releases) and a dedicated support team for cashback and account disputes.",
        ],
      },
      {
        id: "how-we-protect",
        heading: "9. How RebateBoard Protects Traders",
        body: ["We protect traders through four pillars:"],
        sub: [
          { id: "real-cashback", heading: "Real Cashback Tracking", body: ["Every eligible trade is tracked through verified affiliate links and reconciled against partner reports."] },
          { id: "verified-partners", heading: "Verified Partners", body: ["Brokers, prop firms and exchanges are vetted before listing and continuously re-scored via TBI."] },
          { id: "complaints", heading: "Complaint System", body: ["Structured, evidence-backed complaints with full timeline and official brand responses."] },
          { id: "payout-tracking", heading: "Public Payout Tracking", body: ["A community-visible feed of verified payouts is rolling out so traders can see real, current payout reliability per brand."] },
        ],
      },
      {
        id: "contact",
        heading: "10. Contact & Reporting",
        body: [
          "To report a compliance concern, suspected fraud or partner misconduct, contact compliance@rebateboard.com. We acknowledge reports within 48 hours.",
        ],
      },
    ],
  },
];

export function getLegalDoc(slug: string): LegalDoc | undefined {
  return LEGAL_DOCS.find((d) => d.slug === slug);
}
