import { fetchJson } from "../config/api";

// nebula/utils/subscriptionStatus.js checks `user.paymentStatus` for the
// values "trial"/"payment_due" — but the actual monster backend's User
// schema only ever sets paymentStatus to "unpaid"/"paid"/"failed"
// (models/User.js) and never writes "trial"/"payment_due" anywhere in the
// codebase. The real fields the backend uses for this (see
// routes/auth.js's login-time trial-expiry check and the unused-but-
// documented requireActiveAccount middleware) are `accountStatus`
// ("pending_payment" when a trial lapses) and `isTrialActive`/
// `trialEndDate`. This reproduces nebula's actual INTENT — gate on trial
// expiry, banner while trialing — against the fields the backend really
// sends, rather than porting a check that would never fire.
export async function fetchSubscriptionStatus() {
  const res = await fetchJson("/auth/me");
  const user = res?.user || {};
  return {
    accountStatus: user.accountStatus,
    isTrialActive: Boolean(user.isTrialActive),
    trialEndDate: user.trialEndDate,
    subscriptionEndDate: user.subscriptionEndDate,
  };
}

// Whole days remaining until `endDate` (0 if already past/today).
// null when there's no valid end date to compute from.
export function daysRemaining(endDate) {
  if (!endDate) return null;
  const end = new Date(endDate).getTime();
  if (Number.isNaN(end)) return null;
  return Math.max(0, Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24)));
}
