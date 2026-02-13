import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, AlertTriangle, Check } from "lucide-react";
import {
  Flow,
  FlowModule,
  SubscriptionPlan,
  MODULE_CATALOG,
  SUBSCRIPTION_PLANS,
  CURRENT_TENANT_ID,
} from "@/types/flows";
import { cn } from "@/lib/utils";

interface CreateFlowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (flow: Flow) => void;
  editFlow?: Flow | null;
}

export function CreateFlowModal({
  open,
  onOpenChange,
  onSave,
  editFlow,
}: CreateFlowModalProps) {
  const isEditing = !!editFlow;

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [maxUses, setMaxUses] = useState<string>("");
  const [selectedPlanId, setSelectedPlanId] = useState(SUBSCRIPTION_PLANS[0].id);
  const [fraudPreventionEnabled, setFraudPreventionEnabled] = useState(true);
  const [amlPepEnabled, setAmlPepEnabled] = useState(true);
  const [enabledModules, setEnabledModules] = useState<string[]>(
    MODULE_CATALOG.map((m) => m.module_key)
  );

  // Get selected plan
  const selectedPlan = SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanId) || SUBSCRIPTION_PLANS[0];

  // Reset form when modal opens/closes or editFlow changes
  useEffect(() => {
    if (open) {
      if (editFlow) {
        setName(editFlow.name);
        setDescription(editFlow.description || "");
        setMaxUses(editFlow.max_uses?.toString() || "");
        setSelectedPlanId(editFlow.plan_id);
        setFraudPreventionEnabled(editFlow.fraud_prevention_enabled);
        setAmlPepEnabled(editFlow.aml_pep_enabled);
        setEnabledModules(
          editFlow.modules?.filter((m) => m.enabled).map((m) => m.module_key) ||
            MODULE_CATALOG.map((m) => m.module_key)
        );
      } else {
        setName("");
        setDescription("");
        setMaxUses("");
        setSelectedPlanId(SUBSCRIPTION_PLANS[0].id);
        setFraudPreventionEnabled(true);
        setAmlPepEnabled(true);
        setEnabledModules(MODULE_CATALOG.map((m) => m.module_key));
      }
    }
  }, [open, editFlow]);

  const handleModuleToggle = (moduleKey: string) => {
    // identity_document and selfie are required
    if (moduleKey === "identity_document" || moduleKey === "selfie") {
      return;
    }
    setEnabledModules((prev) =>
      prev.includes(moduleKey)
        ? prev.filter((k) => k !== moduleKey)
        : [...prev, moduleKey]
    );
  };

  const isModuleAvailable = (moduleKey: string) => {
    return selectedPlan.included_modules_json.includes(moduleKey);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    const now = new Date().toISOString();
    const flowId = editFlow?.id || `flow_${Date.now()}`;

    const modules: FlowModule[] = MODULE_CATALOG.map((m, idx) => ({
      id: editFlow?.modules?.[idx]?.id || `fm_${flowId}_${idx}`,
      flow_id: flowId,
      module_key: m.module_key,
      enabled: enabledModules.includes(m.module_key),
    }));

    const flow: Flow = {
      id: flowId,
      tenant_id: CURRENT_TENANT_ID,
      name: name.trim(),
      description: description.trim(),
      plan_id: selectedPlanId,
      max_uses: maxUses ? parseInt(maxUses, 10) : null,
      uses_consumed: editFlow?.uses_consumed || 0,
      status: editFlow?.status || "active",
      fraud_prevention_enabled: fraudPreventionEnabled,
      aml_pep_enabled: amlPepEnabled,
      created_at: editFlow?.created_at || now,
      updated_at: now,
      plan: selectedPlan,
      modules,
    };

    onSave(flow);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? "Edit flow" : "Create new onboarding flow"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 grid grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="min-h-0 overflow-y-auto p-6 pr-4 space-y-6 border-r">
            {/* Flow Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Flow Details
              </h3>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="maxUses">Max Uses for This Flow</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    placeholder="Max Uses for This Flow"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    You have transactions available.
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Options */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Additional Options
              </h3>

              {/* Fraud Prevention Card */}
              <Card className={cn(
                "transition-colors",
                fraudPreventionEnabled ? "border-primary/30 bg-primary/5" : ""
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">Fraud Prevention</span>
                    </div>
                    <Switch
                      checked={fraudPreventionEnabled}
                      onCheckedChange={setFraudPreventionEnabled}
                    />
                  </div>
                  {fraudPreventionEnabled && (
                    <div className="space-y-1.5 ml-6">
                      <p className="text-xs font-medium text-muted-foreground">
                        Level 1 Features:
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        <li>• Phone reuse detection</li>
                        <li>• Biometric validation</li>
                        <li>• Location risk assessment</li>
                        <li>• IP/VPN detection</li>
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AML/PEP Card */}
              <Card className={cn(
                "transition-colors",
                amlPepEnabled ? "border-primary/30 bg-primary/5" : ""
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span className="font-medium text-sm">AML/PEP Screening</span>
                    </div>
                    <Switch
                      checked={amlPepEnabled}
                      onCheckedChange={setAmlPepEnabled}
                    />
                  </div>
                  {amlPepEnabled && (
                    <div className="space-y-1.5 ml-6">
                      <p className="text-xs font-medium text-muted-foreground">
                        Level 1 Screening:
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        <li>• Global sanctions lists</li>
                        <li>• PEP database</li>
                        <li>• AML watchlists</li>
                        <li>• Biometric search</li>
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column */}
          <div className="min-h-0 overflow-y-auto p-6 pl-4 space-y-6">
            <div className="p-6 space-y-6">
              {/* Subscription Plan */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Subscription Plan
                </h3>

                <div className="space-y-3">
                  <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBSCRIPTION_PLANS.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <p className="text-xs text-muted-foreground">
                    Includes: {selectedPlan.includes_text}
                  </p>

                  {/* Plan Card */}
                  <Card className="border-primary/40 bg-primary/5">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">{selectedPlan.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Risk Level: {selectedPlan.risk_level_count} | Sanctions: {selectedPlan.sanctions_level_count}
                          </p>
                        </div>
                        <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-3.5 w-3.5 text-primary-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Verification Types */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    Verification Types
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Available modules for {selectedPlan.name} plan
                  </p>
                </div>

                <div className="space-y-3">
                  {MODULE_CATALOG.map((module) => {
                    const isAvailable = isModuleAvailable(module.module_key);
                    const isRequired =
                      module.module_key === "identity_document" ||
                      module.module_key === "selfie";
                    const isChecked = enabledModules.includes(module.module_key);

                    return (
                      <div
                        key={module.module_key}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                          isChecked && isAvailable
                            ? "border-primary/30 bg-primary/5"
                            : "border-border bg-background",
                          !isAvailable && "opacity-50"
                        )}
                      >
                        <Checkbox
                          id={module.module_key}
                          checked={isChecked}
                          disabled={!isAvailable || isRequired}
                          onCheckedChange={() => handleModuleToggle(module.module_key)}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor={module.module_key}
                            className={cn(
                              "text-sm font-medium cursor-pointer",
                              !isAvailable && "cursor-not-allowed"
                            )}
                          >
                            {module.label}
                            {isRequired && (
                              <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">
                                (required)
                              </span>
                            )}
                          </Label>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {module.helper}
                          </p>
                          {!isAvailable && (
                            <p className="text-xs text-destructive mt-1">
                              Not available on this plan
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            {isEditing ? "Save Changes" : "Create New Flow"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
