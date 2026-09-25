// Ported verbatim from nebula/constants/subscriptionPlans.js. Prices are
// hardcoded client-side on both apps — there is no /plans endpoint; the
// backend trusts `planKey` on POST /payment/create-order and knows the price.
export const SUBSCRIPTION_PLANS = [
  {
    key: "monthly",
    label: "Monthly",
    price: 300,
    amount: 30000, // paise
    tagline: "Try it out",
  },
  {
    key: "quarterly",
    label: "Quarterly",
    price: 600,
    amount: 60000,
    tagline: "₹200/month · Save 33%",
    badge: "Popular",
  },
  {
    key: "yearly",
    label: "Yearly",
    price: 1200,
    amount: 120000,
    tagline: "₹100/month · Save 67%",
    badge: "Best Value",
  },
];

export default SUBSCRIPTION_PLANS;
