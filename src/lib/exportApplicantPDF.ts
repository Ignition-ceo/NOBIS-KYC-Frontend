/**
 * NOBIS Applicant Verification Report — PDF Export
 *
 * Generates a branded, multi-page PDF report from the applicant data
 * already loaded in the ApplicantDetails component.
 *
 * Dependencies (add to package.json):
 *   npm install jspdf jspdf-autotable
 *
 * Usage:
 *   import { exportApplicantPDF } from "@/lib/exportApplicantPDF";
 *   exportApplicantPDF({ applicant, verificationResults, clientName });
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ── Brand colours ────────────────────────────────────────────────────
const NOBIS_BLUE = "#1B0C8C"; // sidebar / header
const NOBIS_LIGHT = "#E8E6F5"; // light accent
const STATUS_GREEN = "#16a34a";
const STATUS_RED = "#dc2626";
const STATUS_AMBER = "#d97706";
const STATUS_GREY = "#64748b";
const TEXT_PRIMARY = "#1e293b";
const TEXT_SECONDARY = "#64748b";
const BORDER_GREY = "#e2e8f0";

// ── Logo (inline base64 — white NOBIS logo on transparent) ──────────
// This is the same logo already in the project at src/assets/nobis-logo-white.png
// We embed a small dark version for the PDF header. Replace with your own if needed.
const NOBIS_LOGO_PLACEHOLDER = true; // set false + add base64 if you embed an actual logo

// ── Types ────────────────────────────────────────────────────────────
interface ExportParams {
  applicant: any;
  verificationResults: any[];
  clientName?: string; // e.g. "WiPay Trinidad" — shows as "Created for <clientName>"
  logoBase64?: string; // optional: base64 PNG/JPEG of the NOBIS logo
}

// ── Helpers ──────────────────────────────────────────────────────────
function safeStr(val: any): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (Array.isArray(val)) return val.map(safeStr).join(", ");
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

function fmtDate(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    verified: "APPROVED",
    approved: "APPROVED",
    rejected: "REJECTED",
    pending: "PENDING",
    needsReview: "NEEDS REVIEW",
    requested: "PENDING",
    passed: "PASS",
    failed: "FAIL",
  };
  return map[status?.toLowerCase()] || status?.toUpperCase() || "—";
}

function statusColor(status: string): string {
  const s = status?.toLowerCase();
  if (["verified", "approved", "passed", "pass", "ok", "match", "valid", "clear"].includes(s)) return STATUS_GREEN;
  if (["rejected", "failed", "fail", "expired", "invalid"].includes(s)) return STATUS_RED;
  if (["pending", "needsreview", "needs_review", "in_progress", "review"].includes(s)) return STATUS_AMBER;
  return STATUS_GREY;
}

function getResult(results: any[], type: string): any {
  return results.find((r: any) => r.verificationType === type) || null;
}

// ── Main export function ─────────────────────────────────────────────
export async function exportApplicantPDF({
  applicant,
  verificationResults,
  clientName = "NOBIS KYC",
  logoBase64,
}: ExportParams): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = 0;

  const fullName = applicant?.name || [applicant?.firstName, applicant?.lastName].filter(Boolean).join(" ") || "Unknown";
  const applicantId = applicant?.applicantIdRemote || applicant?._id || "—";
  const createdAt = fmtDate(applicant?.createdAt);

  // Derive overall status
  const statuses = (applicant?.requiredVerifications || []).map((v: any) => v.status);
  let overallStatus = "PENDING";
  if (statuses.every((s: string) => s === "verified")) overallStatus = "APPROVED";
  else if (statuses.some((s: string) => s === "rejected" || s === "failed")) overallStatus = "REJECTED";
  else if (statuses.some((s: string) => s === "verified") && statuses.some((s: string) => s === "pending")) overallStatus = "NEEDS REVIEW";

  // IDV, Face, Phone, Email, PoA, AML results
  const idvResult = getResult(verificationResults, "idDocument");
  const faceResult = getResult(verificationResults, "selfie");
  const phoneResult = getResult(verificationResults, "phone");
  const emailResult = getResult(verificationResults, "email");
  const poaResult = getResult(verificationResults, "proofOfAddress");
  const amlResult = getResult(verificationResults, "sanctionsCheck");
  const riskResult = getResult(verificationResults, "riskEvaluation");

  // ════════════════════════════════════════════════════════════════════
  // PAGE HEADER (reusable)
  // ════════════════════════════════════════════════════════════════════
  const drawHeader = () => {
    // Blue header bar
    doc.setFillColor(27, 12, 140); // NOBIS_BLUE
    doc.rect(0, 0, pageW, 22, "F");

    // Logo text fallback (or actual logo if provided)
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "PNG", margin, 4, 30, 14);
      } catch {
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("NOBIS", margin, 14);
      }
    } else {
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("NOBIS", margin, 14);
    }

    // Right side header text
    doc.setTextColor(200, 200, 230);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("VERIFICATION REPORT", pageW - margin, 10, { align: "right" });
    doc.text(`Generated ${new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}`, pageW - margin, 15, { align: "right" });
  };

  // ════════════════════════════════════════════════════════════════════
  // PAGE FOOTER (reusable)
  // ════════════════════════════════════════════════════════════════════
  const drawFooter = (pageNum: number, totalPages: number) => {
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageH - 14, pageW - margin, pageH - 14);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.text(`Powered by NOBIS — ${clientName}`, margin, pageH - 9);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageW - margin, pageH - 9, { align: "right" });
    doc.text("This report is confidential and intended for authorized personnel only.", margin, pageH - 5);
  };

  // Helper: ensure space, add new page if needed
  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - 20) {
      doc.addPage();
      drawHeader();
      y = 30;
    }
  };

  // Helper: section heading
  const sectionHeading = (title: string) => {
    ensureSpace(14);
    doc.setFillColor(232, 230, 245); // NOBIS_LIGHT
    doc.roundedRect(margin, y, contentW, 9, 1.5, 1.5, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(27, 12, 140);
    doc.text(title, margin + 4, y + 6.5);
    y += 13;
  };

  // Helper: key-value row
  const kvRow = (key: string, value: string, opts?: { valueColor?: string; bold?: boolean }) => {
    ensureSpace(7);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(key, margin + 2, y);
    doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
    doc.setTextColor(...(hexToRgb(opts?.valueColor || TEXT_PRIMARY)));
    doc.text(safeStr(value), margin + 60, y);
    y += 6;
  };

  // Helper: status pill
  const statusPill = (x: number, yPos: number, label: string, color: string) => {
    const pillW = doc.getTextWidth(label) + 8;
    const rgb = hexToRgb(color);
    doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    doc.roundedRect(x, yPos - 4, pillW, 6, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(label, x + 4, yPos);
  };

  // Hex to RGB
  function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace("#", "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  // ════════════════════════════════════════════════════════════════════
  // PAGE 1: Cover / Summary
  // ════════════════════════════════════════════════════════════════════
  drawHeader();
  y = 32;

  // Title
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...hexToRgb(TEXT_PRIMARY));
  doc.text(fullName, margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...hexToRgb(TEXT_SECONDARY));
  doc.text(`Inspection report for ${new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}`, margin, y);
  y += 5;
  doc.text(`Created for ${clientName}`, margin, y);
  y += 12;

  // Verification Status
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...hexToRgb(TEXT_PRIMARY));
  doc.text("Verification Status", margin, y);
  statusPill(margin + 45, y, overallStatus, statusColor(overallStatus));
  y += 14;

  // Divider
  doc.setDrawColor(...hexToRgb(BORDER_GREY));
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // Profile info
  sectionHeading("Profile Data");
  kvRow("Applicant ID:", applicantId);
  kvRow("Full Name:", fullName);
  kvRow("Email:", safeStr(applicant?.email));
  kvRow("Phone:", safeStr(applicant?.phone));
  kvRow("Address:", safeStr(applicant?.address));
  kvRow("Profile Created:", createdAt);
  const flowName = applicant?.flowId?.name || (typeof applicant?.flowId === "string" ? applicant.flowId : "—");
  kvRow("Verification Flow:", safeStr(flowName));
  y += 4;

  // ── Verification Steps Summary ──
  sectionHeading("Verification Steps");
  const steps = applicant?.requiredVerifications || [];
  if (steps.length > 0) {
    const stepRows = steps.map((s: any) => {
      const label = {
        phone: "Phone", email: "Email", idDocument: "ID Document",
        selfie: "Selfie / Face", proofOfAddress: "Proof of Address",
      }[s.verificationType as string] || s.verificationType;
      return [label, statusLabel(s.status)];
    });

    autoTable(doc, {
      startY: y,
      margin: { left: margin + 2, right: margin + 2 },
      head: [["Step", "Status"]],
      body: stepRows,
      theme: "grid",
      headStyles: { fillColor: [27, 12, 140], textColor: 255, fontSize: 9, font: "helvetica", fontStyle: "bold" },
      bodyStyles: { fontSize: 9, textColor: [30, 41, 59], font: "helvetica" },
      columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 40, halign: "center" } },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: (data: any) => {
        if (data.section === "body" && data.column.index === 1) {
          const val = data.cell.raw as string;
          data.cell.styles.textColor = hexToRgb(statusColor(val));
          data.cell.styles.fontStyle = "bold";
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ════════════════════════════════════════════════════════════════════
  // PAGE 2+: Key Findings
  // ════════════════════════════════════════════════════════════════════
  ensureSpace(40);
  sectionHeading("Key Findings");

  // Document Review
  if (idvResult) {
    const idvProcessed = idvResult.processedData || {};
    const idvRaw = idvResult.rawResponse || {};

    ensureSpace(12);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...hexToRgb(TEXT_PRIMARY));
    doc.text("Document Review", margin + 2, y);
    y += 7;

    // Detailed checks
    const details = idvRaw.resultData?.verificationResultDetails || {};
    const checks: [string, string][] = [];
    for (const [key, val] of Object.entries(details)) {
      if (val && typeof val === "object" && "DecisionResult" in (val as any)) {
        const label = key.replace("Decision_", "").replace(/([A-Z])/g, " $1").trim();
        checks.push([label, (val as any).DecisionResult]);
      }
    }
    // Fallback to processedData
    if (checks.length === 0 && idvProcessed.detailedChecks) {
      for (const [k, v] of Object.entries(idvProcessed.detailedChecks)) {
        checks.push([k, safeStr(v)]);
      }
    }

    if (checks.length > 0) {
      autoTable(doc, {
        startY: y,
        margin: { left: margin + 2, right: margin + 2 },
        head: [["Check", "Result"]],
        body: checks,
        theme: "grid",
        headStyles: { fillColor: [27, 12, 140], textColor: 255, fontSize: 8, font: "helvetica", fontStyle: "bold" },
        bodyStyles: { fontSize: 8, textColor: [30, 41, 59], font: "helvetica" },
        columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 30, halign: "center" } },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        didParseCell: (data: any) => {
          if (data.section === "body" && data.column.index === 1) {
            const val = (data.cell.raw as string)?.toLowerCase();
            if (val === "ok" || val === "pass") data.cell.styles.textColor = hexToRgb(STATUS_GREEN);
            else if (val === "fail") data.cell.styles.textColor = hexToRgb(STATUS_RED);
            data.cell.styles.fontStyle = "bold";
          }
        },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }
  }

  // ID Document Information
  if (idvResult) {
    const idvProcessed = idvResult.processedData || {};
    const idvRaw = idvResult.rawResponse || {};

    ensureSpace(20);
    sectionHeading("ID Document Information");

    const docInfo: [string, string][] = [];
    if (idvProcessed.documentInfo) {
      for (const [k, v] of Object.entries(idvProcessed.documentInfo)) {
        if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
          docInfo.push([k, safeStr(v)]);
        }
      }
    } else {
      const idData = idvRaw.responseCustomerData?.extractedIdData || {};
      if (idData.idType) docInfo.push(["ID Type", idData.idType]);
      if (idData.idNumber) docInfo.push(["ID Number", idData.idNumber]);
      if (idData.idCountry) docInfo.push(["ID Country", idData.idCountry]);
      if (idData.idDateOfBirth) docInfo.push(["Date of Birth", idData.idDateOfBirth]);
      if (idData.idExpirationDate) docInfo.push(["Expiration Date", idData.idExpirationDate]);
      if (idData.nationality) docInfo.push(["Nationality", idData.nationality]);
    }

    if (docInfo.length > 0) {
      autoTable(doc, {
        startY: y,
        margin: { left: margin + 2, right: margin + 2 },
        body: docInfo,
        theme: "plain",
        bodyStyles: { fontSize: 9, textColor: [30, 41, 59], font: "helvetica" },
        columnStyles: {
          0: { cellWidth: 55, textColor: hexToRgb(TEXT_SECONDARY), fontStyle: "normal" },
          1: { fontStyle: "bold" },
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        didParseCell: (data: any) => {
          if (data.section === "body" && data.column.index === 1) {
            const val = (data.cell.raw as string);
            if (val === "Valid" || val === "Yes") data.cell.styles.textColor = hexToRgb(STATUS_GREEN);
            else if (val === "Invalid" || val === "No" || val === "Expired") data.cell.styles.textColor = hexToRgb(STATUS_RED);
          }
        },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }
  }

  // Face Verification
  if (faceResult) {
    ensureSpace(20);
    sectionHeading("Face Verification");

    const fp = faceResult.processedData || {};
    const fr = faceResult.rawResponse || {};
    const matchResult = fp.result || fp.matchResult || fr.resultData?.verificationResult || "—";
    const matchScore = fp.matchScore || fp.score || fp.confidence || fr.resultData?.matchScore || "—";
    const livenessResult = fp.livenessResult || fp.liveness?.result || fr.resultData?.livenessResult || "—";
    const livenessScore = fp.livenessScore || fp.liveness?.score || fr.resultData?.livenessScore || "—";

    kvRow("Face Match Result:", safeStr(matchResult), { valueColor: statusColor(matchResult), bold: true });
    kvRow("Match Confidence:", matchScore !== "—" ? `${matchScore}%` : "—");
    kvRow("Liveness Check:", safeStr(livenessResult), { valueColor: statusColor(livenessResult), bold: true });
    kvRow("Liveness Score:", livenessScore !== "—" ? `${livenessScore}%` : "—");
    kvRow("Checked At:", fmtDate(faceResult.createdAt));
    y += 4;
  }

  // Phone / Email
  if (phoneResult || emailResult) {
    ensureSpace(20);
    sectionHeading("Contact Verification");

    if (phoneResult) {
      kvRow("Phone Check:", statusLabel(phoneResult.status), { valueColor: statusColor(phoneResult.status), bold: true });
      kvRow("Phone Number:", safeStr(applicant?.phone));
      kvRow("Verified At:", fmtDate(phoneResult.createdAt));
      y += 2;
    }
    if (emailResult) {
      kvRow("Email Check:", statusLabel(emailResult.status), { valueColor: statusColor(emailResult.status), bold: true });
      kvRow("Email Address:", safeStr(applicant?.email));
      kvRow("Verified At:", fmtDate(emailResult.createdAt));
      y += 2;
    }
  }

  // AML / Sanctions
  if (amlResult) {
    ensureSpace(20);
    sectionHeading("AML / Sanctions Screening");

    const ap = amlResult.processedData || {};
    const ar = amlResult.rawResponse || {};
    const matchStatus = ap.matchStatus || ar.matchStatus || "NO_MATCH";
    const amlStatus = ap.status || ar.status || "CLEAR";

    kvRow("Screening Result:", safeStr(amlStatus), { valueColor: statusColor(amlStatus), bold: true });
    kvRow("Match Status:", safeStr(matchStatus), { valueColor: matchStatus === "NO_MATCH" ? STATUS_GREEN : STATUS_RED, bold: true });

    const sources = ap.sources || ar.sources || [];
    if (sources.length > 0) kvRow("Data Sources:", sources.join(", "));

    const warnings = ap.warningTypes || ar.warningTypes || [];
    if (warnings.length > 0) kvRow("Warning Types:", warnings.join(", "));

    kvRow("Checked At:", fmtDate(amlResult.createdAt));
    y += 4;
  }

  // Risk Assessment
  if (riskResult) {
    ensureSpace(20);
    sectionHeading("Risk Assessment");

    const rp = riskResult.processedData || {};
    const rr = riskResult.rawResponse || {};
    const score = rp.score ?? rp.riskScore ?? rr.totalPoints ?? "—";
    const level = rp.level || rp.riskLevel || rr.classification || "—";
    const action = rp.recommendedAction || rp.recommendation || rr.recommendation || "—";

    kvRow("Risk Score:", safeStr(score), { bold: true });
    kvRow("Risk Level:", safeStr(level), { valueColor: statusColor(level), bold: true });
    kvRow("Recommended Action:", safeStr(action));
    kvRow("Assessed At:", fmtDate(riskResult.createdAt));
    y += 4;
  }

  // Proof of Address
  if (poaResult) {
    ensureSpace(20);
    sectionHeading("Proof of Address");

    const pp = poaResult.processedData || {};
    const pr = poaResult.rawResponse || {};

    kvRow("PoA Status:", statusLabel(poaResult.status), { valueColor: statusColor(poaResult.status), bold: true });
    if (pp.billHolderName || pr.billHolderName) kvRow("Bill Holder:", safeStr(pp.billHolderName || pr.billHolderName));
    if (pp.serviceAddress || pr.serviceAddress) kvRow("Service Address:", safeStr(pp.serviceAddress || pr.serviceAddress));
    if (pp.accountNumber || pr.accountNumber) kvRow("Account Number:", safeStr(pp.accountNumber || pr.accountNumber));
    if (pp.provider || pr.provider) kvRow("Provider:", safeStr(pp.provider || pr.provider));
    kvRow("Checked At:", fmtDate(poaResult.createdAt));
    y += 4;
  }

  // Location / IP
  const ip = applicant?.ip || idvResult?.rawResponse?.status?.ipAddress;
  const geo = applicant?.geoLocation;
  if (ip || geo) {
    ensureSpace(20);
    sectionHeading("Location & IP Data");

    if (ip) kvRow("IP Address:", ip);
    if (geo?.country) kvRow("Country:", safeStr(geo.country));
    if (geo?.region || geo?.regionName) kvRow("Region:", safeStr(geo.region || geo.regionName));
    if (geo?.city) kvRow("City:", safeStr(geo.city));
    if (geo?.latitude && geo?.longitude) kvRow("Coordinates:", `${geo.latitude}, ${geo.longitude}`);
    if (geo?.timezone) kvRow("Timezone:", safeStr(geo.timezone));
    y += 4;
  }

  // ════════════════════════════════════════════════════════════════════
  // DISCLAIMER
  // ════════════════════════════════════════════════════════════════════
  ensureSpace(30);
  doc.setDrawColor(...hexToRgb(BORDER_GREY));
  doc.line(margin, y, pageW - margin, y);
  y += 6;
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...hexToRgb(TEXT_SECONDARY));
  const disclaimer = "This report is generated from automated verification processes and is intended for authorized compliance personnel only. It does not constitute legal advice. Subjects included in this report do not necessarily pose actual risk. Further scrutiny may be appropriate based on the findings presented.";
  const disclaimerLines = doc.splitTextToSize(disclaimer, contentW - 4);
  doc.text(disclaimerLines, margin + 2, y);

  // ════════════════════════════════════════════════════════════════════
  // ADD FOOTERS TO ALL PAGES
  // ════════════════════════════════════════════════════════════════════
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }

  // ════════════════════════════════════════════════════════════════════
  // SAVE
  // ════════════════════════════════════════════════════════════════════
  const safeName = fullName.replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-");
  doc.save(`NOBIS-Verification-Report-${safeName}.pdf`);
}
