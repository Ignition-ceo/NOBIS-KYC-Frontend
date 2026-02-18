import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Search,
  Filter,
  ArrowUpRight,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Types
interface AmlQueueItem {
  id: string;
  applicantId: string;
  fullName: string;
  selfieUrl?: string;
  searchName: string;
  warningTypes: string[];
  matchStatus: "NO_MATCH" | "POTENTIAL_MATCH" | "TRUE_MATCH" | "FALSE_POSITIVE";
  riskLevel: "Low" | "Medium" | "High";
  status: "REVIEWED" | "PENDING" | "HIT" | "CLEAR";
  reviewedAt: string;
  reviewedTime: string;
  matchCount: number;
}

// Mock data
const mockAmlQueue: AmlQueueItem[] = [
  {
    id: "1",
    applicantId: "696bf4ec27940c2a1fa5fc77",
    fullName: "JESTON J LETT",
    selfieUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    searchName: "JESTON J LETT",
    warningTypes: [],
    matchStatus: "NO_MATCH",
    riskLevel: "Low",
    status: "CLEAR",
    reviewedAt: "Jan 17, 2026",
    reviewedTime: "16:49",
    matchCount: 0,
  },
  {
    id: "2",
    applicantId: "696bf4ec27940c2a1fa5fc78",
    fullName: "MARIA GONZALEZ",
    selfieUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    searchName: "MARIA GONZALEZ",
    warningTypes: ["PEP", "Adverse Media"],
    matchStatus: "POTENTIAL_MATCH",
    riskLevel: "High",
    status: "PENDING",
    reviewedAt: "Jan 18, 2026",
    reviewedTime: "10:22",
    matchCount: 2,
  },
  {
    id: "3",
    applicantId: "696bf4ec27940c2a1fa5fc79",
    fullName: "JOHN SMITH",
    selfieUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    searchName: "JOHN SMITH",
    warningTypes: ["Sanctions"],
    matchStatus: "FALSE_POSITIVE",
    riskLevel: "Medium",
    status: "REVIEWED",
    reviewedAt: "Jan 16, 2026",
    reviewedTime: "14:30",
    matchCount: 1,
  },
  {
    id: "4",
    applicantId: "696bf4ec27940c2a1fa5fc80",
    fullName: "SARAH WILLIAMS",
    selfieUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    searchName: "SARAH WILLIAMS",
    warningTypes: [],
    matchStatus: "NO_MATCH",
    riskLevel: "Low",
    status: "CLEAR",
    reviewedAt: "Jan 15, 2026",
    reviewedTime: "09:15",
    matchCount: 0,
  },
  {
    id: "5",
    applicantId: "696bf4ec27940c2a1fa5fc81",
    fullName: "CARLOS RODRIGUEZ",
    selfieUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    searchName: "CARLOS RODRIGUEZ",
    warningTypes: ["PEP", "Sanctions", "Adverse Media"],
    matchStatus: "TRUE_MATCH",
    riskLevel: "High",
    status: "HIT",
    reviewedAt: "Jan 19, 2026",
    reviewedTime: "11:45",
    matchCount: 5,
  },
];

const matchStatusConfig: Record<string, { label: string; className: string }> = {
  NO_MATCH: { label: "No Match", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  POTENTIAL_MATCH: { label: "Potential Match", className: "bg-amber-50 text-amber-700 border-amber-200" },
  TRUE_MATCH: { label: "True Match", className: "bg-red-50 text-red-700 border-red-200" },
  FALSE_POSITIVE: { label: "False Positive", className: "bg-slate-50 text-slate-600 border-slate-200" },
};

const statusConfig: Record<string, { label: string; className: string }> = {
  REVIEWED: { label: "Reviewed", className: "bg-primary/10 text-primary border-primary/20" },
  PENDING: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200" },
  HIT: { label: "Hit", className: "bg-red-50 text-red-700 border-red-200" },
  CLEAR: { label: "Clear", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

const warningTypeConfig: Record<string, { className: string }> = {
  PEP: { className: "bg-purple-50 text-purple-700 border-purple-200" },
  Sanctions: { className: "bg-red-50 text-red-700 border-red-200" },
  "Adverse Media": { className: "bg-orange-50 text-orange-700 border-orange-200" },
};

export default function AmlScreening() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter queue
  const filteredQueue = mockAmlQueue.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.applicantId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    const matchesRisk = riskFilter === "All" || item.riskLevel === riskFilter;
    return matchesSearch && matchesStatus && matchesRisk;
  });

  // Stats
  const stats = {
    total: mockAmlQueue.length,
    pending: mockAmlQueue.filter((i) => i.status === "PENDING").length,
    hits: mockAmlQueue.filter((i) => i.status === "HIT").length,
    clear: mockAmlQueue.filter((i) => i.status === "CLEAR").length,
  };

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [searchQuery, statusFilter, riskFilter, pageSize]);

  const totalFiltered = filteredQueue.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const paginatedQueue = filteredQueue.slice((page - 1) * pageSize, page * pageSize);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  return (
    <div className="min-h-full bg-muted/30 p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">AML Screening</h1>
        <p className="text-muted-foreground">
          Anti-Money Laundering checks and sanctions screening queue
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Screenings</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">Pending Review</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.hits}</p>
              <p className="text-sm text-muted-foreground">Hits Found</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.clear}</p>
              <p className="text-sm text-muted-foreground">Cleared</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Table Card */}
      <Card className="shadow-lg border-border/60">
        <CardContent className="p-0">
          {/* Table Header with Filters */}
          <div className="p-4 border-b border-border/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-base font-semibold text-foreground">AML Screening Queue</h2>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name / applicant ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 w-[240px] rounded-xl"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 w-[140px] rounded-xl">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="REVIEWED">Reviewed</SelectItem>
                  <SelectItem value="HIT">Hit</SelectItem>
                  <SelectItem value="CLEAR">Clear</SelectItem>
                </SelectContent>
              </Select>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="h-10 w-[130px] rounded-xl">
                  <SelectValue placeholder="Risk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Risk</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-[350px] font-semibold">Applicant</TableHead>
                <TableHead className="w-[220px] font-semibold">Warning Types</TableHead>
                <TableHead className="w-[160px] font-semibold">Match Status</TableHead>
                <TableHead className="w-[120px] font-semibold">Risk Level</TableHead>
                <TableHead className="w-[120px] font-semibold">Status</TableHead>
                <TableHead className="w-[180px] font-semibold">Reviewed</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {totalFiltered === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <ShieldCheck className="h-10 w-10 mb-2 opacity-40" />
                      <p>No screening results found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredQueue.map((item, idx) => (
                  <TableRow
                    key={item.id}
                    className={`cursor-pointer hover:bg-muted/40 transition-colors ${
                      idx % 2 === 1 ? "bg-muted/20" : ""
                    }`}
                    onClick={() => navigate(`/admin/applicants/${item.applicantId}`)}
                  >
                    {/* Applicant */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-border">
                          <AvatarImage src={item.selfieUrl} alt={item.fullName} />
                          <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                            {getInitials(item.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {item.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID: {item.applicantId.slice(0, 12)}...
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Warning Types */}
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {item.warningTypes.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          item.warningTypes.map((type) => (
                            <Badge
                              key={type}
                              variant="outline"
                              className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                                warningTypeConfig[type]?.className || "bg-muted text-muted-foreground"
                              }`}
                            >
                              {type}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>

                    {/* Match Status */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          matchStatusConfig[item.matchStatus]?.className
                        }`}
                      >
                        {matchStatusConfig[item.matchStatus]?.label}
                      </Badge>
                    </TableCell>

                    {/* Risk Level */}
                    <TableCell>
                      <span
                        className={`text-sm font-medium ${
                          item.riskLevel === "Low"
                            ? "text-emerald-600"
                            : item.riskLevel === "Medium"
                            ? "text-amber-600"
                            : "text-red-600"
                        }`}
                      >
                        {item.riskLevel}
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          statusConfig[item.status]?.className
                        }`}
                      >
                        {statusConfig[item.status]?.label}
                      </Badge>
                    </TableCell>

                    {/* Reviewed */}
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.reviewedAt}</p>
                        <p className="text-xs text-muted-foreground">{item.reviewedTime} (GMT-4)</p>
                      </div>
                    </TableCell>

                    {/* Action */}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/applicants/${item.applicantId}`);
                        }}
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 px-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page</span>
              <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="w-[70px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {totalFiltered > 0 ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, totalFiltered)} of ${totalFiltered}` : "0 results"}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(1)}><span className="text-xs">«</span></Button>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><span className="text-xs">‹</span></Button>
                <span className="px-2 text-sm font-medium">{page} / {totalPages}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><span className="text-xs">›</span></Button>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(totalPages)}><span className="text-xs">»</span></Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
