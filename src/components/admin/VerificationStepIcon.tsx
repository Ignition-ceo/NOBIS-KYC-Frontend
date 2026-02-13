import { Phone, Mail, CreditCard, ScanFace, MapPin, LucideIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type StepState = "na" | "pending" | "passed" | "failed";

interface VerificationStepIconProps {
  icon: "phone" | "mail" | "id-card" | "scan-face" | "map-pin";
  state: StepState;
  tooltip: string;
}

const iconMap: Record<string, LucideIcon> = {
  phone: Phone,
  mail: Mail,
  "id-card": CreditCard,
  "scan-face": ScanFace,
  "map-pin": MapPin,
};

const stateStyles: Record<StepState, { bg: string; border: string; icon: string }> = {
  na: {
    bg: "bg-slate-200/40",
    border: "border-slate-300/50",
    icon: "text-slate-500",
  },
  pending: {
    bg: "bg-amber-100/60",
    border: "border-amber-400/50",
    icon: "text-amber-700",
  },
  passed: {
    bg: "bg-emerald-100/60",
    border: "border-emerald-400/50",
    icon: "text-emerald-700",
  },
  failed: {
    bg: "bg-red-100/60",
    border: "border-red-400/50",
    icon: "text-red-700",
  },
};

export function VerificationStepIcon({ icon, state, tooltip }: VerificationStepIconProps) {
  const IconComponent = iconMap[icon];
  const styles = stateStyles[state];

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-lg border transition-all",
              styles.bg,
              styles.border
            )}
          >
            <IconComponent className={cn("h-4 w-4", styles.icon)} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p>{tooltip}</p>
          <p className="text-muted-foreground capitalize">({state === "na" ? "Not Started" : state})</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
