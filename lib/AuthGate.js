import { useEffect, useState } from "react";

const STORAGE_KEY = "zakat_app_authed";

export default function AuthGate({ children }) {
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "1") setAuthed(true);
      setChecked(true);
    }
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    const passcode = process.env.NEXT_PUBLIC_APP_PASSCODE || "";
    if (!passcode) {
      // No passcode configured — allow access but warn in console.
      console.warn("NEXT_PUBLIC_APP_PASSCODE is not set. App is unprotected.");
      setAuthed(true);
      window.localStorage.setItem(STORAGE_KEY, "1");
      return;
    }
    if (input === passcode) {
      setAuthed(true);
      window.localStorage.setItem(STORAGE_KEY, "1");
      setError("");
    } else {
      setError("غلط پاس کوڈ۔ دوبارہ کوشش کریں۔");
    }
  }

  if (!checked) return null;

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div
            className="bg-primary rounded-t-2xl px-8 pt-8 pb-9 text-center relative"
            style={{
              backgroundImage:
                "radial-gradient(circle at 15% 20%, rgba(255,255,255,0.06), transparent 40%)",
            }}
          >
            <span className="text-gold text-2xl">۞</span>
            <h1 className="text-white text-2xl mt-2 leading-[2.1]">زکوٰۃ و صدقہ رجسٹر</h1>
            <p className="text-white/60 text-sm mt-3 font-mono" dir="ltr">
              Donation Register
            </p>
          </div>
          <div className="perforated-bottom bg-primary" />

          <form
            onSubmit={handleSubmit}
            className="bg-card rounded-b-2xl shadow-xl px-8 pt-6 pb-8 border border-t-0 border-gold/30"
          >
            <p className="text-sm text-ink/60 mb-4 text-center">
              جاری رکھنے کے لیے پاس کوڈ درج کریں
            </p>
            <input
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full border border-gold/40 bg-paper/60 rounded-lg px-4 py-2.5 mb-3 text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="پاس کوڈ"
              autoFocus
            />
            {error && <p className="text-maroon text-sm mb-3 text-center">{error}</p>}
            <button
              type="submit"
              className="w-full bg-primary text-white rounded-lg py-2.5 font-medium hover:bg-primary-dark transition-colors"
            >
              داخل ہوں
            </button>
          </form>
        </div>
      </div>
    );
  }

  return children;
}
