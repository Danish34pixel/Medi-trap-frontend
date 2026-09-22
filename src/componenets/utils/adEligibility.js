const ROLE_ALIASES = {
  medicalowner: "medical_owner",
  medicalretailer: "medical_owner",
  medical: "medical_owner",
  retailer: "medical_owner",
  user: "user",
  stockist: "stockist",
  purchaser: "purchaser",
  staff: "staff",
  admin: "admin",
};

export function normalizeRole(role) {
  const compact = String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return ROLE_ALIASES[compact] || compact;
}

export function canViewAds(role) {
  return ["medical_owner", "user", "stockist", "purchaser", "staff"].includes(
    normalizeRole(role),
  );
}
