import { useState } from "react";
import { useRouter } from "next/router";
import AuthGate from "../lib/AuthGate";
import { supabase } from "../lib/supabaseClient";

function IndexPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    donor_name: "",
    phone: "",
    category: "zakat",
    amount: "",
    method: "cash",
    note: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.amount || Number(form.amount) <= 0) {
      setError("براہ کرم درست رقم درج کریں۔");
      return;
    }

    setSaving(true);
    try {
      const receiptNo = "R-" + Date.now().toString().slice(-8);

      const { data, error: insertError } = await supabase
        .from("receipts")
        .insert([
          {
            receipt_no: receiptNo,
            donor_name: form.donor_name || "Anonymous",
            phone: form.phone || null,
            category: form.category,
            amount: Number(form.amount),
            method: form.method,
            note: form.note || null,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      router.push(`/receipt/${data.id}`);
    } catch (err) {
      console.error(err);
      setError("رسید محفوظ کرنے میں مسئلہ پیش آیا۔ دوبارہ کوشش کریں۔");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-primary">نئی رسید</h1>
          <a href="/dashboard" className="text-sm text-primary underline">
            ← ڈیش بورڈ دیکھیں
          </a>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              عطیہ دہندہ کا نام (اختیاری)
            </label>
            <input
              type="text"
              value={form.donor_name}
              onChange={(e) => update("donor_name", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="خالی چھوڑنے پر نامعلوم درج ہوگا"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              فون نمبر (اختیاری)
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="03XX-XXXXXXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">قسم</label>
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="zakat">زکوٰۃ</option>
              <option value="sadqa">صدقہ</option>
              <option value="general">عمومی عطیہ</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              رقم (روپے)
            </label>
            <input
              type="number"
              min="1"
              value={form.amount}
              onChange={(e) => update("amount", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="مثلاً 5000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ادائیگی کا طریقہ
            </label>
            <select
              value={form.method}
              onChange={(e) => update("method", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="cash">نقد</option>
              <option value="bank_transfer">بینک ٹرانسفر</option>
              <option value="other">دیگر</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              نوٹ (اختیاری)
            </label>
            <textarea
              value={form.note}
              onChange={(e) => update("note", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              rows={2}
              placeholder="کوئی اضافی تفصیل"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary text-white rounded-lg py-2.5 font-medium hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "محفوظ ہو رہا ہے..." : "رسید بنائیں"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AuthGate>
      <IndexPage />
    </AuthGate>
  );
}
