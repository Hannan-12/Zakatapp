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

export const CATEGORY_LABELS = {
  zakat: "زکوٰۃ",
  sadqa: "صدقہ",
  general: "عمومی عطیہ",
};

export const METHOD_LABELS = {
  cash: "نقد",
  bank_transfer: "بینک ٹرانسفر",
  other: "دیگر",
};
