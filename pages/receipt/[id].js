import { useEffect, useRef, useState } from "react";
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
  const [sharing, setSharing] = useState(false);
  const printAreaRef = useRef(null);
  const sealRef = useRef(null);

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
    if (!printAreaRef.current || sharing) return;
    setSharing(true);
    setShareMessage("");
    // html2canvas mis-shapes connected Nastaliq script when letter-spacing,
    // rotation, or blend-mode are applied, so plainify the seal just for
    // the capture, then restore it.
    const seal = sealRef.current;
    const sealText = seal?.querySelector("span");
    const sealTransform = seal?.style.transform;
    const sealBlend = seal?.style.mixBlendMode;
    const sealSpacing = sealText?.style.letterSpacing;
    if (seal) {
      seal.style.transform = "none";
      seal.style.mixBlendMode = "normal";
    }
    if (sealText) sealText.style.letterSpacing = "normal";

    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(printAreaRef.current, {
        backgroundColor: "#FFFCF5",
        scale: 2,
        useCORS: true,
      });

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("image generation failed");

      const fileName = `receipt-${receipt.receipt_no}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "رسید",
          text: `رسید نمبر: ${receipt.receipt_no}`,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        setShareMessage("تصویر ڈاؤن لوڈ ہو گئی");
        setTimeout(() => setShareMessage(""), 2500);
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        console.error(err);
        setShareMessage("شیئر کرنے میں مسئلہ پیش آیا۔");
      }
    } finally {
      if (seal) {
        seal.style.transform = sealTransform || "";
        seal.style.mixBlendMode = sealBlend || "";
      }
      if (sealText) sealText.style.letterSpacing = sealSpacing || "";
      setSharing(false);
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

  const lineItems = items.length > 0 ? items : [{ id: "total", category: receipt.category, amount: receipt.amount }];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4 no-print">
          <a href="/" className="text-sm text-gold underline underline-offset-4">
            ← نئی رسید
          </a>
          <a href="/dashboard" className="text-sm text-gold underline underline-offset-4">
            ڈیش بورڈ
          </a>
        </div>

        <div ref={printAreaRef} className="print-area bg-card border-2 border-gold/30 rounded-lg shadow-md p-5">
          {/* Header: org identity + QR */}
          <div className="flex items-start justify-between gap-3 pb-4 border-b-2 border-gold/30">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="بنیادِ مدرسہ فیضانِ علم" className="w-14 h-14 rounded-lg shadow-sm" />
              <div>
                <p className="text-gold text-sm">بنیادِ مدرسہ فیضانِ علم</p>
                <h2 className="text-lg text-primary mt-0.5">عطیہ کی رسید</h2>
              </div>
            </div>
            {qrDataUrl && (
              <img src={qrDataUrl} alt="تصدیقی QR کوڈ" className="w-16 h-16 rounded-md border border-gold/30 shrink-0" />
            )}
          </div>

          {/* Receipt meta */}
          <div className="grid grid-cols-2 gap-3 py-4 border-b-2 border-gold/30 text-sm">
            <div>
              <p className="text-ink/50 text-xs mb-1">رسید نمبر</p>
              <p className="figures font-medium text-ink">{receipt.receipt_no}</p>
            </div>
            <div className="text-left">
              <p className="text-ink/50 text-xs mb-1">تاریخ</p>
              <p className="figures font-medium text-ink">{formatDate(receipt.created_at)}</p>
            </div>
          </div>

          {/* Donor information */}
          <div className="border-2 border-gold/30 rounded-md p-3 my-4">
            <p className="text-xs text-gold mb-2">عطیہ دہندہ کی معلومات</p>
            <div className="space-y-1.5 text-sm">
              <Row label="نام" value={receipt.donor_name} />
              {receipt.donor_address && <Row label="پتہ" value={receipt.donor_address} />}
              {receipt.phone && <Row label="فون" value={receipt.phone} figures />}
              {receipt.received_by && <Row label="نامِ وصول کنندہ" value={receipt.received_by} />}
            </div>
          </div>

          {/* Donation line items */}
          <div className="border-2 border-gold/30 rounded-md overflow-hidden my-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-primary/5 text-ink/60">
                  <th className="border border-gold/25 px-3 py-2 font-normal w-10">#</th>
                  <th className="border border-gold/25 px-3 py-2 font-normal">قسم</th>
                  <th className="border border-gold/25 px-3 py-2 font-normal">طریقہ</th>
                  <th className="border border-gold/25 px-3 py-2 font-normal">رقم</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((it, i) => (
                  <tr key={it.id}>
                    <td className="border border-gold/25 px-3 py-2 text-center figures">{i + 1}</td>
                    <td className="border border-gold/25 px-3 py-2">
                      {CATEGORY_LABELS[it.category] || "—"}
                    </td>
                    <td className="border border-gold/25 px-3 py-2">
                      {METHOD_LABELS[receipt.method] || receipt.method}
                    </td>
                    <td className="border border-gold/25 px-3 py-2 figures font-medium">
                      {formatPKR(it.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {receipt.note && (
            <div className="text-sm mb-4">
              <Row label="نوٹ" value={receipt.note} />
            </div>
          )}

          {/* Grand total */}
          <div className="border-2 border-primary rounded-md p-4 text-center bg-primary/5 my-4">
            <p className="text-xs text-ink/50">کل موصولہ رقم</p>
            <p className="text-2xl font-semibold text-primary figures mt-1">
              {formatPKR(receipt.amount)}
            </p>
          </div>

          <p className="text-center text-xs text-ink/45 leading-relaxed">
            آپ کے عطیہ پر جزاک اللہ خیر۔
          </p>

          <div className="flex justify-center mt-5">
            <div ref={sealRef} className="seal">
              <span className="text-sm font-medium tracking-wide">سید غلام دستگیر شاہ</span>
            </div>
          </div>
        </div>

        <div className="no-print flex gap-3 mt-5">
          <button
            onClick={handleShare}
            disabled={sharing}
            className="flex-1 bg-gold text-white rounded-lg py-3 font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {sharing ? "تیار ہو رہا ہے..." : "شیئر کریں"}
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
