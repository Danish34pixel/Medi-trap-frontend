// Ported from nebula/components/RazorpayCheckout.web.jsx — the browser
// (not RN) half of the platform-specific checkout bridge. Injects Razorpay's
// checkout.js once, then opens window.Razorpay(options) directly; Razorpay
// draws its own DOM overlay so this renders nothing itself.
const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadCheckoutScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const existing = document.querySelector(`script[src="${CHECKOUT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Razorpay checkout script")),
      );
      return;
    }
    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Razorpay checkout script"));
    document.head.appendChild(script);
  });
}

// orderData must already contain keyId (Razorpay's public checkout key,
// sourced from the backend's /payment/create-order response — never a
// secret, never read from a local env var).
export async function openRazorpayCheckout(orderData, { onSuccess, onDismiss, onError }) {
  try {
    await loadCheckoutScript();
  } catch (e) {
    onError?.(e);
    return;
  }

  const options = {
    key: orderData.keyId,
    amount: orderData.amount,
    currency: orderData.currency || "INR",
    order_id: orderData.orderId,
    name: "MedTrap",
    description: orderData.plan ? `${orderData.plan} subscription` : "Subscription",
    theme: { color: "#0891b2" },
    handler: (response) => onSuccess?.(response),
    modal: {
      ondismiss: () => onDismiss?.(),
    },
  };

  try {
    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (response) => onError?.(response.error));
    rzp.open();
  } catch (e) {
    onError?.(e);
  }
}
