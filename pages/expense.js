import { useState } from "react";
import { useRouter } from "next/router";
import AuthGate from "../lib/AuthGate";
import { supabase } from "../lib/supabaseClient";
import { CATEGORIES } from "../lib/format";

const CATEGORY_CHOICES = CATEGORIES;

function ExpensePage() {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!amount || Number(amount) <= 0) {
      setError("براہ کرم درست رقم درج کریں۔");
      return;
    }
    if (!category) {
      setError("براہ کرم خرچ کی مد منتخب کریں۔");
      return;
    }

    setSaving(true);
    try {
      const { error: insertError } = await supabase.from("expenses").insert([
        {
          category: category || null,
          amount: Number(amount),
          note: note || null,
        },
      ]);

      if (insertError) throw insertError;

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("خرچ درج کرنے میں مسئلہ پیش آیا۔ دوبارہ کوشش کریں۔");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex flex-col items-center gap-2 mb-5">
          <img src="/logo.png" alt="بنیادِ مدرسہ فیضانِ علم" className="w-28 h-28 rounded-2xl shadow-md" />
          <span className="text-lg text-gold">بنیادِ مدرسہ فیضانِ علم</span>
        </div>

        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl text-primary">رقم استعمال کریں</h1>
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
            <label className="block text-sm text-ink/70 mb-2">
              کس مد سے خرچ ہوا
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORY_CHOICES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  data-active={category === c.value}
                  onClick={() => setCategory(c.value)}
                  className="pill rounded-lg py-2 text-sm px-2"
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
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                dir="ltr"
                className="w-full bg-transparent px-2 py-2 text-right figures text-lg focus:outline-none"
                placeholder="5000"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-ink/70 mb-1.5">نوٹ (اختیاری)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border-b-2 border-gold/30 bg-transparent px-1 py-2 focus:outline-none focus:border-primary transition-colors"
              rows={2}
              placeholder="کس کام کے لیے خرچ ہوا"
            />
          </div>

          {error && <p className="text-maroon text-sm">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-maroon text-white rounded-lg py-3 font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? "محفوظ ہو رہا ہے..." : "خرچ درج کریں"}
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
      <ExpensePage />
    </AuthGate>
  );
}
