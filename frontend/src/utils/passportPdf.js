// Generates a printable Digital Passport PDF using jsPDF + QR Code.
// QR points to /verify/:assetId for public authenticity check.
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { supabase } from "../lib/supabaseClient";
import logoImage from "../assets/logo-transparent.png";

const VERIFY_BASE = "https://rightiotsa.com/verify";

async function fetchOwner(ownerId) {
  if (!ownerId) return null;
  const { data } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("user_id", ownerId)
    .maybeSingle();
  return data;
}

async function fetchLatestVitals(assetId) {
  const { data } = await supabase
    .from("sensor_readings")
    .select("recorded_at, heart_rate, temperature, respiration_rate, stability_score")
    .eq("asset_id", assetId)
    .order("recorded_at", { ascending: false })
    .limit(5);
  return data ?? [];
}

async function fetchSubscription(ownerId) {
  if (!ownerId) return null;
  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("owner_id", ownerId)
    .maybeSingle();
  return data;
}

async function loadImageDataUrl(url) {
  if (!url) return null;
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function exportAssetPassportPDF({ asset, passport }) {
  if (!asset?.id) throw new Error("Missing asset");

  const [owner, vitals, sub, qrDataUrl, photo] = await Promise.all([
    fetchOwner(asset.owner_id),
    fetchLatestVitals(asset.id),
    fetchSubscription(asset.owner_id),
    QRCode.toDataURL(`${VERIFY_BASE}/${asset.id}`, { width: 600, margin: 1, errorCorrectionLevel: "H" }),
    loadImageDataUrl(asset.image_url),
  ]);

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  // ==== Header band (Saudi Royal Green) ====
  doc.setFillColor(0, 108, 53);
  doc.rect(0, 0, pageW, 30, "F");
  doc.setFillColor(197, 165, 90);
  doc.rect(0, 30, pageW, 1.6, "F");

  // Embed real Right IoT logo (top-left)
  try {
    const logoData = await loadImageDataUrl(logoImage);
    if (logoData) doc.addImage(logoData, "PNG", margin, 5, 20, 20);
  } catch { /* fallback to text only */ }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("Right IoT — Digital Passport", margin + 24, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(244, 228, 188);
  doc.text("Kingdom of Saudi Arabia  |  rightiotsa.com", margin + 24, 20);
  doc.setFontSize(8);
  doc.text(
    `Issued: ${new Date().toLocaleString("en-GB")}`,
    pageW - margin,
    20,
    { align: "right" },
  );

  // ==== Title strip ====
  doc.setTextColor(0, 56, 28);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(asset.name || "—", margin, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text(
    `${asset.species || ""}${asset.registration_no ? "  |  Reg: " + asset.registration_no : ""}`,
    margin,
    48,
  );

  // ==== Photo (left) ====
  const photoX = margin;
  const photoY = 54;
  const photoW = 55;
  const photoH = 45;
  doc.setDrawColor(197, 165, 90);
  doc.setLineWidth(0.4);
  doc.rect(photoX, photoY, photoW, photoH);
  if (photo) {
    try {
      doc.addImage(photo, "JPEG", photoX + 0.5, photoY + 0.5, photoW - 1, photoH - 1);
    } catch {
      // Try PNG fallback
      try { doc.addImage(photo, "PNG", photoX + 0.5, photoY + 0.5, photoW - 1, photoH - 1); } catch { /* ignore */ }
    }
  } else {
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("No photo", photoX + photoW / 2, photoY + photoH / 2, { align: "center" });
  }

  // ==== Identity block (right) ====
  const idX = photoX + photoW + 8;
  let y = photoY + 4;
  const line = (label, value) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 108, 53);
    doc.setFontSize(8);
    doc.text(label.toUpperCase(), idX, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(10);
    doc.text(String(value ?? "—"), idX, y + 4.5);
    y += 10.5;
  };
  line("Passport No.", passport?.passport_no || "—");
  line("Microchip ID", passport?.microchip_id || "—");
  line("Bloodline", passport?.bloodline || "—");
  line("Birth Date", asset.birth_date || passport?.birth_date || "—");

  // ==== Owner & subscription ====
  let sy = photoY + photoH + 12;
  doc.setDrawColor(230);
  doc.line(margin, sy - 4, pageW - margin, sy - 4);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 108, 53);
  doc.setFontSize(11);
  doc.text("Owner & Subscription", margin, sy);
  sy += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(40);
  doc.text(`Owner: ${owner?.full_name || "—"}`, margin, sy);
  doc.text(`Phone: ${owner?.phone ? maskPhone(owner.phone) : "—"}`, margin + 90, sy);
  sy += 6;
  doc.text(`Plan: ${sub?.plan ?? "—"}`, margin, sy);
  doc.text(
    `Status: ${sub?.status ?? "—"}   |   Insured: ${asset.is_insured ? "Yes" : "No"}`,
    margin + 90,
    sy,
  );
  sy += 4;

  // ==== Latest vitals table ====
  sy += 8;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 108, 53);
  doc.setFontSize(11);
  doc.text("Latest Vital Readings", margin, sy);
  sy += 4;

  // Manual table
  const cols = [
    { key: "recorded_at", label: "Time", w: 42 },
    { key: "heart_rate", label: "HR (bpm)", w: 25 },
    { key: "temperature", label: "Temp (C)", w: 25 },
    { key: "respiration_rate", label: "Resp", w: 22 },
    { key: "stability_score", label: "Stability %", w: 30 },
  ];

  doc.setFillColor(0, 108, 53);
  doc.rect(margin, sy, pageW - margin * 2, 7, "F");
  doc.setTextColor(255);
  doc.setFontSize(9);
  let cx = margin + 2;
  cols.forEach((c) => { doc.text(c.label, cx, sy + 5); cx += c.w; });
  sy += 7;

  doc.setTextColor(40);
  doc.setFont("helvetica", "normal");
  if (vitals.length === 0) {
    doc.setTextColor(140);
    doc.text("No readings recorded yet.", margin + 2, sy + 6);
    sy += 10;
  } else {
    vitals.forEach((v, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(247, 245, 238);
        doc.rect(margin, sy, pageW - margin * 2, 7, "F");
      }
      cx = margin + 2;
      doc.setTextColor(40);
      const fmt = (val, decimals = 0) =>
        val == null || val === "" ? "—" : Number(val).toFixed(decimals);
      const t = v.recorded_at
        ? new Date(v.recorded_at).toLocaleString("en-GB", {
            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
          })
        : "—";
      doc.text(t, cx, sy + 5); cx += cols[0].w;
      doc.text(fmt(v.heart_rate), cx, sy + 5); cx += cols[1].w;
      doc.text(fmt(v.temperature, 1), cx, sy + 5); cx += cols[2].w;
      doc.text(fmt(v.respiration_rate), cx, sy + 5); cx += cols[3].w;
      doc.text(fmt(v.stability_score), cx, sy + 5);
      sy += 7;
    });
  }

  // ==== QR code (verification) ====
  sy += 6;
  const qrSize = 38;
  const qrX = pageW - margin - qrSize;
  doc.addImage(qrDataUrl, "PNG", qrX, sy, qrSize, qrSize);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 108, 53);
  doc.setFontSize(10);
  doc.text("Verify authenticity", margin, sy + 6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  doc.setFontSize(8);
  doc.text(
    "Scan the QR code to verify this asset's identity",
    margin,
    sy + 12,
  );
  doc.text(`${VERIFY_BASE}/${asset.id}`, margin, sy + 17);
  doc.setFontSize(7);
  doc.setTextColor(140);
  doc.text(
    "Document electronically issued by Right IoT.",
    margin,
    sy + 24,
  );
  doc.text("Any unauthorized modification voids this passport.", margin, sy + 28);

  // ==== Footer ====
  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setDrawColor(197, 165, 90);
  doc.setLineWidth(0.6);
  doc.line(margin, footerY, pageW - margin, footerY);
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(`© ${new Date().getFullYear()} Right IoT  -  rightiotsa.com`, margin, footerY + 5);
  doc.text(`Doc ID: RT-${asset.id.slice(0, 8).toUpperCase()}`, pageW - margin, footerY + 5, { align: "right" });

  doc.save(`passport-${(asset.name || "asset").replace(/\s+/g, "_")}.pdf`);
}

function maskPhone(p) {
  const s = String(p);
  if (s.length < 6) return s;
  return s.slice(0, 4) + "****" + s.slice(-3);
}
