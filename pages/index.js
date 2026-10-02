import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import AuthGate from "../lib/AuthGate";
import { supabase } from "../lib/supabaseClient";
import { formatPKR } from "../lib/format";

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
    donor_address: "",
    phone: "",
    method: "cash",
    note: "",
  });
  const [selected, setSelected] = useState(["zakat"]);
  const [amounts, setAmounts] = useState({ zakat: "", sadqa: "", general: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleCategory(value) {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  function updateAmount(category, value) {
    setAmounts((a) => ({ ...a, [category]: value }));
  }

  const total = useMemo(
    () => selected.reduce((sum, c) => sum + (Number(amounts[c]) || 0), 0),
    [selected, amounts]
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (selected.length === 0) {
      setError("کم از کم ایک قسم منتخب کریں۔");
      return;
    }
    const invalid = selected.find((c) => !amounts[c] || Number(amounts[c]) <= 0);
    if (invalid) {
      setError("ہر منتخب قسم کے لیے درست رقم درج کریں۔");
      return;
    }

    setSaving(true);
    try {
      const receiptNo = "R-" + Date.now().toString().slice(-8);

      const { data, error: rpcError } = await supabase.rpc("create_receipt", {
        p_receipt_no: receiptNo,
        p_donor_name: form.donor_name || "Anonymous",
        p_donor_address: form.donor_address || null,
        p_phone: form.phone || null,
        p_method: form.method,
        p_note: form.note || null,
        p_items: selected.map((c) => ({ category: c, amount: Number(amounts[c]) })),
      });

      if (rpcError) throw rpcError;

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
            <label className="block text-sm text-ink/70 mb-1.5">پتہ (اختیاری)</label>
            <input
              type="text"
              value={form.donor_address}
              onChange={(e) => update("donor_address", e.target.value)}
              className="w-full border-b-2 border-gold/30 bg-transparent px-1 py-2 focus:outline-none focus:border-primary transition-colors"
              placeholder="عطیہ دہندہ کا پتہ"
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
            <label className="block text-sm text-ink/70 mb-2">قسم (ایک سے زیادہ منتخب کر سکتے ہیں)</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  data-active={selected.includes(c.value)}
                  onClick={() => toggleCategory(c.value)}
                  className="pill rounded-lg py-2 text-sm"
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {selected.length === 1 ? (
            <div>
              <label className="block text-sm text-ink/70 mb-1.5">رقم (روپے)</label>
              <div className="flex items-center border-b-2 border-gold/30 focus-within:border-primary transition-colors">
                <span className="text-gold text-sm ps-1 figures">Rs.</span>
                <input
                  type="number"
                  min="1"
                  value={amounts[selected[0]]}
                  onChange={(e) => updateAmount(selected[0], e.target.value)}
                  dir="ltr"
                  className="w-full bg-transparent px-2 py-2 text-right figures text-lg focus:outline-none"
                  placeholder="5000"
                  required
                />
              </div>
            </div>
          ) : selected.length > 1 ? (
            <div>
              <label className="block text-sm text-ink/70 mb-2">ہر قسم کے مطابق رقم (روپے)</label>
              <div className="space-y-3">
                {CATEGORIES.filter((c) => selected.includes(c.value)).map((c) => (
                  <div key={c.value} className="flex items-center gap-3">
                    <span className="text-sm text-ink/70 w-14 shrink-0">{c.label}</span>
                    <div className="flex-1 flex items-center border-b-2 border-gold/30 focus-within:border-primary transition-colors">
                      <span className="text-gold text-sm ps-1 figures">Rs.</span>
                      <input
                        type="number"
                        min="1"
                        value={amounts[c.value]}
                        onChange={(e) => updateAmount(c.value, e.target.value)}
                        dir="ltr"
                        className="w-full bg-transparent px-2 py-2 text-right figures focus:outline-none"
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-gold/20 text-sm">
                  <span className="text-ink/70">میزان (کل رقم)</span>
                  <span className="figures font-semibold text-primary">{formatPKR(total)}</span>
                </div>
              </div>
            </div>
          ) : null}

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
