import { useState, useEffect, useRef } from "react";
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
  RotateCcw,
  MessageSquare,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────
interface BackendFlow {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  maxUses: number | null;
  currentUses: number;
  requiredVerifications: Array<{ verificationType: string; order?: number; status: string }>;
  subscriptionPlan?: any;
  verificationConfig?: { riskLevel?: number; sanctionsLevel?: number; fraudPrevention?: boolean; amlPepScreening?: boolean };
}

interface StartVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedFlowId?: string | null;
}

// ── Constants ───────────────────────────────────────────────────────────────
const SDK_BASE_URL = "https://web-sdk.getnobis.com";

const STEP_ICONS: Record<string, React.ElementType> = {
  phone: Phone, email: Mail, idDocument: CreditCard, selfie: ScanFace, proofOfAddress: MapPin,
};

const STEP_LABELS: Record<string, string> = {
  phone: "Phone", email: "Email", idDocument: "ID Doc", selfie: "Selfie", proofOfAddress: "PoA",
};

type DistMethod = "link" | "qr" | "embed" | "send";

const DIST_METHODS: { key: DistMethod; label: string; description: string; icon: React.ElementType }[] = [
  { key: "link", label: "Verification Link", description: "Copy a shareable URL", icon: Link2 },
  { key: "qr", label: "QR Code", description: "Scannable code for in-person", icon: QrCode },
  { key: "embed", label: "HTML Embed", description: "Add to your website", icon: Code2 },
  { key: "send", label: "Send Directly", description: "Email or SMS to applicant", icon: Send },
];

// ── Component ───────────────────────────────────────────────────────────────
export function StartVerificationModal({ open, onOpenChange, preselectedFlowId }: StartVerificationModalProps) {
  // State
  const [flows, setFlows] = useState<BackendFlow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFlowId, setSelectedFlowId] = useState<string>("");
  const [activeMethod, setActiveMethod] = useState<DistMethod>("link");
  const [copied, setCopied] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  // Send form
  const [sendMethod, setSendMethod] = useState<"email" | "sms">("email");
  const [sendTo, setSendTo] = useState("");
  const [sendMessage, setSendMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const qrRef = useRef<HTMLDivElement>(null);

  // Load flows
  useEffect(() => {
    if (open) {
      loadFlows();
      setCopied(false);
      setCopiedEmbed(false);
      setSent(false);
      setSendTo("");
      setSendMessage("");
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

  const selectedFlow = flows.find((f) => f._id === selectedFlowId);
  const flowUrl = selectedFlowId ? `${SDK_BASE_URL}/flow/${selectedFlowId}` : "";
  const usageLeft = selectedFlow?.maxUses ? selectedFlow.maxUses - selectedFlow.currentUses : null;

  const embedCode = `<!-- NOBIS Verification Widget -->
<div id="nobis-verify"></div>
<script src="${SDK_BASE_URL}/sdk.js"></script>
<script>
  NobisSDK.init({
    container: '#nobis-verify',
    flowId: '${selectedFlowId}',
    theme: 'light',
    onComplete: function(result) {
      console.log('Verification complete:', result);
    }
  });
</script>`;

  const iframeCode = `<iframe
  src="${flowUrl}"
  width="100%"
  height="700"
  frameborder="0"
  allow="camera; microphone"
  style="border: none; border-radius: 12px;"
></iframe>`;

  // Copy helpers
  const copyToClipboard = async (text: string, type: "link" | "embed") => {
    await navigator.clipboard.writeText(text);
    if (type === "link") { setCopied(true); setTimeout(() => setCopied(false), 2000); }
    if (type === "embed") { setCopiedEmbed(true); setTimeout(() => setCopiedEmbed(false), 2000); }
  };

  // Send handler (mock for now)
  const handleSend = async () => {
    if (!sendTo.trim()) return;
    setSending(true);
    // TODO: Wire to backend POST /sessions/send or similar
    await new Promise((r) => setTimeout(r, 1200));
    setSending(false);
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  // QR Code SVG generator (simple implementation)
  const generateQRMatrix = (text: string): boolean[][] => {
    // Simple visual placeholder — in production use a QR library
    const size = 25;
    const matrix: boolean[][] = [];
    let hash = 0;
    for (let i = 0; i < text.length; i++) { hash = ((hash << 5) - hash) + text.charCodeAt(i); hash |= 0; }
    for (let y = 0; y < size; y++) {
      matrix[y] = [];
      for (let x = 0; x < size; x++) {
        // Finder patterns (top-left, top-right, bottom-left)
        const inTL = x < 7 && y < 7;
        const inTR = x >= size - 7 && y < 7;
        const inBL = x < 7 && y >= size - 7;
        if (inTL || inTR || inBL) {
          const lx = inTL ? x : inTR ? x - (size - 7) : x;
          const ly = inTL ? y : inTR ? y : y - (size - 7);
          matrix[y][x] = (lx === 0 || lx === 6 || ly === 0 || ly === 6 || (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4));
        } else {
          // Data area - deterministic pseudo-random based on hash
          const seed = (hash + x * 31 + y * 37 + x * y * 13) & 0xFFFF;
          matrix[y][x] = seed % 3 !== 0;
        }
      }
    }
    return matrix;
  };

  const qrMatrix = flowUrl ? generateQRMatrix(flowUrl) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden rounded-xl border-0 shadow-2xl">
        <DialogDescription className="sr-only">Start a new verification session</DialogDescription>

        {/* Header */}
        <div className="px-8 pt-7 pb-5 bg-gradient-to-b from-slate-50 to-white border-b">
          <DialogTitle className="text-xl font-semibold tracking-tight text-slate-900">
            Start Verification
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            Generate a verification link, QR code, or embed widget for applicants
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : flows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 px-8">
            <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
              <Sparkles className="h-5 w-5 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-900">No active flows</p>
            <p className="text-sm text-slate-500 mt-1">Create a flow first to start verifying applicants</p>
          </div>
        ) : (
          <div className="grid grid-cols-[260px_1fr] min-h-[420px]">
            {/* Left sidebar */}
            <div className="border-r bg-slate-50/60 p-5 space-y-5">
              {/* Flow selector */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select flow</Label>
                <Select value={selectedFlowId} onValueChange={setSelectedFlowId}>
                  <SelectTrigger className="bg-white border-slate-200 h-10">
                    <SelectValue placeholder="Choose a flow" />
                  </SelectTrigger>
                  <SelectContent>
                    {flows.map((flow) => (
                      <SelectItem key={flow._id} value={flow._id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{flow.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Flow info card */}
              {selectedFlow && (
                <div className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-3">
                  <div>
                    <p className="font-semibold text-sm text-slate-900 truncate">{selectedFlow.name}</p>
                    {selectedFlow.description && (
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{selectedFlow.description}</p>
                    )}
                  </div>

                  {/* Verification steps */}
                  <div className="flex flex-wrap gap-1.5">
                    {selectedFlow.requiredVerifications?.map((v) => {
                      const Icon = STEP_ICONS[v.verificationType] || CreditCard;
                      return (
                        <span
                          key={v.verificationType}
                          className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200"
                        >
                          <Icon className="h-3 w-3" />
                          {STEP_LABELS[v.verificationType] || v.verificationType}
                        </span>
                      );
                    })}
                  </div>

                  {/* Usage stats */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Sessions used</span>
                      <span className="font-semibold text-slate-700">
                        {selectedFlow.currentUses}{selectedFlow.maxUses ? ` / ${selectedFlow.maxUses}` : ""}
                      </span>
                    </div>
                    {selectedFlow.maxUses && (
                      <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            (selectedFlow.currentUses / selectedFlow.maxUses) > 0.9 ? "bg-red-500" : "bg-slate-900"
                          )}
                          style={{ width: `${Math.min((selectedFlow.currentUses / selectedFlow.maxUses) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                    {usageLeft !== null && usageLeft <= 5 && usageLeft > 0 && (
                      <p className="text-[10px] text-amber-600 font-medium mt-1">{usageLeft} sessions remaining</p>
                    )}
                    {usageLeft !== null && usageLeft <= 0 && (
                      <p className="text-[10px] text-red-500 font-medium mt-1">No sessions remaining</p>
                    )}
                  </div>
                </div>
              )}

              {/* Distribution method selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Method</Label>
                <div className="space-y-1">
                  {DIST_METHODS.map((m) => {
                    const Icon = m.icon;
                    const isActive = activeMethod === m.key;
                    return (
                      <button
                        key={m.key}
                        onClick={() => setActiveMethod(m.key)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-100",
                          isActive
                            ? "bg-slate-900 text-white shadow-sm"
                            : "hover:bg-slate-100 text-slate-600"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-white" : "text-slate-400")} />
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-xs font-semibold", isActive ? "text-white" : "text-slate-700")}>{m.label}</p>
                        </div>
                        <ChevronRight className={cn("h-3.5 w-3.5 flex-shrink-0", isActive ? "text-white/60" : "text-transparent")} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right content area */}
            <div className="p-6 flex flex-col">
              {/* ── Link Method ──────────────────────────────────── */}
              {activeMethod === "link" && (
                <div className="flex-1 flex flex-col">
                  <div className="mb-5">
                    <h3 className="text-base font-semibold text-slate-900">Verification Link</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Share this link with applicants. Each person who opens it will start a unique verification session.
                    </p>
                  </div>

                  <div className="space-y-4 flex-1">
                    {/* URL display */}
                    <div className="relative">
                      <div className="flex items-center gap-0 border border-slate-200 rounded-lg overflow-hidden bg-white">
                        <div className="flex-1 px-4 py-3 font-mono text-sm text-slate-700 truncate bg-slate-50/50">
                          {flowUrl}
                        </div>
                        <button
                          onClick={() => copyToClipboard(flowUrl, "link")}
                          className={cn(
                            "px-4 py-3 border-l flex items-center gap-2 text-xs font-semibold transition-colors flex-shrink-0",
                            copied
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
                          )}
                        >
                          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          {copied ? "Copied" : "Copy"}
                        </button>
                      </div>
                    </div>

                    {/* Info callout */}
                    <div className="rounded-lg bg-blue-50/70 border border-blue-100 p-4">
                      <div className="flex gap-3">
                        <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Link2 className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-blue-900">Multi-use link</p>
                          <p className="text-xs text-blue-700 mt-0.5">
                            This link can be shared multiple times. Each applicant who opens it gets a unique, one-time verification session automatically.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Open preview */}
                    <Button
                      variant="outline"
                      className="gap-2 text-slate-600"
                      onClick={() => window.open(flowUrl, "_blank")}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Preview in new tab
                    </Button>
                  </div>
                </div>
              )}

              {/* ── QR Code Method ───────────────────────────────── */}
              {activeMethod === "qr" && (
                <div className="flex-1 flex flex-col">
                  <div className="mb-5">
                    <h3 className="text-base font-semibold text-slate-900">QR Code</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Display this QR code at kiosks, offices, or print on materials. Scanning opens the verification flow.
                    </p>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center gap-5">
                    {/* QR Code */}
                    <div ref={qrRef} className="relative p-5 bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
                      <svg
                        viewBox={`0 0 ${qrMatrix.length || 25} ${qrMatrix.length || 25}`}
                        className="w-52 h-52"
                        shapeRendering="crispEdges"
                      >
                        {qrMatrix.map((row, y) =>
                          row.map((cell, x) =>
                            cell ? (
                              <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#0f172a" />
                            ) : null
                          )
                        )}
                      </svg>
                      {/* Center logo */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-10 w-10 rounded-lg bg-white border-2 border-slate-200 flex items-center justify-center shadow-sm">
                          <span className="text-[10px] font-black text-slate-900 tracking-tighter">N</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 font-mono max-w-xs text-center truncate">{flowUrl}</p>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => {
                        // Download QR as SVG
                        const svgEl = qrRef.current?.querySelector("svg");
                        if (svgEl) {
                          const svgData = new XMLSerializer().serializeToString(svgEl);
                          const blob = new Blob([svgData], { type: "image/svg+xml" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url; a.download = `nobis-qr-${selectedFlow?.name || "flow"}.svg`; a.click();
                          URL.revokeObjectURL(url);
                        }
                      }}>
                        <Download className="h-3.5 w-3.5" />
                        Download SVG
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => copyToClipboard(flowUrl, "link")}>
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? "Copied" : "Copy URL"}
                      </Button>
                    </div>

                    <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 max-w-sm w-full">
                      <p className="text-[10px] text-slate-500 text-center">
                        For production use, integrate a QR library (e.g. <span className="font-mono text-slate-700">qrcode.react</span>) for standards-compliant codes.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Embed Method ──────────────────────────────────── */}
              {activeMethod === "embed" && (
                <div className="flex-1 flex flex-col">
                  <div className="mb-5">
                    <h3 className="text-base font-semibold text-slate-900">HTML Embed</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Add the verification flow directly to your website or app.
                    </p>
                  </div>

                  <div className="space-y-4 flex-1">
                    {/* Widget snippet */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs font-semibold text-slate-500">JavaScript Widget</Label>
                        <span className="text-[9px] uppercase tracking-wider text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">Recommended</span>
                      </div>
                      <div className="relative rounded-lg border border-slate-200 overflow-hidden">
                        <pre className="p-4 text-xs font-mono text-slate-700 bg-slate-50 overflow-x-auto leading-relaxed whitespace-pre-wrap break-all max-h-40">
                          {embedCode}
                        </pre>
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={() => copyToClipboard(embedCode, "embed")}
                            className={cn(
                              "px-2.5 py-1.5 rounded-md text-[10px] font-semibold flex items-center gap-1 transition-colors",
                              copiedEmbed ? "bg-emerald-100 text-emerald-700" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                            )}
                          >
                            {copiedEmbed ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            {copiedEmbed ? "Copied" : "Copy"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* iFrame alternative */}
                    <div>
                      <Label className="text-xs font-semibold text-slate-500 mb-2 block">iFrame Alternative</Label>
                      <div className="relative rounded-lg border border-slate-200 overflow-hidden">
                        <pre className="p-4 text-xs font-mono text-slate-700 bg-slate-50 overflow-x-auto leading-relaxed whitespace-pre-wrap break-all max-h-28">
                          {iframeCode}
                        </pre>
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={() => copyToClipboard(iframeCode, "embed")}
                            className="px-2.5 py-1.5 rounded-md text-[10px] font-semibold flex items-center gap-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                          >
                            <Copy className="h-3 w-3" />
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Send Method ───────────────────────────────────── */}
              {activeMethod === "send" && (
                <div className="flex-1 flex flex-col">
                  <div className="mb-5">
                    <h3 className="text-base font-semibold text-slate-900">Send Directly</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Send the verification link directly to an applicant via email or SMS.
                    </p>
                  </div>

                  <div className="space-y-4 flex-1">
                    {/* Toggle email / sms */}
                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
                      <button
                        onClick={() => setSendMethod("email")}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
                          sendMethod === "email" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        <Mail className="h-3.5 w-3.5" />
                        Email
                      </button>
                      <button
                        onClick={() => setSendMethod("sms")}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
                          sendMethod === "sms" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        SMS
                      </button>
                    </div>

                    {/* Recipient */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-slate-700">
                        {sendMethod === "email" ? "Email address" : "Phone number"} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type={sendMethod === "email" ? "email" : "tel"}
                        placeholder={sendMethod === "email" ? "applicant@example.com" : "+1 (868) 555-0123"}
                        value={sendTo}
                        onChange={(e) => { setSendTo(e.target.value); setSent(false); }}
                        className="h-11 bg-white border-slate-200 placeholder:text-slate-300"
                      />
                    </div>

                    {/* Custom message */}
                    {sendMethod === "email" && (
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-slate-700">Custom message <span className="text-xs text-slate-400 font-normal">(optional)</span></Label>
                        <Textarea
                          placeholder="Add a personal note to the verification email..."
                          value={sendMessage}
                          onChange={(e) => setSendMessage(e.target.value)}
                          rows={3}
                          className="bg-white border-slate-200 placeholder:text-slate-300 resize-none"
                        />
                      </div>
                    )}

                    {/* Preview */}
                    <div className="rounded-lg bg-slate-50 border border-slate-100 p-4">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Preview</p>
                      <div className="space-y-1 text-xs text-slate-600">
                        <p>
                          {sendMethod === "email" ? "Subject: " : ""}
                          <span className="font-medium text-slate-900">Complete your identity verification</span>
                        </p>
                        {sendMessage && <p className="text-slate-500 italic">"{sendMessage}"</p>}
                        <p className="font-mono text-blue-600 text-[10px] mt-1 truncate">{flowUrl}</p>
                      </div>
                    </div>

                    {/* Send button */}
                    <Button
                      onClick={handleSend}
                      disabled={!sendTo.trim() || sending}
                      className={cn(
                        "gap-2 w-full h-11 font-semibold",
                        sent
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : "bg-slate-900 hover:bg-slate-800"
                      )}
                    >
                      {sending ? (
                        <><Loader2 className="h-4 w-4 animate-spin" />Sending...</>
                      ) : sent ? (
                        <><Check className="h-4 w-4" />Sent successfully</>
                      ) : (
                        <><Send className="h-4 w-4" />Send {sendMethod === "email" ? "email" : "SMS"}</>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-8 py-4 border-t bg-slate-50/60 flex items-center justify-between">
          <p className="text-[10px] text-slate-400">
            {selectedFlow && (
              <>Flow ID: <span className="font-mono">{selectedFlowId}</span></>
            )}
          </p>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-500 hover:text-slate-700">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
