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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-xl p-8 w-full max-w-sm border border-gray-100"
        >
          <h1 className="text-xl font-semibold text-primary mb-1">زکوٰۃ اور صدقہ رجسٹر</h1>
          <p className="text-sm text-gray-500 mb-4">جاری رکھنے کے لیے پاس کوڈ درج کریں</p>
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="پاس کوڈ"
            autoFocus
          />
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <button
            type="submit"
            className="w-full bg-primary text-white rounded-lg py-2 font-medium hover:opacity-90"
          >
            داخل ہوں
          </button>
        </form>
      </div>
    );
  }

  return children;
}
