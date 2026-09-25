// Ported from nebula/services/payment.js — the two payment endpoints,
// shared by both apps against the same backend (LOGIC_REFERENCE.md §8).
import { fetchJson } from "../config/api";

export function createSubscriptionOrder(planKey) {
  return fetchJson("/payment/create-order", {
    method: "POST",
    body: JSON.stringify({ planKey }),
  });
}

export function verifySubscriptionPayment({
  razorpay_payment_id,
  razorpay_order_id,
  razorpay_signature,
}) {
  return fetchJson("/payment/verify", {
    method: "POST",
    body: JSON.stringify({
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    }),
  });
}
