import { LayoutGrid, CheckCircle2, Clock, XCircle } from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { TransactionsChart } from "@/components/admin/TransactionsChart";
import { RecentVerifications } from "@/components/admin/RecentVerifications";
import { Button } from "@/components/ui/button";

const recentVerifications = [
  { id: "1", name: "JESTON J LETT", date: "17/01/2026", status: "verified" as const },
  { id: "2", name: "TEST R BIRDE", date: "17/01/2026", status: "pending" as const },
  { id: "3", name: "CALVIN LEON", date: "17/01/2026", status: "pending" as const },
];

export default function Dashboard() {
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
          value={67}
          change="+100%"
          icon={LayoutGrid}
          variant="blue"
        />
        <StatCard
          title="Approved Verifications"
          value={11}
          change="+100%"
          icon={CheckCircle2}
          variant="green"
        />
        <StatCard
          title="Pending Verifications"
          value={55}
          change="+100%"
          icon={Clock}
          variant="yellow"
        />
        <StatCard
          title="Rejected Verifications"
          value={1}
          change="+100%"
          icon={XCircle}
          variant="red"
        />
        <TransactionsChart used={67} />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Verification Statistics */}
        <div className="stat-card lg:col-span-1">
          <h3 className="text-lg font-semibold text-foreground mb-4">Verification Statistics</h3>
          <div className="flex items-center justify-center h-48">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="hsl(38, 92%, 50%)"
                  strokeWidth="12"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="hsl(142, 71%, 45%)"
                  strokeWidth="12"
                  strokeDasharray="50 200"
                  strokeDashoffset="0"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="hsl(217, 91%, 50%)"
                  strokeWidth="12"
                  strokeDasharray="175 200"
                  strokeDashoffset="-50"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="hsl(0, 84%, 60%)"
                  strokeWidth="12"
                  strokeDasharray="5 200"
                  strokeDashoffset="-225"
                />
              </svg>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-sm text-muted-foreground">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-destructive" />
              <span className="text-sm text-muted-foreground">Rejected</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-success" />
              <span className="text-sm text-muted-foreground">Approved</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-warning" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
          </div>
        </div>

        {/* Plan Breakdown */}
        <div className="stat-card lg:col-span-1">
          <h3 className="text-lg font-semibold text-foreground mb-4">Plan Breakdown</h3>
          <div className="h-48 flex items-end justify-center gap-4 pb-4">
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 bg-warning rounded-t" style={{ height: "20px" }} />
              <span className="text-xs text-muted-foreground">Sep</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 bg-warning rounded-t" style={{ height: "30px" }} />
              <span className="text-xs text-muted-foreground">Oct</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 bg-warning rounded-t" style={{ height: "60px" }} />
              <span className="text-xs text-muted-foreground">Dec</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 bg-warning rounded-t" style={{ height: "120px" }} />
              <span className="text-xs text-muted-foreground">Jan</span>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">SimpleKYC</p>
              <p className="text-xs text-muted-foreground">IDV with additional compliance</p>
            </div>
            <span className="ml-auto font-bold text-foreground">63</span>
          </div>
        </div>

        {/* Recent Verifications */}
        <RecentVerifications verifications={recentVerifications} />
      </div>
    </div>
  );
}
