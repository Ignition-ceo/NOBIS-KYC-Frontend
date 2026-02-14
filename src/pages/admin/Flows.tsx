import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Copy,
  Power,
  Trash2,
  CreditCard,
  User,
  Mail,
  Phone,
  MapPin,
  ScanFace,
  Loader2,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CreateFlowModal } from "@/components/admin/flows/CreateFlowModal";
import { StartVerificationModal } from "@/components/admin/StartVerificationModal";
import {
  Flow,
  SUBSCRIPTION_PLANS,
  MODULE_CATALOG,
} from "@/types/flows";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  fetchClientFlows,
  createFlowService,
  updateFlowService,
  deleteFlowService,
} from "@/services/flow";

// Module icons mapping
const MODULE_ICONS: Record<string, React.ElementType> = {
  identity_document: CreditCard,
  idDocument: CreditCard,
  selfie: ScanFace,
  email_verification: Mail,
  email: Mail,
  phone_verification: Phone,
  phone: Phone,
  poa_verification: MapPin,
  proofOfAddress: MapPin,
};

// Map backend flow data to frontend Flow type
function mapBackendFlow(backendFlow: any): Flow {
  return {
    id: backendFlow._id || backendFlow.id,
    tenant_id: backendFlow.clientId || "",
    name: backendFlow.name || "",
    description: backendFlow.description || "",
    plan_id: backendFlow.subscriptionPlan?._id || backendFlow.subscriptionPlan || "",
    max_uses: backendFlow.maxUses ?? null,
    uses_consumed: backendFlow.currentUses || 0,
    status: backendFlow.isActive === false ? "inactive" : "active",
    fraud_prevention_enabled: backendFlow.verificationConfig?.fraudPrevention ?? false,
    aml_pep_enabled: backendFlow.verificationConfig?.amlPepScreening ?? false,
    created_at: backendFlow.createdAt || new Date().toISOString(),
    updated_at: backendFlow.updatedAt || new Date().toISOString(),
    plan: backendFlow.subscriptionPlan
      ? {
          id: backendFlow.subscriptionPlan._id || backendFlow.subscriptionPlan,
          name: backendFlow.subscriptionPlan.name || "Unknown",
          description: backendFlow.subscriptionPlan.description || "",
          included_modules_json: backendFlow.subscriptionPlan.intakeModules || [],
          includes_text: "",
          risk_level_count: 0,
          sanctions_level_count: 0,
          created_at: "",
        }
      : undefined,
    modules: backendFlow.requiredVerifications?.map((v: any, idx: number) => ({
      id: `fm_${backendFlow._id}_${idx}`,
      flow_id: backendFlow._id || backendFlow.id,
      module_key: v.verificationType || v.module_key,
      enabled: true,
    })) || [],
  };
}

export default function Flows() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<Flow | null>(null);
  const [deleteFlow, setDeleteFlow] = useState<Flow | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyFlowId, setVerifyFlowId] = useState<string | null>(null);

  const loadFlows = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchClientFlows(page, searchQuery);
      const mapped = (data.flows || []).map(mapBackendFlow);
      setFlows(mapped);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Failed to load flows:", err);
      toast.error("Failed to load flows");
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    loadFlows();
  }, [loadFlows]);

  // Filter locally for status (API doesn't support status filter)
  const filteredFlows = statusFilter === "all"
    ? flows
    : flows.filter((f) => f.status === statusFilter);

  // Map frontend module keys to backend verification type keys
  const MODULE_TO_BACKEND: Record<string, string> = {
    phone_verification: "phone",
    email_verification: "email",
    identity_document: "idDocument",
    selfie: "selfie",
    poa_verification: "proofOfAddress",
  };

  const handleSaveFlow = async (flow: Flow) => {
    try {
      const exists = flows.find((f) => f.id === flow.id && !flow.id.startsWith("flow_"));
      if (exists) {
        await updateFlowService({ id: flow.id, name: flow.name, description: flow.description });
        toast.success("Flow updated successfully");
      } else {
        await createFlowService({
          name: flow.name,
          description: flow.description,
          subscriptionPlan: flow.plan_id,
          maxUses: flow.max_uses,
          requiredVerifications: flow.modules
            ?.filter((m) => m.enabled)
            .map((m, idx) => ({
              verificationType: MODULE_TO_BACKEND[m.module_key] || m.module_key,
              order: idx + 1,
              status: "pending",
            })) || [],
          verificationConfig: {
            fraudPrevention: flow.fraud_prevention_enabled,
            amlPepScreening: flow.aml_pep_enabled,
          },
        });
        toast.success("Flow created successfully");
      }
      setEditingFlow(null);
      setModalOpen(false);
      loadFlows();
    } catch (err: any) {
      console.error("Failed to save flow:", err);
      toast.error(err?.response?.data?.message || "Failed to save flow");
    }
  };

  const handleEdit = (flow: Flow) => {
    setEditingFlow(flow);
    setModalOpen(true);
  };

  const handleToggleStatus = async (flow: Flow) => {
    try {
      const newActive = flow.status === "active" ? false : true;
      await updateFlowService({ id: flow.id, isActive: newActive });
      toast.success(
        `Flow "${flow.name}" ${newActive ? "activated" : "deactivated"}`
      );
      loadFlows();
    } catch (err) {
      toast.error("Failed to update flow status");
    }
  };

  const handleDelete = async () => {
    if (!deleteFlow) return;
    try {
      await deleteFlowService(deleteFlow.id);
      toast.success(`Flow "${deleteFlow.name}" deleted`);
      setDeleteFlow(null);
      loadFlows();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete flow");
    }
  };

  const handleCreateNew = () => {
    setEditingFlow(null);
    setModalOpen(true);
  };

  const getPlanBadge = (planId: string, flow: Flow) => {
    if (flow.plan?.name) return flow.plan.name;
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    return plan?.name || planId;
  };

  if (loading && flows.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Flows Overview</h1>
          <p className="text-muted-foreground">
            Create and manage onboarding flows for different use-cases.
          </p>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Create New Flow
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search flows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Flows Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">Flow</TableHead>
              <TableHead className="w-[180px]">Modules</TableHead>
              <TableHead className="w-[120px]">Plan</TableHead>
              <TableHead className="w-[160px]">Usage</TableHead>
              <TableHead className="w-[120px]">Updated</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFlows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <p className="text-muted-foreground">
                    {loading ? "Loading..." : "No flows found"}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredFlows.map((flow) => (
                <TableRow key={flow.id}>
                  {/* Flow Name & Description */}
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {flow.name}
                        </span>
                        {flow.status === "inactive" && (
                          <Badge variant="secondary" className="text-[10px] py-0">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      {flow.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {flow.description}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  {/* Modules */}
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {flow.modules
                        ?.filter((m) => m.enabled)
                        .map((module) => {
                          const Icon = MODULE_ICONS[module.module_key] || User;
                          const catalog = MODULE_CATALOG.find(
                            (c) => c.module_key === module.module_key
                          );
                          return (
                            <Tooltip key={module.id}>
                              <TooltipTrigger asChild>
                                <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center">
                                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                {catalog?.label || module.module_key}
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                    </div>
                  </TableCell>

                  {/* Plan Badge */}
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {getPlanBadge(flow.plan_id, flow)}
                    </Badge>
                  </TableCell>

                  {/* Usage */}
                  <TableCell>
                    {flow.max_uses ? (
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">
                          {flow.uses_consumed.toLocaleString()} /{" "}
                          {flow.max_uses.toLocaleString()}
                        </div>
                        <Progress
                          value={(flow.uses_consumed / flow.max_uses) * 100}
                          className="h-1.5"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Unlimited
                      </span>
                    )}
                  </TableCell>

                  {/* Updated */}
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(flow.updated_at), "MMM d, yyyy")}
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setVerifyFlowId(flow.id); setVerifyModalOpen(true); }}>
                          <Link2 className="h-4 w-4 mr-2" />
                          Start Verification
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEdit(flow)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(flow)}>
                          <Power className="h-4 w-4 mr-2" />
                          {flow.status === "active" ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteFlow(flow)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {total > 10 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {Math.ceil(total / 10)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= Math.ceil(total / 10)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </Button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <CreateFlowModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleSaveFlow}
        editFlow={editingFlow}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteFlow} onOpenChange={() => setDeleteFlow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete flow?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteFlow?.name}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <StartVerificationModal
        open={verifyModalOpen}
        onOpenChange={setVerifyModalOpen}
        preselectedFlowId={verifyFlowId}
      />
    </div>
  );
}
