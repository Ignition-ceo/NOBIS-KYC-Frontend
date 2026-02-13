import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, ArrowUpRight, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Mock data for risk assessment queue
interface RiskQueueItem {
  id: string;
  applicantId: string;
  fullName: string;
  selfieUrl?: string;
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  recommendedAction: "APPROVE" | "REVIEW" | "REJECT";
  flagsCount: number;
  status: "PENDING" | "REVIEWED" | "ESCALATED";
  assessedAt: string;
}

const mockRiskQueue: RiskQueueItem[] = [
  {
    id: "risk-1",
    applicantId: "1",
    fullName: "Mario Francisco De La Cruz",
    riskScore: 50,
    riskLevel: "MEDIUM",
    recommendedAction: "REVIEW",
    flagsCount: 1,
    status: "REVIEWED",
    assessedAt: "2025-07-04T13:01:04Z",
  },
  {
    id: "risk-2",
    applicantId: "2",
    fullName: "Ana María Rodríguez",
    riskScore: 15,
    riskLevel: "LOW",
    recommendedAction: "APPROVE",
    flagsCount: 0,
    status: "REVIEWED",
    assessedAt: "2025-07-03T10:22:00Z",
  },
  {
    id: "risk-3",
    applicantId: "3",
    fullName: "Carlos Enrique Méndez",
    riskScore: 78,
    riskLevel: "HIGH",
    recommendedAction: "REJECT",
    flagsCount: 4,
    status: "ESCALATED",
    assessedAt: "2025-07-02T08:45:30Z",
  },
  {
    id: "risk-4",
    applicantId: "4",
    fullName: "Luisa Fernanda García",
    riskScore: 42,
    riskLevel: "MEDIUM",
    recommendedAction: "REVIEW",
    flagsCount: 2,
    status: "PENDING",
    assessedAt: "2025-07-01T15:30:00Z",
  },
  {
    id: "risk-5",
    applicantId: "5",
    fullName: "José Manuel Pérez",
    riskScore: 85,
    riskLevel: "HIGH",
    recommendedAction: "REJECT",
    flagsCount: 5,
    status: "PENDING",
    assessedAt: "2025-06-30T09:15:00Z",
  },
];

const riskLevelConfig: Record<string, { label: string; className: string }> = {
  LOW: {
    label: "LOW",
    className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  },
  MEDIUM: {
    label: "MEDIUM",
    className: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  },
  HIGH: {
    label: "HIGH",
    className: "bg-red-500/10 text-red-700 border-red-500/20",
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

const statusConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  PENDING: {
    label: "PENDING",
    className: "bg-slate-500/10 text-slate-600 border-slate-500/20",
    icon: Clock,
  },
  REVIEWED: {
    label: "REVIEWED",
    className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    icon: CheckCircle,
  },
  ESCALATED: {
    label: "ESCALATED",
    className: "bg-red-500/10 text-red-700 border-red-500/20",
    icon: AlertTriangle,
  },
};

export default function RiskFraudQueue() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Filter and sort queue
  const filteredQueue = mockRiskQueue
    .filter((item) => {
      const matchesSearch =
        item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.applicantId.includes(searchQuery);
      const matchesLevel = levelFilter === "all" || item.riskLevel === levelFilter;
      return matchesSearch && matchesLevel;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.assessedAt).getTime() - new Date(b.assessedAt).getTime();
        case "high-low":
          return b.riskScore - a.riskScore;
        case "low-high":
          return a.riskScore - b.riskScore;
        default: // newest
          return new Date(b.assessedAt).getTime() - new Date(a.assessedAt).getTime();
      }
    });

  // Stats
  const stats = {
    total: mockRiskQueue.length,
    high: mockRiskQueue.filter((i) => i.riskLevel === "HIGH").length,
    medium: mockRiskQueue.filter((i) => i.riskLevel === "MEDIUM").length,
    low: mockRiskQueue.filter((i) => i.riskLevel === "LOW").length,
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Risk / Fraud</h1>
        <p className="text-muted-foreground">
          Monitor and manage risk assessment queue
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Assessments</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">High Risk</p>
              <p className="text-2xl font-bold text-red-600">{stats.high}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Medium Risk</p>
              <p className="text-2xl font-bold text-amber-600">{stats.medium}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Low Risk</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.low}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Queue Card */}
      <div className="stat-card p-0 overflow-hidden">
        {/* Queue Header */}
        <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-foreground">
            Risk Assessment Queue
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search applicant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 w-[200px] rounded-xl"
              />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="h-10 w-[140px] rounded-xl">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border z-50">
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-10 w-[150px] rounded-xl">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border z-50">
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="high-low">High → Low</SelectItem>
                <SelectItem value="low-high">Low → High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Queue Table */}
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-semibold">Applicant</TableHead>
              <TableHead className="font-semibold">Risk Score</TableHead>
              <TableHead className="font-semibold">Risk Level</TableHead>
              <TableHead className="font-semibold">Recommended Action</TableHead>
              <TableHead className="font-semibold">Flags</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Assessed</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQueue.map((item, index) => {
              const levelCfg = riskLevelConfig[item.riskLevel];
              const actionCfg = actionConfig[item.recommendedAction];
              const statusCfg = statusConfig[item.status];
              const StatusIcon = statusCfg.icon;

              return (
                <TableRow
                  key={item.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    index % 2 === 0 ? "bg-background" : "bg-muted/20"
                  }`}
                  onClick={() => navigate(`/admin/risk-fraud/${item.applicantId}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-border/50">
                        <AvatarImage src={item.selfieUrl} />
                        <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                          {getInitials(item.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground text-sm">
                          {item.fullName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ID: {item.applicantId}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-foreground">
                      {item.riskScore} pts
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${levelCfg.className}`}
                    >
                      {levelCfg.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${actionCfg.className}`}
                    >
                      {actionCfg.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {item.flagsCount} flag{item.flagsCount !== 1 ? "s" : ""}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold inline-flex items-center gap-1.5 ${statusCfg.className}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {statusCfg.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-foreground text-sm">
                        {formatDate(item.assessedAt)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(item.assessedAt)} (GMT-4)
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/risk-fraud/${item.applicantId}`);
                      }}
                    >
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filteredQueue.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No risk assessments found</p>
          </div>
        )}
      </div>
    </div>
  );
}
