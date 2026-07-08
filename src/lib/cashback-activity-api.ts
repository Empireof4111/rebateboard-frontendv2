export type HomepageCashbackActivityStats = {
  today_cashback_paid: number;
  monthly_cashback_paid: number;
  lifetime_cashback_paid: number;
  active_cashback_traders: number;
};

const homepageCashbackActivityFallback: HomepageCashbackActivityStats = {
  today_cashback_paid: 2480,
  monthly_cashback_paid: 31240,
  lifetime_cashback_paid: 248300,
  active_cashback_traders: 1243,
};

export async function fetchHomepageCashbackActivityStats() {
  return homepageCashbackActivityFallback;
}
