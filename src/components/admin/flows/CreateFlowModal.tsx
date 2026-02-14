import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Shield,
  AlertTriangle,
  Check,
  Loader2,
  CreditCard,
  ScanFace,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import {
  Flow,
  FlowModule,
  MODULE_CATALOG,
} from "@/types/flows";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface BackendPlan {
  _id: string;
  name: string;
  intakeModules: string[];
  defaults?: {
    riskLevel: number;
    sanctionsLevel: number;
  };
}

const MODULE_KEY_MAP: Record<string, string> = {
  phone: "phone_verification",
  email: "email_verification",
  idDocument: "identity_document",
  selfie: "selfie",
  proofOfAddress: "poa_verification",
};

const MODULE_META: Record<string, { icon: React.ElementType; label: string; description: string; color: string }> = {
  identity_document: { icon: CreditCard, label: "ID Document", description: "National ID, Passport, Driver's License", color: "text-blue-600 bg-blue-50 border-blue-200" },
  selfie: { icon: ScanFace, label: "Selfie", description: "Face verification & liveness check", color: "text-violet-600 bg-violet-50 border-violet-200" },
  email_verification: { icon: Mail, label: "Email", description: "Email address verification", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  phone_verification: { icon: Phone, label: "Phone", description: "Phone number verification via OTP", color: "text-amber-600 bg-amber-50 border-amber-200" },
  poa_verification: { icon: MapPin, label: "Proof of Address", description: "Utility bill or bank statement", color: "text-rose-600 bg-rose-50 border-rose-200" },
};

interface CreateFlowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (flow: Flow) => void;
  editFlow?: Flow | null;
}

export function CreateFlowModal({ open, onOpenChange, onSave, editFlow }: CreateFlowModalProps) {
  const isEditing = !!editFlow;
  const [step, setStep] = useState(1);
  const [plans, setPlans] = useState<BackendPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [maxUses, setMaxUses] = useState<string>("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [fraudPreventionEnabled, setFraudPreventionEnabled] = useState(true);
  const [amlPepEnabled, setAmlPepEnabled] = useState(true);
  const [enabledModules, setEnabledModules] = useState<string[]>(MODULE_CATALOG.map((m) => m.module_key));

  useEffect(() => {
    if (open && plans.length === 0) loadPlans();
  }, [open]);

  const loadPlans = async () => {
    try {
      setPlansLoading(true);
      const response = await api.get("/plans");
      const allPlans: BackendPlan[] = Array.isArray(response.data) ? response.data : [];
      setPlans(allPlans);
      if (allPlans.length > 0 && !selectedPlanId) setSelectedPlanId(allPlans[0]._id);
    } catch {
      try {
        const profileRes = await api.get("/clients/profile");
        const client = profileRes.data?.user || profileRes.data;
        const planIds: string[] = client?.subscriptionPlans || [];
        const fallbackPlans: BackendPlan[] = planIds.map((id: any) => {
          if (typeof id === "object" && id._id) return id as BackendPlan;
          return { _id: typeof id === "string" ? id : id.toString(), name: "Plan", intakeModules: ["phone", "email", "idDocument", "selfie", "proofOfAddress"], defaults: { riskLevel: 1, sanctionsLevel: 1 } };
        });
        setPlans(fallbackPlans);
        if (fallbackPlans.length > 0 && !selectedPlanId) setSelectedPlanId(fallbackPlans[0]._id);
      } catch (e) { console.error("Failed to load plans:", e); }
    } finally { setPlansLoading(false); }
  };

  const selectedPlan = plans.find((p) => p._id === selectedPlanId) || plans[0];
  const availableModules = selectedPlan ? selectedPlan.intakeModules.map((key) => MODULE_KEY_MAP[key] || key).filter(Boolean) : [];
  const fraudAvailable = (selectedPlan?.defaults?.riskLevel ?? 0) >= 1;
  const amlAvailable = (selectedPlan?.defaults?.sanctionsLevel ?? 0) >= 1;

  useEffect(() => {
    if (open) {
      setStep(1);
      if (editFlow) {
        setName(editFlow.name); setDescription(editFlow.description || ""); setMaxUses(editFlow.max_uses?.toString() || "");
        setSelectedPlanId(editFlow.plan_id); setFraudPreventionEnabled(editFlow.fraud_prevention_enabled); setAmlPepEnabled(editFlow.aml_pep_enabled);
        setEnabledModules(editFlow.modules?.filter((m) => m.enabled).map((m) => m.module_key) || MODULE_CATALOG.map((m) => m.module_key));
      } else {
        setName(""); setDescription(""); setMaxUses(""); if (plans.length > 0) setSelectedPlanId(plans[0]._id);
        setFraudPreventionEnabled(true); setAmlPepEnabled(true); setEnabledModules(MODULE_CATALOG.map((m) => m.module_key));
      }
    }
  }, [open, editFlow, plans]);

  const handleModuleToggle = (moduleKey: string) => {
    if (moduleKey === "identity_document" || moduleKey === "selfie") return;
    setEnabledModules((prev) => prev.includes(moduleKey) ? prev.filter((k) => k !== moduleKey) : [...prev, moduleKey]);
  };

  const isModuleAvailable = (moduleKey: string) => availableModules.includes(moduleKey);
  const canProceedStep1 = name.trim().length > 0 && description.trim().length > 0;
  const canProceedStep2 = !!selectedPlanId;

  const handleSubmit = () => {
    if (!name.trim() || !description.trim() || !selectedPlanId) return;
    const now = new Date().toISOString();
    const flowId = editFlow?.id || `flow_${Date.now()}`;
    const modules: FlowModule[] = MODULE_CATALOG.map((m, idx) => ({
      id: editFlow?.modules?.[idx]?.id || `fm_${flowId}_${idx}`, flow_id: flowId, module_key: m.module_key,
      enabled: enabledModules.includes(m.module_key) && isModuleAvailable(m.module_key),
    }));
    const flow: Flow = {
      id: flowId, tenant_id: "", name: name.trim(), description: description.trim(), plan_id: selectedPlanId,
      max_uses: maxUses ? parseInt(maxUses, 10) : null, uses_consumed: editFlow?.uses_consumed || 0,
      status: editFlow?.status || "active", fraud_prevention_enabled: fraudAvailable && fraudPreventionEnabled,
      aml_pep_enabled: amlAvailable && amlPepEnabled, created_at: editFlow?.created_at || now, updated_at: now,
      plan: selectedPlan ? { id: selectedPlan._id, name: selectedPlan.name, description: "", included_modules_json: selectedPlan.intakeModules, includes_text: selectedPlan.intakeModules.join(", "), risk_level_count: selectedPlan.defaults?.riskLevel || 0, sanctions_level_count: selectedPlan.defaults?.sanctionsLevel || 0, created_at: "" } : undefined,
      modules,
    };
    onSave(flow);
    onOpenChange(false);
  };

  const planColors: Record<string, string> = { BasicIDV: "from-slate-500 to-slate-600", SimpleKYC: "from-blue-500 to-blue-600", "KYC+": "from-violet-500 to-violet-600" };
  const planBadgeColors: Record<string, string> = { BasicIDV: "bg-slate-100 text-slate-700 border-slate-200", SimpleKYC: "bg-blue-100 text-blue-700 border-blue-200", "KYC+": "bg-violet-100 text-violet-700 border-violet-200" };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden rounded-xl border-0 shadow-2xl">
        <DialogDescription className="sr-only">
          {isEditing ? "Edit an existing onboarding flow" : "Create a new onboarding flow for verification"}
        </DialogDescription>

        {/* Header */}
        <div className="relative px-8 pt-8 pb-6 bg-gradient-to-b from-slate-50 to-white border-b">
          <DialogTitle className="text-xl font-semibold tracking-tight text-slate-900">
            {isEditing ? "Edit flow" : "New onboarding flow"}
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            {step === 1 && "Configure your flow details"}
            {step === 2 && "Select plan and verification modules"}
            {step === 3 && "Review and create"}
          </p>
          <div className="flex items-center gap-2 mt-5">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <button
                  onClick={() => { if (s < step) setStep(s); if (s === 2 && canProceedStep1) setStep(2); if (s === 3 && canProceedStep1 && canProceedStep2) setStep(3); }}
                  className={cn("h-8 w-8 rounded-full text-xs font-semibold flex items-center justify-center transition-all duration-200",
                    s === step ? "bg-slate-900 text-white shadow-sm" : s < step ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-400 border border-slate-200"
                  )}
                >
                  {s < step ? <Check className="h-3.5 w-3.5" /> : s}
                </button>
                {s < 3 && <div className={cn("w-16 h-px transition-colors", s < step ? "bg-emerald-300" : "bg-slate-200")} />}
              </div>
            ))}
            <span className="ml-3 text-xs text-slate-400 font-medium">{["Details", "Plan & Modules", "Review"][step - 1]}</span>
          </div>
        </div>

        {plansLoading ? (
          <div className="flex items-center justify-center h-72"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
        ) : (
          <div className="px-8 py-6 max-h-[58vh] overflow-y-auto">
            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm font-medium text-slate-700">Flow name <span className="text-red-500">*</span></Label>
                  <Input id="name" placeholder="e.g. Customer Onboarding" value={name} onChange={(e) => setName(e.target.value)} className="h-11 bg-white border-slate-200 focus-visible:ring-slate-400 placeholder:text-slate-300" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-sm font-medium text-slate-700">Description <span className="text-red-500">*</span></Label>
                  <Textarea id="description" placeholder="Briefly describe this flow's purpose..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="bg-white border-slate-200 focus-visible:ring-slate-400 placeholder:text-slate-300 resize-none" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="maxUses" className="text-sm font-medium text-slate-700">Usage limit</Label>
                  <Input id="maxUses" type="number" placeholder="Leave blank for unlimited" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className="h-11 bg-white border-slate-200 focus-visible:ring-slate-400 placeholder:text-slate-300" />
                  <p className="text-xs text-slate-400">Maximum number of applicants that can use this flow</p>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-7">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-700">Subscription plan</Label>
                  <div className="grid gap-3">
                    {plans.map((plan) => {
                      const isSelected = plan._id === selectedPlanId;
                      const gradient = planColors[plan.name] || "from-slate-500 to-slate-600";
                      const badge = planBadgeColors[plan.name] || "bg-slate-100 text-slate-600";
                      return (
                        <button key={plan._id} onClick={() => setSelectedPlanId(plan._id)}
                          className={cn("relative flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all duration-150",
                            isSelected ? "border-slate-900 bg-slate-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50")}>
                          <div className={cn("h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0", gradient)}>
                            <Sparkles className="h-4.5 w-4.5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-slate-900">{plan.name}</span>
                              <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", badge)}>{plan.intakeModules.length} modules</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Risk: {plan.defaults?.riskLevel ?? 0} · Sanctions: {plan.defaults?.sanctionsLevel ?? 0}
                              {(plan.defaults?.riskLevel ?? 0) === 0 && (plan.defaults?.sanctionsLevel ?? 0) === 0 && " · Basic verification only"}
                            </p>
                          </div>
                          <div className={cn("h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                            isSelected ? "border-slate-900 bg-slate-900" : "border-slate-300")}>
                            {isSelected && <Check className="h-3 w-3 text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-700">Verification modules</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {MODULE_CATALOG.map((module) => {
                      const meta = MODULE_META[module.module_key]; if (!meta) return null;
                      const Icon = meta.icon;
                      const isAvailable = isModuleAvailable(module.module_key);
                      const isRequired = module.module_key === "identity_document" || module.module_key === "selfie";
                      const isActive = enabledModules.includes(module.module_key) && isAvailable;
                      return (
                        <button key={module.module_key} onClick={() => isAvailable && handleModuleToggle(module.module_key)} disabled={!isAvailable || isRequired}
                          className={cn("flex items-center gap-3 p-3 rounded-lg border transition-all duration-150 text-left",
                            isActive ? "border-slate-300 bg-white shadow-sm" : "border-slate-200 bg-slate-50/50",
                            !isAvailable && "opacity-40 cursor-not-allowed", isAvailable && !isRequired && "cursor-pointer hover:border-slate-300")}>
                          <div className={cn("h-9 w-9 rounded-lg border flex items-center justify-center flex-shrink-0", isActive ? meta.color : "bg-slate-100 text-slate-400 border-slate-200")}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={cn("text-sm font-medium", isActive ? "text-slate-900" : "text-slate-500")}>{meta.label}</span>
                              {isRequired && <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">Required</span>}
                              {!isAvailable && <span className="text-[9px] uppercase tracking-wider text-red-400 font-semibold bg-red-50 px-1.5 py-0.5 rounded">Upgrade</span>}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{meta.description}</p>
                          </div>
                          <div className={cn("h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors", isActive ? "border-slate-900 bg-slate-900" : "border-slate-300")}>
                            {isActive && <Check className="h-3 w-3 text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-700">Compliance & screening</Label>
                  <div className={cn("flex items-center justify-between p-4 rounded-lg border transition-all",
                    fraudAvailable && fraudPreventionEnabled ? "border-slate-300 bg-white" : "border-slate-200 bg-slate-50/50", !fraudAvailable && "opacity-50")}>
                    <div className="flex items-center gap-3">
                      <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", fraudAvailable && fraudPreventionEnabled ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400")}>
                        <Shield className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">Fraud Prevention</p>
                        <p className="text-xs text-slate-400">{fraudAvailable ? "IP detection, biometric validation, phone reuse" : `Not included in ${selectedPlan?.name || "this plan"}`}</p>
                      </div>
                    </div>
                    <Switch checked={fraudAvailable && fraudPreventionEnabled} onCheckedChange={setFraudPreventionEnabled} disabled={!fraudAvailable} />
                  </div>
                  <div className={cn("flex items-center justify-between p-4 rounded-lg border transition-all",
                    amlAvailable && amlPepEnabled ? "border-slate-300 bg-white" : "border-slate-200 bg-slate-50/50", !amlAvailable && "opacity-50")}>
                    <div className="flex items-center gap-3">
                      <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", amlAvailable && amlPepEnabled ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-400")}>
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">AML / PEP Screening</p>
                        <p className="text-xs text-slate-400">{amlAvailable ? "Sanctions lists, PEP database, watchlists" : `Not included in ${selectedPlan?.name || "this plan"}`}</p>
                      </div>
                    </div>
                    <Switch checked={amlAvailable && amlPepEnabled} onCheckedChange={setAmlPepEnabled} disabled={!amlAvailable} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
                  <div className="p-4">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Flow</p>
                    <p className="font-semibold text-slate-900">{name}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{description}</p>
                    {maxUses && <p className="text-xs text-slate-400 mt-1">Limit: {parseInt(maxUses).toLocaleString()} uses</p>}
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Plan</p>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xs px-2.5 py-1 rounded-full border font-semibold", planBadgeColors[selectedPlan?.name || ""] || "bg-slate-100 text-slate-600 border-slate-200")}>{selectedPlan?.name}</span>
                      <span className="text-xs text-slate-400">Risk: {selectedPlan?.defaults?.riskLevel ?? 0} · Sanctions: {selectedPlan?.defaults?.sanctionsLevel ?? 0}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Modules</p>
                    <div className="flex flex-wrap gap-2">
                      {enabledModules.filter((key) => isModuleAvailable(key)).map((key) => {
                        const meta = MODULE_META[key]; if (!meta) return null; const Icon = meta.icon;
                        return (<div key={key} className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border", meta.color)}><Icon className="h-3 w-3" />{meta.label}</div>);
                      })}
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Compliance</p>
                    <div className="flex items-center gap-3">
                      <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", fraudAvailable && fraudPreventionEnabled ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-400")}>
                        {fraudAvailable && fraudPreventionEnabled ? "✓ Fraud Prevention" : "✕ Fraud Prevention"}
                      </span>
                      <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", amlAvailable && amlPepEnabled ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-400")}>
                        {amlAvailable && amlPepEnabled ? "✓ AML/PEP Screening" : "✕ AML/PEP Screening"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-8 py-5 border-t bg-slate-50/80 flex items-center justify-between">
          <div>{step > 1 && (<Button variant="ghost" onClick={() => setStep(step - 1)} className="text-slate-600 hover:text-slate-900 gap-1.5"><ArrowLeft className="h-3.5 w-3.5" />Back</Button>)}</div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-500 hover:text-slate-700">Cancel</Button>
            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)} disabled={step === 1 ? !canProceedStep1 : !canProceedStep2} className="bg-slate-900 text-white hover:bg-slate-800 gap-1.5 px-5">Continue<ArrowRight className="h-3.5 w-3.5" /></Button>
            ) : (
              <Button onClick={handleSubmit} className="bg-slate-900 text-white hover:bg-slate-800 gap-1.5 px-6">{isEditing ? "Save changes" : "Create flow"}</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
