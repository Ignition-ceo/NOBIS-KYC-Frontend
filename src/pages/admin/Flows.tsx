import { useState, useMemo } from "react";
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
import {
  Flow,
  DEMO_FLOWS,
  SUBSCRIPTION_PLANS,
  MODULE_CATALOG,
} from "@/types/flows";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STORAGE_KEY = "nobis_flows";

// Module icons mapping
const MODULE_ICONS: Record<string, React.ElementType> = {
  identity_document: CreditCard,
  selfie: ScanFace,
  email_verification: Mail,
  phone_verification: Phone,
  poa_verification: MapPin,
};

function getStoredFlows(): Flow[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error reading flows from localStorage", e);
  }
  return DEMO_FLOWS;
}

function storeFlows(flows: Flow[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flows));
}

export default function Flows() {
  const [flows, setFlows] = useState<Flow[]>(getStoredFlows);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<Flow | null>(null);
  const [deleteFlow, setDeleteFlow] = useState<Flow | null>(null);

  // Filter and sort flows
  const filteredFlows = useMemo(() => {
    let result = [...flows];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.description?.toLowerCase().includes(q)
      );
    }

    // Plan filter
    if (planFilter !== "all") {
      result = result.filter((f) => f.plan_id === planFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((f) => f.status === statusFilter);
    }

    // Sort by updated_at desc
    result.sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

    return result;
  }, [flows, searchQuery, planFilter, statusFilter]);

  const handleSaveFlow = (flow: Flow) => {
    setFlows((prev) => {
      const exists = prev.find((f) => f.id === flow.id);
      let updated: Flow[];
      if (exists) {
        updated = prev.map((f) => (f.id === flow.id ? flow : f));
        toast.success("Flow updated successfully");
      } else {
        updated = [flow, ...prev];
        toast.success("Flow created successfully");
      }
      storeFlows(updated);
      return updated;
    });
    setEditingFlow(null);
  };

  const handleEdit = (flow: Flow) => {
    setEditingFlow(flow);
    setModalOpen(true);
  };

  const handleDuplicate = (flow: Flow) => {
    const duplicated: Flow = {
      ...flow,
      id: `flow_${Date.now()}`,
      name: `${flow.name} (Copy)`,
      uses_consumed: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      modules: flow.modules?.map((m, idx) => ({
        ...m,
        id: `fm_${Date.now()}_${idx}`,
        flow_id: `flow_${Date.now()}`,
      })),
    };
    setFlows((prev) => {
      const updated = [duplicated, ...prev];
      storeFlows(updated);
      return updated;
    });
    toast.success(`Flow "${flow.name}" duplicated`);
  };

  const handleToggleStatus = (flow: Flow) => {
    const newStatus = flow.status === "active" ? "inactive" : "active";
    setFlows((prev) => {
      const updated = prev.map((f) =>
        f.id === flow.id
          ? { ...f, status: newStatus, updated_at: new Date().toISOString() }
          : f
      ) as Flow[];
      storeFlows(updated);
      return updated;
    });
    toast.success(
      `Flow "${flow.name}" ${newStatus === "active" ? "activated" : "deactivated"}`
    );
  };

  const handleDelete = () => {
    if (!deleteFlow) return;
    setFlows((prev) => {
      const updated = prev.filter((f) => f.id !== deleteFlow.id);
      storeFlows(updated);
      return updated;
    });
    toast.success(`Flow "${deleteFlow.name}" deleted`);
    setDeleteFlow(null);
  };

  const handleCreateNew = () => {
    setEditingFlow(null);
    setModalOpen(true);
  };

  const getPlanBadge = (planId: string) => {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    return plan?.name || planId;
  };

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
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Plans" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            {SUBSCRIPTION_PLANS.map((plan) => (
              <SelectItem key={plan.id} value={plan.id}>
                {plan.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                  <p className="text-muted-foreground">No flows found</p>
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
                      {getPlanBadge(flow.plan_id)}
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(flow)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(flow)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(flow)}
                        >
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
    </div>
  );
}
