import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  ChevronDown,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Phone,
  Mail,
  IdCard,
  ScanFace,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Copy,
  ExternalLink,
  Clock,
  Check,
  Eye,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApplicantNotes } from "@/components/admin/ApplicantNotes";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { api } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────
type StepState = "passed" | "pending" | "failed" | "na";
type ApplicantStatus = "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_REVIEW";

const stepLabels: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  phone: { label: "Phone Check", icon: Phone },
  email: { label: "Email Check", icon: Mail },
  idDocument: { label: "ID Verification", icon: IdCard },
  selfie: { label: "Face Verification", icon: ScanFace },
  proofOfAddress: { label: "Proof of Address", icon: MapPin },
};

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-slate-100 text-slate-700 border-slate-200" },
  APPROVED: { label: "Approved", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  REJECTED: { label: "Rejected", className: "bg-red-50 text-red-700 border-red-200" },
  NEEDS_REVIEW: { label: "Needs Review", className: "bg-amber-50 text-amber-700 border-amber-200" },
  pending: { label: "Pending", className: "bg-slate-100 text-slate-700 border-slate-200" },
  verified: { label: "Approved", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Rejected", className: "bg-red-50 text-red-700 border-red-200" },
  needsReview: { label: "Needs Review", className: "bg-amber-50 text-amber-700 border-amber-200" },
};

const stepStateConfig: Record<StepState, { label: string; className: string }> = {
  passed: { label: "Verified", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200" },
  failed: { label: "Failed", className: "bg-red-50 text-red-700 border-red-200" },
  na: { label: "N/A", className: "bg-slate-50 text-slate-500 border-slate-200" },
};

// Map backend status to display state
function mapStepState(status: string): StepState {
  switch (status?.toLowerCase()) {
    case "verified": case "approved": case "passed": case "completed": return "passed";
    case "failed": case "rejected": return "failed";
    case "pending": case "in_progress": return "pending";
    default: return "na";
  }
}

// Map overall applicant status
function mapOverallStatus(applicant: any): string {
  const statuses = applicant.requiredVerifications?.map((v: any) => v.status) || [];
  if (statuses.every((s: string) => s === "verified")) return "APPROVED";
  if (statuses.some((s: string) => s === "rejected" || s === "failed")) return "REJECTED";
  if (statuses.some((s: string) => s === "verified") && statuses.some((s: string) => s === "pending")) return "NEEDS_REVIEW";
  return "PENDING";
}

// Copy helper
const copyToClipboard = (text: string, label: string) => {
  navigator.clipboard.writeText(text);
  toast.success(`${label} copied to clipboard`);
};

// Safe string — prevents React error #31 (objects as children)
function safeStr(val: any): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (Array.isArray(val)) return val.map(safeStr).join(", ");
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

// Check if a value is a primitive (safe to render)
function isPrimitive(val: any): boolean {
  return val === null || val === undefined || typeof val === "string" || typeof val === "number" || typeof val === "boolean";
}

// ── Component ──────────────────────────────────────────────────────────
export default function ApplicantDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [applicant, setApplicant] = useState<any>(null);
  const [verificationResults, setVerificationResults] = useState<any[]>([]);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [expandAll, setExpandAll] = useState(false);
  const [activeTab, setActiveTab] = useState("idv");
  const [poaBillModalOpen, setPoaBillModalOpen] = useState(false);
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    if (!id) return;
    loadApplicant();
  }, [id]);

  const loadApplicant = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/applicants/withAllDetails/${id}`);
      const data = res.data;
      setApplicant(data.applicant);
      setVerificationResults(data.verificationResults || []);
    } catch (err) {
      console.error("Failed to load applicant:", err);
      toast.error("Failed to load applicant details");
    } finally {
      setLoading(false);
    }
  };

  // Get verification result by type
  const getResult = useCallback((type: string) => {
    return verificationResults.find((r: any) => r.verificationType === type) || null;
  }, [verificationResults]);

  const idvResult = getResult("idDocument");
  const faceResult = getResult("selfie");
  const phoneResult = getResult("phone");
  const emailResult = getResult("email");
  const poaResult = getResult("proofOfAddress");
  const riskResult = getResult("riskEvaluation");
  const amlResult = getResult("sanctionsCheck");

  // Derived data
  const fullName = applicant?.name || "Unknown";
  const initials = fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const applicantId = safeStr(applicant?.applicantIdRemote || applicant?._id || id);
  const overallStatus = applicant ? mapOverallStatus(applicant) : "PENDING";
  const status = statusConfig[overallStatus] || statusConfig.PENDING;
  const flowName = safeStr(applicant?.flowId?.name || (typeof applicant?.flowId === "string" ? applicant.flowId : null) || "—");
  const submittedAt = applicant?.createdAt ? new Date(applicant.createdAt).toLocaleString("en-GB", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  // Selfie URL from face result or ID result images
  const selfieUrl = faceResult?.imagesUrls?.[0] || idvResult?.imagesUrls?.find((u: string) => u.includes("selfie")) || null;

  // Location data from ID verification raw response
  const ipAddress = idvResult?.rawResponse?.ipAddress || applicant?.ip || null;
  const locationData = idvResult?.processedData?.location || idvResult?.rawResponse?.location || {};
  const country = safeStr(locationData?.country || idvResult?.rawResponse?.country || "—");
  const region = safeStr(locationData?.region || locationData?.state || "—");
  const city = safeStr(locationData?.city || "—");
  const lat = locationData?.latitude || locationData?.lat;
  const lng = locationData?.longitude || locationData?.lng || locationData?.lon;
  const coordinates = lat && lng ? `${lat}, ${lng}` : null;

  // Steps
  const requiredSteps = applicant?.requiredVerifications || [];

  // IDV data
  const idvProcessed = idvResult?.processedData || {};
  const idvRaw = idvResult?.rawResponse || {};
  const idvDetailedChecks = idvProcessed.detailedChecks || idvProcessed.checks || idvRaw.detailedChecks || {};
  const idvExtracted = idvProcessed.extracted || idvProcessed.personalData || idvRaw.extracted || {};
  const idvDocInfo = idvProcessed.documentInfo || idvRaw.documentInfo || {};
  const idvImages = (idvResult?.imagesUrls || []).map((url: string, idx: number) => ({
    url,
    label: idx === 0 ? "ID Doc Front" : idx === 1 ? "ID Doc Back" : `Image ${idx + 1}`,
  }));

  // Face data
  const faceProcessed = faceResult?.processedData || {};
  const faceScore = faceProcessed.matchScore || faceProcessed.score || faceProcessed.confidence || null;
  const faceLivenessScore = faceProcessed.livenessScore || faceProcessed.liveness?.score || null;
  const faceLivenessResult = faceProcessed.livenessResult || faceProcessed.liveness?.result || null;
  const faceMatchResult = faceProcessed.result || faceProcessed.matchResult || null;
  const selfieImage = faceResult?.imagesUrls?.[0] || null;
  const idPortraitImage = faceResult?.imagesUrls?.[1] || idvResult?.imagesUrls?.[2] || null;

  // PoA data
  const poaProcessed = poaResult?.processedData || {};
  const poaRaw = poaResult?.rawResponse || {};
  const poaImages = poaResult?.imagesUrls || [];

  // Risk data
  const riskProcessed = riskResult?.processedData || {};
  const riskRaw = riskResult?.rawResponse || {};
  const riskScore = riskProcessed.score ?? riskProcessed.riskScore ?? riskRaw.totalPoints ?? null;
  const riskLevel = riskProcessed.level || riskProcessed.riskLevel || riskRaw.classification || null;
  const riskAction = riskProcessed.recommendedAction || riskProcessed.recommendation || riskRaw.recommendation || null;
  const riskFactors = riskProcessed.factors || riskProcessed.breakdown || [];
  const riskFlags = riskProcessed.flags || riskRaw.flags || [];

  // AML data
  const amlProcessed = amlResult?.processedData || {};
  const amlRaw = amlResult?.rawResponse || {};
  const amlMatches = amlProcessed.matches || amlRaw.matches || [];
  const amlMatchStatus = amlProcessed.matchStatus || amlRaw.matchStatus || "NO_MATCH";
  const amlStatus = amlProcessed.status || amlRaw.status || "CLEAR";
  const amlWarningTypes = amlProcessed.warningTypes || amlRaw.warningTypes || [];
  const amlSources = amlProcessed.sources || amlRaw.sources || [];

  // Status change handler
  const handleStatusChange = useCallback(async (newStatus: string) => {
    try {
      // Update each verification step to match overall status
      const targetVerifStatus = newStatus === "APPROVED" ? "verified" : newStatus === "REJECTED" ? "rejected" : "pending";
      for (const step of requiredSteps) {
        await api.patch(`/applicants/${id}/verification-status`, {
          verificationType: step.verificationType,
          status: targetVerifStatus,
        });
      }
      toast.success(`Applicant ${statusConfig[newStatus]?.label || newStatus}`);
      loadApplicant();
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Failed to update applicant status");
    }
  }, [id, requiredSteps]);

  const handleReject = () => {
    handleStatusChange("REJECTED");
    setRejectModalOpen(false);
    setRejectReason("");
  };

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!applicant) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <p className="text-muted-foreground">Applicant not found</p>
        <Button variant="outline" onClick={() => navigate("/admin/applicants")}>Back to Users</Button>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-muted/30 p-6 space-y-4 max-w-[1400px] mx-auto">
      {/* Top Header Card */}
      <Card className="shadow-lg border-border/60">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4 flex-nowrap min-w-0">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Button variant="ghost" size="icon" onClick={() => navigate("/admin/applicants")} className="h-10 w-10 rounded-xl flex-shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-4 min-w-0">
                <Avatar className="h-14 w-14 border-2 border-primary/20 shadow-md flex-shrink-0">
                  <AvatarImage src={selfieUrl || undefined} alt={fullName} />
                  <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <div className="space-y-1 min-w-0">
                  <h1 className="text-lg font-bold text-foreground truncate">{fullName}</h1>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                    <span className="flex items-center gap-1 flex-shrink-0">
                      Applicant ID:
                      <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px]">{applicantId}</code>
                      <button onClick={() => copyToClipboard(String(applicantId), "Applicant ID")} className="hover:text-foreground transition-colors">
                        <Copy className="h-3 w-3" />
                      </button>
                    </span>
                    <span className="text-muted-foreground/50 hidden sm:inline">•</span>
                    <span className="hidden sm:inline">Flow: {typeof flowName === "string" ? flowName : "—"}</span>
                    <span className="text-muted-foreground/50 hidden md:inline">•</span>
                    <span className="hidden md:inline">Submitted: {submittedAt}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center min-w-[140px] px-4 flex-shrink-0">
              <Badge variant="outline" className={`rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap ${status.className}`}>
                {status.label}
              </Badge>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="outline" className="h-10 gap-2 rounded-xl whitespace-nowrap">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export as PDF</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" className="h-10 gap-2 rounded-xl whitespace-nowrap">
                    Actions <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleStatusChange("APPROVED")} className="gap-2 cursor-pointer">
                    <CheckCircle className="h-4 w-4 text-emerald-600" /> Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange("NEEDS_REVIEW")} className="gap-2 cursor-pointer">
                    <AlertTriangle className="h-4 w-4 text-amber-600" /> Needs Review
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setRejectModalOpen(true)} className="gap-2 cursor-pointer text-destructive">
                    <XCircle className="h-4 w-4" /> Reject
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <ApplicantNotes applicantId={String(applicantId)} />

      {/* Snapshot Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Basic Information */}
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-xs text-muted-foreground">Name:</span>
              <span className="text-sm font-medium text-foreground">{fullName}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-xs text-muted-foreground">Email:</span>
              <div className="flex items-center gap-1">
                {applicant.email ? (
                  <>
                    <span className="text-sm font-medium text-foreground">{applicant.email}</span>
                    <button onClick={() => copyToClipboard(applicant.email, "Email")} className="text-muted-foreground hover:text-foreground"><Copy className="h-3 w-3" /></button>
                  </>
                ) : <span className="text-sm text-muted-foreground italic">Not collected</span>}
              </div>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-xs text-muted-foreground">Phone:</span>
              <div className="flex items-center gap-1">
                {applicant.phone ? (
                  <>
                    <span className="text-sm font-medium text-foreground">{applicant.phone}</span>
                    <button onClick={() => copyToClipboard(applicant.phone, "Phone")} className="text-muted-foreground hover:text-foreground"><Copy className="h-3 w-3" /></button>
                  </>
                ) : <span className="text-sm text-muted-foreground italic">Not collected</span>}
              </div>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-xs text-muted-foreground">Applicant ID:</span>
              <div className="flex items-center gap-1">
                <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{applicantId}</code>
                <button onClick={() => copyToClipboard(String(applicantId), "Applicant ID")} className="text-muted-foreground hover:text-foreground"><Copy className="h-3 w-3" /></button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Intelligence */}
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">Location Intelligence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-xs text-muted-foreground">IP Address:</span>
              <div className="flex items-center gap-1">
                <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{ipAddress || "—"}</code>
                {ipAddress && <button onClick={() => copyToClipboard(ipAddress, "IP Address")} className="text-muted-foreground hover:text-foreground"><Copy className="h-3 w-3" /></button>}
              </div>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-xs text-muted-foreground">Country:</span>
              <span className="text-sm font-medium text-foreground">{country}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-xs text-muted-foreground">State/Region:</span>
              <span className="text-sm font-medium text-foreground">{region}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-xs text-muted-foreground">City:</span>
              <span className="text-sm font-medium text-foreground">{city}</span>
            </div>
            {coordinates && (
              <div className="flex justify-between items-start">
                <span className="text-xs text-muted-foreground">Coordinates:</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-foreground">{coordinates}</span>
                  <button onClick={() => copyToClipboard(coordinates, "Coordinates")} className="text-muted-foreground hover:text-foreground"><Copy className="h-3 w-3" /></button>
                </div>
              </div>
            )}
            {lat && lng && (
              <div className="mt-3 rounded-xl overflow-hidden border border-border/60 shadow-sm">
                <img
                  src={`https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=13&size=400x180&markers=color:red%7C${lat},${lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_KEY || ""}`}
                  alt="Location map"
                  className="w-full h-[160px] object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Verification Progress */}
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground">Verification Progress</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setExpandAll(!expandAll)} className="h-7 text-xs">
                {expandAll ? "Collapse" : "Expand"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {requiredSteps.map((step: any) => {
              const meta = stepLabels[step.verificationType] || { label: step.verificationType, icon: CheckCircle };
              const state = mapStepState(step.status);
              const stateStyle = stepStateConfig[state];
              const IconComponent = meta.icon;

              return (
                <div key={step.verificationType} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                      state === "passed" ? "bg-emerald-100 text-emerald-600" :
                      state === "pending" ? "bg-amber-100 text-amber-600" :
                      state === "failed" ? "bg-red-100 text-red-600" :
                      "bg-slate-100 text-slate-400"
                    }`}>
                      <IconComponent className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{meta.label}</span>
                  </div>
                  <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${stateStyle.className}`}>
                    {stateStyle.label}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Verification Results */}
      <Card className="shadow-lg border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-foreground">Detailed Verification Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start bg-muted/50 p-1 rounded-xl mb-6 flex-wrap">
              <TabsTrigger value="idv" className="gap-2 data-[state=active]:bg-background rounded-lg">
                <IdCard className="h-4 w-4" /> ID Verification
              </TabsTrigger>
              <TabsTrigger value="face" className="gap-2 data-[state=active]:bg-background rounded-lg">
                <ScanFace className="h-4 w-4" /> Face Verification
              </TabsTrigger>
              {poaResult && (
                <TabsTrigger value="poa" className="gap-2 data-[state=active]:bg-background rounded-lg">
                  <MapPin className="h-4 w-4" /> Proof of Address
                </TabsTrigger>
              )}
              {riskResult && (
                <TabsTrigger value="risk" className={`gap-2 rounded-lg ${
                  riskLevel === "MEDIUM" || riskLevel === "HIGH" ? "bg-amber-100/60 text-amber-800 border border-amber-300/50 font-semibold data-[state=active]:bg-amber-100" : "data-[state=active]:bg-background"
                }`}>
                  <ShieldAlert className="h-4 w-4" /> Risk Assessment
                </TabsTrigger>
              )}
              {amlResult && (
                <TabsTrigger value="aml" className={`gap-2 rounded-lg ${
                  amlMatchStatus !== "NO_MATCH" ? "bg-red-100/60 text-red-800 border border-red-300/50 font-semibold data-[state=active]:bg-red-100" : "data-[state=active]:bg-background"
                }`}>
                  <ShieldCheck className="h-4 w-4" /> AML / Sanctions
                </TabsTrigger>
              )}
            </TabsList>

            {/* ── ID Verification ── */}
            <TabsContent value="idv" className="space-y-4 mt-0">
              {idvResult ? (
                <Accordion type="multiple" defaultValue={["summary"]} className="space-y-3">
                  <AccordionItem value="summary" className="border rounded-xl px-4">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4">
                      <div className="flex items-center justify-between w-full pr-4">
                        <span>ID Verification Results</span>
                        <span className="text-xs text-muted-foreground font-normal">{idvResult.createdAt ? new Date(idvResult.createdAt).toLocaleString("en-GB") : ""}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 space-y-4">
                      <div className="p-4 bg-muted/30 rounded-xl space-y-3">
                        <h4 className="text-sm font-semibold">ID Verification Status</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Verification Result:</span>
                          <Badge className={`rounded-full ${
                            idvProcessed.result === "Approved" || idvProcessed.result === "passed" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                          }`}>
                            {idvProcessed.result || idvProcessed.status || "—"}
                          </Badge>
                        </div>
                      </div>

                      {Object.keys(idvDetailedChecks).length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-3">Detailed Checks:</h4>
                          <div className="grid grid-cols-2 gap-3">
                            {Object.entries(idvDetailedChecks).map(([key, value]) => (
                              <div key={key} className="flex items-center justify-between py-1.5 px-3 bg-muted/20 rounded-lg">
                                <span className="text-sm text-muted-foreground">{key}:</span>
                                <Badge variant="outline" className={`text-[10px] px-2 ${
                                  value === "OK" || value === "PASS" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                  value === "FAIL" ? "bg-red-50 text-red-700 border-red-200" :
                                  "bg-amber-50 text-amber-700 border-amber-200"
                                }`}>
                                  {safeStr(value)}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {Object.keys(idvExtracted).length > 0 && (
                    <AccordionItem value="extracted" className="border rounded-xl px-4">
                      <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4">Extracted Personal Information</AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Object.entries(idvExtracted).filter(([, v]) => isPrimitive(v)).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between py-2.5 px-3 bg-muted/30 rounded-xl border border-border/40">
                              <span className="text-xs font-medium text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                              <span className="text-sm font-semibold text-foreground">{safeStr(value)}</span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {Object.keys(idvDocInfo).length > 0 && (
                    <AccordionItem value="docinfo" className="border rounded-xl px-4">
                      <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4">ID Document Information</AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(idvDocInfo).filter(([, v]) => isPrimitive(v)).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center py-1">
                              <span className="text-sm text-muted-foreground">{key}:</span>
                              <span className={`text-sm font-medium ${value === "Valid" || value === "Yes" ? "text-emerald-600" : ""}`}>
                                {safeStr(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {idvImages.length > 0 && (
                    <AccordionItem value="images" className="border rounded-xl px-4">
                      <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4">
                        <div className="flex items-center gap-2">
                          <span>ID Verification Images</span>
                          <Badge variant="secondary" className="text-[10px]">{idvImages.length}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {idvImages.map((img: any, idx: number) => (
                            <div key={idx} className="space-y-2 cursor-pointer" onClick={() => setImageModalUrl(img.url)}>
                              <div className="aspect-[4/3] rounded-xl overflow-hidden border border-border bg-muted">
                                <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                              </div>
                              <p className="text-xs text-center text-muted-foreground font-medium">{img.label}</p>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  <AccordionItem value="raw" className="border rounded-xl px-4">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4">View Raw Response</AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto text-xs font-mono max-h-96">
                        {JSON.stringify(idvRaw, null, 2)}
                      </pre>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ) : (
                <Card className="border-border/40"><CardContent className="p-16 flex flex-col items-center justify-center text-center">
                  <IdCard className="h-12 w-12 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-1">No ID Verification</h3>
                  <p className="text-sm text-muted-foreground">ID verification data not yet available.</p>
                </CardContent></Card>
              )}
            </TabsContent>

            {/* ── Face Verification ── */}
            <TabsContent value="face" className="space-y-4 mt-0">
              {faceResult ? (
                <Accordion type="single" defaultValue="facematch" collapsible className="space-y-3">
                  <AccordionItem value="facematch" className="border rounded-xl px-4">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4">Face Match</AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {selfieImage && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-primary text-primary-foreground">Selfie</Badge>
                              {faceLivenessResult && <Badge className={faceLivenessResult === "Pass" || faceLivenessResult === "passed" ? "bg-emerald-100 text-emerald-700 border border-emerald-300" : "bg-red-100 text-red-700 border border-red-300"}>{faceLivenessResult}</Badge>}
                            </div>
                            <div className="aspect-square rounded-xl overflow-hidden border border-border bg-muted cursor-pointer" onClick={() => setImageModalUrl(selfieImage)}>
                              <img src={selfieImage} alt="Selfie" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        )}
                        {idPortraitImage && (
                          <div className="space-y-2">
                            <Badge className="bg-emerald-600 text-white">ID Portrait</Badge>
                            <div className="aspect-square rounded-xl overflow-hidden border border-border bg-muted cursor-pointer" onClick={() => setImageModalUrl(idPortraitImage)}>
                              <img src={idPortraitImage} alt="ID Photo" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        )}
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <span className="text-sm text-muted-foreground">Check date:</span>
                            <p className="text-sm font-medium">{faceResult.createdAt ? new Date(faceResult.createdAt).toLocaleString("en-GB") : "—"}</p>
                          </div>
                          {faceLivenessScore !== null && (
                            <div className="space-y-2">
                              <span className="text-sm text-muted-foreground">Liveness score:</span>
                              <p className={`text-2xl font-bold ${Number(faceLivenessScore) >= 80 ? "text-emerald-600" : "text-amber-600"}`}>{faceLivenessScore}%</p>
                            </div>
                          )}
                          <div className="border-t border-border/50 my-2" />
                          {faceMatchResult && (
                            <div className="space-y-2">
                              <span className="text-sm text-muted-foreground">Match result:</span>
                              <div className="flex items-center gap-2">
                                {faceMatchResult === "Match" || faceMatchResult === "passed" ? <CheckCircle className="h-5 w-5 text-emerald-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
                                <span className="font-semibold">{faceMatchResult}</span>
                              </div>
                            </div>
                          )}
                          {faceScore !== null && (
                            <div className="space-y-2">
                              <span className="text-sm text-muted-foreground">Match confidence:</span>
                              <p className="text-2xl font-bold text-emerald-600">{faceScore}%</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="raw" className="border rounded-xl px-4">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4">View Raw Response</AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto text-xs font-mono max-h-96">{JSON.stringify(faceResult.rawResponse, null, 2)}</pre>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ) : (
                <Card className="border-border/40"><CardContent className="p-16 flex flex-col items-center justify-center text-center">
                  <ScanFace className="h-12 w-12 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-1">No Face Verification</h3>
                  <p className="text-sm text-muted-foreground">Face verification data not yet available.</p>
                </CardContent></Card>
              )}
            </TabsContent>

            {/* ── Proof of Address ── */}
            <TabsContent value="poa" className="space-y-4 mt-0">
              {poaResult ? (
                <div className="space-y-4">
                  <Card className="border-border/40">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-base font-semibold text-foreground">Proof of Address Results</h3>
                          <p className="text-sm text-muted-foreground">Processed: {poaResult.createdAt ? new Date(poaResult.createdAt).toLocaleString("en-GB") : "—"}</p>
                        </div>
                        <Badge variant="outline" className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          poaProcessed.status === "VERIFIED" || poaProcessed.status === "verified" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {poaProcessed.status || "Pending"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(poaProcessed).filter(([k, v]) => k !== "raw" && isPrimitive(v)).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between py-2.5 px-3 bg-muted/30 rounded-xl border border-border/40">
                            <span className="text-xs font-medium text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                            <span className="text-sm font-semibold text-foreground">{safeStr(value)}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {poaImages.length > 0 && (
                    <Card className="border-border/40">
                      <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-foreground">Uploaded Document</CardTitle></CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/40">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><FileText className="h-5 w-5 text-primary" /></div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">PoA Document</p>
                              <p className="text-xs text-muted-foreground">{poaImages.length} file(s)</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="default" size="sm" className="h-9 gap-2 rounded-xl" onClick={() => setPoaBillModalOpen(true)}>
                              <Eye className="h-4 w-4" /> View
                            </Button>
                            <Button variant="outline" size="sm" className="h-9 gap-2 rounded-xl" onClick={() => window.open(poaImages[0], "_blank")}>
                              <Download className="h-4 w-4" /> Download
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Accordion type="single" collapsible className="space-y-3">
                    <AccordionItem value="raw" className="border rounded-xl px-4">
                      <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4">View Raw Response</AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto text-xs font-mono max-h-96">{JSON.stringify(poaRaw, null, 2)}</pre>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              ) : (
                <Card className="border-border/40"><CardContent className="p-16 flex flex-col items-center justify-center text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-1">No Proof of Address</h3>
                  <p className="text-sm text-muted-foreground">PoA verification not required or not yet submitted.</p>
                </CardContent></Card>
              )}
            </TabsContent>

            {/* ── Risk Assessment ── */}
            <TabsContent value="risk" className="space-y-4 mt-0">
              {riskResult ? (
                <div className="space-y-4">
                  <Card className="border-border/40">
                    <CardContent className="p-5">
                      <h4 className="text-sm font-semibold text-foreground mb-4">Risk Assessment Overview</h4>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="p-4 bg-muted/30 rounded-xl border border-border/40 flex flex-col items-center justify-center">
                          <p className="text-sm font-semibold text-foreground mb-3">Risk Score</p>
                          <div className="relative w-32 h-32">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                              <circle cx="50" cy="50" r="40" fill="none" stroke={riskScore < 35 ? "#10b981" : riskScore < 65 ? "#f59e0b" : "#ef4444"} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${((riskScore || 0) / 100) * 251.2} 251.2`} />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-2xl font-bold text-foreground">{riskScore ?? "—"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-xl border border-border/40 flex flex-col items-center justify-center text-center">
                          <p className="text-xs text-muted-foreground mb-2">Risk Level</p>
                          <Badge className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                            riskLevel === "LOW" ? "bg-emerald-100 text-emerald-700" : riskLevel === "MEDIUM" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                          }`}>{riskLevel || "—"}</Badge>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-xl border border-border/40 flex flex-col items-center justify-center text-center">
                          <p className="text-xs text-muted-foreground mb-2">Recommended Action</p>
                          <Badge className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                            riskAction === "APPROVE" ? "bg-emerald-100 text-emerald-700" : riskAction === "REVIEW" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                          }`}>{riskAction || "—"}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {riskFlags.length > 0 && (
                    <Card className="border-border/40">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                          <h4 className="text-sm font-semibold text-foreground">Detected Risk Flags ({riskFlags.length})</h4>
                        </div>
                        <div className="space-y-2">
                          {riskFlags.map((flag: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-3">
                              <span className="h-2 w-2 rounded-full bg-amber-500 flex-shrink-0" />
                              <p className="text-xs text-muted-foreground">{flag}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Accordion type="single" collapsible><AccordionItem value="raw" className="border rounded-xl px-4">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4">View Raw Response</AccordionTrigger>
                    <AccordionContent className="pb-4"><pre className="p-4 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto text-xs font-mono max-h-96">{JSON.stringify(riskRaw, null, 2)}</pre></AccordionContent>
                  </AccordionItem></Accordion>
                </div>
              ) : (
                <Card className="border-border/40"><CardContent className="p-16 flex flex-col items-center justify-center text-center">
                  <ShieldAlert className="h-12 w-12 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-1">No Risk Assessment</h3>
                  <p className="text-sm text-muted-foreground">Risk assessment not performed for this applicant.</p>
                </CardContent></Card>
              )}
            </TabsContent>

            {/* ── AML / Sanctions ── */}
            <TabsContent value="aml" className="space-y-4 mt-0">
              {amlResult ? (
                <div className="space-y-4">
                  <Card className="border-border/40 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-base font-semibold text-foreground">AML Screening</h3>
                          <p className="text-sm text-muted-foreground">Processed: {amlResult.createdAt ? new Date(amlResult.createdAt).toLocaleString("en-GB") : "—"}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="p-3 bg-muted/30 rounded-xl border border-border/40">
                          <p className="text-xs text-muted-foreground mb-1">Search Term</p>
                          <p className="text-sm font-semibold text-foreground">{amlProcessed.searchName || fullName}</p>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-xl border border-border/40">
                          <p className="text-xs text-muted-foreground mb-1">Provider</p>
                          <p className="text-sm font-semibold text-foreground">{amlProcessed.provider || "—"}</p>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-xl border border-border/40">
                          <p className="text-xs text-muted-foreground mb-1">Match Status</p>
                          <Badge className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            amlMatchStatus === "NO_MATCH" ? "bg-emerald-100 text-emerald-700" :
                            amlMatchStatus === "FALSE_POSITIVE" ? "bg-slate-100 text-slate-600" :
                            "bg-red-100 text-red-700"
                          }`}>{amlMatchStatus.replace(/_/g, " ")}</Badge>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-xl border border-border/40">
                          <p className="text-xs text-muted-foreground mb-1">Status</p>
                          <Badge className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            amlStatus === "CLEAR" ? "bg-emerald-100 text-emerald-700" : amlStatus === "REVIEWED" ? "bg-primary/10 text-primary" : "bg-red-100 text-red-700"
                          }`}>{amlStatus}</Badge>
                        </div>
                      </div>

                      {amlWarningTypes.length > 0 && (
                        <div className="flex items-center gap-2 mt-4 flex-wrap">
                          <span className="text-xs text-muted-foreground">Warning types:</span>
                          {amlWarningTypes.map((type: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-50 text-red-700 border-red-200">{type}</Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {amlMatches.length > 0 && (
                    <Card className="border-border/40">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-semibold text-foreground">Matches</CardTitle>
                          <Badge variant="secondary" className="text-xs">{amlMatches.length}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {amlMatches.map((match: any, idx: number) => (
                          <div key={idx} className="p-4 bg-muted/30 rounded-xl border border-border/40 space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-foreground">{match.name || "Unknown"}</p>
                                {match.matchId && <p className="text-xs text-muted-foreground">Match ID: {match.matchId}</p>}
                              </div>
                              <Badge className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                match.matchStatus === "FALSE_POSITIVE" ? "bg-slate-100 text-slate-600" : "bg-red-100 text-red-700"
                              }`}>{match.matchStatus || "—"}</Badge>
                            </div>
                            {match.categories?.length > 0 && (
                              <div className="flex items-center gap-2 flex-wrap">
                                {match.categories.map((cat: string, catIdx: number) => (
                                  <Badge key={catIdx} variant="outline" className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-purple-50 text-purple-700 border-purple-200">{cat}</Badge>
                                ))}
                              </div>
                            )}
                            {match.source && (
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Source: {match.source}</span>
                                {match.sourceUrl && <a href={match.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline"><ExternalLink className="h-3 w-3" />View Source</a>}
                              </div>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  <Accordion type="single" collapsible><AccordionItem value="raw" className="border rounded-xl px-4">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4">View Raw Response</AccordionTrigger>
                    <AccordionContent className="pb-4"><pre className="p-4 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto text-xs font-mono max-h-96">{JSON.stringify(amlRaw, null, 2)}</pre></AccordionContent>
                  </AccordionItem></Accordion>
                </div>
              ) : (
                <Card className="border-border/40"><CardContent className="p-16 flex flex-col items-center justify-center text-center">
                  <ShieldCheck className="h-12 w-12 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-1">No AML Screening</h3>
                  <p className="text-sm text-muted-foreground">AML screening not performed for this applicant.</p>
                </CardContent></Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Image Modal */}
      <Dialog open={!!imageModalUrl} onOpenChange={() => setImageModalUrl(null)}>
        <DialogContent className="max-w-3xl p-2">
          {imageModalUrl && <img src={imageModalUrl} alt="Verification image" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>

      {/* PoA Bill Modal */}
      <Dialog open={poaBillModalOpen} onOpenChange={setPoaBillModalOpen}>
        <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-4 pb-3 border-b flex-shrink-0">
            <DialogTitle className="text-base font-semibold">View PoA Document</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-4">
            {poaImages[0] && <img src={poaImages[0]} alt="PoA Document" className="w-full rounded-xl" style={{ maxHeight: "72vh", objectFit: "contain" }} />}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject applicant</DialogTitle>
            <DialogDescription>Select a reason (optional) and confirm rejection.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Reason for rejection (optional)…" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="min-h-[100px]" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
            <Button onClick={handleReject} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Confirm rejection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
