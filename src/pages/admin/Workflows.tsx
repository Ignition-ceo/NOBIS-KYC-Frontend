import { GitBranch } from "lucide-react";

export default function Workflows() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Workflows</h1>
        <p className="text-muted-foreground">
          Configure and manage verification workflows
        </p>
      </div>
      <div className="stat-card flex flex-col items-center justify-center py-16">
        <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No workflows configured</p>
      </div>
    </div>
  );
}
