import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Users,
  FileCheck,
  Clock,
  XCircle,
  MoreVertical,
  ArrowUpRight,
  PanelRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
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
import { VerificationStepIcon, StepState } from "@/components/admin/VerificationStepIcon";
import { fetchApplicants, updateApplicantService } from "@/services/applicant";
import { toast } from "sonner";

// Map backend verification status to display status
const mapVerificationStatus = (status: string): string => {
  switch (status) {
    case "verified":
      return "APPROVED";
    case "rejected":
      return "REJECTED";
    case "requested":
      return "NEEDS_REVIEW";
    case "pending":
    default:
      return "PENDING";
  }
};

// Map backend applicant to frontend shape
function mapBackendApplicant(a: any): Applicant & {
  steps: Record<string, StepState>;
  documentType?: string;
  flowName?: string;
} {
  // Build verification steps from requiredVerifications
  const steps: Record<string, StepState> = {};
  const stepKeyMap: Record<string, string> = {
    phone: "phone",
    email: "email",
    idDocument: "idDoc",
    selfie: "selfie",
    proofOfAddress: "poa",
  };

  (a.requiredVerifications || []).forEach((v: any) => {
    const key = stepKeyMap[v.verificationType] || v.verificationType;
    const statusMap: Record<string, StepState> = {
      verified: "passed",
      pending: "pending",
      rejected: "failed",
      failed: "failed",
      requested: "pending",
    };
    steps[key] = statusMap[v.status] || "pending";
  });

  const fullName = a.name || [a.firstName, a.lastName].filter(Boolean).join(" ") || "Unknown";
  const initials = fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  return {
    id: a._id || a.id,
    clientId: a.clientId || "",
    fullName,
    email: a.email || "",
    phone: a.phone || "",
    address: a.address || "",
    status: mapVerificationStatus(a.verificationStatus || "pending"),
    level: 1,
    createdAt: a.createdAt || "",
    updatedAt: a.updatedAt || "",
    selfieUrl: a.selfieImageUrl || "",
    idDocName: a.idDocumentImageUrl ? "ID Document" : undefined,
    steps,
    documentType: a.documentType || undefined,
    flowName: a.flowName || undefined,
  };
}

// Step definitions for rendering
type StepDefinition = {
  key: string;
  icon: "phone" | "mail" | "id-card" | "scan-face" | "map-pin";
  stateKey: string;
  label: string;
};

const allStepDefinitions: StepDefinition[] = [
  { key: "phone", icon: "phone", stateKey: "phone", label: "Phone Check" },
  { key: "email", icon: "mail", stateKey: "email", label: "Email Check" },
  { key: "idDoc", icon: "id-card", stateKey: "idDoc", label: "ID Document" },
  { key: "selfie", icon: "scan-face", stateKey: "selfie", label: "Selfie / Liveness" },
  { key: "poa", icon: "map-pin", stateKey: "poa", label: "Proof of Address" },
];

const getApplicantSteps = (steps: Record<string, StepState>): StepDefinition[] => {
  // Only show steps that exist in this applicant's verification
  return allStepDefinitions.filter((def) => def.stateKey in steps);
};

const tabs = [
  { key: "all", label: "All" },
  { key: "verified", label: "Verified" },
  { key: "pending", label: "Pending" },
  { key: "rejected", label: "Rejected" },
];

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: "Pending",
    className: "bg-slate-50 text-slate-600 border-slate-200",
  },
  APPROVED: {
    label: "Verified",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  NEEDS_REVIEW: {
    label: "Needs Review",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
};

export default function Applicants() {
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState<any[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadApplicants = useCallback(async () => {
    try {
      setLoading(true);

      // Map tab to backend status filter
      let verificationStatus = "";
      if (activeTab === "verified") verificationStatus = "verified";
      else if (activeTab === "pending") verificationStatus = "pending";
      else if (activeTab === "rejected") verificationStatus = "rejected";

      // Override with dropdown filter if set
      if (statusFilter !== "all") {
        if (statusFilter === "verified") verificationStatus = "verified";
        else if (statusFilter === "pending") verificationStatus = "pending";
        else if (statusFilter === "needs-review") verificationStatus = "requested";
        else if (statusFilter === "rejected") verificationStatus = "rejected";
      }

      const params: Record<string, any> = {
        page,
        searchText: searchQuery || undefined,
        verificationStatus: verificationStatus || undefined,
        sortBy: sortBy === "newest" || sortBy === "oldest" ? "createdAt" : undefined,
        sortOrder: sortBy === "oldest" ? "asc" : "desc",
        nameSort: sortBy === "name-az" ? "1" : sortBy === "name-za" ? "-1" : undefined,
      };

      // Remove undefined values
      Object.keys(params).forEach((key) => {
        if (params[key] === undefined) delete params[key];
      });

      const data = await fetchApplicants(params);
      const mapped = (data.applicants || []).map(mapBackendApplicant);
      setApplicants(mapped);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Failed to load applicants:", err);
      toast.error("Failed to load applicants");
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, activeTab, statusFilter, sortBy]);

  useEffect(() => {
    loadApplicants();
  }, [loadApplicants]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, activeTab, statusFilter, sortBy]);

  const stats = useMemo(
    () => ({
      total: total,
      verified: applicants.filter((a) => a.status === "APPROVED").length,
      pending: applicants.filter(
        (a) => a.status === "PENDING" || a.status === "NEEDS_REVIEW"
      ).length,
    }),
    [applicants, total]
  );

  const handleStatusChange = async (applicantId: string, newStatus: string) => {
    // Map display status back to backend verificationStatus values
    const backendStatusMap: Record<string, string> = {
      APPROVED: "verified",
      REJECTED: "rejected",
      NEEDS_REVIEW: "requested",
      PENDING: "pending",
    };
    const backendStatus = backendStatusMap[newStatus] || newStatus.toLowerCase();

    try {
      await updateApplicantService(applicantId, { verificationStatus: backendStatus });
      toast.success(`Applicant status updated to ${newStatus}`);
      loadApplicants();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === applicants.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(applicants.map((a) => a.id)));
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const timeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "1 day ago";
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      return `${Math.floor(diffDays / 365)} years ago`;
    } catch {
      return "";
    }
  };

  return (
    <div className="flex gap-0 h-[calc(100vh-80px)]">
      <div className="flex-1 flex flex-col min-w-0 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Users</h1>
            <p className="text-muted-foreground text-sm">
              Review and manage applicant verifications
            </p>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{total} Total</span>
          </div>
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium">{stats.verified} Verified</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium">{stats.pending} Pending</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4 border-b">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === tab.key
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="needs-review">Needs Review</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name-az">Name A-Z</SelectItem>
              <SelectItem value="name-za">Name Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {loading && applicants.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="rounded-lg border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={selectedIds.size === applicants.length && applicants.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-[280px]">Applicant</TableHead>
                    <TableHead className="w-[200px]">Verification Steps</TableHead>
                    <TableHead className="w-[180px]">Verified At</TableHead>
                    <TableHead className="w-[130px]">Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applicants.map((applicant, index) => {
                    const status = statusConfig[applicant.status] || statusConfig.PENDING;
                    const initials = applicant.fullName
                      .split(" ")
                      .map((n: string) => n[0])
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

                        {/* Applicant: Avatar + Name */}
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-slate-200/80 ring-1 ring-slate-100">
                              <AvatarImage src={applicant.selfieUrl} className="object-cover" />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-0.5">
                              <p className="font-semibold text-foreground text-sm leading-tight">
                                {applicant.fullName}
                              </p>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span>{applicant.email}</span>
                                {applicant.documentType && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <span>{applicant.documentType}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Verification Steps */}
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2.5">
                            {getApplicantSteps(applicant.steps).map((step) => (
                              <VerificationStepIcon
                                key={step.key}
                                icon={step.icon}
                                state={applicant.steps?.[step.stateKey] ?? "na"}
                                tooltip={step.label}
                              />
                            ))}
                            {Object.keys(applicant.steps).length === 0 && (
                              <span className="text-xs text-muted-foreground">No steps</span>
                            )}
                          </div>
                        </TableCell>

                        {/* Verified At */}
                        <TableCell className="py-4">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-foreground text-sm">
                              {formatDate(applicant.updatedAt)}
                            </p>
                            <p className="text-xs text-muted-foreground/80">
                              {formatTime(applicant.updatedAt)}
                            </p>
                            <p className="text-xs text-slate-400">
                              {timeAgo(applicant.updatedAt)}
                            </p>
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

                        {/* Actions */}
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
                                onClick={() => navigate(`/client/users/${applicant.id}`)}
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
                  {applicants.length === 0 && !loading && (
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
            {total > 10 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ← Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {Math.ceil(total / 10)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page >= Math.ceil(total / 10)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next →
                </Button>
              </div>
            )}
          </>
        )}
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
