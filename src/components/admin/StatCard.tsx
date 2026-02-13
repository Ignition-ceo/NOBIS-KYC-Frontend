import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  variant?: "blue" | "green" | "yellow" | "red";
}

export function StatCard({ title, value, change, icon: Icon, variant = "blue" }: StatCardProps) {
  const iconStyles = {
    blue: "stat-icon-blue",
    green: "stat-icon-green",
    yellow: "stat-icon-yellow",
    red: "stat-icon-red",
  };

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("stat-icon", iconStyles[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-1">{title}</p>
      <p className="text-3xl font-bold text-foreground">{value}</p>
      {change && (
        <p className="text-sm text-success mt-2">{change} This Month</p>
      )}
    </div>
  );
}
