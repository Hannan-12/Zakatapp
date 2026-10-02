import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AuthGate from "../../lib/AuthGate";
import { supabase } from "../../lib/supabaseClient";
import { formatPKR, formatDate, CATEGORY_LABELS, METHOD_LABELS } from "../../lib/format";

function ReceiptPage() {
  const router = useRouter();
  const { id } = router.query;
  const [receipt, setReceipt] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const { data, error } = await supabase
        .from("receipts")
        .select("*, receipt_items(*)")
        .eq("id", id)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setReceipt(data);
        setItems(data.receipt_items || []);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">لوڈ ہو رہا ہے...</div>;
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>رسید نہیں ملی۔</p>
      </div>
    );
  }

  const isMulti = items.length > 1;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-4 no-print">
          <a href="/" className="text-sm text-gold underline underline-offset-4">
            ← نئی رسید
          </a>
          <a href="/dashboard" className="text-sm text-gold underline underline-offset-4">
            ڈیش بورڈ
          </a>
        </div>

        <div className="perforated-top bg-card rounded-t-2xl" />
        <div className="print-area bg-card border-x border-gold/30 shadow-md p-6">
          <div className="text-center border-b-2 border-dashed border-gold/40 pb-4 mb-4">
            <span className="text-gold text-lg">۞</span>
            <h2 className="text-xl text-primary mt-1">عطیہ کی رسید</h2>
            <p className="text-xs text-ink/50 mt-1 figures">رسید نمبر: {receipt.receipt_no}</p>
          </div>

          <div className="space-y-2.5 text-sm">
            <Row label="تاریخ" value={formatDate(receipt.created_at)} figures />
            <Row label="عطیہ دہندہ" value={receipt.donor_name} />
            {receipt.donor_address && <Row label="پتہ" value={receipt.donor_address} />}
            {receipt.phone && <Row label="فون" value={receipt.phone} figures />}
            {!isMulti && (
              <Row
                label="قسم"
                value={CATEGORY_LABELS[receipt.category] || (items[0] && CATEGORY_LABELS[items[0].category])}
              />
            )}
            <Row label="طریقہ" value={METHOD_LABELS[receipt.method] || receipt.method} />
            {receipt.note && <Row label="نوٹ" value={receipt.note} />}
          </div>

          {isMulti && (
            <div className="mt-4 pt-4 border-t-2 border-dashed border-gold/40">
              <p className="text-xs text-ink/50 mb-2">تفصیل</p>
              <div className="space-y-1.5 text-sm">
                {items.map((it) => (
                  <div key={it.id} className="flex justify-between">
                    <span className="text-ink/70">{CATEGORY_LABELS[it.category]}</span>
                    <span className="figures font-medium text-left">{formatPKR(it.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 pt-5 border-t-2 border-dashed border-gold/40 text-center">
            <p className="text-xs text-ink/50">موصولہ رقم</p>
            <p className="text-3xl font-semibold text-primary figures mt-1">
              {formatPKR(receipt.amount)}
            </p>
          </div>

          <p className="text-center text-xs text-ink/45 mt-6 leading-relaxed">
            آپ کے عطیہ پر جزاک اللہ خیر۔
          </p>

          <div className="flex justify-center mt-6">
            <div className="seal">
              <span className="text-sm font-medium tracking-wide">سید دستگیر شاہ</span>
            </div>
          </div>
        </div>
        <div className="perforated-bottom bg-card border-x border-gold/30 rounded-b-2xl" />

        <button
          onClick={() => window.print()}
          className="no-print w-full mt-5 bg-primary text-white rounded-lg py-3 font-medium hover:bg-primary-dark transition-colors"
        >
          پرنٹ / PDF کے طور پر محفوظ کریں
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, figures }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-ink/50">{label}</span>
      <span className={`font-medium text-ink text-left ${figures ? "figures" : ""}`}>{value}</span>
    </div>
  );
}

export default function Page() {
  return (
    <AuthGate>
      <ReceiptPage />
    </AuthGate>
  );
}
