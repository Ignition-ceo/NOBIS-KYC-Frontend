import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Users, FileCheck, Clock, XCircle, MoreVertical, ArrowUpRight, PanelRight, CheckCircle2, AlertTriangle, RotateCcw, Settings, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ApplicantSidePanel, Applicant } from "@/components/admin/ApplicantSidePanel";

// Demo assets
import carolSelfie from "@/assets/demo/carol-selfie.png";
import { VerificationStepIcon, StepState } from "@/components/admin/VerificationStepIcon";

// Extended Applicant type with verification steps
interface ApplicantWithSteps extends Applicant {
  steps: {
    phone: StepState;
    email: StepState;
    idDoc: StepState;
    selfie: StepState;
    poa: StepState;
  };
  reviewDuration?: string;
  documentType?: string;
  flowName?: string;
}

// Helper functions for date/time formatting
const formatDatePretty = (dateStr: string): string => {
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = 2000 + parseInt(parts[2]);
    const date = new Date(year, month, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return dateStr;
};

const formatTimePretty = (dateStr: string, timeStr?: string): string => {
  if (timeStr) return timeStr;
  const hash = dateStr.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const hours = hash % 12 || 12;
  const minutes = (hash * 7) % 60;
  const seconds = (hash * 13) % 60;
  const ampm = hash % 2 === 0 ? 'AM' : 'PM';
  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampm}`;
};

const timeAgo = (dateStr: string): string => {
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = 2000 + parseInt(parts[2]);
    const date = new Date(year, month, day);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }
  return '';
};

const parseDate = (dateStr: string): Date => {
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = 2000 + parseInt(parts[2]);
    return new Date(year, month, day);
  }
  return new Date();
};

// Flow-aware verification step definitions
type StepDefinition = {
  key: string;
  icon: "phone" | "mail" | "id-card" | "scan-face" | "map-pin";
  stateKey: string;
  label: string;
};

const stepDefinitions: Record<string, StepDefinition> = {
  phone: { key: "phone", icon: "phone", stateKey: "phone", label: "Phone Check" },
  email: { key: "email", icon: "mail", stateKey: "email", label: "Email Check" },
  idDoc: { key: "idDoc", icon: "id-card", stateKey: "idDoc", label: "ID Document" },
  selfie: { key: "selfie", icon: "scan-face", stateKey: "selfie", label: "Selfie / Liveness" },
  poa: { key: "poa", icon: "map-pin", stateKey: "poa", label: "Proof of Address" },
};

// Map flow names to required steps
const flowStepMap: Record<string, string[]> = {
  "Default": ["phone", "email", "idDoc", "selfie", "poa"],
  "SimpleKYC": ["phone", "email", "idDoc", "selfie"],
  "EnhancedKYC": ["phone", "email", "idDoc", "selfie", "poa"],
  "PoA Required": ["phone", "email", "idDoc", "selfie", "poa"],
  "BASIC_IDV": ["idDoc", "selfie"],
  "SIM_REGISTRATION": ["phone", "idDoc", "selfie"],
};

const getFlowSteps = (flowName?: string): StepDefinition[] => {
  const flow = flowName || "Default";
  const stepKeys = flowStepMap[flow] || flowStepMap["Default"];
  return stepKeys.map(key => stepDefinitions[key]);
};

// Mock data with Caribbean names, Trinidad & Tobago locations, and verification steps
const mockApplicants: ApplicantWithSteps[] = [
  // DEMO: Carol Collymore - Canonical demo applicant (first row)
  {
    id: "NB-CC-0001",
    clientId: "NB-CC-0001",
    fullName: "Carol Collymore",
    email: "carol.collymore@example.com",
    phone: "+1 (868) 555-0196",
    address: "216 North Hills Residence Club, Santa Cruz, Trinidad & Tobago",
    status: "NEEDS_REVIEW",
    level: 2,
    createdAt: "22/01/26",
    updatedAt: "22/01/26",
    selfieUrl: carolSelfie,
    utilityBillName: "Amplia_bill_jan.pdf",
    idDocName: "TT_ID_front.jpg",
    steps: { phone: "passed", email: "passed", idDoc: "passed", selfie: "passed", poa: "passed" },
    reviewDuration: "4 min 12 sec",
    documentType: "National ID",
    flowName: "EnhancedKYC",
  },
  {
    id: "1",
    clientId: "NB-29013",
    fullName: "John Smith",
    email: "john.smith@example.com",
    phone: "+1 (868) 555-0139",
    address: "12 Jaggernauth Ave, Chaguanas, Trinidad & Tobago",
    status: "APPROVED",
    level: 1,
    createdAt: "10/01/26",
    updatedAt: "17/01/26",
    selfieUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    utilityBillName: "T&TEC_bill_jan.pdf",
    idDocName: "TT_ID_front.jpg",
    steps: { phone: "passed", email: "passed", idDoc: "passed", selfie: "passed", poa: "passed" },
    reviewDuration: "2 min 15 sec",
    documentType: "National ID",
    flowName: "Default",
  },
  {
    id: "2",
    clientId: "NB-29014",
    fullName: "Cindy Alexander",
    email: "cindy.alexander@example.com",
    phone: "+1 (868) 555-0140",
    address: "8 Palmiste Drive, San Fernando, Trinidad & Tobago",
    status: "NEEDS_REVIEW",
    level: 2,
    createdAt: "11/01/26",
    updatedAt: "17/01/26",
    selfieUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    utilityBillName: "Flow_bill_dec.pdf",
    idDocName: "Drivers_permit.jpg",
    steps: { phone: "passed", email: "passed", idDoc: "passed", selfie: "pending", poa: "pending" },
    reviewDuration: "5 min 42 sec",
    documentType: "Driver's License",
    flowName: "EnhancedKYC",
  },
  {
    id: "3",
    clientId: "NB-29015",
    fullName: "Curtis Williams",
    email: "curtis.williams@example.com",
    phone: "+1 (868) 555-0141",
    address: "24 Eastern Main Road, Arima, Trinidad & Tobago",
    status: "REJECTED",
    level: 1,
    createdAt: "12/01/26",
    updatedAt: "17/01/26",
    selfieUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    utilityBillName: "TSTT_bill_nov.pdf",
    idDocName: "Passport_bio.jpg",
    steps: { phone: "passed", email: "passed", idDoc: "failed", selfie: "pending", poa: "na" },
    reviewDuration: "8 min 03 sec",
    documentType: "Passport",
    flowName: "SimpleKYC",
  },
  {
    id: "4",
    clientId: "NB-29016",
    fullName: "Brianna Thomas",
    email: "brianna.thomas@example.com",
    phone: "+1 (868) 555-0142",
    address: "5 Southern Main Road, Couva, Trinidad & Tobago",
    status: "APPROVED",
    level: 1,
    createdAt: "13/01/26",
    updatedAt: "17/01/26",
    selfieUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    idDocName: "TT_ID_front.jpg",
    utilityBillName: "Digicel_bill_jan.pdf",
    steps: { phone: "passed", email: "passed", idDoc: "passed", selfie: "passed", poa: "passed" },
    reviewDuration: "1 min 48 sec",
    documentType: "National ID",
    flowName: "Default",
  },
  {
    id: "5",
    clientId: "NB-29017",
    fullName: "Dwayne Joseph",
    email: "dwayne.joseph@example.com",
    phone: "+1 (868) 555-0143",
    address: "19 Morne Coco Road, Diego Martin, Trinidad & Tobago",
    status: "NEEDS_REVIEW",
    level: 2,
    createdAt: "14/01/26",
    updatedAt: "17/01/26",
    selfieUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    utilityBillName: "T&TEC_bill_dec.pdf",
    idDocName: "Drivers_permit.jpg",
    steps: { phone: "passed", email: "passed", idDoc: "passed", selfie: "pending", poa: "pending" },
    reviewDuration: "3 min 22 sec",
    documentType: "Driver's License",
    flowName: "PoA Required",
  },
  {
    id: "6",
    clientId: "NB-29018",
    fullName: "Kira Mohammed",
    email: "kira.mohammed@example.com",
    phone: "+1 (868) 555-0144",
    address: "Lot 7 Endeavour Gardens, Endeavour, Trinidad & Tobago",
    status: "APPROVED",
    level: 2,
    createdAt: "15/01/26",
    updatedAt: "17/01/26",
    selfieUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    utilityBillName: "Flow_bill_jan.pdf",
    idDocName: "Passport_bio.jpg",
    steps: { phone: "passed", email: "passed", idDoc: "passed", selfie: "passed", poa: "passed" },
    reviewDuration: "2 min 05 sec",
    documentType: "Passport",
    flowName: "EnhancedKYC",
  },
  {
    id: "7",
    clientId: "NB-29019",
    fullName: "Shania Pierre",
    email: "shania.pierre@example.com",
    phone: "+1 (868) 555-0145",
    address: "3 Clifton Hill, Point Fortin, Trinidad & Tobago",
    status: "PENDING",
    level: 1,
    createdAt: "16/01/26",
    updatedAt: "17/01/26",
    selfieUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face",
    utilityBillName: "TSTT_bill_dec.pdf",
    idDocName: "TT_ID_front.jpg",
    steps: { phone: "pending", email: "pending", idDoc: "pending", selfie: "pending", poa: "pending" },
    documentType: "National ID",
    flowName: "Default",
  },
  {
    id: "8",
    clientId: "NB-29020",
    fullName: "Marcus Baptiste",
    email: "marcus.baptiste@example.com",
    phone: "+1 (868) 555-0146",
    address: "15 Ariapita Ave, Woodbrook, Trinidad & Tobago",
    status: "APPROVED",
    level: 2,
    createdAt: "17/01/26",
    updatedAt: "17/01/26",
    selfieUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
    utilityBillName: "WASA_bill_jan.pdf",
    idDocName: "TT_ID_front.jpg",
    steps: { phone: "passed", email: "passed", idDoc: "passed", selfie: "passed", poa: "passed" },
    reviewDuration: "1 min 33 sec",
    documentType: "National ID",
    flowName: "SimpleKYC",
  },
];

const tabs = [
  { key: "all", label: "All" },
  { key: "new", label: "New", dot: true },
  { key: "verified", label: "Verified" },
  { key: "pending", label: "Pending" },
  { key: "rejected", label: "Rejected" },
];

const statusConfig = {
  PENDING: { 
    label: "Pending", 
    className: "bg-slate-50 text-slate-600 border-slate-200" 
  },
  APPROVED: { 
    label: "Verified", 
    className: "bg-emerald-50 text-emerald-700 border-emerald-200" 
  },
  REJECTED: { 
    label: "Rejected", 
    className: "bg-red-50 text-red-700 border-red-200" 
  },
  NEEDS_REVIEW: { 
    label: "Needs Review", 
    className: "bg-amber-50 text-amber-800 border-amber-200" 
  },
};

type SortOption = "newest" | "oldest" | "name-az" | "name-za";

export default function Applicants() {
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState<ApplicantWithSteps[]>(mockApplicants);
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicantWithSteps | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [docTypeFilter, setDocTypeFilter] = useState<string>("all");
  const [flowFilter, setFlowFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const stats = {
    today: applicants.length,
    verified: applicants.filter((a) => a.status === "APPROVED").length,
    pending: applicants.filter((a) => a.status === "PENDING" || a.status === "NEEDS_REVIEW").length,
  };

  const filteredApplicants = useMemo(() => {
    let result = [...applicants];

    // Tab filter
    if (activeTab === "new") result = result.filter(a => a.status === "PENDING");
    else if (activeTab === "verified") result = result.filter(a => a.status === "APPROVED");
    else if (activeTab === "pending") result = result.filter(a => a.status === "PENDING" || a.status === "NEEDS_REVIEW");
    else if (activeTab === "rejected") result = result.filter(a => a.status === "REJECTED");

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "verified") result = result.filter(a => a.status === "APPROVED");
      else if (statusFilter === "pending") result = result.filter(a => a.status === "PENDING");
      else if (statusFilter === "needs-review") result = result.filter(a => a.status === "NEEDS_REVIEW");
      else if (statusFilter === "rejected") result = result.filter(a => a.status === "REJECTED");
    }

    // Document type filter
    if (docTypeFilter !== "all") {
      result = result.filter(a => a.documentType?.toLowerCase() === docTypeFilter.toLowerCase());
    }

    // Flow filter
    if (flowFilter !== "all") {
      result = result.filter(a => a.flowName?.toLowerCase() === flowFilter.toLowerCase());
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.fullName.toLowerCase().includes(query) ||
        a.email.toLowerCase().includes(query) ||
        a.clientId.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return parseDate(b.updatedAt).getTime() - parseDate(a.updatedAt).getTime();
        case "oldest":
          return parseDate(a.updatedAt).getTime() - parseDate(b.updatedAt).getTime();
        case "name-az":
          return a.fullName.localeCompare(b.fullName);
        case "name-za":
          return b.fullName.localeCompare(a.fullName);
        default:
          return 0;
      }
    });

    return result;
  }, [applicants, activeTab, statusFilter, docTypeFilter, flowFilter, searchQuery, sortBy]);

  const handleStatusChange = (id: string, status: Applicant["status"]) => {
    setApplicants((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
    if (selectedApplicant?.id === id) {
      setSelectedApplicant((prev) => (prev ? { ...prev, status } : null));
    }
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setDocTypeFilter("all");
    setFlowFilter("all");
    setSortBy("newest");
    setSearchQuery("");
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredApplicants.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredApplicants.map(a => a.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 space-y-6 overflow-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Verification</h1>
          <p className="text-muted-foreground">
            Review and manage applicant verifications
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat-card flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Applications Today</p>
              <p className="text-2xl font-bold text-foreground">{stats.today.toLocaleString()}</p>
            </div>
          </div>
          <div className="stat-card flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <FileCheck className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Applications Verified</p>
              <p className="text-2xl font-bold text-foreground">{stats.verified.toLocaleString()}</p>
            </div>
          </div>
          <div className="stat-card flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Applications Pending</p>
              <p className="text-2xl font-bold text-foreground">{stats.pending.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.dot && (
                <span className="absolute -top-0.5 -right-2 h-1.5 w-1.5 rounded-full bg-red-500" />
              )}
            </button>
          ))}
        </div>

        {/* Enterprise Filter Bar */}
        <div className="bg-card rounded-xl border border-border/60 p-4 shadow-sm space-y-4">
          {/* Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-11 rounded-xl bg-background border-border/60">
                <SelectValue placeholder="Verification Status" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="needs-review">Needs Review</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Document Type Filter */}
            <Select value={docTypeFilter} onValueChange={setDocTypeFilter}>
              <SelectTrigger className="h-11 rounded-xl bg-background border-border/60">
                <SelectValue placeholder="Document Type" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50">
                <SelectItem value="all">All Documents</SelectItem>
                <SelectItem value="passport">Passport</SelectItem>
                <SelectItem value="driver's license">Driver's License</SelectItem>
                <SelectItem value="national id">National ID</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            {/* Flow Filter */}
            <Select value={flowFilter} onValueChange={setFlowFilter}>
              <SelectTrigger className="h-11 rounded-xl bg-background border-border/60">
                <SelectValue placeholder="Onboarding Flow" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50">
                <SelectItem value="all">All Flows</SelectItem>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="simplekyc">SimpleKYC</SelectItem>
                <SelectItem value="enhancedkyc">EnhancedKYC</SelectItem>
                <SelectItem value="poa required">PoA Required</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="h-11 rounded-xl bg-background border-border/60">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50">
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="name-az">A → Z (Name)</SelectItem>
                <SelectItem value="name-za">Z → A (Name)</SelectItem>
              </SelectContent>
            </Select>

            {/* Reset Filters */}
            <Button 
              variant="outline" 
              onClick={resetFilters}
              className="h-11 rounded-xl gap-2 font-semibold"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Filters
            </Button>
          </div>

          {/* Actions Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Bulk Action */}
              <Select>
                <SelectTrigger className="h-10 w-44 rounded-xl bg-background border-border/60">
                  <SelectValue placeholder="Bulk Action" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  <SelectItem value="approve">Approve selected</SelectItem>
                  <SelectItem value="review">Needs Review selected</SelectItem>
                  <SelectItem value="reject">Reject selected</SelectItem>
                  <SelectItem value="export">Export selected</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search applicants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 w-64 rounded-xl bg-background"
                />
              </div>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Enterprise Table */}
        <div className="bg-card rounded-xl border border-border/60 overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead className="w-[54px]">
                  <Checkbox 
                    checked={selectedIds.size === filteredApplicants.length && filteredApplicants.length > 0}
                    onCheckedChange={toggleSelectAll}
                    className="border-slate-300"
                  />
                </TableHead>
                <TableHead className="font-semibold text-slate-600 w-[380px]">Applicant</TableHead>
                <TableHead className="font-semibold text-slate-600 w-[280px]">Required Steps</TableHead>
                <TableHead className="font-semibold text-slate-600 w-[240px]">Reviewed</TableHead>
                <TableHead className="font-semibold text-slate-600 w-[140px]">Status</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplicants.map((applicant, index) => {
                const status = statusConfig[applicant.status];
                const initials = applicant.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase();
                const isEven = index % 2 === 0;
                const isSelected = selectedIds.has(applicant.id);

                return (
                  <TableRow
                    key={applicant.id}
                    onClick={() => setSelectedApplicant(applicant)}
                    className={`cursor-pointer transition-colors h-[68px] ${
                      selectedApplicant?.id === applicant.id 
                        ? "bg-primary/5 hover:bg-primary/8" 
                        : isSelected
                          ? "bg-primary/5 hover:bg-primary/8"
                          : isEven 
                            ? "bg-white hover:bg-slate-50/80" 
                            : "bg-slate-50/40 hover:bg-slate-100/60"
                    }`}
                  >
                    {/* Checkbox */}
                    <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(applicant.id)}
                        className="border-slate-300" 
                      />
                    </TableCell>
                    
                    {/* Applicant: Avatar + Name + Client ID / Flow */}
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-slate-200/80 ring-1 ring-slate-100">
                          <AvatarImage src={applicant.selfieUrl} className="object-cover" />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-0.5">
                          <p className="font-semibold text-foreground text-sm leading-tight">{applicant.fullName}</p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>ID: {applicant.clientId}</span>
                            <span className="text-slate-300">•</span>
                            <span>{applicant.documentType || "—"}</span>
                            <span className="text-slate-300">•</span>
                            <span>Flow: {applicant.flowName || "Default"}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    {/* Verification Steps - Flow Aware */}
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2.5">
                        {getFlowSteps(applicant.flowName).map((step) => (
                          <VerificationStepIcon 
                            key={step.key} 
                            icon={step.icon} 
                            state={applicant.steps?.[step.stateKey as keyof typeof applicant.steps] ?? "na"} 
                            tooltip={step.label} 
                          />
                        ))}
                      </div>
                    </TableCell>
                    
                    {/* Verified At: Date & Time + Timezone + Relative + Duration */}
                    <TableCell className="py-4">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-foreground text-sm">{formatDatePretty(applicant.updatedAt)}</p>
                        <p className="text-xs text-muted-foreground/80">{formatTimePretty(applicant.updatedAt)} (GMT-4)</p>
                        <p className="text-xs text-slate-400">{timeAgo(applicant.updatedAt)}</p>
                        {applicant.reviewDuration && (
                          <p className="text-xs text-slate-400">Took {applicant.reviewDuration}</p>
                        )}
                      </div>
                    </TableCell>
                    
                    {/* Status */}
                    <TableCell className="py-4">
                      <Badge 
                        variant="outline" 
                        className={`rounded-full px-3 py-1 font-medium text-xs tracking-wide border ${status.className}`}
                      >
                        {status.label}
                      </Badge>
                    </TableCell>
                    
                    {/* Actions: Kebab Menu */}
                    <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 hover:bg-primary/10 rounded-lg"
                          >
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem 
                            className="gap-2 cursor-pointer"
                            onClick={() => navigate(`/admin/applicants/${applicant.id}`)}
                          >
                            <ArrowUpRight className="h-4 w-4" />
                            Open applicant
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2 cursor-pointer"
                            onClick={() => setSelectedApplicant(applicant)}
                          >
                            <PanelRight className="h-4 w-4" />
                            Open in side panel
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="gap-2 cursor-pointer"
                            onClick={() => handleStatusChange(applicant.id, "APPROVED")}
                          >
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2 cursor-pointer"
                            onClick={() => handleStatusChange(applicant.id, "NEEDS_REVIEW")}
                          >
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            Needs Review
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2 cursor-pointer text-red-600"
                            onClick={() => handleStatusChange(applicant.id, "REJECTED")}
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredApplicants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <XCircle className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No applicants found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="sm" disabled>
            ← Previous
          </Button>
          {[1, 2, 3, "...", 987].map((page, i) => (
            <Button
              key={i}
              variant={page === 1 ? "default" : "ghost"}
              size="sm"
              className="w-8 h-8 p-0"
              disabled={page === "..."}
            >
              {page}
            </Button>
          ))}
          <Button variant="ghost" size="sm">
            Next →
          </Button>
        </div>
      </div>

      {/* Side Panel */}
      {selectedApplicant && (
        <ApplicantSidePanel
          applicant={selectedApplicant}
          onClose={() => setSelectedApplicant(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
