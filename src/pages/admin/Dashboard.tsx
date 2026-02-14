import { useEffect, useState } from "react";
import { LayoutGrid, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { TransactionsChart } from "@/components/admin/TransactionsChart";
import { RecentVerifications } from "@/components/admin/RecentVerifications";
import { Button } from "@/components/ui/button";
import { fetchDashboardStats } from "@/services/dashboard";

interface DashboardData {
  totalVerifications: number;
  approvedVerifications: number;
  pendingVerifications: number;
  rejectedVerifications: number;
  transactionsUsed: number;
  transactionLimit: number;
  monthlyGrowth: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  currentMonthStats: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  lastMonthStats: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  recentApplicants: Array<{
    _id: string;
    name: string;
    image: string | null;
    createdAt: string;
    updatedAt: string;
    status: string;
    riskValue: number | null;
    riskStatus: string | null;
  }>;
  planBreakdownStats: {
    monthlyProgress: Array<{ month: string; [planName: string]: number | string }>;
    legend: Array<{ name: string; count: number; color: string; description: string }>;
  };
}

const mapStatus = (status: string): "verified" | "pending" | "rejected" => {
  switch (status) {
    case "verified":
      return "verified";
    case "rejected":
      return "rejected";
    default:
      return "pending";
  }
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const stats = await fetchDashboardStats();
        setData(stats);
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{error || "No data available"}</p>
      </div>
    );
  }

  const recentVerifications = data.recentApplicants.map((a) => ({
    id: a._id,
    name: a.name || "Unknown",
    date: new Date(a.createdAt).toLocaleDateString("en-GB"),
    status: mapStatus(a.status),
    image: a.image,
  }));

  const growthLabel = (value: number) =>
    value >= 0 ? `+${value}%` : `${value}%`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Overview</h1>
          <p className="text-muted-foreground">
            Monitor your verification statistics and transaction usage
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          Start Verification
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Verifications"
          value={data.totalVerifications}
          change={growthLabel(data.monthlyGrowth.total)}
          icon={LayoutGrid}
          variant="blue"
        />
        <StatCard
          title="Approved Verifications"
          value={data.approvedVerifications}
          change={growthLabel(data.monthlyGrowth.approved)}
          icon={CheckCircle2}
          variant="green"
        />
        <StatCard
          title="Pending Verifications"
          value={data.pendingVerifications}
          change={growthLabel(data.monthlyGrowth.pending)}
          icon={Clock}
          variant="yellow"
        />
        <StatCard
          title="Rejected Verifications"
          value={data.rejectedVerifications}
          change={growthLabel(data.monthlyGrowth.rejected)}
          icon={XCircle}
          variant="red"
        />
        <TransactionsChart used={data.transactionsUsed} total={data.transactionLimit} />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Verification Statistics - Donut Chart */}
        <div className="stat-card lg:col-span-1">
          <h3 className="text-lg font-semibold text-foreground mb-4">Verification Statistics</h3>
          <div className="flex items-center justify-center h-48">
            <div className="relative w-40 h-40">
              {(() => {
                const total = data.totalVerifications || 1;
                const approvedPct = (data.approvedVerifications / total) * 251;
                const pendingPct = (data.pendingVerifications / total) * 251;
                const rejectedPct = (data.rejectedVerifications / total) * 251;
                let offset = 0;
                return (
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Pending (yellow) */}
                    <circle
                      cx="50" cy="50" r="40" fill="none"
                      stroke="hsl(38, 92%, 50%)" strokeWidth="12"
                      strokeDasharray={`${pendingPct} ${251 - pendingPct}`}
                      strokeDashoffset={`${-(offset)}`}
                      transform="rotate(-90 50 50)"
                    />
                    {(() => { offset += pendingPct; return null; })()}
                    {/* Approved (green) */}
                    <circle
                      cx="50" cy="50" r="40" fill="none"
                      stroke="hsl(142, 71%, 45%)" strokeWidth="12"
                      strokeDasharray={`${approvedPct} ${251 - approvedPct}`}
                      strokeDashoffset={`${-(offset)}`}
                      transform="rotate(-90 50 50)"
                    />
                    {(() => { offset += approvedPct; return null; })()}
                    {/* Rejected (red) */}
                    <circle
                      cx="50" cy="50" r="40" fill="none"
                      stroke="hsl(0, 84%, 60%)" strokeWidth="12"
                      strokeDasharray={`${rejectedPct} ${251 - rejectedPct}`}
                      strokeDashoffset={`${-(offset)}`}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                );
              })()}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-warning" />
              <span className="text-sm text-muted-foreground">Pending ({data.pendingVerifications})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-destructive" />
              <span className="text-sm text-muted-foreground">Rejected ({data.rejectedVerifications})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-success" />
              <span className="text-sm text-muted-foreground">Approved ({data.approvedVerifications})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-sm text-muted-foreground">Total ({data.totalVerifications})</span>
            </div>
          </div>
        </div>

        {/* Plan Breakdown */}
        <div className="stat-card lg:col-span-1">
          <h3 className="text-lg font-semibold text-foreground mb-4">Plan Breakdown</h3>
          <div className="h-48 flex items-end justify-center gap-4 pb-4">
            {data.planBreakdownStats.monthlyProgress.slice(-4).map((month) => {
              const total = Object.entries(month)
                .filter(([key]) => key !== "month")
                .reduce((sum, [, val]) => sum + (typeof val === "number" ? val : 0), 0);
              const maxHeight = 120;
              const height = Math.max(total * 4, 8);
              return (
                <div key={month.month} className="flex flex-col items-center gap-1">
                  <div
                    className="w-12 bg-warning rounded-t"
                    style={{ height: `${Math.min(height, maxHeight)}px` }}
                  />
                  <span className="text-xs text-muted-foreground">{month.month}</span>
                </div>
              );
            })}
          </div>
          {data.planBreakdownStats.legend.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-border">
              {data.planBreakdownStats.legend.map((plan) => (
                <div key={plan.name} className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${plan.color}20` }}
                  >
                    <CheckCircle2 className="h-5 w-5" style={{ color: plan.color }} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                  </div>
                  <span className="ml-auto font-bold text-foreground">{plan.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Verifications */}
        <RecentVerifications verifications={recentVerifications} />
      </div>
    </div>
  );
}
