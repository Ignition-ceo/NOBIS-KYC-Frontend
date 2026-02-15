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
  Trash2,
  Download,
  RefreshCw,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ApplicantSidePanel, Applicant } from "@/components/admin/ApplicantSidePanel";
import { VerificationStepIcon, StepState } from "@/components/admin/VerificationStepIcon";
import { fetchApplicants, updateApplicantService, deleteApplicantService } from "@/services/applicant";
import { toast } from "sonner";

// ─── Map backend verification status to display status ───
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

// ─── Map backend applicant to frontend shape ───
function mapBackendApplicant(a: any): Applicant & {
  steps: Record<string, StepState>;
  documentType?: string;
  flowName?: string;
} {
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

// ─── Step definitions ───
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
  return allStepDefinitions.filter((def) => def.stateKey in steps);
};

// ─── Config ───
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

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

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
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{ ids: string[]; names: string[] } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // ─── Load applicants ───
  const loadApplicants = useCallback(async () => {
    try {
      setLoading(true);

      let verificationStatus = "";
      if (activeTab === "verified") verificationStatus = "verified";
      else if (activeTab === "pending") verificationStatus = "pending";
      else if (activeTab === "rejected") verificationStatus = "rejected";

      if (statusFilter !== "all") {
        if (statusFilter === "verified") verificationStatus = "verified";
        else if (statusFilter === "pending") verificationStatus = "pending";
        else if (statusFilter === "needs-review") verificationStatus = "requested";
        else if (statusFilter === "rejected") verificationStatus = "rejected";
      }

      const params: Record<string, any> = {
        page,
        limit: pageSize,
        searchText: searchQuery || undefined,
        verificationStatus: verificationStatus || undefined,
        sortBy: sortBy === "newest" || sortBy === "oldest" ? "createdAt" : undefined,
        sortOrder: sortBy === "oldest" ? "asc" : "desc",
        nameSort: sortBy === "name-az" ? "1" : sortBy === "name-za" ? "-1" : undefined,
      };

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
  }, [page, pageSize, searchQuery, activeTab, statusFilter, sortBy]);

  useEffect(() => {
    loadApplicants();
  }, [loadApplicants]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, activeTab, statusFilter, sortBy, pageSize]);

  // ─── Stats ───
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

  // ─── Status change ───
  const handleStatusChange = async (applicantId: string, newStatus: string) => {
    try {
      await updateApplicantService(applicantId, { overallStatus: newStatus.toLowerCase() });
      toast.success(`Applicant status updated to ${newStatus}`);
      loadApplicants();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  // ─── Delete single or bulk ───
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await Promise.all(deleteTarget.ids.map((id) => deleteApplicantService(id)));
      toast.success(
        deleteTarget.ids.length === 1
          ? "Applicant deleted"
          : `${deleteTarget.ids.length} applicants deleted`
      );
      setSelectedIds((prev) => {
        const next = new Set(prev);
        deleteTarget.ids.forEach((id) => next.delete(id));
        return next;
      });
      setDeleteTarget(null);
      loadApplicants();
    } catch (err) {
      toast.error("Failed to delete applicant(s)");
    } finally {
      setDeleting(false);
    }
  };

  const requestDeleteSingle = (applicant: any) => {
    setDeleteTarget({ ids: [applicant.id], names: [applicant.fullName || applicant.email] });
  };

  const requestDeleteBulk = () => {
    const ids = Array.from(selectedIds);
    const names = applicants.filter((a) => selectedIds.has(a.id)).map((a) => a.fullName || a.email);
    setDeleteTarget({ ids, names });
  };

  // ─── Selection ───
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === applicants.length && applicants.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(applicants.map((a) => a.id)));
    }
  };

  // ─── Bulk status change ───
  const handleBulkStatusChange = async (newStatus: string) => {
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          updateApplicantService(id, { overallStatus: newStatus.toLowerCase() })
        )
      );
      toast.success(`${selectedIds.size} applicant(s) updated to ${newStatus}`);
      setSelectedIds(new Set());
      loadApplicants();
    } catch (err) {
      toast.error("Failed to update applicants");
    }
  };

  // ─── Bulk export ───
  const handleBulkExport = () => {
    const selected = applicants.filter((a) => selectedIds.has(a.id));
    const csv = [
      ["Name", "Email", "Status", "Updated At"].join(","),
      ...selected.map((a) =>
        [a.fullName, a.email, a.status, a.updatedAt].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nobis-applicants-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${selected.length} applicant(s)`);
  };

  // ─── Formatting helpers ───
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

  // ─── Pagination helpers ───
  const paginationStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const paginationEnd = Math.min(page * pageSize, total);

  const getPageNumbers = (): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("ellipsis");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

  const hasSelection = selectedIds.size > 0;

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="flex gap-0 h-[calc(100vh-80px)]">
      <div className="flex-1 flex flex-col min-w-0">
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between p-6 pb-0">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Users</h1>
            <p className="text-muted-foreground text-sm">
              Review and manage applicant verifications
            </p>
          </div>
        </div>

        {/* ─── Stats Bar ─── */}
        <div className="flex items-center gap-6 px-6 pt-4 pb-2">
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

        {/* ─── Tabs ─── */}
        <div className="flex items-center gap-1 px-6 border-b">
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

        {/* ─── Filters Row ─── */}
        <div className="flex items-center gap-3 px-6 py-4">
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

        {/* ════════════════════════════════════════════════════════
            NEW FEATURE: Bulk Actions Bar
            ════════════════════════════════════════════════════════ */}
        {hasSelection && (
          <div className="flex items-center gap-3 px-6 py-2.5 bg-primary/5 border-y border-primary/10">
            <span className="text-sm font-semibold text-primary">
              {selectedIds.size} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
              onClick={handleBulkExport}
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Change Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuItem onClick={() => handleBulkStatusChange("APPROVED")} className="gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Approve
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusChange("NEEDS_REVIEW")} className="gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" /> Needs Review
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusChange("REJECTED")} className="gap-2 text-red-600">
                  <XCircle className="h-4 w-4" /> Reject
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs border-red-300 text-red-600 hover:bg-red-50"
              onClick={requestDeleteBulk}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Selected
            </Button>
            <button
              className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear selection
            </button>
          </div>
        )}

        {/* ─── Loading State ─── */}
        {loading && applicants.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* ════════════════════════════════════════════════════
                IMPROVED: Scrollable Table Area
                ════════════════════════════════════════════════════ */}
            <div className="flex-1 overflow-auto px-6">
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

                          {/* ════════════════════════════════════════
                              IMPROVED: Actions with Delete option
                              ════════════════════════════════════════ */}
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
                                <DropdownMenuSeparator />
                                {/* NEW: Delete option */}
                                <DropdownMenuItem
                                  className="gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                  onClick={() => requestDeleteSingle(applicant)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete User
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
            </div>

            {/* ════════════════════════════════════════════════════════
                NEW FEATURE: Full Pagination with Page Size Selector
                ════════════════════════════════════════════════════════ */}
            <div className="flex items-center justify-between px-6 py-3 border-t bg-card flex-shrink-0 flex-wrap gap-2">
              {/* Rows per page */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rows per page:</span>
                <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                  <SelectTrigger className="w-[70px] h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Range display */}
              <span className="text-sm text-muted-foreground">
                {paginationStart}–{paginationEnd} of {total}
              </span>

              {/* Page navigation */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page <= 1}
                  onClick={() => setPage(1)}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {getPageNumbers().map((p, idx) =>
                  p === "ellipsis" ? (
                    <span key={`ellipsis-${idx}`} className="px-1.5 text-muted-foreground text-sm">
                      …
                    </span>
                  ) : (
                    <Button
                      key={p}
                      variant={page === p ? "default" : "outline"}
                      size="icon"
                      className="h-8 w-8 text-sm"
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  )
                )}

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= totalPages}
                  onClick={() => setPage(totalPages)}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── Side Panel ─── */}
      {selectedApplicant && (
        <ApplicantSidePanel
          applicant={selectedApplicant}
          onClose={() => setSelectedApplicant(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* ════════════════════════════════════════════════════════
          NEW FEATURE: Delete Confirmation Modal
          ════════════════════════════════════════════════════════ */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteTarget?.ids.length === 1 ? "user" : `${deleteTarget?.ids.length} users`}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.ids.length === 1 ? (
                <>
                  This will permanently delete <strong>{deleteTarget.names[0]}</strong> and all
                  associated verification data. This action cannot be undone.
                </>
              ) : (
                <>
                  This will permanently delete {deleteTarget?.ids.length} users and all their
                  associated verification data. This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
