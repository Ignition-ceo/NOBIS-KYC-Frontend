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
} from "lucide-react";
import ampliaBillDemo from "@/assets/demo/amplia-bill.jpg";
import carolSelfie from "@/assets/demo/carol-selfie.png";
import carolIdFront from "@/assets/demo/carol-id-front.jpg";
import carolIdBack from "@/assets/demo/carol-id-back.jpg";
import carolIdCropped from "@/assets/demo/carol-id-cropped.jpg";
import posMapImage from "@/assets/demo/pos-map.png";
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

// Types
type StepState = "passed" | "pending" | "failed" | "na";
type ApplicantStatus = "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_REVIEW";

interface ApplicantData {
  id: string;
  applicantId: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  status: ApplicantStatus;
  flowName: string;
  submittedAt: string;
  selfieUrl?: string;
  ipAddress?: string;
  country?: string;
  region?: string;
  city?: string;
  coordinates?: string;
  requiredSteps: string[];
  steps: Record<string, StepState>;
  idv?: {
    result: string;
    checkedAt: string;
    documentType: string;
    issuingCountry: string;
    extracted: {
      fullName: string;
      dob: string;
      gender: string;
      idNumber: string;
      address: string;
    };
    detailedChecks: Record<string, "OK" | "FAIL" | "PENDING">;
    documentInfo: Record<string, string>;
    images: { url: string; label: string }[];
    raw: object;
  };
  face?: {
    result: string;
    checkedAt: string;
    score: number;
    selfieUrl: string;
    idPhotoUrl: string;
    livenessResult: string;
    livenessScore: number;
  };
  aml?: {
    result: string;
    checkedAt: string;
    hits: number;
    sources: string[];
    provider: string;
    searchName: string;
    matchStatus: "NO_MATCH" | "POTENTIAL_MATCH" | "TRUE_MATCH" | "FALSE_POSITIVE";
    status: "REVIEWED" | "PENDING" | "HIT" | "CLEAR";
    warningTypes: string[];
    riskLevel: "Low" | "Medium" | "High";
    matches: {
      id: string;
      name: string;
      matchId: string;
      categories: string[];
      matchStatus: string;
      riskLevel: string;
      status: string;
      source: string;
      sourceUrl?: string;
    }[];
    raw: object;
  };
  risk?: {
    score: number;
    level: string;
    recommendedAction: string;
    assessedAt: string;
    factors: { name: string; impact: string }[];
    breakdownLeft: string[];
    breakdownRight: string[];
    flags: string[];
    raw: object;
  };
  poa?: {
    status: string;
    provider: string;
    checkedAt: string;
    accountNumber: string;
    billIssueDate: string;
    billHolderName: string;
    serviceAddress: string;
    validationStatus: string;
    dbValidationResult: string;
    billFilename: string;
    billUrl: string;
    billMime: string;
    raw: object;
  };
}

// Flow step mapping
const flowStepMap: Record<string, string[]> = {
  Default: ["phone", "email", "idDoc", "selfie", "poa"],
  SimpleKYC: ["phone", "email", "idDoc", "selfie"],
  EnhancedKYC: ["phone", "email", "idDoc", "selfie", "poa"],
  "PoA Required": ["phone", "email", "idDoc", "selfie", "poa"],
  BASIC_IDV: ["idDoc", "selfie"],
  SIM_REGISTRATION: ["phone", "idDoc", "selfie"],
};

const stepLabels: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  phone: { label: "Phone Check", icon: Phone },
  email: { label: "Email Check", icon: Mail },
  idDoc: { label: "ID Verification", icon: IdCard },
  selfie: { label: "Face Verification", icon: ScanFace },
  poa: { label: "Proof of Address", icon: MapPin },
};

const statusConfig: Record<ApplicantStatus, { label: string; className: string; tone: string }> = {
  PENDING: { label: "Pending", className: "bg-slate-100 text-slate-700 border-slate-200", tone: "neutral" },
  APPROVED: { label: "Approved", className: "bg-emerald-50 text-emerald-700 border-emerald-200", tone: "success" },
  REJECTED: { label: "Rejected", className: "bg-red-50 text-red-700 border-red-200", tone: "danger" },
  NEEDS_REVIEW: { label: "Needs Review", className: "bg-amber-50 text-amber-700 border-amber-200", tone: "warning" },
};

const stepStateConfig: Record<StepState, { label: string; className: string }> = {
  passed: { label: "Verified", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200" },
  failed: { label: "Failed", className: "bg-red-50 text-red-700 border-red-200" },
  na: { label: "N/A", className: "bg-slate-50 text-slate-500 border-slate-200" },
};

// Mock data for demonstration - Carol Collymore (Canonical Demo)
const mockApplicant: ApplicantData = {
  id: "NB-CC-0001",
  applicantId: "NB-CC-0001",
  fullName: "CAROL COLLYMORE",
  email: "carol.collymore@example.com",
  phone: "+1 (868) 555-0196",
  address: "216 North Hills Residence Club, Santa Cruz, Trinidad & Tobago",
  status: "NEEDS_REVIEW",
  flowName: "EnhancedKYC",
  submittedAt: "January 22, 2026 10:15",
  selfieUrl: carolSelfie,
  ipAddress: "181.118.50.98",
  country: "Trinidad and Tobago",
  region: "Port of Spain",
  city: "Port of Spain",
  coordinates: "10.6698, -61.5142",
  requiredSteps: ["phone", "email", "idDoc", "selfie", "poa"],
  steps: {
    phone: "passed",
    email: "passed",
    idDoc: "passed",
    selfie: "passed",
    poa: "passed",
  },
  idv: {
    result: "Approved",
    checkedAt: "Jan 22, 2026 10:17",
    documentType: "National Identification Card",
    issuingCountry: "TTO",
    extracted: {
      fullName: "COLLYMORE, CAROL",
      dob: "03/12/1960",
      gender: "F",
      idNumber: "19601203024",
      address: "216 North Hills Residence Club, Santa Cruz",
    },
    detailedChecks: {
      "Key Component": "OK",
      "Image Quality": "OK",
      "Color Code": "OK",
      Sample: "OK",
      "Age Validation": "OK",
      "ID Accepted": "OK",
      "Template Match": "OK",
      "Data Match": "OK",
      "Security Feature": "OK",
      "Id Number Validation": "OK",
      "Face Detected": "OK",
      Tamper: "OK",
      "Suspicious ID": "OK",
      Expiration: "OK",
    },
    documentInfo: {
      "ID Type": "National Identification Card",
      "ID Number": "19601203024",
      "Secondary ID Number": "19850209063",
      "Id Issue Country": "TTO",
      "Date of Birth": "03/12/1960",
      "Issue Date": "15/05/2019",
      "Expiration Date": "15/05/2029",
      Nationality: "TRINIDAD AND TOBAGO",
      "Place of Birth": "PORT OF SPAIN",
      "Age Over 18": "Yes",
      "Valid ID Number": "Valid",
      "ID Not Expired": "Valid",
    },
    images: [
      { url: carolIdFront, label: "ID Doc Front" },
      { url: carolIdBack, label: "ID Doc Back" },
      { url: carolIdCropped, label: "ID Portrait (Cropped)" },
    ],
    raw: {
      status: { statusCode: "000", statusMessage: "Form Submitted Successfully" },
      requestId: 1840587177,
      traceId: "6890025206868085454",
      ipAddress: "181.118.50.98",
    },
  },
  face: {
    result: "Match",
    checkedAt: "Jan 22, 2026 10:18",
    score: 98.7,
    selfieUrl: carolSelfie,
    idPhotoUrl: carolIdCropped,
    livenessResult: "Pass",
    livenessScore: 97.4,
  },
  aml: {
    result: "Match Found",
    checkedAt: "Jan 22, 2026 10:19",
    hits: 1,
    sources: ["Warning", "OFAC", "UN Sanctions", "PEP Lists"],
    provider: "ComplyAdvantage",
    searchName: "CAROL COLLYMORE",
    matchStatus: "FALSE_POSITIVE",
    status: "REVIEWED",
    warningTypes: [
      "Pep",
      "Pep Class 1",
      "Pep Class 2",
      "Pep Class 3",
      "Pep Class 4",
      "Sanction",
      "FATCA Sanction",
      "Warning",
      "Fitness Probity",
    ],
    riskLevel: "Medium",
    matches: [
      {
        id: "match-001",
        name: "Carol Collymore",
        matchId: "CA-2024-78901",
        categories: ["PEP", "FATCA Sanction", "Fitness Probity"],
        matchStatus: "FALSE_POSITIVE",
        riskLevel: "Medium",
        status: "REVIEWED",
        source: "Securities and Exchange Commission",
        sourceUrl: "https://www.sec.gov/litigation/litreleases/lr-19768",
      },
    ],
    raw: {
      searchId: "aml-search-carol-001",
      searchDate: "2026-01-22T10:19:00Z",
      totalMatches: 1,
      listsSearched: 4,
      reviewDecision: "False positive",
      reviewDate: "2024-07-09",
      additionalInfo: {
        activationDate: "Oct. 11, 2011",
        enforcementAgency: "Securities and Exchange Commission",
      },
      relatedUrls: [
        "https://www.sec.gov/litigation/litreleases/lr-19768",
        "https://www.sec.gov/litigation/litreleases/lr-20989",
        "https://www.sec.gov/litigation/litreleases/lr-22119",
      ],
    },
  },
  risk: {
    score: 50,
    level: "MEDIUM",
    recommendedAction: "REVIEW",
    assessedAt: "July 04, 2025 13:01:04",
    factors: [
      { name: "Document Authenticity", impact: "Low" },
      { name: "Geographic Risk", impact: "Medium" },
      { name: "Biometric Reuse", impact: "High" },
    ],
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
    flags: [
      "Biometric data already present in existing user record",
    ],
    raw: {
      assessmentId: "risk-assess-carol-001",
      assessmentDate: "2025-07-04T13:01:04Z",
      totalPoints: 50,
      classification: "MEDIUM",
      recommendation: "REVIEW",
      flagsDetected: 1,
    },
  },
  poa: {
    status: "VERIFIED",
    provider: "AMPLIA",
    checkedAt: "Jan 22, 2026 10:20",
    accountNumber: "CRM_000115716",
    billIssueDate: "May 29, 2025",
    billHolderName: "CAROL COLLYMORE",
    serviceAddress: "216 North Hills Residence Club, Santa Cruz",
    validationStatus: "VALID",
    dbValidationResult: "MATCH",
    billFilename: "Amplia bill - PDF document",
    billUrl: ampliaBillDemo,
    billMime: "image/jpeg",
    raw: {
      status: "verified",
      confidence: 0.98,
      addressMatch: true,
      nameMatch: true,
    },
  },
};

// Copy to clipboard helper
const copyToClipboard = (text: string, label: string) => {
  navigator.clipboard.writeText(text);
  toast.success(`${label} copied to clipboard`);
};

// localStorage key prefix for status persistence
const STATUS_STORAGE_PREFIX = "demo.status.";
const NOTES_STORAGE_PREFIX = "nobis_applicant_notes_";

// Helper to add a system note programmatically
const addSystemNote = (applicantId: string, message: string) => {
  const storageKey = `${NOTES_STORAGE_PREFIX}${applicantId}`;
  const stored = localStorage.getItem(storageKey);
  let notes = [];
  
  try {
    notes = stored ? JSON.parse(stored) : [];
  } catch {
    notes = [];
  }

  const systemNote = {
    id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    body: message,
    authorName: "System",
    authorId: "system",
    createdAt: new Date().toISOString(),
  };

  const updatedNotes = [systemNote, ...notes];
  localStorage.setItem(storageKey, JSON.stringify(updatedNotes));
  
  // Dispatch custom event to notify ApplicantNotes component
  window.dispatchEvent(new CustomEvent("applicant-notes-updated", { detail: { applicantId } }));
};

export default function ApplicantDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  // For demo, just use static mock data
  const [applicant, setApplicant] = useState<ApplicantData>(mockApplicant);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [expandAll, setExpandAll] = useState(false);
  const [locationExpanded, setLocationExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("idv");
  const [poaBillModalOpen, setPoaBillModalOpen] = useState(false);

  // Persisted status state (per applicant)
  const statusStorageKey = `${STATUS_STORAGE_PREFIX}${applicant.applicantId}`;
  
  // Load persisted status on mount
  useEffect(() => {
    const storedStatus = localStorage.getItem(statusStorageKey);
    if (storedStatus && ["PENDING", "APPROVED", "REJECTED", "NEEDS_REVIEW"].includes(storedStatus)) {
      setApplicant(prev => ({ ...prev, status: storedStatus as ApplicantStatus }));
    }
  }, [statusStorageKey]);

  // Flow-aware visibility
  const flowVisibility = useMemo(() => {
    const requiredSteps = flowStepMap[applicant.flowName] || flowStepMap.Default;
    return {
      phone: requiredSteps.includes("phone"),
      email: requiredSteps.includes("email"),
      address: requiredSteps.includes("poa"),
      idDoc: requiredSteps.includes("idDoc"),
      selfie: requiredSteps.includes("selfie"),
    };
  }, [applicant.flowName]);

  const status = statusConfig[applicant.status];
  const initials = applicant.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  // Status change handler with persistence + system note
  const handleStatusChange = useCallback((newStatus: ApplicantStatus) => {
    const statusLabel = statusConfig[newStatus].label;
    
    // Update local state
    setApplicant(prev => ({ ...prev, status: newStatus }));
    
    // Persist to localStorage
    localStorage.setItem(statusStorageKey, newStatus);
    
    // Add system note
    addSystemNote(applicant.applicantId, `System: Status changed to ${statusLabel}.`);
    
    // Show toast
    if (newStatus === "APPROVED") {
      toast.success("Applicant approved successfully");
    } else if (newStatus === "REJECTED") {
      toast.success("Applicant rejected");
    } else {
      toast.info(`Applicant marked as ${statusLabel}`);
    }
  }, [statusStorageKey, applicant.applicantId]);

  const handleApprove = () => {
    handleStatusChange("APPROVED");
  };

  const handleReject = () => {
    handleStatusChange("REJECTED");
    setRejectModalOpen(false);
    setRejectReason("");
  };

  const handleNeedsReview = () => {
    handleStatusChange("NEEDS_REVIEW");
  };

  return (
    <div className="min-h-full bg-muted/30 p-6 space-y-4 max-w-[1400px] mx-auto">
      {/* Top Header Card */}
      <Card className="shadow-lg border-border/60">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4 flex-nowrap min-w-0">
            {/* Left: Back + Profile (flexible, can shrink) */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/admin/applicants")}
                className="h-10 w-10 rounded-xl flex-shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div className="flex items-center gap-4 min-w-0">
                <Avatar className="h-14 w-14 border-2 border-primary/20 shadow-md flex-shrink-0">
                  <AvatarImage src={applicant.selfieUrl} alt={applicant.fullName} />
                  <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-1 min-w-0">
                  <h1 className="text-lg font-bold text-foreground truncate">{applicant.fullName}</h1>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                    <span className="flex items-center gap-1 flex-shrink-0">
                      Applicant ID: 
                      <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px]">
                        {applicant.applicantId}
                      </code>
                      <button 
                        onClick={() => copyToClipboard(applicant.applicantId, "Applicant ID")}
                        className="hover:text-foreground transition-colors"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </span>
                    <span className="text-muted-foreground/50 hidden sm:inline">•</span>
                    <span className="hidden sm:inline">Flow: {applicant.flowName}</span>
                    <span className="text-muted-foreground/50 hidden md:inline">•</span>
                    <span className="hidden md:inline">Submitted: {applicant.submittedAt}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Center: Status (fixed width, no shrink) */}
            <div className="flex items-center justify-center min-w-[140px] px-4 flex-shrink-0">
              <Badge variant="outline" className={`rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap ${status.className}`}>
                {status.label}
              </Badge>
            </div>

            {/* Right: Actions (fixed, no shrink) */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="outline" className="h-10 gap-2 rounded-xl whitespace-nowrap">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export as PDF</span>
                <span className="sm:hidden">Export</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" className="h-10 gap-2 rounded-xl whitespace-nowrap">
                    Actions
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleApprove} className="gap-2 cursor-pointer">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleNeedsReview} className="gap-2 cursor-pointer">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Needs Review
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setRejectModalOpen(true)} 
                    className="gap-2 cursor-pointer text-destructive"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes Section */}
      <ApplicantNotes applicantId={applicant.applicantId} />

      {/* Snapshot Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: Basic Information */}
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-xs text-muted-foreground">Name:</span>
              <span className="text-sm font-medium text-foreground">{applicant.fullName}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-xs text-muted-foreground">Email:</span>
              <div className="flex items-center gap-1">
                {flowVisibility.email ? (
                  <>
                    <span className="text-sm font-medium text-foreground">{applicant.email}</span>
                    <button onClick={() => copyToClipboard(applicant.email, "Email")} className="text-muted-foreground hover:text-foreground">
                      <Copy className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground italic">Not collected (flow)</span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-xs text-muted-foreground">Phone:</span>
              <div className="flex items-center gap-1">
                {flowVisibility.phone ? (
                  <>
                    <span className="text-sm font-medium text-foreground">{applicant.phone}</span>
                    <button onClick={() => copyToClipboard(applicant.phone, "Phone")} className="text-muted-foreground hover:text-foreground">
                      <Copy className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground italic">Not collected (flow)</span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-xs text-muted-foreground">Applicant ID:</span>
              <div className="flex items-center gap-1">
                <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{applicant.applicantId}</code>
                <button onClick={() => copyToClipboard(applicant.applicantId, "Applicant ID")} className="text-muted-foreground hover:text-foreground">
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Location Intelligence */}
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">Location Intelligence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-xs text-muted-foreground">IP Address:</span>
              <div className="flex items-center gap-1">
                <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{applicant.ipAddress || "—"}</code>
                {applicant.ipAddress && (
                  <button onClick={() => copyToClipboard(applicant.ipAddress!, "IP Address")} className="text-muted-foreground hover:text-foreground">
                    <Copy className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-xs text-muted-foreground">Country:</span>
              <span className="text-sm font-medium text-foreground">{applicant.country || "—"}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-xs text-muted-foreground">State/Region:</span>
              <span className="text-sm font-medium text-foreground">{applicant.region || "—"}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-xs text-muted-foreground">City:</span>
              <span className="text-sm font-medium text-foreground">{applicant.city || "—"}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-xs text-muted-foreground">Coordinates:</span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-foreground">{applicant.coordinates || "—"}</span>
                {applicant.coordinates && (
                  <button onClick={() => copyToClipboard(applicant.coordinates!, "Coordinates")} className="text-muted-foreground hover:text-foreground">
                    <Copy className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Static Map Placeholder for Demo */}
            <div className="mt-3">
              <div className="rounded-xl overflow-hidden border border-border/60 shadow-sm">
                <img 
                  src={posMapImage}
                  alt={`Map of ${applicant.city || applicant.country || "location"}`}
                  className="w-full h-[160px] md:h-[180px] object-cover"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Verification Progress */}
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground">Verification Progress</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setExpandAll(!expandAll)}
                className="h-7 text-xs"
              >
                {expandAll ? "Collapse" : "Expand"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {applicant.requiredSteps.map((stepKey) => {
              const step = stepLabels[stepKey];
              const state = applicant.steps[stepKey] || "na";
              const stateStyle = stepStateConfig[state];
              const IconComponent = step?.icon || CheckCircle;

              return (
                <div key={stepKey} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                      state === "passed" ? "bg-emerald-100 text-emerald-600" :
                      state === "pending" ? "bg-amber-100 text-amber-600" :
                      state === "failed" ? "bg-red-100 text-red-600" :
                      "bg-slate-100 text-slate-400"
                    }`}>
                      <IconComponent className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{step?.label || stepKey}</span>
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
            <TabsList className="w-full justify-start bg-muted/50 p-1 rounded-xl mb-6">
              <TabsTrigger value="idv" className="gap-2 data-[state=active]:bg-background rounded-lg">
                <IdCard className="h-4 w-4" />
                ID Verification
              </TabsTrigger>
              <TabsTrigger value="face" className="gap-2 data-[state=active]:bg-background rounded-lg">
                <ScanFace className="h-4 w-4" />
                Face Verification
              </TabsTrigger>
              <TabsTrigger value="poa" className="gap-2 data-[state=active]:bg-background rounded-lg">
                <MapPin className="h-4 w-4" />
                Proof of Address
              </TabsTrigger>
              <TabsTrigger 
                value="risk" 
                className={`gap-2 rounded-lg ${
                  applicant.risk?.level === "MEDIUM" || applicant.risk?.recommendedAction === "REVIEW"
                    ? "bg-amber-100/60 text-amber-800 border border-amber-300/50 font-semibold data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900"
                    : "data-[state=active]:bg-background"
                }`}
              >
                <ShieldAlert className="h-4 w-4" />
                Risk Assessment
              </TabsTrigger>
              <TabsTrigger 
                value="aml" 
                className={`gap-2 rounded-lg ${
                  applicant.aml?.warningTypes?.some(w => w.toLowerCase().includes("sanction") || w.toLowerCase().includes("pep")) ||
                  applicant.aml?.matchStatus === "TRUE_MATCH" || applicant.aml?.matchStatus === "POTENTIAL_MATCH" || applicant.aml?.matchStatus === "FALSE_POSITIVE"
                    ? "bg-red-100/60 text-red-800 border border-red-300/50 font-semibold data-[state=active]:bg-red-100 data-[state=active]:text-red-900"
                    : "data-[state=active]:bg-background"
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                AML / Sanctions Screening
              </TabsTrigger>
            </TabsList>

            {/* ID Verification Tab */}
            <TabsContent value="idv" className="space-y-4 mt-0">
              <Accordion type="multiple" defaultValue={expandAll ? ["summary", "checks", "extracted", "docinfo", "images", "raw"] : ["summary"]} className="space-y-3">
                {/* ID Verification Summary */}
                <AccordionItem value="summary" className="border rounded-xl px-4">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4">
                    <div className="flex items-center justify-between w-full pr-4">
                      <span>ID Verification Results</span>
                      <span className="text-xs text-muted-foreground font-normal">{applicant.idv?.checkedAt}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="space-y-4">
                      <div className="p-4 bg-muted/30 rounded-xl space-y-3">
                        <h4 className="text-sm font-semibold">ID Verification Status</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Verification Result:</span>
                          <Badge className={`rounded-full ${applicant.idv?.result === "Approved" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                            {applicant.idv?.result}
                          </Badge>
                        </div>
                      </div>

                      {/* Detailed Checks Grid */}
                      <div>
                        <h4 className="text-sm font-semibold mb-3">Detailed Checks:</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {applicant.idv?.detailedChecks && Object.entries(applicant.idv.detailedChecks).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between py-1.5 px-3 bg-muted/20 rounded-lg">
                              <span className="text-sm text-muted-foreground">{key}:</span>
                              <Badge variant="outline" className={`text-[10px] px-2 ${
                                value === "OK" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                value === "FAIL" ? "bg-red-50 text-red-700 border-red-200" :
                                "bg-amber-50 text-amber-700 border-amber-200"
                              }`}>
                                {value}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Extracted Personal Information */}
                <AccordionItem value="extracted" className="border rounded-xl px-4">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4">
                    Extracted Personal Information
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center justify-between py-2.5 px-3 bg-muted/30 rounded-xl border border-border/40">
                        <span className="text-xs font-medium text-muted-foreground">Full Name</span>
                        <span className="text-sm font-semibold text-foreground">{applicant.idv?.extracted.fullName || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between py-2.5 px-3 bg-muted/30 rounded-xl border border-border/40">
                        <span className="text-xs font-medium text-muted-foreground">Date of Birth</span>
                        <span className="text-sm font-semibold text-foreground">{applicant.idv?.extracted.dob || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between py-2.5 px-3 bg-muted/30 rounded-xl border border-border/40">
                        <span className="text-xs font-medium text-muted-foreground">Gender</span>
                        <span className="text-sm font-semibold text-foreground">{applicant.idv?.extracted.gender || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between py-2.5 px-3 bg-muted/30 rounded-xl border border-border/40">
                        <span className="text-xs font-medium text-muted-foreground">ID Number</span>
                        <span className="text-sm font-semibold text-foreground">{applicant.idv?.extracted.idNumber || "—"}</span>
                      </div>
                      <div className="md:col-span-2 flex items-center justify-between py-2.5 px-3 bg-muted/30 rounded-xl border border-border/40">
                        <span className="text-xs font-medium text-muted-foreground">Address</span>
                        <span className="text-sm font-semibold text-foreground text-right max-w-[65%]">
                          {flowVisibility.address ? (applicant.idv?.extracted.address || "—") : "Not collected (flow)"}
                        </span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* ID Document Information */}
                <AccordionItem value="docinfo" className="border rounded-xl px-4">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4">
                    ID Document Information
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="grid grid-cols-2 gap-3">
                      {applicant.idv?.documentInfo && Object.entries(applicant.idv.documentInfo).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center py-1">
                          <span className="text-sm text-muted-foreground">{key}:</span>
                          <span className={`text-sm font-medium ${
                            value === "Valid" || value === "Yes" ? "text-emerald-600" : ""
                          }`}>
                            {value === "Valid" || value === "Yes" ? (
                              <span className="flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                {value}
                              </span>
                            ) : value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Verification Images */}
                <AccordionItem value="images" className="border rounded-xl px-4">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4">
                    <div className="flex items-center gap-2">
                      <span>ID Verification Images</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {applicant.idv?.images.length || 0}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {applicant.idv?.images.map((img, idx) => (
                        <div key={idx} className="space-y-2">
                          <div className="aspect-[4/3] rounded-xl overflow-hidden border border-border bg-muted">
                            <img 
                              src={img.url} 
                              alt={img.label} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-xs text-center text-muted-foreground font-medium">{img.label}</p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Raw Response */}
                <AccordionItem value="raw" className="border rounded-xl px-4">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4">
                    View Raw Response
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto text-xs font-mono">
                      {JSON.stringify(applicant.idv?.raw, null, 2)}
                    </pre>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>

            {/* Risk Assessment Tab */}
            <TabsContent value="risk" className="space-y-4 mt-0">
              {applicant.risk ? (
                <div className="space-y-4">
                  {/* Risk Assessment Results Header */}
                  <Card className="border-border/40 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground">Risk Assessment Results</h3>
                        <Badge 
                          variant="outline" 
                          className="rounded-full px-3 py-1 text-xs font-medium bg-muted/50 border-border/60 text-muted-foreground"
                        >
                          {applicant.risk.assessedAt.replace(" ", " ").slice(0, 16) || "Jul 04, 2025 13:01"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Risk Assessment Overview */}
                  <Card className="border-border/40">
                    <CardContent className="p-5">
                      <h4 className="text-sm font-semibold text-foreground mb-4">Risk Assessment Overview</h4>
                      
                      {/* Score + Level + Action Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Donut Score Block */}
                        <div className="p-4 bg-muted/30 rounded-xl border border-border/40 flex flex-col items-center justify-center">
                          <p className="text-sm font-semibold text-foreground mb-3">Risk Score: {applicant.risk.score} Points</p>
                          {/* Donut Chart */}
                          <div className="relative w-32 h-32">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                              {/* Background circle */}
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke="hsl(var(--muted))"
                                strokeWidth="10"
                              />
                              {/* Progress circle */}
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke={
                                  applicant.risk.score < 35 ? "#10b981" :
                                  applicant.risk.score < 65 ? "#f59e0b" : "#ef4444"
                                }
                                strokeWidth="10"
                                strokeLinecap="round"
                                strokeDasharray={`${(applicant.risk.score / 100) * 251.2} 251.2`}
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-2xl font-bold text-foreground">{applicant.risk.score}</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">Risk Points</p>
                        </div>

                        {/* Risk Level Block */}
                        <div className="p-4 bg-muted/30 rounded-xl border border-border/40 flex flex-col items-center justify-center text-center">
                          <p className="text-xs text-muted-foreground mb-2">Risk Level</p>
                          <Badge className={`rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 ${
                            applicant.risk.level === "LOW" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                            applicant.risk.level === "MEDIUM" ? "bg-amber-100 text-amber-700 border border-amber-200" :
                            "bg-red-100 text-red-700 border border-red-200"
                          }`}>
                            <FileText className="h-3.5 w-3.5" />
                            {applicant.risk.level}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-3">35-64 points</p>
                        </div>

                        {/* Recommended Action Block */}
                        <div className="p-4 bg-muted/30 rounded-xl border border-border/40 flex flex-col items-center justify-center text-center">
                          <p className="text-xs text-muted-foreground mb-2">Recommended Action</p>
                          <Badge className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                            applicant.risk.recommendedAction === "APPROVE" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                            applicant.risk.recommendedAction === "REVIEW" ? "bg-amber-100 text-amber-700 border border-amber-200" :
                            "bg-red-100 text-red-700 border border-red-200"
                          }`}>
                            {applicant.risk.recommendedAction}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Risk Scoring Breakdown */}
                  <Card className="border-border/40">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                        <h4 className="text-sm font-semibold text-foreground">Risk Scoring Breakdown</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mb-4">How Risk Score is Calculated:</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                        {/* Left Column */}
                        <div className="space-y-2">
                          {applicant.risk.breakdownLeft?.map((item, idx) => (
                            <p key={idx} className="text-xs text-muted-foreground/80">• {item}</p>
                          ))}
                        </div>
                        {/* Right Column */}
                        <div className="space-y-2">
                          {applicant.risk.breakdownRight?.map((item, idx) => (
                            <p key={idx} className="text-xs text-muted-foreground/80">• {item}</p>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Detected Risk Flags */}
                  <Card className="border-border/40">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        <h4 className="text-sm font-semibold text-foreground">Detected Risk Flags ({applicant.risk.flags?.length || 0})</h4>
                      </div>
                      
                      {applicant.risk.flags && applicant.risk.flags.length > 0 ? (
                        <div className="space-y-2">
                          {applicant.risk.flags.map((flag, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <span className="h-2 w-2 rounded-full bg-amber-500 flex-shrink-0" />
                              <p className="text-xs text-muted-foreground">{flag}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No risk flags detected</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Assessment Summary */}
                  <Card className="border-border/40">
                    <CardContent className="p-5">
                      <h4 className="text-sm font-semibold text-foreground mb-4">Assessment Summary</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex justify-between items-center py-1">
                          <span className="text-xs text-muted-foreground">Assessment Date:</span>
                          <span className="text-sm font-medium text-foreground">{applicant.risk.assessedAt}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-xs text-muted-foreground">Total Risk Points:</span>
                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-semibold ${
                              applicant.risk.score < 35 ? "text-emerald-600" :
                              applicant.risk.score < 65 ? "text-amber-600" : "text-red-600"
                            }`}>{applicant.risk.score} points</span>
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  applicant.risk.score < 35 ? "bg-emerald-500" :
                                  applicant.risk.score < 65 ? "bg-amber-500" : "bg-red-500"
                                }`}
                                style={{ width: `${applicant.risk.score}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-xs text-muted-foreground">Risk Classification:</span>
                          <div className="flex items-center gap-2">
                            <Badge className={`rounded-lg px-2 py-0.5 text-[11px] font-medium ${
                              applicant.risk.level === "LOW" ? "bg-emerald-100 text-emerald-700" :
                              applicant.risk.level === "MEDIUM" ? "bg-amber-100 text-amber-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {applicant.risk.level}
                            </Badge>
                            <span className="text-xs text-muted-foreground">(35-64 points)</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-xs text-muted-foreground">System Recommendation:</span>
                          <Badge className={`rounded-lg px-2 py-0.5 text-[11px] font-medium ${
                            applicant.risk.recommendedAction === "APPROVE" ? "bg-emerald-100 text-emerald-700" :
                            applicant.risk.recommendedAction === "REVIEW" ? "bg-amber-100 text-amber-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {applicant.risk.recommendedAction}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-xs text-muted-foreground">Risk Flags Detected:</span>
                          <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 border-amber-200">
                            {applicant.risk.flags?.length || 0}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Raw Response */}
                  <Accordion type="single" collapsible className="space-y-3">
                    <AccordionItem value="raw" className="border rounded-xl px-4">
                      <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4">
                        View Raw Response
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto text-xs font-mono">
                          {JSON.stringify(applicant.risk.raw, null, 2)}
                        </pre>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              ) : (
                <Card className="border-border/40">
                  <CardContent className="p-16 flex flex-col items-center justify-center text-center">
                    <ShieldAlert className="h-12 w-12 text-muted-foreground/40 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-1">No Risk Assessment</h3>
                    <p className="text-sm text-muted-foreground">
                      Risk assessment has not been performed for this applicant.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Sanction Screening Tab - Enhanced */}
            <TabsContent value="aml" className="space-y-4 mt-0">
              {applicant.aml ? (
                <div className="space-y-4">
                  {/* AML Synopsis Card */}
                  <Card className="border-border/40 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-base font-semibold text-foreground">AML Screening</h3>
                          <p className="text-sm text-muted-foreground">Processed: {applicant.aml.checkedAt}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-9 gap-2 rounded-xl"
                            onClick={() => toast.success("PDF report exported")}
                          >
                            <Download className="h-4 w-4" />
                            Export PDF Report
                          </Button>
                        </div>
                      </div>

                      {/* Synopsis Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="p-3 bg-muted/30 rounded-xl border border-border/40">
                          <p className="text-xs text-muted-foreground mb-1">Search Term</p>
                          <p className="text-sm font-semibold text-foreground">{applicant.aml.searchName}</p>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-xl border border-border/40">
                          <p className="text-xs text-muted-foreground mb-1">Provider</p>
                          <p className="text-sm font-semibold text-foreground">{applicant.aml.provider}</p>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-xl border border-border/40">
                          <p className="text-xs text-muted-foreground mb-1">Match Status</p>
                          <Badge className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            applicant.aml.matchStatus === "NO_MATCH" ? "bg-emerald-100 text-emerald-700" :
                            applicant.aml.matchStatus === "FALSE_POSITIVE" ? "bg-slate-100 text-slate-600" :
                            applicant.aml.matchStatus === "POTENTIAL_MATCH" ? "bg-amber-100 text-amber-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {applicant.aml.matchStatus === "NO_MATCH" ? "No Match" :
                             applicant.aml.matchStatus === "FALSE_POSITIVE" ? "False Positive" :
                             applicant.aml.matchStatus === "POTENTIAL_MATCH" ? "Potential Match" : "True Match"}
                          </Badge>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-xl border border-border/40">
                          <p className="text-xs text-muted-foreground mb-1">Status</p>
                          <Badge className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            applicant.aml.status === "CLEAR" ? "bg-emerald-100 text-emerald-700" :
                            applicant.aml.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                            applicant.aml.status === "REVIEWED" ? "bg-primary/10 text-primary" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {applicant.aml.status === "CLEAR" ? "Clear" :
                             applicant.aml.status === "PENDING" ? "Pending" :
                             applicant.aml.status === "REVIEWED" ? "Reviewed" : "Hit"}
                          </Badge>
                        </div>
                      </div>

                      {/* Warning Types */}
                      {applicant.aml.warningTypes.length > 0 && (
                        <div className="flex items-center gap-2 mt-4 flex-wrap">
                          <span className="text-xs text-muted-foreground">Warning types:</span>
                          {applicant.aml.warningTypes.map((type, idx) => (
                            <Badge 
                              key={idx}
                              variant="outline" 
                              className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-50 text-red-700 border-red-200"
                            >
                              {type}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Sources Checked */}
                  <Card className="border-border/40">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-foreground">Sources Checked</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {applicant.aml.sources.map((source, idx) => (
                          <div key={idx} className="flex items-center gap-2 py-2.5 px-3 bg-muted/30 rounded-xl border border-border/40">
                            <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                            <span className="text-sm font-medium">{source}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Matches Table */}
                  <Card className="border-border/40">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold text-foreground">Matches</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {applicant.aml.matches.length} {applicant.aml.matches.length === 1 ? "match" : "matches"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {applicant.aml.matches.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <ShieldCheck className="h-10 w-10 text-emerald-600 mb-3" />
                          <p className="text-sm font-medium text-foreground">No matches found</p>
                          <p className="text-xs text-muted-foreground">This applicant cleared all AML screening checks</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {applicant.aml.matches.map((match, idx) => (
                            <div 
                              key={match.id}
                              className="p-4 bg-muted/30 rounded-xl border border-border/40 space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-foreground">{match.name}</p>
                                  <p className="text-xs text-muted-foreground">Match ID: {match.matchId}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                    match.matchStatus === "NO_MATCH" ? "bg-emerald-100 text-emerald-700" :
                                    match.matchStatus === "FALSE_POSITIVE" ? "bg-slate-100 text-slate-600" :
                                    match.matchStatus === "POTENTIAL_MATCH" ? "bg-amber-100 text-amber-700" :
                                    "bg-red-100 text-red-700"
                                  }`}>
                                    {match.matchStatus}
                                  </Badge>
                                  <Badge variant="outline" className={`text-xs ${
                                    match.riskLevel === "Low" ? "text-emerald-600 border-emerald-200" :
                                    match.riskLevel === "Medium" ? "text-amber-600 border-amber-200" :
                                    "text-red-600 border-red-200"
                                  }`}>
                                    {match.riskLevel} Risk
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                {match.categories.map((cat, catIdx) => (
                                  <Badge 
                                    key={catIdx}
                                    variant="outline" 
                                    className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-purple-50 text-purple-700 border-purple-200"
                                  >
                                    {cat}
                                  </Badge>
                                ))}
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Source: {match.source}</span>
                                {match.sourceUrl && (
                                  <a 
                                    href={match.sourceUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-primary hover:underline"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    View Source
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Raw Response */}
                  <Accordion type="single" collapsible className="space-y-3">
                    <AccordionItem value="raw" className="border rounded-xl px-4">
                      <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4">
                        View Raw Response
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto text-xs font-mono">
                          {JSON.stringify(applicant.aml.raw, null, 2)}
                        </pre>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              ) : (
                <Card className="border-border/40">
                  <CardContent className="p-16 flex flex-col items-center justify-center text-center">
                    <ShieldCheck className="h-12 w-12 text-muted-foreground/40 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-1">No AML Screening</h3>
                    <p className="text-sm text-muted-foreground">
                      AML screening has not been performed for this applicant.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Face Verification Tab */}
            <TabsContent value="face" className="space-y-4 mt-0">
              <Accordion type="single" defaultValue="facematch" collapsible className="space-y-3">
                <AccordionItem value="facematch" className="border rounded-xl px-4">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4">
                    Face Match
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Selfie with Liveness overlay */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-primary text-primary-foreground">Selfie</Badge>
                          <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-300">
                            Liveness
                          </Badge>
                          <Badge className={`${
                            applicant.face?.livenessResult === "Pass" 
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-300" 
                              : "bg-red-100 text-red-700 border border-red-300"
                          }`}>
                            {applicant.face?.livenessResult || "Pass"}
                          </Badge>
                        </div>
                        <div className="aspect-square rounded-xl overflow-hidden border border-border bg-muted">
                          <img 
                            src={applicant.face?.selfieUrl} 
                            alt="Selfie" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      {/* ID Photo */}
                      <div className="space-y-2">
                        <Badge className="bg-emerald-600 text-white">ID Portrait</Badge>
                        <div className="aspect-square rounded-xl overflow-hidden border border-border bg-muted">
                          <img 
                            src={applicant.face?.idPhotoUrl} 
                            alt="ID Photo" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      {/* Match Details - Liveness first, then Match */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <span className="text-sm text-muted-foreground">Check date:</span>
                          <p className="text-sm font-medium">{applicant.face?.checkedAt}</p>
                        </div>
                        
                        {/* Liveness Score - appears FIRST */}
                        <div className="space-y-2">
                          <span className="text-sm text-muted-foreground">Liveness score:</span>
                          <p className={`text-2xl font-bold ${
                            (applicant.face?.livenessScore || 0) >= 80 
                              ? "text-emerald-600" 
                              : "text-amber-600"
                          }`}>
                            {applicant.face?.livenessScore || 97.4}%
                          </p>
                        </div>

                        <div className="border-t border-border/50 my-2" />

                        {/* Match Result */}
                        <div className="space-y-2">
                          <span className="text-sm text-muted-foreground">Match result:</span>
                          <div className="flex items-center gap-2">
                            {applicant.face?.result === "Match" ? (
                              <CheckCircle className="h-5 w-5 text-emerald-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                            <span className="font-semibold">{applicant.face?.result}</span>
                          </div>
                        </div>

                        {/* Match Confidence Score */}
                        <div className="space-y-2">
                          <span className="text-sm text-muted-foreground">Match confidence:</span>
                          <p className="text-2xl font-bold text-emerald-600">{applicant.face?.score}%</p>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>

            {/* Proof of Address Tab */}
            <TabsContent value="poa" className="space-y-4 mt-0">
              {applicant.poa ? (
                <div className="space-y-4">
                  {/* PoA Summary Header */}
                  <Card className="border-border/40">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-base font-semibold text-foreground">Proof of Address Results</h3>
                          <p className="text-sm text-muted-foreground">Processed: {applicant.poa.checkedAt}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-semibold bg-primary/10 text-primary border-primary/20">
                            {applicant.poa.provider}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              applicant.poa.status === "VERIFIED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              applicant.poa.status === "PENDING" ? "bg-amber-50 text-amber-700 border-amber-200" :
                              "bg-red-50 text-red-700 border-red-200"
                            }`}
                          >
                            {applicant.poa.status === "VERIFIED" ? "Verified" : 
                             applicant.poa.status === "PENDING" ? "Pending" : "Failed"}
                          </Badge>
                        </div>
                      </div>

                      {/* Summary Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-3 bg-muted/30 rounded-xl border border-border/40">
                          <p className="text-xs text-muted-foreground mb-1">Status</p>
                          <Badge className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            applicant.poa.status === "VERIFIED" ? "bg-emerald-100 text-emerald-700" :
                            applicant.poa.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {applicant.poa.status === "VERIFIED" ? "Verified" : 
                             applicant.poa.status === "PENDING" ? "Pending" : "Failed"}
                          </Badge>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-xl border border-border/40">
                          <p className="text-xs text-muted-foreground mb-1">Provider</p>
                          <p className="text-sm font-semibold text-foreground">{applicant.poa.provider}</p>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-xl border border-border/40">
                          <p className="text-xs text-muted-foreground mb-1">DB Validation</p>
                          <Badge className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            applicant.poa.dbValidationResult === "MATCH" || applicant.poa.dbValidationResult === "VERIFIED" 
                              ? "bg-emerald-100 text-emerald-700" 
                              : "bg-red-100 text-red-700"
                          }`}>
                            {applicant.poa.dbValidationResult}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bill Information */}
                  <Card className="border-border/40">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-foreground">Bill Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center justify-between py-2.5 px-3 bg-muted/30 rounded-xl border border-border/40">
                          <span className="text-xs font-medium text-muted-foreground">Account Number</span>
                          <span className="text-sm font-semibold text-foreground">{applicant.poa.accountNumber || "—"}</span>
                        </div>
                        <div className="flex items-center justify-between py-2.5 px-3 bg-muted/30 rounded-xl border border-border/40">
                          <span className="text-xs font-medium text-muted-foreground">Bill Issue Date</span>
                          <span className="text-sm font-semibold text-foreground">{applicant.poa.billIssueDate || "—"}</span>
                        </div>
                        <div className="flex items-center justify-between py-2.5 px-3 bg-muted/30 rounded-xl border border-border/40">
                          <span className="text-xs font-medium text-muted-foreground">Bill Holder Name</span>
                          <span className="text-sm font-semibold text-foreground">{applicant.poa.billHolderName || "—"}</span>
                        </div>
                        <div className="flex items-center justify-between py-2.5 px-3 bg-muted/30 rounded-xl border border-border/40">
                          <span className="text-xs font-medium text-muted-foreground">Validation Status</span>
                          <Badge className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            applicant.poa.validationStatus === "VALID" || applicant.poa.validationStatus === "VERIFIED" 
                              ? "bg-emerald-100 text-emerald-700" 
                              : "bg-red-100 text-red-700"
                          }`}>
                            {applicant.poa.validationStatus}
                          </Badge>
                        </div>
                        <div className="md:col-span-2 flex items-center justify-between py-2.5 px-3 bg-muted/30 rounded-xl border border-border/40">
                          <span className="text-xs font-medium text-muted-foreground">Service Address</span>
                          <span className="text-sm font-semibold text-foreground text-right max-w-[65%]">
                            {applicant.poa.serviceAddress || "—"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Uploaded Document */}
                  <Card className="border-border/40">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-foreground">Uploaded Document</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/40">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{applicant.poa.billFilename}</p>
                            <p className="text-xs text-muted-foreground">{applicant.poa.billMime}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="default"
                            size="sm"
                            className="h-9 gap-2 rounded-xl"
                            onClick={() => setPoaBillModalOpen(true)}
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <Button 
                            variant="outline"
                            size="sm"
                            className="h-9 gap-2 rounded-xl"
                            onClick={() => window.open(applicant.poa?.billUrl, "_blank")}
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Raw Response */}
                  <Accordion type="single" collapsible className="space-y-3">
                    <AccordionItem value="raw" className="border rounded-xl px-4">
                      <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4">
                        View Raw Response
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto text-xs font-mono">
                          {JSON.stringify(applicant.poa.raw, null, 2)}
                        </pre>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              ) : (
                <Card className="border-border/40">
                  <CardContent className="p-16 flex flex-col items-center justify-center text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground/40 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-1">No Proof of Address</h3>
                    <p className="text-sm text-muted-foreground">
                      This applicant's flow does not require proof of address verification.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* PoA Bill Preview Modal */}
      <Dialog open={poaBillModalOpen} onOpenChange={setPoaBillModalOpen}>
        <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-4 pb-3 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-semibold">
                View Bill • {applicant.poa?.billFilename}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline"
                  size="sm"
                  className="h-8 gap-2 rounded-lg"
                  onClick={() => window.open(applicant.poa?.billUrl || ampliaBillDemo, "_blank")}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-4" style={{ maxHeight: "78vh" }}>
            {/* Use demo bill image or actual bill */}
            <div className="w-full flex items-start justify-center bg-white rounded-xl">
              <img 
                src={applicant.poa?.billUrl || ampliaBillDemo}
                alt="Bill"
                className="rounded-xl"
                style={{
                  width: "100%",
                  maxHeight: "72vh",
                  objectFit: "contain",
                  objectPosition: "center top",
                  transform: "scale(0.92)",
                  transformOrigin: "center top",
                  display: "block",
                  margin: "0 auto",
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
            <Button onClick={handleReject} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Confirm rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
