import { Code2 } from "lucide-react";

export default function DevSpace() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dev Space</h1>
        <p className="text-muted-foreground">
          Developer tools and API documentation
        </p>
      </div>
      <div className="stat-card flex flex-col items-center justify-center py-16">
        <Code2 className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Developer tools coming soon</p>
      </div>
    </div>
  );
}
