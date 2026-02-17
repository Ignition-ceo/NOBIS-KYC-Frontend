import { useNavigate } from "react-router-dom";
import { X, FileText, Home, CheckCircle, XCircle, AlertTriangle, ArrowUpRight, Download, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState, useMemo } from "react";
import { StepState } from "@/components/admin/VerificationStepIcon";

export interface Applicant {
  id: string;
  clientId: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_REVIEW";
  level: number;
  createdAt: string;
  updatedAt: string;
  selfieUrl?: string;
  idDocName?: string;
  utilityBillName?: string;
  flowName?: string;
  steps?: {
    phone: StepState;
    email: StepState;
    idDoc: StepState;
    selfie: StepState;
    poa: StepState;
  };
}

interface ApplicantSidePanelProps {
  applicant: Applicant | null;
  onClose: () => void;
  onStatusChange: (id: string, status: Applicant["status"]) => void;
}

const statusConfig = {
  PENDING: { label: "Pending", className: "bg-slate-100 text-slate-700 border-slate-200" },
  APPROVED: { label: "Approved", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  REJECTED: { label: "Rejected", className: "bg-red-50 text-red-700 border-red-200" },
  NEEDS_REVIEW: { label: "Needs Review", className: "bg-amber-50 text-amber-700 border-amber-200" },
};

// Flow step mapping - defines which steps are required per flow
const flowStepMap: Record<string, string[]> = {
  "Default": ["phone", "email", "idDoc", "selfie", "poa"],
  "SimpleKYC": ["phone", "email", "idDoc", "selfie"],
  "EnhancedKYC": ["phone", "email", "idDoc", "selfie", "poa"],
  "PoA Required": ["phone", "email", "idDoc", "selfie", "poa"],
  "BASIC_IDV": ["idDoc", "selfie"],
  "SIM_REGISTRATION": ["phone", "idDoc", "selfie"],
};

// Attachment definitions with their step keys
interface AttachmentDef {
  stepKey: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  getFileName: (applicant: Applicant) => string | undefined;
}

const attachmentDefinitions: AttachmentDef[] = [
  {
    stepKey: "idDoc",
    title: "Identification",
    icon: FileText,
    getFileName: (a) => a.idDocName,
  },
  {
    stepKey: "poa",
    title: "Utility Bill",
    icon: Home,
    getFileName: (a) => a.utilityBillName,
  },
];

// Status indicator component for attachments
const AttachmentStatusIcon = ({ status }: { status: StepState }) => {
  switch (status) {
    case "passed":
      return <CheckCircle className="h-5 w-5 text-emerald-500" />;
    case "failed":
      return <XCircle className="h-5 w-5 text-red-500" />;
    case "pending":
      return <Clock className="h-5 w-5 text-amber-500" />;
    default:
      return <AlertCircle className="h-5 w-5 text-slate-400" />;
  }
};

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ApplicantSidePanel({ applicant, onClose, onStatusChange }: ApplicantSidePanelProps) {
  const navigate = useNavigate();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Compute flow-aware attachments
  const flowAttachments = useMemo(() => {
    if (!applicant) return [];
    
    const flow = applicant.flowName || "Default";
    const requiredSteps = flowStepMap[flow] || flowStepMap["Default"];
    
    return attachmentDefinitions
      .filter(att => requiredSteps.includes(att.stepKey))
      .map(att => {
        const fileName = att.getFileName(applicant);
        const stepStatus = applicant.steps?.[att.stepKey as keyof typeof applicant.steps] || "na";
        const exists = !!fileName;
        
        // Show if: step is in flow AND (file exists OR status is failed for evidence)
        const shouldShow = exists || stepStatus === "failed";
        
        return {
          ...att,
          fileName: fileName || "Not uploaded",
          status: stepStatus,
          exists,
          shouldShow,
        };
      })
      .filter(att => att.shouldShow);
  }, [applicant]);

  // Compute flow-aware visibility flags for PII fields
  const flowVisibility = useMemo(() => {
    if (!applicant) return { phone: false, email: false, address: false, idDoc: false, selfie: false };
    const flow = applicant.flowName || "Default";
    const requiredSteps = flowStepMap[flow] || flowStepMap["Default"];
    return {
      phone: requiredSteps.includes("phone"),
      email: requiredSteps.includes("email"),
      address: requiredSteps.includes("poa"),
      idDoc: requiredSteps.includes("idDoc"),
      selfie: requiredSteps.includes("selfie"),
    };
  }, [applicant]);

  if (!applicant) return null;

  const status = statusConfig[applicant.status];
  const initials = applicant.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const handleApprove = () => {
    onStatusChange(applicant.id, "APPROVED");
  };

  const handleReject = () => {
    onStatusChange(applicant.id, "REJECTED");
    setRejectModalOpen(false);
    setRejectReason("");
  };

  const handleNeedsReview = () => {
    onStatusChange(applicant.id, "NEEDS_REVIEW");
  };

  return (
    <>
      <div className="w-[380px] h-full bg-white border-l border-slate-200 flex flex-col overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <span className="text-sm font-bold text-slate-500 tracking-wide uppercase">
            Applicant Review
          </span>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Identity Block */}
          <div className="flex flex-col items-center text-center space-y-3">
            <Avatar className="h-28 w-28 border-4 border-primary/20 shadow-lg">
              <AvatarImage src={applicant.selfieUrl} alt={applicant.fullName} />
              <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="max-w-full text-center">
              <h3 className="text-xl font-black text-slate-900">{applicant.fullName}</h3>
              <p className="text-sm text-slate-500 whitespace-nowrap">
                {flowVisibility.email ? applicant.email : "Email not collected"}
              </p>
            </div>
            <Badge variant="outline" className={`rounded-full px-3 py-1 font-bold ${status.className}`}>
              {status.label}
            </Badge>
            {applicant.flowName && (
              <Badge variant="outline" className="rounded-full px-3 py-1 font-medium bg-slate-50 text-slate-600 border-slate-200">
                Flow: {applicant.flowName}
              </Badge>
            )}
          </div>

          {/* Contact & Details Card */}
          <div className="bg-slate-50/80 rounded-[14px] p-4 border border-slate-100/60">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Contact & Details
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              {/* Client ID - always visible */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400 leading-4">Client ID</span>
                <p className="text-[13px] font-semibold text-slate-900 leading-5 break-words">{applicant.clientId}</p>
              </div>
              
              {/* Phone - always visible, show placeholder if not collected */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400 leading-4">Phone</span>
                <p className={`text-[13px] leading-5 whitespace-nowrap ${flowVisibility.phone ? "font-semibold text-slate-900" : "font-medium text-slate-400 italic"}`}>
                  {flowVisibility.phone ? (applicant.phone || "—") : "Not collected (flow)"}
                </p>
              </div>
              
              {/* Email - always visible, full width (spans 2 columns), no truncation */}
              <div className="col-span-2 flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400 leading-4">Email</span>
                <p className={`text-[13px] leading-5 whitespace-nowrap ${flowVisibility.email ? "font-semibold text-slate-900" : "font-medium text-slate-400 italic"}`}>
                  {flowVisibility.email ? (applicant.email || "—") : "Not collected (flow)"}
                </p>
              </div>
              
              {/* Address - always visible, full width, show placeholder if not collected */}
              <div className="col-span-2 flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400 leading-4">Address</span>
                <p className={`text-[13px] leading-5 break-words ${flowVisibility.address ? "font-semibold text-slate-900" : "font-medium text-slate-400 italic"}`}>
                  {flowVisibility.address ? (applicant.address || "—") : "Not collected (flow)"}
                </p>
              </div>
              
              {/* Created - always visible */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400 leading-4">Created</span>
                <p className="text-[13px] font-semibold text-slate-900 leading-5">{applicant.createdAt}</p>
              </div>
              
              {/* Updated - always visible */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400 leading-4">Updated</span>
                <p className="text-[13px] font-semibold text-slate-900 leading-5">{applicant.updatedAt}</p>
              </div>
            </div>
          </div>

          {/* Flow-Aware Attachments */}
          {flowAttachments.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Attachments
              </h4>

              {flowAttachments.map((attachment) => {
                const IconComponent = attachment.icon;
                return (
                  <div 
                    key={attachment.stepKey}
                    className={`flex items-center justify-between p-3 bg-white border rounded-xl ${
                      attachment.status === "failed" 
                        ? "border-red-200 bg-red-50/30" 
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        attachment.status === "failed" 
                          ? "bg-red-100" 
                          : "bg-slate-100"
                      }`}>
                        <IconComponent className={`h-5 w-5 ${
                          attachment.status === "failed" 
                            ? "text-red-600" 
                            : "text-slate-600"
                        }`} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{attachment.title}</p>
                        <p className="text-xs text-slate-500">{attachment.fileName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <AttachmentStatusIcon status={attachment.status} />
                      {attachment.exists && (
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Separator />

          {/* Decision Actions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Decision
            </h4>
            <Button
              onClick={handleApprove}
              className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button
              onClick={() => setRejectModalOpen(true)}
              className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={handleNeedsReview}
              variant="outline"
              className="w-full h-11 rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50 font-semibold"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Needs Review
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100">
          <Button 
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-semibold"
            onClick={() => {
              navigate(`/client/users/${applicant.id}`);
              onClose();
            }}
          >
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Open applicant profile
          </Button>
        </div>
      </div>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject applicant</DialogTitle>
            <DialogDescription>
              Select a reason (optional) and confirm rejection.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection (optional)…"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReject} className="bg-red-600 hover:bg-red-700 text-white">
              Confirm rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
