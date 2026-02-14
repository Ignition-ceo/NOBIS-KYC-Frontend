import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { fetchClientFlows } from "@/services/flow";
import { QRCodeSVG } from "qrcode.react";
import {
  Link2,
  QrCode,
  Code2,
  Send,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  ChevronRight,
  Mail,
  Phone,
  CreditCard,
  ScanFace,
  MapPin,
  Sparkles,
  Download,
  MessageSquare,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────
interface BackendFlow {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  maxUses: number | null;
  currentUses: number;
  requiredVerifications: Array<{ verificationType: string; order?: number; status: string }>;
  subscriptionPlan?: any;
  verificationConfig?: any;
}

interface StartVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedFlowId?: string | null;
}

// ── Constants ────────────────────────────────────────────────────────────
const SDK_BASE_URL = "https://web-sdk.getnobis.com";

const STEP_META: Record<string, { icon: React.ElementType; label: string }> = {
  phone: { icon: Phone, label: "Phone" },
  email: { icon: Mail, label: "Email" },
  idDocument: { icon: CreditCard, label: "ID Doc" },
  selfie: { icon: ScanFace, label: "Selfie" },
  proofOfAddress: { icon: MapPin, label: "PoA" },
};

type DistMethod = "link" | "qr" | "embed" | "send";

const METHODS: { key: DistMethod; label: string; icon: React.ElementType }[] = [
  { key: "link", label: "Verification Link", icon: Link2 },
  { key: "qr", label: "QR Code", icon: QrCode },
  { key: "embed", label: "HTML Embed", icon: Code2 },
  { key: "send", label: "Send Directly", icon: Send },
];

// ── Component ────────────────────────────────────────────────────────────
export function StartVerificationModal({ open, onOpenChange, preselectedFlowId }: StartVerificationModalProps) {
  const [flows, setFlows] = useState<BackendFlow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFlowId, setSelectedFlowId] = useState("");
  const [activeMethod, setActiveMethod] = useState<DistMethod>("link");
  const [copied, setCopied] = useState<string | null>(null);

  // Send form
  const [sendMethod, setSendMethod] = useState<"email" | "whatsapp">("email");
  const [sendTo, setSendTo] = useState("");
  const [sendMessage, setSendMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const qrRef = useRef<HTMLDivElement>(null);

  // ── Load flows ──
  useEffect(() => {
    if (open) {
      loadFlows();
      setCopied(null);
      setSent(false);
      setSendTo("");
      setSendMessage("");
      setSendError(null);
    }
  }, [open]);

  useEffect(() => {
    if (preselectedFlowId) setSelectedFlowId(preselectedFlowId);
  }, [preselectedFlowId]);

  const loadFlows = async () => {
    try {
      setLoading(true);
      const res = await fetchClientFlows(1, "");
      const data = res?.flows || res || [];
      const active = data.filter((f: any) => f.isActive !== false);
      setFlows(active);
      if (!selectedFlowId && active.length > 0) {
        setSelectedFlowId(preselectedFlowId || active[0]._id);
      }
    } catch (e) {
      console.error("Failed to load flows:", e);
    } finally {
      setLoading(false);
    }
  };

  // ── Derived ──
  const flow = flows.find((f) => f._id === selectedFlowId);
  const flowUrl = selectedFlowId ? `${SDK_BASE_URL}/flow/${selectedFlowId}` : "";
  const usageLeft = flow?.maxUses ? flow.maxUses - flow.currentUses : null;

  const embedWidget = `<!-- NOBIS Verification Widget -->\n<div id="nobis-verify"></div>\n<script src="${SDK_BASE_URL}/sdk.js"></script>\n<script>\n  NobisSDK.init({\n    container: '#nobis-verify',\n    flowId: '${selectedFlowId}',\n    theme: 'light',\n    onComplete: function(result) {\n      console.log('Verification complete:', result);\n    }\n  });\n</script>`;

  const embedIframe = `<iframe\n  src="${flowUrl}"\n  width="100%" height="700"\n  frameborder="0" allow="camera; microphone"\n  style="border:none; border-radius:12px;"\n></iframe>`;

  // ── Helpers ──
  const copyText = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  // ── Send handler ──
  const handleSend = async () => {
    if (!sendTo.trim() || !selectedFlowId) return;
    setSending(true);
    setSendError(null);

    try {
      await api.post("/flows/" + selectedFlowId + "/invite", {
        channel: sendMethod,
        to: sendTo.trim(),
        message: sendMessage.trim() || undefined,
      });
      setSent(true);
      setTimeout(() => setSent(false), 4000);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to send. Please try again.";
      setSendError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setSending(false);
    }
  };

  // ── QR Download ──
  const downloadQR = useCallback(() => {
    const svgEl = qrRef.current?.querySelector("svg");
    if (!svgEl) return;

    // Download as PNG for better compatibility
    const canvas = document.createElement("canvas");
    const size = 1024;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      const link = document.createElement("a");
      link.download = `nobis-qr-${flow?.name || "flow"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }, [flow?.name]);

  const downloadQRSvg = useCallback(() => {
    const svgEl = qrRef.current?.querySelector("svg");
    if (!svgEl) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svgEl)], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nobis-qr-${flow?.name || "flow"}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [flow?.name]);

  // ── Render ──
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden rounded-xl border shadow-2xl [&>button]:hidden">
        <DialogDescription className="sr-only">Start a new verification session</DialogDescription>

        {/* Header */}
        <div className="px-7 pt-6 pb-5 border-b bg-gradient-to-b from-slate-50/80 to-white flex items-start justify-between">
          <div>
            <DialogTitle className="text-lg font-semibold tracking-tight text-slate-900">Start Verification</DialogTitle>
            <p className="text-sm text-slate-500 mt-0.5">Generate a verification link, QR code, or embed widget for applicants</p>
          </div>
          <button onClick={() => onOpenChange(false)} className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-80">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : flows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 px-8 text-center">
            <div className="h-11 w-11 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
              <Sparkles className="h-5 w-5 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-900 text-sm">No active flows</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">Create a verification flow first, then come back here to generate links and share with applicants.</p>
          </div>
        ) : (
          <div className="grid grid-cols-[240px_1fr] min-h-[440px] max-h-[70vh]">

            {/* Left Sidebar */}
            <div className="border-r bg-slate-50/50 p-4 flex flex-col gap-4 overflow-y-auto">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Select flow</p>
                <Select value={selectedFlowId} onValueChange={setSelectedFlowId}>
                  <SelectTrigger className="bg-white border-slate-200 h-9 text-sm">
                    <SelectValue placeholder="Choose a flow" />
                  </SelectTrigger>
                  <SelectContent>
                    {flows.map((f) => (
                      <SelectItem key={f._id} value={f._id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {flow && (
                <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2.5">
                  <div>
                    <p className="font-semibold text-[13px] text-slate-900 leading-tight">{flow.name}</p>
                    {flow.description && (
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-2">{flow.description}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {flow.requiredVerifications?.map((v) => {
                      const meta = STEP_META[v.verificationType];
                      if (!meta) return null;
                      const Icon = meta.icon;
                      return (
                        <span key={v.verificationType} className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-150">
                          <Icon className="h-2.5 w-2.5" />{meta.label}
                        </span>
                      );
                    })}
                  </div>
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Sessions</span>
                      <span className="font-semibold text-slate-700 tabular-nums">
                        {flow.currentUses}{flow.maxUses ? ` / ${flow.maxUses}` : " / ∞"}
                      </span>
                    </div>
                    {flow.maxUses && (
                      <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
                        <div className={cn("h-full rounded-full", (flow.currentUses / flow.maxUses) > 0.9 ? "bg-red-500" : "bg-slate-800")}
                          style={{ width: `${Math.min((flow.currentUses / flow.maxUses) * 100, 100)}%` }} />
                      </div>
                    )}
                    {usageLeft !== null && usageLeft <= 5 && usageLeft > 0 && (
                      <p className="text-[10px] text-amber-600 font-medium">{usageLeft} remaining</p>
                    )}
                    {usageLeft !== null && usageLeft <= 0 && (
                      <p className="text-[10px] text-red-500 font-medium">No sessions left</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Method</p>
                <div className="space-y-0.5">
                  {METHODS.map((m) => {
                    const Icon = m.icon;
                    const active = activeMethod === m.key;
                    return (
                      <button key={m.key} onClick={() => setActiveMethod(m.key)}
                        className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all text-[13px]",
                          active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100")}>
                        <Icon className={cn("h-3.5 w-3.5", active ? "text-slate-300" : "text-slate-400")} />
                        <span className={cn("font-medium flex-1", active ? "text-white" : "text-slate-700")}>{m.label}</span>
                        {active && <ChevronRight className="h-3 w-3 text-slate-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="p-7 overflow-y-auto">

              {/* ── LINK ── */}
              {activeMethod === "link" && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-[15px] font-semibold text-slate-900">Verification Link</h3>
                    <p className="text-[13px] text-slate-500 mt-0.5 leading-relaxed">
                      Share this link with applicants. Each person who opens it will start their own unique verification session.
                    </p>
                  </div>

                  <div className="flex items-stretch border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <div className="flex-1 min-w-0 px-3.5 py-2.5 bg-slate-50/70">
                      <p className="font-mono text-[13px] text-slate-700 truncate">{flowUrl}</p>
                    </div>
                    <button onClick={() => copyText(flowUrl, "link")}
                      className={cn("flex items-center gap-1.5 px-4 border-l text-[12px] font-semibold transition-all shrink-0",
                        copied === "link" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200")}>
                      {copied === "link" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied === "link" ? "Copied!" : "Copy"}
                    </button>
                  </div>

                  <div className="flex gap-3 p-4 rounded-lg bg-blue-50/60 border border-blue-100">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Link2 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-blue-900">Multi-use link</p>
                      <p className="text-[12px] text-blue-700/80 leading-relaxed mt-0.5">
                        This link can be shared unlimited times. When an applicant opens it, a unique one-time session is created automatically — the link itself never expires.
                      </p>
                    </div>
                  </div>

                  <Button variant="outline" size="sm" className="gap-2 text-[13px] text-slate-600 h-9" onClick={() => window.open(flowUrl, "_blank")}>
                    <ExternalLink className="h-3.5 w-3.5" />
                    Preview in new tab
                  </Button>
                </div>
              )}

              {/* ── QR CODE ── */}
              {activeMethod === "qr" && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-[15px] font-semibold text-slate-900">QR Code</h3>
                    <p className="text-[13px] text-slate-500 mt-0.5 leading-relaxed">
                      Display at kiosks, offices, or print on materials. Scanning opens the verification flow.
                    </p>
                  </div>

                  <div className="flex flex-col items-center py-4 gap-4">
                    {/* Real QR Code */}
                    <div ref={qrRef} className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                      <QRCodeSVG
                        value={flowUrl}
                        size={200}
                        level="M"
                        includeMargin={false}
                        bgColor="#ffffff"
                        fgColor="#0f172a"
                        imageSettings={{
                          src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230f172a'%3E%3Ctext x='4' y='18' font-size='16' font-weight='900' font-family='Arial'%3EN%3C/text%3E%3C/svg%3E",
                          x: undefined,
                          y: undefined,
                          height: 28,
                          width: 28,
                          excavate: true,
                        }}
                      />
                    </div>

                    <p className="text-[10px] text-slate-400 font-mono truncate max-w-[320px] text-center">{flowUrl}</p>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-1.5 text-[12px] h-8" onClick={downloadQR}>
                        <Download className="h-3.5 w-3.5" />
                        Download PNG
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5 text-[12px] h-8" onClick={downloadQRSvg}>
                        <Download className="h-3.5 w-3.5" />
                        Download SVG
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5 text-[12px] h-8" onClick={() => copyText(flowUrl, "qr-link")}>
                        {copied === "qr-link" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied === "qr-link" ? "Copied!" : "Copy URL"}
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-3 p-4 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                      <QrCode className="h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-slate-700">Print-ready</p>
                      <p className="text-[12px] text-slate-500 leading-relaxed mt-0.5">
                        Download as PNG (1024×1024px) for print materials or SVG for vector use. The QR code links to your multi-use flow — each scan creates a unique session.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── EMBED ── */}
              {activeMethod === "embed" && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-[15px] font-semibold text-slate-900">HTML Embed</h3>
                    <p className="text-[13px] text-slate-500 mt-0.5 leading-relaxed">
                      Add the verification flow directly into your website or application.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[12px] font-semibold text-slate-600">JavaScript Widget</p>
                      <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">Recommended</span>
                    </div>
                    <div className="relative rounded-lg border border-slate-200 overflow-hidden">
                      <pre className="p-4 text-[11px] font-mono text-slate-600 bg-slate-50 overflow-x-auto leading-relaxed whitespace-pre max-h-36">{embedWidget}</pre>
                      <button onClick={() => copyText(embedWidget, "widget")}
                        className={cn("absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors",
                          copied === "widget" ? "bg-emerald-100 text-emerald-700" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50")}>
                        {copied === "widget" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied === "widget" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-[12px] font-semibold text-slate-600 mb-2">iFrame Alternative</p>
                    <div className="relative rounded-lg border border-slate-200 overflow-hidden">
                      <pre className="p-4 text-[11px] font-mono text-slate-600 bg-slate-50 overflow-x-auto leading-relaxed whitespace-pre max-h-28">{embedIframe}</pre>
                      <button onClick={() => copyText(embedIframe, "iframe")}
                        className="absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 bg-white border border-slate-200 text-slate-500 hover:bg-slate-50">
                        <Copy className="h-3 w-3" />Copy
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── SEND ── */}
              {activeMethod === "send" && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-[15px] font-semibold text-slate-900">Send Directly</h3>
                    <p className="text-[13px] text-slate-500 mt-0.5 leading-relaxed">
                      Send the verification link directly to an applicant via email or WhatsApp.
                    </p>
                  </div>

                  {/* Email / WhatsApp toggle */}
                  <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 rounded-lg w-fit">
                    <button onClick={() => { setSendMethod("email"); setSendTo(""); setSent(false); setSendError(null); }}
                      className={cn("flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[12px] font-semibold transition-all",
                        sendMethod === "email" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                      <Mail className="h-3 w-3" />Email
                    </button>
                    <button onClick={() => { setSendMethod("whatsapp"); setSendTo(""); setSent(false); setSendError(null); }}
                      className={cn("flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[12px] font-semibold transition-all",
                        sendMethod === "whatsapp" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                      <MessageSquare className="h-3 w-3" />WhatsApp
                    </button>
                  </div>

                  {/* Recipient */}
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-medium text-slate-700">
                      {sendMethod === "email" ? "Email address" : "WhatsApp number"} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type={sendMethod === "email" ? "email" : "tel"}
                      placeholder={sendMethod === "email" ? "applicant@example.com" : "+1 (868) 555-0123"}
                      value={sendTo}
                      onChange={(e) => { setSendTo(e.target.value); setSent(false); setSendError(null); }}
                      className="h-10 bg-white border-slate-200 placeholder:text-slate-300 text-[13px]"
                    />
                  </div>

                  {/* Custom message (email only) */}
                  {sendMethod === "email" && (
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-medium text-slate-700">
                        Custom message <span className="text-xs text-slate-400 font-normal">(optional)</span>
                      </Label>
                      <Textarea
                        placeholder="Add a personal note to the verification email..."
                        value={sendMessage}
                        onChange={(e) => setSendMessage(e.target.value)}
                        rows={2}
                        className="bg-white border-slate-200 placeholder:text-slate-300 resize-none text-[13px]"
                      />
                    </div>
                  )}

                  {/* Preview */}
                  <div className="rounded-lg bg-slate-50 border border-slate-100 p-3.5 space-y-1.5">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Preview</p>
                    {sendMethod === "email" ? (
                      <>
                        <p className="text-[13px] font-medium text-slate-900">Subject: Complete your identity verification</p>
                        {sendMessage && <p className="text-[12px] text-slate-500 italic leading-relaxed">"{sendMessage}"</p>}
                        <p className="font-mono text-[11px] text-blue-600 truncate">{flowUrl}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-[13px] text-slate-700 leading-relaxed">
                          Hi! You've been invited to complete your identity verification. Click the link below to get started:
                        </p>
                        <p className="font-mono text-[11px] text-blue-600 truncate">{flowUrl}</p>
                      </>
                    )}
                  </div>

                  {/* Error */}
                  {sendError && (
                    <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
                      <p className="text-[12px] text-red-700">{sendError}</p>
                    </div>
                  )}

                  {/* Send button */}
                  <Button onClick={handleSend} disabled={!sendTo.trim() || sending}
                    className={cn("w-full h-10 text-[13px] font-semibold gap-2",
                      sent ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-900 hover:bg-slate-800")}>
                    {sending ? <><Loader2 className="h-4 w-4 animate-spin" />Sending...</>
                      : sent ? <><Check className="h-4 w-4" />Sent successfully</>
                      : <><Send className="h-4 w-4" />Send {sendMethod === "email" ? "email" : "WhatsApp"}</>}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-7 py-3.5 border-t bg-slate-50/50 flex items-center justify-between">
          <p className="text-[10px] text-slate-400 font-mono truncate max-w-[300px]">
            {flow && <>Flow: {selectedFlowId}</>}
          </p>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-slate-500 hover:text-slate-700 text-[13px] h-8">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
