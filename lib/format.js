export function formatPKR(amount) {
  const num = Number(amount) || 0;
  return "Rs. " + num.toLocaleString("en-PK", { maximumFractionDigits: 0 });
}

export function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  return (
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
}

// The categories offered when creating a receipt.
export const CATEGORIES = [
  { value: "zakat", label: "زکوٰۃ" },
  { value: "fitra", label: "فطرہ" },
  { value: "ushr", label: "عشر" },
  { value: "sadaqat_wajiba", label: "صدقاتِ واجبہ" },
  { value: "sadaqat_nafila", label: "صدقاتِ نافلہ" },
  { value: "kulli_ikhtiyar", label: "کلی اختیار" },
];

export const CATEGORY_LABELS = {
  zakat: "زکوٰۃ",
  fitra: "فطرہ",
  ushr: "عشر",
  sadaqat_wajiba: "صدقاتِ واجبہ",
  sadaqat_nafila: "صدقاتِ نافلہ",
  kulli_ikhtiyar: "کلی اختیار",
  // legacy categories kept so older receipts still display correctly
  sadqa: "صدقہ",
  general: "عمومی عطیہ",
};

export const METHOD_LABELS = {
  cash: "نقد",
  bank_transfer: "بینک ٹرانسفر",
  other: "دیگر",
};
