import { useEffect, useMemo, useState } from "react";
import AuthGate from "../lib/AuthGate";
import { supabase } from "../lib/supabaseClient";
import { formatPKR, formatDateTime, CATEGORIES, CATEGORY_LABELS, METHOD_LABELS } from "../lib/format";

const CATEGORY_FILTERS = [{ value: "all", label: "تمام" }, ...CATEGORIES];
const UNSPECIFIED_LABEL = "غیر مخصوص";

function categoryText(receipt) {
  const items = receipt.receipt_items || [];
  if (items.length <= 1) {
    const cat = receipt.category || items[0]?.category;
    return CATEGORY_LABELS[cat] || "—";
  }
  return items.map((it) => CATEGORY_LABELS[it.category]).join(" + ");
}

function DashboardPage() {
  const [receipts, setReceipts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [view, setView] = useState("receipts");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [receiptsRes, expensesRes] = await Promise.all([
      supabase.from("receipts").select("*, receipt_items(*)").order("created_at", { ascending: false }),
      supabase.from("expenses").select("*").order("created_at", { ascending: false }),
    ]);
    if (!receiptsRes.error) setReceipts(receiptsRes.data || []);
    if (!expensesRes.error) setExpenses(expensesRes.data || []);
    setLoading(false);
  }

  const totals = useMemo(() => {
    const t = { all: 0 };
    receipts.forEach((r) => {
      (r.receipt_items || []).forEach((it) => {
        t[it.category] = (t[it.category] || 0) + Number(it.amount);
      });
      t.all += Number(r.amount);
    });
    return t;
  }, [receipts]);

  const spent = useMemo(() => {
    const t = { all: 0 };
    expenses.forEach((e) => {
      if (e.category) t[e.category] = (t[e.category] || 0) + Number(e.amount);
      t.all += Number(e.amount);
    });
    return t;
  }, [expenses]);

  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const matchesSearch =
        !search ||
        r.donor_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.receipt_no?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" ||
        (r.receipt_items || []).some((it) => it.category === categoryFilter);
      return matchesSearch && matchesCategory;
    });
  }, [receipts, search, categoryFilter]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesSearch = !search || (e.note || "").toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "all" || e.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, search, categoryFilter]);

  function exportCSV() {
    let header, rows, filenamePrefix;
    if (view === "receipts") {
      header = ["رسید نمبر", "تاریخ", "عطیہ دہندہ", "پتہ", "فون", "قسم", "طریقہ", "رقم", "نوٹ"];
      rows = filteredReceipts.map((r) => [
        r.receipt_no,
        new Date(r.created_at).toISOString(),
        r.donor_name,
        r.donor_address || "",
        r.phone || "",
        categoryText(r),
        r.method,
        r.amount,
        (r.note || "").replace(/,/g, ";"),
      ]);
      filenamePrefix = "receipts";
    } else {
      header = ["تاریخ", "قسم", "رقم", "نوٹ"];
      rows = filteredExpenses.map((e) => [
        new Date(e.created_at).toISOString(),
        e.category ? CATEGORY_LABELS[e.category] : UNSPECIFIED_LABEL,
        e.amount,
        (e.note || "").replace(/,/g, ";"),
      ]);
      filenamePrefix = "expenses";
    }
    const csv = [header, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filenamePrefix}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center gap-2 mb-5">
          <img src="/logo.png" alt="بنیادِ مدرسہ فیضانِ علم" className="w-28 h-28 rounded-2xl shadow-md" />
          <span className="text-lg text-gold">بنیادِ مدرسہ فیضانِ علم</span>
        </div>

        <div className="flex items-center justify-between mb-5 gap-3">
          <h1 className="text-2xl text-primary">ڈیش بورڈ</h1>
          <div className="flex gap-3">
            <a href="/expense" className="text-sm text-maroon underline underline-offset-4 whitespace-nowrap">
              + رقم استعمال کریں
            </a>
            <a href="/" className="text-sm text-gold underline underline-offset-4 whitespace-nowrap">
              + نئی رسید
            </a>
          </div>
        </div>

        {/* Overview: collected, spent, balance */}
        <div className="grid grid-cols-3 gap-px bg-gold/25 border border-gold/30 rounded-xl mb-3 overflow-hidden">
          <TotalCell label="کل وصولی" value={totals.all} />
          <TotalCell label="کل خرچ" value={spent.all} />
          <TotalCell label="باقی رقم" value={totals.all - spent.all} highlight />
        </div>

        {/* Per-category remaining balance */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-gold/25 border border-gold/30 rounded-xl mb-6 overflow-hidden">
          {CATEGORIES.map((c) => (
            <TotalCell
              key={c.value}
              label={c.label}
              value={(totals[c.value] || 0) - (spent[c.value] || 0)}
            />
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder={view === "receipts" ? "عطیہ دہندہ کے نام یا رسید نمبر سے تلاش کریں" : "نوٹ میں تلاش کریں"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gold/30 bg-card rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={exportCSV}
            className="bg-primary text-white rounded-lg px-4 py-2 font-medium hover:bg-primary-dark transition-colors whitespace-nowrap"
          >
            CSV ایکسپورٹ کریں
          </button>
        </div>

        <div className="flex gap-2 mb-3">
          <button
            data-active={view === "receipts"}
            onClick={() => setView("receipts")}
            className="pill rounded-lg px-4 py-1.5 text-sm flex-1"
          >
            رسیدیں
          </button>
          <button
            data-active={view === "expenses"}
            onClick={() => setView("expenses")}
            className="pill rounded-lg px-4 py-1.5 text-sm flex-1"
          >
            اخراجات
          </button>
        </div>

        <div className="flex gap-2 mb-5 overflow-x-auto">
          {CATEGORY_FILTERS.map((c) => (
            <button
              key={c.value}
              data-active={categoryFilter === c.value}
              onClick={() => setCategoryFilter(c.value)}
              className="pill rounded-full px-4 py-1.5 text-sm whitespace-nowrap"
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-gold/30 overflow-hidden">
          {loading ? (
            <p className="p-6 text-ink/50">لوڈ ہو رہا ہے...</p>
          ) : view === "receipts" ? (
            filteredReceipts.length === 0 ? (
              <p className="p-6 text-ink/50">کوئی رسید نہیں ملی۔</p>
            ) : (
              <>
                {/* Mobile: stacked ledger cards */}
                <div className="sm:hidden divide-y divide-gold/15">
                  {filteredReceipts.map((r) => (
                    <a key={r.id} href={`/receipt/${r.id}`} className="ledger-row block px-4 py-3">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-medium">{r.donor_name}</span>
                        <span className="figures text-sm font-semibold text-primary">
                          {formatPKR(r.amount)}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline text-xs text-ink/55">
                        <span>
                          {categoryText(r)} · {METHOD_LABELS[r.method] || r.method}
                        </span>
                        <span className="figures">{formatDateTime(r.created_at)}</span>
                      </div>
                    </a>
                  ))}
                </div>

                {/* Desktop / tablet: ledger table */}
                <table className="w-full text-sm hidden sm:table">
                  <thead>
                    <tr className="text-right text-ink/50 border-b border-gold/20">
                      <th className="px-4 py-3 font-normal">رسید نمبر</th>
                      <th className="px-4 py-3 font-normal">تاریخ</th>
                      <th className="px-4 py-3 font-normal">عطیہ دہندہ</th>
                      <th className="px-4 py-3 font-normal">قسم</th>
                      <th className="px-4 py-3 font-normal">طریقہ</th>
                      <th className="px-4 py-3 font-normal">رقم</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReceipts.map((r) => (
                      <tr key={r.id} className="ledger-row border-b border-gold/10">
                        <td className="px-4 py-3 figures text-xs">{r.receipt_no}</td>
                        <td className="px-4 py-3 figures whitespace-nowrap">
                          {formatDateTime(r.created_at)}
                        </td>
                        <td className="px-4 py-3">{r.donor_name}</td>
                        <td className="px-4 py-3">{categoryText(r)}</td>
                        <td className="px-4 py-3">{METHOD_LABELS[r.method] || r.method}</td>
                        <td className="px-4 py-3 figures font-medium">{formatPKR(r.amount)}</td>
                        <td className="px-4 py-3">
                          <a
                            href={`/receipt/${r.id}`}
                            className="text-gold underline underline-offset-4 text-xs whitespace-nowrap"
                          >
                            دیکھیں
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )
          ) : filteredExpenses.length === 0 ? (
            <p className="p-6 text-ink/50">کوئی خرچ نہیں ملا۔</p>
          ) : (
            <>
              {/* Mobile: stacked ledger cards */}
              <div className="sm:hidden divide-y divide-gold/15">
                {filteredExpenses.map((e) => (
                  <div key={e.id} className="ledger-row px-4 py-3">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-medium">
                        {e.category ? CATEGORY_LABELS[e.category] : UNSPECIFIED_LABEL}
                      </span>
                      <span className="figures text-sm font-semibold text-maroon">
                        {formatPKR(e.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline text-xs text-ink/55">
                      <span>{e.note || "—"}</span>
                      <span className="figures">{formatDateTime(e.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop / tablet: ledger table */}
              <table className="w-full text-sm hidden sm:table">
                <thead>
                  <tr className="text-right text-ink/50 border-b border-gold/20">
                    <th className="px-4 py-3 font-normal">تاریخ</th>
                    <th className="px-4 py-3 font-normal">قسم</th>
                    <th className="px-4 py-3 font-normal">نوٹ</th>
                    <th className="px-4 py-3 font-normal">رقم</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((e) => (
                    <tr key={e.id} className="ledger-row border-b border-gold/10">
                      <td className="px-4 py-3 figures whitespace-nowrap">
                        {formatDateTime(e.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        {e.category ? CATEGORY_LABELS[e.category] : UNSPECIFIED_LABEL}
                      </td>
                      <td className="px-4 py-3">{e.note || "—"}</td>
                      <td className="px-4 py-3 figures font-medium text-maroon">
                        {formatPKR(e.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TotalCell({ label, value, highlight }) {
  return (
    <div className={`min-w-0 p-3 sm:p-4 text-center ${highlight ? "bg-primary text-white" : "bg-card"}`}>
      <p className={`text-xs mb-1 ${highlight ? "text-white/70" : "text-ink/50"}`}>{label}</p>
      <p className="figures font-semibold text-sm sm:text-lg truncate">{formatPKR(value)}</p>
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
