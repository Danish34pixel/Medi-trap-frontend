// small helpers to normalize medicine names and to check if a medicine references a given stockist id

export function medicineReferencesStockist(med, stockistId) {
  if (!med || !stockistId) return false;
  try {
    const sid = String(stockistId);

    // stockists array case: elements may be ids or objects with .stockist
    if (Array.isArray(med.stockists)) {
      for (const st of med.stockists) {
        const candidate = st && (st.stockist || st._id || st.id || st);
        if (candidate && String(candidate).includes(sid)) return true;
      }
    }

    // single stockist fields
    const possibleFields = [
      med.stockist,
      med.stockistId,
      med.seller,
      med.sellerId,
      med.vendor,
      med.vendorId,
      med.supplier,
      med.supplierId,
    ];

    for (const f of possibleFields) {
      if (!f) continue;
      const cand = f && (f._id || f.id || f);
      if (String(cand).includes(sid)) return true;
    }

    // as a last resort, check any string-looking field keys that include 'stock' or 'seller'
    for (const k of Object.keys(med)) {
      if (/stock|seller|vendor|supplier/i.test(k)) {
        const v = med[k];
        if (!v) continue;
        const cand = v && (v._id || v.id || v);
        if (String(cand).includes(sid)) return true;
      }
    }
  } catch (e) {
    // ignore
  }
  return false;
}

export function medicineDisplayName(med) {
  if (!med) return "";
  return (
    med.name ||
    med.brandName ||
    med.title ||
    med.medicineName ||
    med.displayName ||
    ""
  );
}

// stronger name matching: normalize strings and check token/substr overlap
export function nameMatchesStockistItems(medName, stockist) {
  if (!medName || !stockist) return false;
  try {
    const normalize = (s) =>
      String(s || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const m = normalize(medName);
    if (!m) return false;

    const candidates = new Set();
    // stockist may expose medicines list under several keys
    const lists = [
      stockist.Medicines,
      stockist.medicines,
      stockist.items,
      stockist.itemsList,
      stockist.companies,
    ];
    for (const lst of lists) {
      if (!Array.isArray(lst)) continue;
      for (const it of lst) candidates.add(normalize(it));
    }

    // also add title and company names
    if (stockist.title) candidates.add(normalize(stockist.title));

    // token-based matching: require at least one token of length>2 overlap
    const mTokens = m.split(" ").filter((t) => t.length > 2);
    if (mTokens.length === 0) return false;

    for (const c of candidates) {
      if (!c) continue;
      // exact include
      if (c.includes(m) || m.includes(c)) return true;
      const cTokens = c.split(" ").filter((t) => t.length > 2);
      for (const mt of mTokens) {
        if (cTokens.includes(mt)) return true;
      }
    }
  } catch (e) {
    // ignore
  }
  return false;
}

// return number of overlapping tokens (length > 2) between medName and stockist items/title
export function tokenOverlapScore(medName, stockist) {
  if (!medName || !stockist) return 0;
  try {
    const normalize = (s) =>
      String(s || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const m = normalize(medName);
    if (!m) return 0;
    const mTokens = new Set(m.split(" ").filter((t) => t.length > 2));
    if (mTokens.size === 0) return 0;

    const candidates = new Set();
    const lists = [
      stockist.Medicines,
      stockist.medicines,
      stockist.items,
      stockist.itemsList,
      stockist.companies,
    ];
    for (const lst of lists) {
      if (!Array.isArray(lst)) continue;
      for (const it of lst) candidates.add(normalize(it));
    }
    if (stockist.title) candidates.add(normalize(stockist.title));

    let best = 0;
    for (const c of candidates) {
      if (!c) continue;
      const cTokens = new Set(c.split(" ").filter((t) => t.length > 2));
      let overlap = 0;
      for (const t of mTokens) if (cTokens.has(t)) overlap++;
      if (overlap > best) best = overlap;
    }
    return best;
  } catch (e) {
    return 0;
  }
}
