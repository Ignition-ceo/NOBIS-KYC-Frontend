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
  Loader2,
  XCircle,
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
import {
  fetchSanctionsEvaluations,
  type AmlQueueItem,
} from "@/services/sanctionsEvaluation";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queueItems, setQueueItems] = useState<AmlQueueItem[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, hits: 0, clear: 0 });

  // Fetch sanctions evaluations from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchSanctionsEvaluations({
          status: statusFilter !== "All" ? statusFilter : undefined,
          riskLevel: riskFilter !== "All" ? riskFilter : undefined,
        });
        setQueueItems(response.data);
        setStats(response.stats);
      } catch (err: any) {
        console.error("Failed to fetch sanctions evaluations:", err);
        setError(err?.response?.data?.message || "Failed to load AML screenings");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [statusFilter, riskFilter]);

  // Client-side search filtering
  const filteredQueue = queueItems.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.fullName.toLowerCase().includes(q) ||
      item.applicantId.toString().includes(q) ||
      item.email?.toLowerCase().includes(q)
    );
  });

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

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

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
              <p className="text-muted-foreground text-sm">Loading AML screenings...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <XCircle className="h-12 w-12 text-red-400 mb-4" />
              <p className="text-red-600 font-medium mb-1">Failed to load data</p>
              <p className="text-muted-foreground text-sm">{error}</p>
            </div>
          )}

          {/* Table */}
          {!loading && !error && (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-[350px] font-semibold">Applicant</TableHead>
                  <TableHead className="w-[220px] font-semibold">Warning Types</TableHead>
                  <TableHead className="w-[160px] font-semibold">Match Status</TableHead>
                  <TableHead className="w-[120px] font-semibold">Risk Level</TableHead>
                  <TableHead className="w-[120px] font-semibold">Status</TableHead>
                  <TableHead className="w-[180px] font-semibold">Screened</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQueue.length === 0 ? (
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
                      key={item._id}
                      className={`cursor-pointer hover:bg-muted/40 transition-colors ${
                        idx % 2 === 1 ? "bg-muted/20" : ""
                      }`}
                      onClick={() => navigate(`/client/aml-sanctions/${item.applicantId}`)}
                    >
                      {/* Applicant */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-border">
                            <AvatarImage src={item.selfieUrl || undefined} alt={item.fullName} />
                            <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                              {getInitials(item.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {item.fullName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ID: {item.applicantIdRemote || item.applicantId.toString().slice(0, 12) + "..."}
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
                            matchStatusConfig[item.matchStatus]?.className || ""
                          }`}
                        >
                          {matchStatusConfig[item.matchStatus]?.label || item.matchStatus}
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
                            statusConfig[item.status]?.className || ""
                          }`}
                        >
                          {statusConfig[item.status]?.label || item.status}
                        </Badge>
                      </TableCell>

                      {/* Screened Date */}
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {formatDate(item.assessedAt)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(item.assessedAt)} (GMT-4)
                          </p>
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
                            navigate(`/client/aml-sanctions/${item.applicantId}`);
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
