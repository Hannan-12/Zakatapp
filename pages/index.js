import { useState } from "react";
import { useRouter } from "next/router";
import AuthGate from "../lib/AuthGate";
import { supabase } from "../lib/supabaseClient";

const CATEGORIES = [
  { value: "zakat", label: "زکوٰۃ" },
  { value: "sadqa", label: "صدقہ" },
  { value: "general", label: "عمومی" },
];

const METHODS = [
  { value: "cash", label: "نقد" },
  { value: "bank_transfer", label: "بینک ٹرانسفر" },
  { value: "other", label: "دیگر" },
];

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
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl text-primary">نئی رسید</h1>
          <a href="/dashboard" className="text-sm text-gold underline underline-offset-4">
            ڈیش بورڈ دیکھیں ←
          </a>
        </div>

        <div className="perforated-top bg-card rounded-t-2xl" />
        <form
          onSubmit={handleSubmit}
          className="bg-card border-x border-gold/30 p-6 space-y-5"
        >
          <div>
            <label className="block text-sm text-ink/70 mb-1.5">عطیہ دہندہ کا نام (اختیاری)</label>
            <input
              type="text"
              value={form.donor_name}
              onChange={(e) => update("donor_name", e.target.value)}
              className="w-full border-b-2 border-gold/30 bg-transparent px-1 py-2 focus:outline-none focus:border-primary transition-colors"
              placeholder="خالی چھوڑنے پر نامعلوم درج ہوگا"
            />
          </div>

          <div>
            <label className="block text-sm text-ink/70 mb-1.5">فون نمبر (اختیاری)</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              dir="ltr"
              className="w-full border-b-2 border-gold/30 bg-transparent px-1 py-2 text-right figures focus:outline-none focus:border-primary transition-colors"
              placeholder="03XX-XXXXXXX"
            />
          </div>

          <div>
            <label className="block text-sm text-ink/70 mb-2">قسم</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  data-active={form.category === c.value}
                  onClick={() => update("category", c.value)}
                  className="pill rounded-lg py-2 text-sm"
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-ink/70 mb-1.5">رقم (روپے)</label>
            <div className="flex items-center border-b-2 border-gold/30 focus-within:border-primary transition-colors">
              <span className="text-gold text-sm ps-1 figures">Rs.</span>
              <input
                type="number"
                min="1"
                value={form.amount}
                onChange={(e) => update("amount", e.target.value)}
                dir="ltr"
                className="w-full bg-transparent px-2 py-2 text-right figures text-lg focus:outline-none"
                placeholder="5000"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-ink/70 mb-2">ادائیگی کا طریقہ</label>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  data-active={form.method === m.value}
                  onClick={() => update("method", m.value)}
                  className="pill rounded-lg py-2 text-xs sm:text-sm"
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-ink/70 mb-1.5">نوٹ (اختیاری)</label>
            <textarea
              value={form.note}
              onChange={(e) => update("note", e.target.value)}
              className="w-full border-b-2 border-gold/30 bg-transparent px-1 py-2 focus:outline-none focus:border-primary transition-colors"
              rows={2}
              placeholder="کوئی اضافی تفصیل"
            />
          </div>

          {error && <p className="text-maroon text-sm">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary text-white rounded-lg py-3 font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {saving ? "محفوظ ہو رہا ہے..." : "رسید بنائیں"}
          </button>
        </form>
        <div className="perforated-bottom bg-card border-x border-gold/30 rounded-b-2xl" />
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
