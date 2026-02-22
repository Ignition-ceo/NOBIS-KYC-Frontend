import { useState, useEffect, useCallback } from "react";
import {
  Settings as SettingsIcon,
  Webhook,
  Link2,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  Shield,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";



// Event options for webhooks
const WEBHOOK_EVENTS = [
  { id: "applicant.created", label: "Applicant Created" },
  { id: "applicant.updated", label: "Applicant Updated" },
  { id: "applicant.status_changed", label: "Applicant Status Changed" },
  { id: "verification.completed", label: "Verification Completed" },
] as const;

type WebhookEvent = (typeof WEBHOOK_EVENTS)[number]["id"];

interface Webhook {
  id: string;
  url: string;
  events: WebhookEvent[];
  status: "active" | "inactive";
  signingSecret?: string;
  createdAt: string;
}

interface RedirectSettings {
  successUrl: string;
  cancelUrl: string;
  allowedDomains: string;
}

export default function Settings() {
  const { toast } = useToast();

  // Webhooks state
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [webhooksLoading, setWebhooksLoading] = useState(true);
  const [webhookModalOpen, setWebhookModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [deleteWebhookId, setDeleteWebhookId] = useState<string | null>(null);
  const [webhookForm, setWebhookForm] = useState({
    url: "",
    events: [] as WebhookEvent[],
  });
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [newSigningSecret, setNewSigningSecret] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Redirect settings state
  const [redirectSettings, setRedirectSettings] = useState<RedirectSettings>({
    successUrl: "",
    cancelUrl: "",
    allowedDomains: "",
  });
  const [savingRedirect, setSavingRedirect] = useState(false);

  // Screening provider state
  const [screeningConfig, setScreeningConfig] = useState({
    provider: "open_sanctions",
    threshold: 0.7,
    dataset: "default",
  });
  const [savingScreening, setSavingScreening] = useState(false);
  const [screeningLoaded, setScreeningLoaded] = useState(false);

  // Fetch webhooks from API
  const fetchWebhooks = useCallback(async () => {
    setWebhooksLoading(true);
    try {
      const res = await api.get("/webhooks");
      const data = res.data;
      setWebhooks(data.webhooks || data || []);
    } catch (error) {
      console.error("Failed to fetch webhooks:", error);
      setWebhooks([]);
    } finally {
      setWebhooksLoading(false);
    }
  }, []);

  const loadRedirectSettings = useCallback(async () => {
    try {
      const res = await api.get("/clients/profile");
      const client = res.data?.user;
      if (client?.redirectSettings) {
        setRedirectSettings(client.redirectSettings);
      }
      if (client?.screeningConfig) {
        setScreeningConfig({
          provider: client.screeningConfig.provider || "open_sanctions",
          threshold: client.screeningConfig.threshold ?? 0.7,
          dataset: client.screeningConfig.dataset || "default",
        });
      }
      setScreeningLoaded(true);
    } catch {
      const successUrl = localStorage.getItem("settings.redirect.successUrl") || "";
      const cancelUrl = localStorage.getItem("settings.redirect.cancelUrl") || "";
      const allowedDomains = localStorage.getItem("settings.redirect.allowedDomains") || "";
      setRedirectSettings({ successUrl, cancelUrl, allowedDomains });
      setScreeningLoaded(true);
    }
  }, []);

  const saveScreeningConfig = async () => {
    setSavingScreening(true);
    try {
      await api.patch("/clients/profile", { screeningConfig });
      toast({
        title: "Screening Settings Saved",
        description: `Provider set to ${screeningConfig.provider === "open_sanctions" ? "OpenSanctions" : "AML Watcher"}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to save screening settings.",
        variant: "destructive",
      });
    } finally {
      setSavingScreening(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
    loadRedirectSettings();
  }, [fetchWebhooks, loadRedirectSettings]);

  // Webhook handlers
  const openWebhookModal = (webhook?: Webhook) => {
    if (webhook) {
      setEditingWebhook(webhook);
      setWebhookForm({ url: webhook.url, events: [...webhook.events] });
    } else {
      setEditingWebhook(null);
      setWebhookForm({ url: "", events: [] });
    }
    setWebhookModalOpen(true);
  };

  const closeWebhookModal = () => {
    setWebhookModalOpen(false);
    setEditingWebhook(null);
    setWebhookForm({ url: "", events: [] });
  };

  const toggleEvent = (eventId: WebhookEvent) => {
    setWebhookForm((prev) => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter((e) => e !== eventId)
        : [...prev.events, eventId],
    }));
  };

  const saveWebhook = async () => {
    if (!webhookForm.url || webhookForm.events.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a URL and select at least one event.",
        variant: "destructive",
      });
      return;
    }

    setSavingWebhook(true);
    try {
      const isEdit = !!editingWebhook;
      let result;
      if (isEdit) {
        const res = await api.put(`/webhooks/${editingWebhook.id}`, {
          url: webhookForm.url,
          events: webhookForm.events,
        });
        result = res.data;
      } else {
        const res = await api.post("/webhooks", {
          url: webhookForm.url,
          events: webhookForm.events,
        });
        result = res.data;
      }

      // Show signing secret for new webhooks
      if (!isEdit && result.signingSecret) {
        setNewSigningSecret(result.signingSecret);
      }

      toast({
        title: isEdit ? "Webhook Updated" : "Webhook Created",
        description: isEdit
          ? "Your webhook has been updated successfully."
          : "Your webhook has been created. Save the signing secret!",
      });

      await fetchWebhooks();
      if (!result.signingSecret) {
        closeWebhookModal();
      }
    } catch (error: any) {
      console.error("Failed to save webhook:", error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to save webhook.",
        variant: "destructive",
      });
    } finally {
      setSavingWebhook(false);
    }
  };

  const deleteWebhook = async () => {
    if (!deleteWebhookId) return;

    try {
      await api.delete(`/webhooks/${deleteWebhookId}`);
      setWebhooks((prev) => prev.filter((wh) => wh.id !== deleteWebhookId));
      toast({
        title: "Webhook Deleted",
        description: "The webhook has been removed.",
      });
    } catch (error: any) {
      console.error("Failed to delete webhook:", error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to delete webhook.",
        variant: "destructive",
      });
    } finally {
      setDeleteWebhookId(null);
    }
  };

  const copySecret = async () => {
    if (newSigningSecret) {
      await navigator.clipboard.writeText(newSigningSecret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const closeSecretModal = () => {
    setNewSigningSecret(null);
    closeWebhookModal();
  };

  // Redirect settings handlers
  const saveRedirectSettings = async () => {
    setSavingRedirect(true);
    try {
      await api.patch("/clients/profile", { redirectSettings });
      // Also save to localStorage as backup
      localStorage.setItem("settings.redirect.successUrl", redirectSettings.successUrl);
      localStorage.setItem("settings.redirect.cancelUrl", redirectSettings.cancelUrl);
      localStorage.setItem("settings.redirect.allowedDomains", redirectSettings.allowedDomains);

      toast({
        title: "Settings Saved",
        description: "Redirect URLs have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    } finally {
      setSavingRedirect(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Configure webhooks and redirect URLs for your integration
        </p>
      </div>

      {/* Webhooks Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Webhook className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Webhooks</CardTitle>
              <CardDescription>
                Receive real-time notifications when events occur
              </CardDescription>
            </div>
          </div>
          <Button onClick={() => openWebhookModal()} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Webhook
          </Button>
        </CardHeader>
        <CardContent>
          {webhooksLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : webhooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Webhook className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No webhooks configured</p>
              <p className="text-sm text-muted-foreground/70">
                Create a webhook to receive event notifications
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Webhook URL</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell className="font-mono text-sm max-w-[300px] truncate">
                      <div className="flex items-center gap-2">
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{webhook.url}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.map((event) => (
                          <Badge
                            key={event}
                            variant="secondary"
                            className="text-xs"
                          >
                            {event.split(".")[1]}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          webhook.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }
                      >
                        {webhook.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openWebhookModal(webhook)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteWebhookId(webhook.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Redirect URLs Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Link2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Redirect / Return URLs</CardTitle>
              <CardDescription>
                Configure where users are redirected after verification
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="successUrl">Default Success Redirect URL</Label>
              <Input
                id="successUrl"
                placeholder="https://yourapp.com/success"
                value={redirectSettings.successUrl}
                onChange={(e) =>
                  setRedirectSettings((prev) => ({
                    ...prev,
                    successUrl: e.target.value,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Users will be redirected here after successful verification
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cancelUrl">Default Cancel Redirect URL</Label>
              <Input
                id="cancelUrl"
                placeholder="https://yourapp.com/cancel"
                value={redirectSettings.cancelUrl}
                onChange={(e) =>
                  setRedirectSettings((prev) => ({
                    ...prev,
                    cancelUrl: e.target.value,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Users will be redirected here if they cancel or exit
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="allowedDomains">Allowed Redirect Domains</Label>
            <Textarea
              id="allowedDomains"
              placeholder="yourapp.com&#10;staging.yourapp.com&#10;localhost:3000"
              value={redirectSettings.allowedDomains}
              onChange={(e) =>
                setRedirectSettings((prev) => ({
                  ...prev,
                  allowedDomains: e.target.value,
                }))
              }
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Enter one domain per line. Only these domains will be allowed as redirect targets.
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={saveRedirectSettings} disabled={savingRedirect}>
              {savingRedirect && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Redirect Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Screening Provider Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Shield className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-lg">AML / Sanctions Screening</CardTitle>
              <CardDescription>
                Choose your screening provider and configure matching settings
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Screening Provider</Label>
              <Select
                value={screeningConfig.provider}
                onValueChange={(value) =>
                  setScreeningConfig((prev) => ({ ...prev, provider: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open_sanctions">
                    OpenSanctions
                  </SelectItem>
                  <SelectItem value="aml_watcher">
                    AML Watcher
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {screeningConfig.provider === "open_sanctions"
                  ? "Cost-effective, pay-as-you-go sanctions screening"
                  : "Premium screening with biometric matching"}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Match Threshold</Label>
              <Select
                value={screeningConfig.threshold.toString()}
                onValueChange={(value) =>
                  setScreeningConfig((prev) => ({
                    ...prev,
                    threshold: parseFloat(value),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">0.50 — Broad (more results)</SelectItem>
                  <SelectItem value="0.6">0.60 — Moderate</SelectItem>
                  <SelectItem value="0.7">0.70 — Balanced (recommended)</SelectItem>
                  <SelectItem value="0.8">0.80 — Strict</SelectItem>
                  <SelectItem value="0.9">0.90 — Very Strict (fewer results)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Results below this score are excluded
              </p>
            </div>
            <div className="space-y-2">
              <Label>Dataset Scope</Label>
              <Select
                value={screeningConfig.dataset}
                onValueChange={(value) =>
                  setScreeningConfig((prev) => ({ ...prev, dataset: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">All Lists (Full KYC)</SelectItem>
                  <SelectItem value="sanctions">Sanctions Only</SelectItem>
                  <SelectItem value="peps">PEPs Only</SelectItem>
                  <SelectItem value="crime">Criminal Watchlists</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Which watchlists to screen against
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={saveScreeningConfig} disabled={savingScreening}>
              {savingScreening && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Screening Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Webhook Create/Edit Modal */}
      <Dialog open={webhookModalOpen && !newSigningSecret} onOpenChange={setWebhookModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingWebhook ? "Edit Webhook" : "Add Webhook"}
            </DialogTitle>
            <DialogDescription>
              {editingWebhook
                ? "Update your webhook configuration"
                : "Create a new webhook endpoint to receive event notifications"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">Webhook URL</Label>
              <Input
                id="webhookUrl"
                placeholder="https://yourapp.com/webhooks/nobis"
                value={webhookForm.url}
                onChange={(e) =>
                  setWebhookForm((prev) => ({ ...prev, url: e.target.value }))
                }
              />
            </div>
            <div className="space-y-3">
              <Label>Events</Label>
              <div className="grid gap-3">
                {WEBHOOK_EVENTS.map((event) => (
                  <label
                    key={event.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={webhookForm.events.includes(event.id)}
                      onCheckedChange={() => toggleEvent(event.id)}
                    />
                    <div>
                      <p className="text-sm font-medium">{event.label}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {event.id}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeWebhookModal}>
              Cancel
            </Button>
            <Button onClick={saveWebhook} disabled={savingWebhook}>
              {savingWebhook && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingWebhook ? "Update Webhook" : "Create Webhook"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Signing Secret Modal */}
      <Dialog open={!!newSigningSecret} onOpenChange={() => closeSecretModal()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-emerald-600">
              Webhook Created Successfully
            </DialogTitle>
            <DialogDescription>
              Save your signing secret now. You won't be able to see it again.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-xs text-muted-foreground mb-2 block">
              Signing Secret
            </Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm break-all">
                {newSigningSecret}
              </code>
              <Button variant="outline" size="icon" onClick={copySecret}>
                {copiedSecret ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="mt-3 text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
              ⚠️ This secret is only shown once. Store it securely to verify webhook signatures.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={closeSecretModal}>
              I've saved my secret
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteWebhookId}
        onOpenChange={() => setDeleteWebhookId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Webhook?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The webhook will stop receiving
              event notifications immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteWebhook}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Webhook
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
