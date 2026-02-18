import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, AlertTriangle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getRiskEvaluationForApplicant, updateRiskReviewStatus } from "@/services/riskEvaluation";
import { getApplicantDetails } from "@/services/applicant";

const riskLevelConfig: Record<string, { label: string; className: string; rangeText: string }> = {
  LOW: {
    label: "LOW",
    className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    rangeText: "0-34 points",
  },
  MEDIUM: {
    label: "MEDIUM",
    className: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    rangeText: "35-64 points",
  },
  HIGH: {
    label: "HIGH",
    className: "bg-red-500/10 text-red-700 border-red-500/20",
    rangeText: "65-100 points",
  },
};

const actionConfig: Record<string, { label: string; className: string }> = {
  APPROVE: {
    label: "APPROVE",
    className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  },
  REVIEW: {
    label: "REVIEW",
    className: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  },
  REJECT: {
    label: "REJECT",
    className: "bg-red-500/10 text-red-700 border-red-500/20",
  },
};

// Risk scoring breakdown labels based on what the risk API evaluates
const scoringBreakdown = {
  left: [
    { key: "email_domain", label: "Email Domain (Disposable)" },
    { key: "biometric_hash", label: "Biometric Hash Reuse" },
    { key: "ip_country_mismatch", label: "IP ≠ ID Country" },
    { key: "geolocation_risk", label: "Geolocation Risk" },
  ],
  right: [
    { key: "phone_reuse", label: "Phone Reuse" },
    { key: "ip_risk", label: "IP Risk (VPN/Proxy)" },
    { key: "phone_area_mismatch", label: "Phone Area Mismatch" },
  ],
};

export default function RiskFraudDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [riskData, setRiskData] = useState<any>(null);
  const [applicant, setApplicant] = useState<any>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [riskResult, applicantResult] = await Promise.allSettled([
          getRiskEvaluationForApplicant(id),
          getApplicantDetails(id),
        ]);

        if (riskResult.status === "fulfilled") {
          setRiskData(riskResult.value);
        } else {
          setError("Risk evaluation data not found for this applicant.");
          return;
        }

        if (applicantResult.status === "fulfilled") {
          setApplicant(applicantResult.value);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load risk data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleStatusUpdate = async (status: string) => {
    if (!riskData?._id) return;
    try {
      setUpdatingStatus(true);
      await updateRiskReviewStatus(riskData._id, status);
      setRiskData((prev: any) => ({
        ...prev,
        processedData: { ...prev?.processedData, reviewStatus: status },
      }));
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
        <p className="text-muted-foreground text-sm">Loading risk assessment...</p>
      </div>
    );
  }

  if (error || !riskData) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <XCircle className="h-12 w-12 text-red-400 mb-4" />
        <p className="text-red-600 font-medium mb-1">Unable to load risk data</p>
        <p className="text-muted-foreground text-sm mb-4">{error}</p>
        <Button variant="outline" onClick={() => navigate("/client/risk-fraud")} className="rounded-xl">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Queue
        </Button>
      </div>
    );
  }

  // Extract data from the stored verification result
  const raw = riskData.rawResponse || {};
  const riskScore = raw.score ?? 0;
  const riskLevel = (raw.risk || "low").toUpperCase();
  const recommendedAction = (raw.outcome || "review").toUpperCase();
  const flags: string[] = raw.flags || [];
  const requestPayload = raw.requestPayload || {};
  const assessedAt = riskData.createdAt || riskData.updatedAt || "";
  const reviewStatus = riskData.processedData?.reviewStatus || "PENDING";

  const fullName = applicant?.name || requestPayload.full_name || "Unknown";
  const applicantIdRemote = applicant?.applicantIdRemote || id;
  const email = applicant?.email || requestPayload.email || "";

  const levelCfg = riskLevelConfig[riskLevel] || riskLevelConfig.LOW;
  const actionCfg = actionConfig[recommendedAction] || actionConfig.REVIEW;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const formatAssessedAt = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "2-digit",
      year: "numeric",
    }) + " " + date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  // Donut chart
  const circumference = 2 * Math.PI * 40;
  const strokeDasharray = `${(riskScore / 100) * circumference} ${circumference}`;

  const getScoreColor = (score: number) => {
    if (score < 35) return "#10B981";
    if (score < 65) return "#F59E0B";
    return "#EF4444";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/client/risk-fraud")}
            className="rounded-xl"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Queue
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-border/50">
              <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold text-foreground">{fullName}</h1>
              <p className="text-sm text-muted-foreground">{applicantIdRemote}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Review Status Actions */}
          {reviewStatus === "PENDING" && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                disabled={updatingStatus}
                onClick={() => handleStatusUpdate("REVIEWED")}
              >
                <CheckCircle className="h-4 w-4 mr-1.5" />
                Mark Reviewed
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-red-700 border-red-300 hover:bg-red-50"
                disabled={updatingStatus}
                onClick={() => handleStatusUpdate("ESCALATED")}
              >
                <AlertTriangle className="h-4 w-4 mr-1.5" />
                Escalate
              </Button>
            </>
          )}
          <Button
            variant="outline"
            className="rounded-xl h-10"
            onClick={() => {
              // TODO: PDF export
              console.log("Export PDF report for", applicantIdRemote);
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF Report
          </Button>
        </div>
      </div>

      {/* Risk Assessment Results Header */}
      <div className="stat-card">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Risk Assessment Results</h2>
          <Badge
            variant="outline"
            className="rounded-full px-3 py-1 text-xs font-medium bg-muted/50 border-border text-muted-foreground"
          >
            {formatAssessedAt(assessedAt)}
          </Badge>
        </div>
      </div>

      {/* Risk Assessment Overview */}
      <div className="stat-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">Risk Assessment Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Donut Score Block */}
          <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
            <p className="font-semibold text-foreground mb-3">
              Risk Score: {riskScore} Points
            </p>
            <div className="flex items-center justify-center">
              <svg width="140" height="140" viewBox="0 0 100 100" className="transform -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-muted/40"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={getScoreColor(riskScore)}
                  strokeWidth="10"
                  strokeDasharray={strokeDasharray}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
                <text
                  x="50"
                  y="50"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-2xl font-bold fill-foreground"
                  transform="rotate(90 50 50)"
                >
                  {riskScore}
                </text>
                <text
                  x="50"
                  y="65"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs fill-muted-foreground"
                  transform="rotate(90 50 50)"
                >
                  Risk Points
                </text>
              </svg>
            </div>
          </div>

          {/* Risk Level Block */}
          <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
            <p className="text-xs text-muted-foreground mb-2">Risk Level</p>
            <Badge
              variant="outline"
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${levelCfg.className}`}
            >
              {levelCfg.label}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">{levelCfg.rangeText}</p>
          </div>

          {/* Recommended Action Block */}
          <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
            <p className="text-xs text-muted-foreground mb-2">Recommended Action</p>
            <Badge
              variant="outline"
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${actionCfg.className}`}
            >
              {actionCfg.label}
            </Badge>
          </div>
        </div>
      </div>

      {/* Risk Scoring Breakdown */}
      <div className="stat-card">
        <h3 className="text-sm font-semibold text-foreground mb-2">Risk Scoring Breakdown</h3>
        <p className="text-xs text-muted-foreground mb-4">How Risk Score is Calculated:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            {scoringBreakdown.left.map((item, idx) => (
              <p key={idx} className="text-xs text-muted-foreground">• {item.label}</p>
            ))}
          </div>
          <div className="space-y-2">
            {scoringBreakdown.right.map((item, idx) => (
              <p key={idx} className="text-xs text-muted-foreground">• {item.label}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Detected Risk Flags */}
      <div className="stat-card">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Detected Risk Flags ({flags.length})
        </h3>
        {flags.length > 0 ? (
          <div className="space-y-2">
            {flags.map((flag: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <p className="text-xs text-muted-foreground">{flag}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <p className="text-xs text-muted-foreground">No risk flags detected</p>
          </div>
        )}
      </div>

      {/* Assessment Summary */}
      <div className="stat-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">Assessment Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex justify-between items-center py-2 border-b border-border/30">
            <span className="text-xs text-muted-foreground">Assessment Date:</span>
            <span className="text-xs font-medium text-foreground">{formatAssessedAt(assessedAt)}</span>
          </div>
          <div className="py-2 border-b border-border/30">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-muted-foreground">Total Risk Points:</span>
              <span className="text-xs font-medium text-foreground">{riskScore} points</span>
            </div>
            <Progress value={riskScore} className="h-2" />
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border/30">
            <span className="text-xs text-muted-foreground">Risk Classification:</span>
            <span className="text-xs font-medium text-foreground">
              {riskLevel} ({levelCfg.rangeText})
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border/30">
            <span className="text-xs text-muted-foreground">System Recommendation:</span>
            <span className="text-xs font-medium text-foreground">{recommendedAction}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border/30">
            <span className="text-xs text-muted-foreground">Risk Flags Detected:</span>
            <span className="text-xs font-medium text-foreground">{flags.length}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-xs text-muted-foreground">Applicant Email:</span>
            <span className="text-xs font-medium text-foreground">{email}</span>
          </div>
        </div>
      </div>

      {/* Input Data (what was sent to risk API) */}
      {Object.keys(requestPayload).length > 0 && (
        <Accordion type="single" collapsible className="stat-card">
          <AccordionItem value="input" className="border-none">
            <AccordionTrigger className="text-sm font-semibold text-foreground py-0 hover:no-underline">
              View Input Data
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(requestPayload).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center py-1.5 border-b border-border/20">
                    <span className="text-xs text-muted-foreground">{key}:</span>
                    <span className="text-xs font-medium text-foreground truncate max-w-[200px]">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Raw Response Accordion */}
      <Accordion type="single" collapsible className="stat-card">
        <AccordionItem value="raw" className="border-none">
          <AccordionTrigger className="text-sm font-semibold text-foreground py-0 hover:no-underline">
            View Raw Response
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <pre className="bg-muted/50 rounded-xl p-4 text-xs overflow-auto max-h-64 text-muted-foreground">
              {JSON.stringify(raw, null, 2)}
            </pre>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
