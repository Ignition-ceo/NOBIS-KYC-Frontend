import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Mock applicant data with risk information
const mockApplicants: Record<string, any> = {
  "1": {
    id: "1",
    applicantId: "NB-2025-001847",
    fullName: "Mario Francisco De La Cruz",
    email: "mario.delacruz@example.com",
    risk: {
      score: 50,
      level: "MEDIUM",
      recommendedAction: "REVIEW",
      assessedAt: "July 04, 2025 13:01:04",
      breakdownLeft: [
        "Email Domain (Disposable): +25 pts",
        "Biometric Hash Reuse: +50 pts",
        "IP ≠ ID Country: +15 pts",
        "Geolocation Risk: +25 pts",
      ],
      breakdownRight: [
        "Phone Reuse (1 user): +40 pts",
        "IP Risk (VPN/Proxy): +30 pts",
        "Phone Area Mismatch: +15 pts",
      ],
      flags: ["Biometric data already present in existing user record"],
      raw: {
        risk_score: 50,
        risk_level: "MEDIUM",
        recommended_action: "REVIEW",
        flags_detected: 1,
      },
    },
  },
  "2": {
    id: "2",
    applicantId: "NB-2025-001846",
    fullName: "Ana María Rodríguez",
    email: "ana.rodriguez@example.com",
    risk: {
      score: 15,
      level: "LOW",
      recommendedAction: "APPROVE",
      assessedAt: "July 03, 2025 10:22:00",
      breakdownLeft: [
        "Email Domain: +0 pts",
        "Biometric Hash: +0 pts",
        "IP Match: +0 pts",
        "Geolocation: +15 pts",
      ],
      breakdownRight: [
        "Phone Status: +0 pts",
        "IP Risk: +0 pts",
        "Phone Area: +0 pts",
      ],
      flags: [],
      raw: {
        risk_score: 15,
        risk_level: "LOW",
        recommended_action: "APPROVE",
        flags_detected: 0,
      },
    },
  },
  "3": {
    id: "3",
    applicantId: "NB-2025-001845",
    fullName: "Carlos Enrique Méndez",
    email: "carlos.mendez@example.com",
    risk: {
      score: 78,
      level: "HIGH",
      recommendedAction: "REJECT",
      assessedAt: "July 02, 2025 08:45:30",
      breakdownLeft: [
        "Email Domain (Disposable): +25 pts",
        "Biometric Hash Reuse: +50 pts",
        "IP ≠ ID Country: +15 pts",
        "Geolocation Risk: +25 pts",
      ],
      breakdownRight: [
        "Phone Reuse (3 users): +40 pts",
        "IP Risk (VPN/Proxy): +30 pts",
        "Phone Area Mismatch: +15 pts",
      ],
      flags: [
        "Biometric data already present in existing user record",
        "Multiple phone number reuse detected",
        "VPN/Proxy detected",
        "Disposable email domain",
      ],
      raw: {
        risk_score: 78,
        risk_level: "HIGH",
        recommended_action: "REJECT",
        flags_detected: 4,
      },
    },
  },
};

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

export default function RiskFraudDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const applicant = mockApplicants[id || "1"] || mockApplicants["1"];
  const risk = applicant.risk;
  const levelCfg = riskLevelConfig[risk.level];
  const actionCfg = actionConfig[risk.recommendedAction];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  // Calculate stroke for donut
  const circumference = 2 * Math.PI * 40;
  const strokeDasharray = `${(risk.score / 100) * circumference} ${circumference}`;

  const getScoreColor = (score: number) => {
    if (score < 35) return "#10B981"; // emerald
    if (score < 65) return "#F59E0B"; // amber
    return "#EF4444"; // red
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/admin/risk-fraud")}
            className="rounded-xl"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Queue
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-border/50">
              <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
                {getInitials(applicant.fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold text-foreground">{applicant.fullName}</h1>
              <p className="text-sm text-muted-foreground">{applicant.applicantId}</p>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          className="rounded-xl h-10"
          onClick={() => {
            console.log("Export PDF report for", applicant.applicantId);
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          Export PDF Report
        </Button>
      </div>

      {/* Risk Assessment Results Header */}
      <div className="stat-card">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Risk Assessment Results</h2>
          <Badge
            variant="outline"
            className="rounded-full px-3 py-1 text-xs font-medium bg-muted/50 border-border text-muted-foreground"
          >
            {risk.assessedAt}
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
              Risk Score: {risk.score} Points
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
                  stroke={getScoreColor(risk.score)}
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
                  {risk.score}
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
            {risk.breakdownLeft.map((item: string, idx: number) => (
              <p key={idx} className="text-xs text-muted-foreground">• {item}</p>
            ))}
          </div>
          <div className="space-y-2">
            {risk.breakdownRight.map((item: string, idx: number) => (
              <p key={idx} className="text-xs text-muted-foreground">• {item}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Detected Risk Flags */}
      <div className="stat-card">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Detected Risk Flags ({risk.flags.length})
        </h3>
        {risk.flags.length > 0 ? (
          <div className="space-y-2">
            {risk.flags.map((flag: string, idx: number) => (
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
            <span className="text-xs font-medium text-foreground">{risk.assessedAt}</span>
          </div>
          <div className="py-2 border-b border-border/30">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-muted-foreground">Total Risk Points:</span>
              <span className="text-xs font-medium text-foreground">{risk.score} points</span>
            </div>
            <Progress value={risk.score} className="h-2" />
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border/30">
            <span className="text-xs text-muted-foreground">Risk Classification:</span>
            <span className="text-xs font-medium text-foreground">
              {risk.level} ({levelCfg.rangeText})
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border/30">
            <span className="text-xs text-muted-foreground">System Recommendation:</span>
            <span className="text-xs font-medium text-foreground">{risk.recommendedAction}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-xs text-muted-foreground">Risk Flags Detected:</span>
            <span className="text-xs font-medium text-foreground">{risk.flags.length}</span>
          </div>
        </div>
      </div>

      {/* Raw Response Accordion */}
      <Accordion type="single" collapsible className="stat-card">
        <AccordionItem value="raw" className="border-none">
          <AccordionTrigger className="text-sm font-semibold text-foreground py-0 hover:no-underline">
            View Raw Response
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <pre className="bg-muted/50 rounded-xl p-4 text-xs overflow-auto max-h-64 text-muted-foreground">
              {JSON.stringify(risk.raw, null, 2)}
            </pre>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
