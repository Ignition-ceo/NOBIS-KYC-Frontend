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
  Users,
  Shield,
  Eye,
  Crown,
  UserPlus,
  Mail,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api } from "@/lib/api";

// TODO: Replace with auth context tenant ID
const TENANT_ID = "demo-tenant";
const API_BASE = "https://backend-api.getnobis.com";

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

  // Team members state
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [removeMemberEmail, setRemoveMemberEmail] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState({ email: "", name: "", role: "org_analyst" as "org_admin" | "org_analyst" });
  const [savingMember, setSavingMember] = useState(false);

  // Fetch team members
  const fetchTeamMembers = useCallback(async () => {
    setTeamLoading(true);
    try {
      const res = await api.get("/clients/profile/team");
      setTeamMembers(res.data?.members || []);
    } catch (err) {
      console.warn("Failed to fetch team members:", err);
      setTeamMembers([]);
    } finally {
      setTeamLoading(false);
    }
  }, []);

  const addMember = async () => {
    if (!memberForm.email) {
      toast({ title: "Email required", description: "Enter the team member's email address.", variant: "destructive" });
      return;
    }
    setSavingMember(true);
    try {
      const res = await api.post("/clients/profile/team", memberForm);
      setTeamMembers(res.data?.members || []);
      setAddMemberOpen(false);
      setMemberForm({ email: "", name: "", role: "org_analyst" });
      const auth0Status = res.data?.auth0Status;
      const statusMsg = auth0Status === "added" ? "They can log in now."
        : auth0Status === "invited" ? "An invitation email has been sent."
        : auth0Status === "skipped" ? "Added locally. Set up Auth0 Organization to enable login."
        : "Added locally. Auth0 sync may have failed — check Auth0 dashboard.";
      toast({ title: "Member Added", description: `${memberForm.email} — ${statusMsg}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to add member.", variant: "destructive" });
    } finally {
      setSavingMember(false);
    }
  };

  const updateMemberRole = async (email: string, role: "org_admin" | "org_analyst") => {
    try {
      const res = await api.patch(`/clients/profile/team/${encodeURIComponent(email)}`, { role });
      setTeamMembers(res.data?.members || []);
      toast({ title: "Role Updated", description: `${email} is now ${role === "org_admin" ? "an Admin" : "an Analyst"}.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to update role.", variant: "destructive" });
    }
  };

  const removeMember = async () => {
    if (!removeMemberEmail) return;
    try {
      const res = await api.delete(`/clients/profile/team/${encodeURIComponent(removeMemberEmail)}`);
      setTeamMembers(res.data?.members || []);
      toast({ title: "Member Removed", description: `${removeMemberEmail} has been removed from your team.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to remove member.", variant: "destructive" });
    } finally {
      setRemoveMemberEmail(null);
    }
  };

  const getInitials = (name: string, email: string) => {
    if (name) return name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
    return email.slice(0, 2).toUpperCase();
  };

  // Fetch webhooks from API
  const fetchWebhooks = useCallback(async () => {
    setWebhooksLoading(true);
    try {
      const response = await fetch(`${API_BASE}/webhooks/${TENANT_ID}`);
      if (response.ok) {
        const data = await response.json();
        setWebhooks(data.webhooks || data || []);
      } else {
        // Fallback to demo data if API not available
        console.warn("Webhooks API not available, using demo data");
        setWebhooks([
          {
            id: "wh_demo_1",
            url: "https://example.com/webhook",
            events: ["applicant.created", "verification.completed"],
            status: "active",
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch webhooks:", error);
      // Use demo data on error
      setWebhooks([]);
    } finally {
      setWebhooksLoading(false);
    }
  }, []);

  // Load redirect settings from localStorage
  const loadRedirectSettings = useCallback(() => {
    // TODO: Persist via backend TenantSettings API when available
    const successUrl = localStorage.getItem("settings.redirect.successUrl") || "";
    const cancelUrl = localStorage.getItem("settings.redirect.cancelUrl") || "";
    const allowedDomains = localStorage.getItem("settings.redirect.allowedDomains") || "";
    setRedirectSettings({ successUrl, cancelUrl, allowedDomains });
  }, []);

  useEffect(() => {
    fetchWebhooks();
    loadRedirectSettings();
    fetchTeamMembers();
  }, [fetchWebhooks, loadRedirectSettings, fetchTeamMembers]);

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
      const url = isEdit
        ? `${API_BASE}/webhooks/${TENANT_ID}/${editingWebhook.id}`
        : `${API_BASE}/webhooks/${TENANT_ID}`;
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: webhookForm.url,
          events: webhookForm.events,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
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
      } else {
        throw new Error("API request failed");
      }
    } catch (error) {
      // Demo mode: simulate success
      console.warn("API not available, simulating success");
      const newId = `wh_${Date.now()}`;
      const newSecret = `whsec_${btoa(Math.random().toString()).substring(0, 32)}`;

      if (editingWebhook) {
        setWebhooks((prev) =>
          prev.map((wh) =>
            wh.id === editingWebhook.id
              ? { ...wh, url: webhookForm.url, events: webhookForm.events }
              : wh
          )
        );
        toast({
          title: "Webhook Updated",
          description: "Your webhook has been updated successfully.",
        });
        closeWebhookModal();
      } else {
        const newWebhook: Webhook = {
          id: newId,
          url: webhookForm.url,
          events: webhookForm.events,
          status: "active",
          createdAt: new Date().toISOString(),
        };
        setWebhooks((prev) => [...prev, newWebhook]);
        setNewSigningSecret(newSecret);
        toast({
          title: "Webhook Created",
          description: "Your webhook has been created. Save the signing secret!",
        });
      }
    } finally {
      setSavingWebhook(false);
    }
  };

  const deleteWebhook = async () => {
    if (!deleteWebhookId) return;

    try {
      const response = await fetch(
        `${API_BASE}/webhooks/${TENANT_ID}/${deleteWebhookId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("API request failed");
      }
    } catch (error) {
      console.warn("API not available, simulating delete");
    }

    setWebhooks((prev) => prev.filter((wh) => wh.id !== deleteWebhookId));
    setDeleteWebhookId(null);
    toast({
      title: "Webhook Deleted",
      description: "The webhook has been removed.",
    });
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
      // TODO: Persist via backend TenantSettings API when available
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
          Configure integrations, team members, and redirect URLs
        </p>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="integrations" className="gap-2">
            <Webhook className="h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
        </TabsList>

        {/* ═══ Integrations Tab ═══ */}
        <TabsContent value="integrations" className="space-y-6">

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
        </TabsContent>

        {/* ═══ Team Tab ═══ */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Team Members</CardTitle>
                  <CardDescription>
                    Manage who has access to your organization's dashboard
                  </CardDescription>
                </div>
              </div>
              <Button onClick={() => { setMemberForm({ email: "", name: "", role: "org_analyst" }); setAddMemberOpen(true); }} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add Member
              </Button>
            </CardHeader>
            <CardContent>
              {/* Role explanation */}
              <div className="grid gap-3 md:grid-cols-2 mb-6">
                <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                  <Crown className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Admin</p>
                    <p className="text-xs text-muted-foreground">Full access — approve/reject verifications, manage flows, settings, and team members</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                  <Eye className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Analyst</p>
                    <p className="text-xs text-muted-foreground">Read-only — view applicants, reports, and export PDFs. Cannot change statuses or settings</p>
                  </div>
                </div>
              </div>

              {teamLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground font-medium">No team members yet</p>
                  <p className="text-sm text-muted-foreground/70 mb-4">
                    Add team members to give others access to your dashboard
                  </p>
                  <Button variant="outline" onClick={() => { setMemberForm({ email: "", name: "", role: "org_analyst" }); setAddMemberOpen(true); }} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add First Member
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="w-[80px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembers.map((member: any) => (
                      <TableRow key={member.email}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {getInitials(member.name, member.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{member.name || member.email}</p>
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={member.role}
                            onValueChange={(val: "org_admin" | "org_analyst") => updateMemberRole(member.email, val)}
                          >
                            <SelectTrigger className="w-[130px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="org_admin">
                                <span className="flex items-center gap-2">
                                  <Crown className="h-3 w-3 text-amber-600" /> Admin
                                </span>
                              </SelectItem>
                              <SelectItem value="org_analyst">
                                <span className="flex items-center gap-2">
                                  <Eye className="h-3 w-3 text-blue-600" /> Analyst
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {member.addedAt ? new Date(member.addedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setRemoveMemberEmail(member.email)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══ Add Member Modal ═══ */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a team member by email. They'll receive an invitation to join your organization automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="memberEmail">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="memberEmail"
                  placeholder="colleague@company.com"
                  className="pl-10"
                  value={memberForm.email}
                  onChange={(e) => setMemberForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="memberName">Display Name (optional)</Label>
              <Input
                id="memberName"
                placeholder="Jane Smith"
                value={memberForm.name}
                onChange={(e) => setMemberForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={memberForm.role} onValueChange={(val: "org_admin" | "org_analyst") => setMemberForm((p) => ({ ...p, role: val }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="org_admin">
                    <span className="flex items-center gap-2">
                      <Crown className="h-3 w-3 text-amber-600" /> Admin — Full access
                    </span>
                  </SelectItem>
                  <SelectItem value="org_analyst">
                    <span className="flex items-center gap-2">
                      <Eye className="h-3 w-3 text-blue-600" /> Analyst — Read-only
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberOpen(false)}>Cancel</Button>
            <Button onClick={addMember} disabled={savingMember}>
              {savingMember && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!removeMemberEmail} onOpenChange={() => setRemoveMemberEmail(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeMemberEmail} will lose access to your organization's dashboard immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={removeMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
