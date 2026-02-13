import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Verification {
  id: string;
  name: string;
  date: string;
  status: "verified" | "pending" | "rejected";
}

interface RecentVerificationsProps {
  verifications: Verification[];
}

export function RecentVerifications({ verifications }: RecentVerificationsProps) {
  const getStatusClass = (status: Verification["status"]) => {
    switch (status) {
      case "verified":
        return "status-verified";
      case "pending":
        return "status-pending";
      case "rejected":
        return "status-rejected";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="stat-card">
      <h3 className="text-lg font-semibold text-foreground mb-4">Recent Verifications</h3>
      <div className="space-y-3">
        {verifications.map((v) => (
          <div
            key={v.id}
            className="flex items-center justify-between py-2"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                  {getInitials(v.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground truncate max-w-[120px]">
                  {v.name}
                </p>
                <p className="text-xs text-muted-foreground">{v.date}</p>
              </div>
            </div>
            <span className={cn("status-badge", getStatusClass(v.status))}>
              {v.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
