import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AuthGate from "../../lib/AuthGate";
import { supabase } from "../../lib/supabaseClient";
import { formatPKR, formatDate, CATEGORY_LABELS, METHOD_LABELS } from "../../lib/format";

function ReceiptPage() {
  const router = useRouter();
  const { id } = router.query;
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const { data, error } = await supabase
        .from("receipts")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setReceipt(data);
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-4 no-print">
          <a href="/" className="text-sm text-primary underline">
            ← نئی رسید
          </a>
          <a href="/dashboard" className="text-sm text-primary underline">
            ڈیش بورڈ
          </a>
        </div>

        <div className="print-area bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="text-center border-b border-dashed border-gray-300 pb-4 mb-4">
            <h2 className="text-lg font-bold text-primary">عطیہ کی رسید</h2>
            <p className="text-xs text-gray-500">رسید نمبر: {receipt.receipt_no}</p>
          </div>

          <div className="space-y-2 text-sm">
            <Row label="تاریخ" value={formatDate(receipt.created_at)} />
            <Row label="عطیہ دہندہ" value={receipt.donor_name} />
            {receipt.phone && <Row label="فون" value={receipt.phone} />}
            <Row label="قسم" value={CATEGORY_LABELS[receipt.category]} />
            <Row label="طریقہ" value={METHOD_LABELS[receipt.method] || receipt.method} />
            {receipt.note && <Row label="نوٹ" value={receipt.note} />}
          </div>

          <div className="mt-4 pt-4 border-t border-dashed border-gray-300 text-center">
            <p className="text-xs text-gray-500">موصولہ رقم</p>
            <p className="text-2xl font-bold text-primary">{formatPKR(receipt.amount)}</p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            آپ کے عطیہ پر جزاک اللہ خیر۔
          </p>

          <p className="text-center text-base font-bold text-primary mt-4 pt-4 border-t border-dashed border-gray-300">
            سید دستگیر شاہ
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="no-print w-full mt-4 bg-primary text-white rounded-lg py-2.5 font-medium hover:opacity-90"
        >
          پرنٹ / PDF کے طور پر محفوظ کریں
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800 capitalize">{value}</span>
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
