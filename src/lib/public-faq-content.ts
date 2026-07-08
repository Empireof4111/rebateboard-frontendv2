import type { Faq } from "@/lib/admin-api";

export const traderFaqFallbacks: Faq[] = [
  {
    id: "fallback-cashback-rebates",
    category: "Cashback",
    question: "How do cashback rebates work?",
    answer:
      "RebateBoard tracks eligible trading activity with supported brands and estimates your cashback from the active rebate terms. Once the brand confirms the activity, approved cashback appears in your wallet history.",
    status: "published",
    updated: "",
    views: 0,
  },
  {
    id: "fallback-transfer-account",
    category: "Cashback",
    question: "Can I transfer my existing broker account?",
    answer:
      "Some brands allow account transfers or partner linking, while others require a new account through the approved RebateBoard path. Check the brand offer page before opening or transferring an account.",
    status: "published",
    updated: "",
    views: 0,
  },
  {
    id: "fallback-rebate-rewards",
    category: "Rewards",
    question: "How do I earn Rebate Rewards?",
    answer:
      "You can earn RR by completing profile steps, submitting useful reviews, maintaining platform activity, joining eligible programs, and participating in future reward missions.",
    status: "published",
    updated: "",
    views: 0,
  },
  {
    id: "fallback-trader-tbi",
    category: "TBI",
    question: "What is Trader TBI?",
    answer:
      "Trader TBI is a trust and activity signal designed to reflect your verified participation in the RebateBoard ecosystem, including profile completion, reviews, trading activity, and responsible platform use.",
    status: "published",
    updated: "",
    views: 0,
  },
  {
    id: "fallback-withdrawals",
    category: "Wallet",
    question: "How do cashback withdrawals work?",
    answer:
      "Approved cashback can be requested from your wallet when withdrawal requirements are met. Each request moves through a clear status flow so you can track it from pending to completed.",
    status: "published",
    updated: "",
    views: 0,
  },
  {
    id: "fallback-free",
    category: "General",
    question: "Is RebateBoard free?",
    answer:
      "Yes. Traders can create an account, explore trusted brands, compare offers, use tools, and track cashback without a subscription fee.",
    status: "published",
    updated: "",
    views: 0,
  },
  {
    id: "fallback-review-verification",
    category: "Reviews",
    question: "How are reviews verified?",
    answer:
      "Reviews may be checked against account activity, proof, moderation signals, and platform rules. Verified reviews carry more trust because they are tied to stronger trader evidence.",
    status: "published",
    updated: "",
    views: 0,
  },
];

export function resolvePublicFaqContent(rows: Faq[], limit?: number) {
  const published = rows.filter((faq) => faq.status === "published" && faq.question && faq.answer);
  const source = published.length ? published : traderFaqFallbacks;
  return typeof limit === "number" ? source.slice(0, limit) : source;
}
