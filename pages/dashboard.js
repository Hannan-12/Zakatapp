import { useEffect, useMemo, useState } from "react";
import AuthGate from "../lib/AuthGate";
import { supabase } from "../lib/supabaseClient";
import { formatPKR, formatDateTime, CATEGORY_LABELS, METHOD_LABELS } from "../lib/format";

function DashboardPage() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("receipts")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setReceipts(data || []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    return receipts.filter((r) => {
      const matchesSearch =
        !search ||
        r.donor_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.receipt_no?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "all" || r.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [receipts, search, categoryFilter]);

  const totals = useMemo(() => {
    const t = { zakat: 0, sadqa: 0, general: 0, all: 0 };
    receipts.forEach((r) => {
      t[r.category] = (t[r.category] || 0) + Number(r.amount);
      t.all += Number(r.amount);
    });
    return t;
  }, [receipts]);

  function exportCSV() {
    const header = ["رسید نمبر", "تاریخ", "عطیہ دہندہ", "فون", "قسم", "طریقہ", "رقم", "نوٹ"];
    const rows = filtered.map((r) => [
      r.receipt_no,
      new Date(r.created_at).toISOString(),
      r.donor_name,
      r.phone || "",
      CATEGORY_LABELS[r.category],
      r.method,
      r.amount,
      (r.note || "").replace(/,/g, ";"),
    ]);
    const csv = [header, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipts-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-primary">ڈیش بورڈ</h1>
          <a href="/" className="text-sm text-primary underline">
            + نئی رسید
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <TotalCard label="کل وصولی" value={totals.all} highlight />
          <TotalCard label="زکوٰۃ" value={totals.zakat} />
          <TotalCard label="صدقہ" value={totals.sadqa} />
          <TotalCard label="عمومی" value={totals.general} />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder="عطیہ دہندہ کے نام یا رسید نمبر سے تلاش کریں"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">تمام اقسام</option>
            <option value="zakat">زکوٰۃ</option>
            <option value="sadqa">صدقہ</option>
            <option value="general">عمومی</option>
          </select>
          <button
            onClick={exportCSV}
            className="bg-primary text-white rounded-lg px-4 py-2 font-medium hover:opacity-90 whitespace-nowrap"
          >
            CSV ایکسپورٹ کریں
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          {loading ? (
            <p className="p-6 text-gray-500">لوڈ ہو رہا ہے...</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-gray-500">کوئی رسید نہیں ملی۔</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="px-4 py-3">رسید نمبر</th>
                  <th className="px-4 py-3">تاریخ</th>
                  <th className="px-4 py-3">عطیہ دہندہ</th>
                  <th className="px-4 py-3">قسم</th>
                  <th className="px-4 py-3">طریقہ</th>
                  <th className="px-4 py-3 text-right">رقم</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{r.receipt_no}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(r.created_at)}</td>
                    <td className="px-4 py-3">{r.donor_name}</td>
                    <td className="px-4 py-3">{CATEGORY_LABELS[r.category]}</td>
                    <td className="px-4 py-3 capitalize">{METHOD_LABELS[r.method] || r.method}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatPKR(r.amount)}</td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`/receipt/${r.id}`}
                        className="text-primary underline text-xs whitespace-nowrap"
                      >
                        دیکھیں
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function TotalCard({ label, value, highlight }) {
  return (
    <div
      className={`rounded-xl p-4 border ${
        highlight ? "bg-primary text-white border-primary" : "bg-white border-gray-100"
      }`}
    >
      <p className={`text-xs ${highlight ? "text-white/80" : "text-gray-500"}`}>{label}</p>
      <p className="text-lg font-bold mt-1">{formatPKR(value)}</p>
    </div>
  );
}

export default function Page() {
  return (
    <AuthGate>
      <DashboardPage />
    </AuthGate>
  );
}
