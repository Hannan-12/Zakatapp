import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import QRCode from "qrcode";
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
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [shareMessage, setShareMessage] = useState("");

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

  useEffect(() => {
    if (typeof window === "undefined" || !id) return;
    QRCode.toDataURL(`${window.location.origin}/receipt/${id}`, {
      margin: 1,
      width: 160,
      color: { dark: "#0E4536", light: "#FFFCF5" },
    })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [id]);

  async function handleShare() {
    const url = `${window.location.origin}/receipt/${id}`;
    const shareData = {
      title: "رسید",
      text: receipt ? `رسید نمبر: ${receipt.receipt_no}` : "رسید",
      url,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // user cancelled the share sheet — not an error
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareMessage("لنک کاپی ہو گیا");
      setTimeout(() => setShareMessage(""), 2500);
    } catch (err) {
      setShareMessage(url);
    }
  }

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
            <img src="/logo.png" alt="بنیادِ مدرسہ فیضانِ علم" className="w-20 h-20 rounded-xl mx-auto shadow-sm" />
            <p className="text-gold text-sm mt-2">بنیادِ مدرسہ فیضانِ علم</p>
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

          <div className="flex items-center justify-between mt-6 gap-4">
            <div className="seal">
              <span className="text-sm font-medium tracking-wide">سید دستگیر شاہ</span>
            </div>
            {qrDataUrl && (
              <img src={qrDataUrl} alt="تصدیقی QR کوڈ" className="w-16 h-16 rounded-md border border-gold/30" />
            )}
          </div>
        </div>
        <div className="perforated-bottom bg-card border-x border-gold/30 rounded-b-2xl" />

        <div className="no-print flex gap-3 mt-5">
          <button
            onClick={handleShare}
            className="flex-1 bg-gold text-white rounded-lg py-3 font-medium hover:opacity-90 transition-opacity"
          >
            شیئر کریں
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 bg-primary text-white rounded-lg py-3 font-medium hover:bg-primary-dark transition-colors"
          >
            پرنٹ / PDF
          </button>
        </div>
        {shareMessage && (
          <p className="no-print text-center text-sm text-ink/60 mt-2 break-all">{shareMessage}</p>
        )}
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
