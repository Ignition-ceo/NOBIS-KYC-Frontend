import { useState, useEffect, useCallback } from "react";
import { useAppState } from "@/contexts/AppStateContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Key,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Terminal,
  BookOpen,
  Webhook,
  ArrowRight,
  Shield,
  Zap,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Code2,
  FileJson,
  Lock,
  Globe,
  Layers,
  Fingerprint,
  ScanFace,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  Search,
  Activity,
  MonitorSmartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────
interface ApiCredentials {
  client_id: string | null;
  scopes: string[];
  rate_limit: number;
  token_endpoint: string;
  api_base_url: string;
}

// ─── Collapsible Section ────────────────────────────────
function Section({
  title,
  subtitle,
  icon: Icon,
  children,
  defaultOpen = true,
  badge,
}: {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50/50 transition-colors"
      >
        <div className="h-9 w-9 rounded-lg bg-primary/5 text-primary flex items-center justify-center flex-shrink-0">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            {badge && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                {badge}
              </Badge>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-400" />
        )}
      </button>
      {open && <div className="px-5 pb-5 pt-1">{children}</div>}
    </div>
  );
}

// ─── Code Block ─────────────────────────────────────────
function CodeBlock({ code, language = "bash", title }: { code: string; language?: string; title?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative rounded-lg border border-slate-200 overflow-hidden bg-slate-950">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
          <span className="text-[11px] font-mono text-slate-400">{title}</span>
          <button onClick={handleCopy} className="text-slate-500 hover:text-slate-300 transition-colors">
            {copied ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}
      <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed font-mono text-slate-300">
        <code>{code}</code>
      </pre>
      {!title && (
        <button onClick={handleCopy} className="absolute top-3 right-3 text-slate-500 hover:text-slate-300">
          {copied ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      )}
    </div>
  );
}

// ─── Credential Field ───────────────────────────────────
function CredentialField({
  label,
  value,
  secret = false,
  mono = true,
}: {
  label: string;
  value: string;
  secret?: boolean;
  mono?: boolean;
}) {
  const [visible, setVisible] = useState(!secret);
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label} copied`);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex-1 px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm truncate",
            mono && "font-mono text-[13px]"
          )}
        >
          {visible ? value : "•".repeat(Math.min(value.length, 40))}
        </div>
        {secret && (
          <button
            onClick={() => setVisible(!visible)}
            className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
        <button
          onClick={handleCopy}
          className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
        >
          {copied ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── Endpoint Row ───────────────────────────────────────
function EndpointRow({
  method,
  path,
  description,
  scopes,
}: {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  description: string;
  scopes?: string[];
}) {
  const methodColors = {
    GET: "bg-emerald-50 text-emerald-700 border-emerald-200",
    POST: "bg-blue-50 text-blue-700 border-blue-200",
    PATCH: "bg-amber-50 text-amber-700 border-amber-200",
    DELETE: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <span
        className={cn(
          "text-[10px] font-bold uppercase px-2 py-1 rounded border flex-shrink-0 mt-0.5",
          methodColors[method]
        )}
      >
        {method}
      </span>
      <div className="flex-1 min-w-0">
        <code className="text-sm font-mono text-slate-900">{path}</code>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        {scopes && scopes.length > 0 && (
          <div className="flex gap-1 mt-1.5">
            {scopes.map((s) => (
              <span key={s} className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────
export default function DevSpace() {
  const { isReadOnly } = useAppState();
  const [creds, setCreds] = useState<ApiCredentials | null>(null);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"credentials" | "docs" | "webhooks" | "sdk" | "platform">("credentials");

  const loadCredentials = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/clients/profile/api-credentials");
      setCreds(data);
    } catch (err) {
      console.error("Failed to load credentials:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  const handleRegenerate = async () => {
    if (!confirm("Regenerate API credentials? Your existing client_secret will stop working immediately.")) return;
    try {
      setRegenerating(true);
      const { data } = await api.post("/clients/profile/api-credentials/regenerate");
      setNewSecret(data.client_secret || data.oauthCredentials?.client_secret);
      setCreds((prev) =>
        prev
          ? { ...prev, client_id: data.client_id || data.oauthCredentials?.client_id || prev.client_id }
          : prev
      );
      toast.success("Credentials regenerated. Copy your new secret — it won't be shown again.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to regenerate credentials");
    } finally {
      setRegenerating(false);
    }
  };

  const baseUrl = creds?.api_base_url || "https://backend-api.getnobis.com/api/v2";
  const clientId = creds?.client_id || "your_client_id";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Developer Hub</h1>
          <p className="text-muted-foreground mt-1">
            API credentials, endpoint documentation, and integration guides
          </p>
        </div>
        <a
          href={`${baseUrl.replace('/api/v2', '')}/api/docs`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Interactive API Docs
        </a>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="border border-slate-200 rounded-xl bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium text-slate-500">Rate Limit</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{creds?.rate_limit?.toLocaleString() || "—"}</p>
          <p className="text-xs text-slate-400">requests / hour</p>
        </div>
        <div className="border border-slate-200 rounded-xl bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-medium text-slate-500">Scopes</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{creds?.scopes?.length || "—"}</p>
          <p className="text-xs text-slate-400">permissions granted</p>
        </div>
        <div className="border border-slate-200 rounded-xl bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-medium text-slate-500">Base URL</span>
          </div>
          <p className="text-sm font-mono font-bold text-slate-900 truncate">{baseUrl}</p>
          <p className="text-xs text-slate-400">production endpoint</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {[
          { key: "credentials" as const, label: "API Keys", icon: Key },
          { key: "docs" as const, label: "Documentation", icon: BookOpen },
          { key: "sdk" as const, label: "Embeddable SDK", icon: MonitorSmartphone },
          { key: "webhooks" as const, label: "Webhooks", icon: Webhook },
          { key: "platform" as const, label: "Platform Guide", icon: Layers },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap",
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Tab: Credentials ─────────────────────────────── */}
      {activeTab === "credentials" && (
        <div className="space-y-4">
          <Section title="API Credentials" subtitle="Use these to authenticate programmatic API calls" icon={Key}>
            {loading ? (
              <div className="flex items-center justify-center py-8 text-slate-400">Loading credentials...</div>
            ) : (
              <div className="space-y-4">
                <CredentialField label="Client ID" value={clientId} />
                {newSecret ? (
                  <div className="space-y-2">
                    <CredentialField label="Client Secret" value={newSecret} secret />
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">
                        Copy this secret now. For security, it will not be displayed again.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Client Secret</label>
                    <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-400">
                      <Lock className="h-4 w-4" />
                      Hidden for security. Regenerate to get a new secret.
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Scopes</label>
                  <div className="flex flex-wrap gap-1.5">
                    {(creds?.scopes || []).map((scope) => (
                      <span
                        key={scope}
                        className="text-xs font-mono bg-primary/5 text-primary border border-primary/10 px-2.5 py-1 rounded-md"
                      >
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>

                {!isReadOnly && (
                  <div className="pt-3 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerate}
                      disabled={regenerating}
                      className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                      <RefreshCw className={cn("h-3.5 w-3.5", regenerating && "animate-spin")} />
                      {regenerating ? "Regenerating..." : "Regenerate Credentials"}
                    </Button>
                    <p className="text-xs text-slate-400 mt-2">
                      This will invalidate your current secret. All existing integrations will need to be updated.
                    </p>
                  </div>
                )}
              </div>
            )}
          </Section>

          <Section title="Quick Start" subtitle="Get authenticated in 30 seconds" icon={Terminal} defaultOpen={false}>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-3">
                  <span className="font-semibold">Step 1:</span> Exchange your credentials for a bearer token
                </p>
                <CodeBlock
                  title="Get Bearer Token"
                  code={`curl -X POST ${baseUrl}/auth/oauth/token \\
  -H "Content-Type: application/json" \\
  -d '{
    "grant_type": "client_credentials",
    "client_id": "${clientId}",
    "client_secret": "your_client_secret"
  }'`}
                />
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-3">
                  <span className="font-semibold">Step 2:</span> Create a verification session
                </p>
                <CodeBlock
                  title="Create Session"
                  code={`curl -X POST ${baseUrl}/sessions \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: req_$(uuidgen)" \\
  -d '{
    "external_ref": { "user_id": "your-user-123" },
    "return_url": "https://yourapp.com/success",
    "cancel_url": "https://yourapp.com/cancelled",
    "steps": ["id", "liveness"]
  }'`}
                />
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-3">
                  <span className="font-semibold">Step 3:</span> Redirect user to the session URL, then check status
                </p>
                <CodeBlock
                  title="Check Session Status"
                  code={`curl -X GET ${baseUrl}/sessions/SESSION_ID \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

// Response:
{
  "session_id": "ses_abc123def",
  "status": "completed",  // created | in_progress | completed | rejected
  "verification_id": "64f1a2b3c4d5e6f7g8h9i0j1",
  "steps": [
    { "type": "idDocument", "status": "verified" },
    { "type": "selfie", "status": "verified" }
  ],
  "external_ref": { "user_id": "your-user-123" }
}`}
                />
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* ─── Tab: Documentation ───────────────────────────── */}
      {activeTab === "docs" && (
        <div className="space-y-4">
          <Section title="Authentication" subtitle="OAuth2 Client Credentials flow" icon={Lock}>
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                NOBIS uses OAuth2 Client Credentials for API authentication. Exchange your client_id and
                client_secret for a bearer token, then include it in the Authorization header of all API requests.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Grant Type</p>
                  <p className="text-sm font-mono text-slate-900">client_credentials</p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Token Format</p>
                  <p className="text-sm font-mono text-slate-900">JWT (HS256)</p>
                </div>
              </div>
              <CodeBlock
                title="Token Request & Response"
                code={`POST ${baseUrl}/auth/oauth/token
Content-Type: application/json

{
  "grant_type": "client_credentials",
  "client_id": "${clientId}",
  "client_secret": "your_client_secret"
}

// Response:
{
  "access_token": "eyJhbG...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "scopes": ["nobis.sessions:write", "nobis.sessions:read", ...]
}`}
              />
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Never expose your <code className="bg-amber-100 px-1 rounded">client_secret</code> in frontend code, public repos, or client-side JavaScript. Only use it in server-to-server calls.
                </p>
              </div>
            </div>
          </Section>

          <Section title="API Endpoints" subtitle="All available endpoints for your integration" icon={FileJson}>
            <div>
              <div className="mb-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sessions</p>
              </div>
              <EndpointRow
                method="POST"
                path="/sessions"
                description="Create a new KYC verification session. Returns session_url for the applicant. Requires Idempotency-Key header."
                scopes={["nobis.sessions:write"]}
              />
              <EndpointRow
                method="GET"
                path="/sessions/:sessionId"
                description="Get session status, verification progress, and step-level results."
                scopes={["nobis.sessions:read"]}
              />

              <div className="mt-5 mb-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Verifications</p>
              </div>
              <EndpointRow
                method="GET"
                path="/verifications/:id"
                description="Get verification details including extracted data, evidence scores, and metadata."
                scopes={["nobis.verifications:read"]}
              />
              <EndpointRow
                method="GET"
                path="/verifications/:id/resources"
                description="List available assets (images, documents) for a verification."
                scopes={["nobis.verifications:read"]}
              />
              <EndpointRow
                method="POST"
                path="/verifications/:id/resources/:assetId/link"
                description="Generate a short-lived presigned download URL for an asset (60-300s TTL)."
                scopes={["nobis.verifications:read"]}
              />

              <div className="mt-5 mb-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Webhooks</p>
              </div>
              <EndpointRow
                method="POST"
                path="/webhooks"
                description="Register a webhook endpoint to receive verification events."
                scopes={["nobis.webhooks:write"]}
              />
              <EndpointRow
                method="GET"
                path="/webhooks"
                description="List all registered webhook endpoints."
              />
              <EndpointRow
                method="DELETE"
                path="/webhooks/:id"
                description="Remove a registered webhook endpoint."
                scopes={["nobis.webhooks:write"]}
              />
              <EndpointRow
                method="POST"
                path="/webhooks/test"
                description="Send a test event to a webhook URL to verify connectivity."
                scopes={["nobis.webhooks:write"]}
              />

              <div className="mt-5 mb-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Flows</p>
              </div>
              <EndpointRow
                method="GET"
                path="/flows"
                description="List all verification flows for your organization."
              />
              <EndpointRow
                method="POST"
                path="/flows"
                description="Create a new verification flow with custom modules, webhooks, and redirect URLs."
              />
              <EndpointRow
                method="PATCH"
                path="/flows/:flowId"
                description="Update an existing flow's configuration."
              />
              <EndpointRow
                method="DELETE"
                path="/flows/:flowId"
                description="Delete a verification flow (no active applicants allowed)."
              />

              <div className="mt-4 pt-3 border-t border-slate-100">
                <a
                  href={`${baseUrl.replace('/api/v2', '')}/api/docs`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80"
                >
                  <ExternalLink className="h-4 w-4" />
                  View full interactive API documentation (Swagger)
                </a>
              </div>
            </div>
          </Section>

          <Section title="Session Lifecycle" subtitle="Understanding verification states" icon={ArrowRight} defaultOpen={false}>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Each verification session moves through a defined set of states. Your integration should handle each state appropriately.
              </p>
              <div className="space-y-2">
                {[
                  { status: "created", desc: "Session created, applicant has not started verification yet", color: "bg-slate-100 text-slate-600 border-slate-200" },
                  { status: "in_progress", desc: "Applicant has started — some steps completed, others still pending", color: "bg-blue-50 text-blue-700 border-blue-200" },
                  { status: "completed", desc: "All verification steps passed successfully", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                  { status: "rejected", desc: "One or more verification steps failed", color: "bg-red-50 text-red-700 border-red-200" },
                ].map((s) => (
                  <div key={s.status} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100">
                    <span className={cn("text-[11px] font-bold uppercase px-2.5 py-1 rounded-md border", s.color)}>
                      {s.status}
                    </span>
                    <p className="text-sm text-slate-600">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Redirect Payloads" subtitle="Data returned after verification completes" icon={ArrowRight} defaultOpen={false}>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                When a verification flow completes, the applicant is redirected to your configured URL with result data as query parameters.
                Configure redirect URLs in <span className="font-semibold">Flows → Edit → Step 4 (Integrations)</span>.
              </p>

              <div className="space-y-3">
                <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50">
                  <p className="text-xs font-semibold text-emerald-700 mb-2">On Success → successUrl</p>
                  <code className="text-xs font-mono text-slate-700 break-all">
                    https://yourapp.com/success?status=completed&verification_id=64f1a2b3...&flow_id=6997e654...
                  </code>
                </div>
                <div className="p-3 rounded-lg border border-red-200 bg-red-50/50">
                  <p className="text-xs font-semibold text-red-700 mb-2">On Cancel → cancelUrl</p>
                  <code className="text-xs font-mono text-slate-700 break-all">
                    https://yourapp.com/cancelled?status=cancelled&verification_id=64f1a2b3...
                  </code>
                </div>
              </div>

              <div className="space-y-2 mt-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Query Parameters</p>
                {[
                  { param: "status", desc: "completed, failed, or cancelled" },
                  { param: "verification_id", desc: "The applicant/verification record ID" },
                  { param: "flow_id", desc: "The flow ID that was used" },
                  { param: "error", desc: "Error code if status is failed (e.g. face_match_failed)" },
                ].map((p) => (
                  <div key={p.param} className="flex items-center gap-3 text-sm">
                    <code className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700 min-w-[140px]">
                      {p.param}
                    </code>
                    <span className="text-slate-600">{p.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Error Handling" subtitle="Standard error response format" icon={AlertTriangle} defaultOpen={false}>
            <div className="space-y-3">
              <p className="text-sm text-slate-600">All errors follow a consistent JSON format:</p>
              <CodeBlock
                title="Error Response"
                code={`{
  "statusCode": 401,
  "message": "Invalid client credentials",
  "error": "Unauthorized"
}`}
              />
              <div className="space-y-2 mt-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Common Status Codes</p>
                {[
                  { code: "200", desc: "Success" },
                  { code: "201", desc: "Created (new session or resource)" },
                  { code: "400", desc: "Bad request — missing or invalid fields" },
                  { code: "401", desc: "Unauthorized — invalid or expired token" },
                  { code: "403", desc: "Forbidden — insufficient scopes" },
                  { code: "404", desc: "Resource not found" },
                  { code: "409", desc: "Conflict — duplicate resource" },
                  { code: "429", desc: "Rate limit exceeded — retry after cooldown" },
                ].map((e) => (
                  <div key={e.code} className="flex items-center gap-3 text-sm">
                    <code className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700 w-10 text-center">
                      {e.code}
                    </code>
                    <span className="text-slate-600">{e.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* ─── Tab: Embeddable SDK ──────────────────────────── */}
      {activeTab === "sdk" && (
        <div className="space-y-4">
          <Section title="Embeddable SDK" subtitle="Embed verification directly in your website" icon={Code2}>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                The NOBIS SDK lets you embed the verification flow as an iframe inside your own application.
                The applicant never leaves your site — verification happens inline and results are communicated via <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">postMessage</code> events.
              </p>
              <CodeBlock
                title="HTML Embed"
                code={`<div id="nobis-verify"></div>
<script src="https://web-sdk.getnobis.com/sdk.js"></script>
<script>
  NobisSDK.init({
    container: '#nobis-verify',
    flowId: 'YOUR_FLOW_ID',
    theme: 'light',
    onComplete: function(result) {
      console.log('Verification complete', result);
      // result.status = "completed"
      // result.verification_id = "64f1a2b3..."
      // result.flow_id = "6997e654..."
    },
    onError: function(error) {
      console.error('Verification error', error);
      // error.status = "failed"
      // error.error = "face_match_failed"
    },
    onClose: function() {
      console.log('Widget closed');
    }
  });
</script>`}
              />
            </div>
          </Section>

          <Section title="SDK Configuration" subtitle="Available initialization options" icon={Terminal} defaultOpen={false}>
            <div className="space-y-2">
              {[
                { param: "container", type: "string", required: true, desc: "CSS selector or DOM element for the widget container" },
                { param: "flowId", type: "string", required: true, desc: "Your verification flow ID (from Flows page)" },
                { param: "theme", type: "'light' | 'dark'", required: false, desc: "Widget color theme (default: light)" },
                { param: "locale", type: "string", required: false, desc: "Language code (default: en)" },
                { param: "externalRef", type: "object", required: false, desc: "Custom metadata passed through to webhooks and redirect URLs" },
                { param: "onComplete", type: "function(result)", required: false, desc: "Called when all verification steps pass" },
                { param: "onError", type: "function(error)", required: false, desc: "Called when verification fails" },
                { param: "onClose", type: "function()", required: false, desc: "Called when the user closes the widget" },
              ].map((p) => (
                <div key={p.param} className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
                  <div className="min-w-[120px]">
                    <code className="text-xs font-mono text-slate-900">{p.param}</code>
                    {p.required && <span className="text-red-500 text-xs ml-1">*</span>}
                  </div>
                  <div className="flex-1">
                    <code className="text-[10px] font-mono text-slate-400">{p.type}</code>
                    <p className="text-xs text-slate-600 mt-0.5">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="postMessage Events" subtitle="Events sent from the SDK iframe to your page" icon={ArrowRight} defaultOpen={false}>
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                If you prefer to listen for events directly instead of using callbacks, the SDK iframe sends <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">postMessage</code> events to the parent window. All messages include <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">source: "nobis-sdk"</code> for filtering.
              </p>

              <CodeBlock
                title="Listen for SDK Events"
                language="javascript"
                code={`window.addEventListener('message', function(event) {
  if (event.data?.source !== 'nobis-sdk') return;

  switch (event.data.type) {
    case 'verification.completed':
      // { status: "completed", verification_id: "...", flow_id: "..." }
      console.log('Verified:', event.data);
      break;

    case 'verification.failed':
      // { status: "failed", verification_id: "...", error: "face_match_failed" }
      console.log('Failed:', event.data);
      break;

    case 'verification.cancelled':
      // { status: "cancelled", verification_id: "...", step: "selfie" }
      console.log('Cancelled:', event.data);
      break;
  }
});`}
              />

              <div className="space-y-2 mt-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Event Types</p>
                {[
                  { event: "verification.completed", desc: "All verification steps passed", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                  { event: "verification.failed", desc: "A step failed (e.g. face match)", color: "bg-red-50 text-red-700 border-red-200" },
                  { event: "verification.cancelled", desc: "User cancelled during a step", color: "bg-amber-50 text-amber-700 border-amber-200" },
                ].map((e) => (
                  <div key={e.event} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100">
                    <code className={cn("text-[10px] font-mono px-2 py-1 rounded-md border flex-shrink-0", e.color)}>
                      {e.event}
                    </code>
                    <p className="text-sm text-slate-600">{e.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* ─── Tab: Webhooks ────────────────────────────────── */}
      {activeTab === "webhooks" && (
        <div className="space-y-4">
          <Section title="Webhook Events" subtitle="Events fired during the verification lifecycle" icon={Webhook}>
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Configure webhooks in <span className="font-semibold">Flows → Edit → Step 4 (Integrations)</span> or globally via the API.
                Each event includes the full payload with applicant and verification data.
              </p>
              <div className="space-y-2">
                {[
                  { event: "session.created", desc: "Fired when a new verification session is created", timing: "Immediate" },
                  { event: "id_capture.completed", desc: "ID document has been captured and processed", timing: "After ID step" },
                  { event: "liveness.completed", desc: "Selfie/liveness check has been completed", timing: "After selfie step" },
                  { event: "verification.processing", desc: "Some steps completed, others still pending", timing: "During verification" },
                  { event: "verification.completed", desc: "All verification steps have passed", timing: "Final — success" },
                  { event: "verification.failed", desc: "One or more verification steps were rejected", timing: "Final — failure" },
                ].map((e) => (
                  <div key={e.event} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <code className="text-xs font-mono bg-violet-50 text-violet-700 border border-violet-200 px-2 py-1 rounded-md flex-shrink-0">
                      {e.event}
                    </code>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700">{e.desc}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Timing: {e.timing}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Webhook Payload" subtitle="Example webhook delivery" icon={FileJson} defaultOpen={false}>
            <CodeBlock
              title="POST https://yourapp.com/webhooks/nobis"
              code={`// Headers:
Content-Type: application/json
X-Nobis-Signature: sha256=abc123...
X-Nobis-Timestamp: 1709251200

// Body:
{
  "event": "verification.completed",
  "timestamp": "2026-03-12T10:30:00.000Z",
  "data": {
    "session_id": "ses_abc123",
    "verification_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "tenant_id": "your_tenant_id",
    "status": "completed",
    "external_ref": { "user_id": "your-user-123" },
    "steps": [
      { "type": "idDocument", "status": "verified" },
      { "type": "selfie", "status": "verified" }
    ]
  }
}`}
            />
          </Section>

          <Section title="Signature Verification" subtitle="Verify webhook authenticity" icon={Shield} defaultOpen={false}>
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Every webhook includes an HMAC-SHA256 signature in the <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">X-Nobis-Signature</code> header.
                Verify it using your webhook secret to ensure the payload wasn't tampered with.
              </p>
              <CodeBlock
                title="Node.js Verification Example"
                language="javascript"
                code={`const crypto = require('crypto');

function verifyWebhook(rawBody, signature, timestamp, secret) {
  const signedPayload = \`\${timestamp}.\${rawBody}\`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  const received = signature.replace('sha256=', '');
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(received)
  );
}`}
              />
            </div>
          </Section>

          <Section title="Retry Policy" subtitle="Automatic retry on failed deliveries" icon={RefreshCw} defaultOpen={false}>
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Failed webhook deliveries (non-2xx responses or timeouts) are retried automatically with exponential backoff.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { attempt: "1st retry", delay: "30 seconds" },
                  { attempt: "2nd retry", delay: "5 minutes" },
                  { attempt: "3rd retry", delay: "30 minutes" },
                ].map((r) => (
                  <div key={r.attempt} className="text-center p-3 rounded-lg border border-slate-200 bg-slate-50">
                    <p className="text-xs font-semibold text-slate-500">{r.attempt}</p>
                    <p className="text-lg font-bold text-slate-900">{r.delay}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <Zap className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  4xx errors (except 429) are not retried — they indicate a client-side issue.
                  5xx and network errors trigger the retry sequence. After 3 failed attempts, the delivery is logged for manual inspection.
                </p>
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* ─── Tab: Platform Guide ──────────────────────────── */}
      {activeTab === "platform" && (
        <div className="space-y-4">
          <Section title="About NOBIS" subtitle="Enterprise KYC & Identity Verification Platform" icon={Layers}>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                NOBIS is a comprehensive KYC (Know Your Customer) and identity verification platform designed for regulated industries. It provides end-to-end identity verification through a modular, configurable pipeline that adapts to your compliance requirements.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Architecture</p>
                  <ul className="space-y-1.5 text-sm text-slate-600">
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" /> Multi-tenant with full data isolation</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" /> Role-based access control (Owner, Admin, Analyst)</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" /> OAuth2 API + Embeddable SDK + Hosted portal</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" /> Real-time webhook event delivery</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Compliance</p>
                  <ul className="space-y-1.5 text-sm text-slate-600">
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" /> AML / Sanctions screening</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" /> PEP (Politically Exposed Persons) checks</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" /> Risk scoring & fraud detection</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" /> Biometric deduplication</li>
                  </ul>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Verification Modules" subtitle="Configurable identity verification pipeline" icon={Fingerprint}>
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Each verification flow consists of one or more modules. Modules are configured per flow and per subscription plan.
              </p>

              <div className="space-y-3 mt-4">
                {[
                  {
                    icon: CreditCard, color: "blue", title: "ID Document Verification",
                    desc: "Captures and validates government-issued identity documents. AI-powered OCR extracts data and performs authenticity checks including tamper detection and MRZ validation.",
                    tags: ["OCR Extraction", "Tamper Detection", "MRZ Validation", "Document Classification"],
                  },
                  {
                    icon: ScanFace, color: "violet", title: "Face Verification & Liveness",
                    desc: "Captures a live selfie and performs biometric face matching against the ID document photo. Includes passive liveness detection to prevent spoofing. IDMission's verification verdict is used as the source of truth.",
                    tags: ["Face Matching", "Liveness Detection", "Anti-Spoofing", "Biometric Scoring"],
                  },
                  {
                    icon: Mail, color: "emerald", title: "Email Verification",
                    desc: "Sends a one-time verification code to confirm email ownership and reachability.",
                    tags: ["OTP Verification", "Disposable Email Check", "Format Validation"],
                  },
                  {
                    icon: Phone, color: "amber", title: "Phone Verification",
                    desc: "Sends an SMS OTP to verify phone number ownership. Supports international numbers.",
                    tags: ["SMS OTP", "International Support", "Carrier Lookup"],
                  },
                  {
                    icon: MapPin, color: "rose", title: "Proof of Address",
                    desc: "Accepts utility bills, bank statements, or government correspondence. Extracts address data via OCR and validates recency.",
                    tags: ["Document Upload", "Address Extraction", "Recency Check"],
                  },
                ].map((mod) => (
                  <div key={mod.title} className={`p-4 rounded-lg border border-${mod.color}-200 bg-${mod.color}-50/30`}>
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 rounded-lg bg-${mod.color}-100 text-${mod.color}-600 flex items-center justify-center flex-shrink-0`}>
                        <mod.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-900">{mod.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">{mod.desc}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {mod.tags.map((tag) => (
                            <span key={tag} className={`text-[10px] bg-${mod.color}-100 text-${mod.color}-700 px-2 py-0.5 rounded-full`}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Integration Patterns" subtitle="Common integration architectures" icon={Terminal} defaultOpen={false}>
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/30">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">Recommended</Badge>
                </div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Hosted Flow</h4>
                <p className="text-xs text-slate-500 mb-3">Redirect users to a NOBIS-hosted verification page. Simplest integration — no frontend work required. After verification, the user is redirected back to your success or cancel URL with result query parameters.</p>
                <div className="flex items-center gap-2 text-xs text-slate-600 bg-white p-3 rounded-lg font-mono flex-wrap">
                  <span>Your App</span> <ArrowRight className="h-3 w-3 text-slate-400" />
                  <span>Create Session</span> <ArrowRight className="h-3 w-3 text-slate-400" />
                  <span>Redirect to session_url</span> <ArrowRight className="h-3 w-3 text-slate-400" />
                  <span>NOBIS Verification</span> <ArrowRight className="h-3 w-3 text-slate-400" />
                  <span>Redirect back + Webhook</span>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/30">
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Embedded SDK</h4>
                <p className="text-xs text-slate-500 mb-3">Embed the NOBIS verification widget directly in your page using an iframe. Results are delivered via postMessage events and webhooks. The user never leaves your site.</p>
                <div className="flex items-center gap-2 text-xs text-slate-600 bg-white p-3 rounded-lg font-mono flex-wrap">
                  <span>Your Page</span> <ArrowRight className="h-3 w-3 text-slate-400" />
                  <span>Load sdk.js</span> <ArrowRight className="h-3 w-3 text-slate-400" />
                  <span>NobisSDK.init()</span> <ArrowRight className="h-3 w-3 text-slate-400" />
                  <span>onComplete callback</span> <ArrowRight className="h-3 w-3 text-slate-400" />
                  <span>Webhook fires</span>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-900 mb-2">API-Only (Headless)</h4>
                <p className="text-xs text-slate-500 mb-3">Build your own verification UI and submit data directly to NOBIS APIs. Full control over the user experience.</p>
                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg font-mono flex-wrap">
                  <span>Your UI</span> <ArrowRight className="h-3 w-3 text-slate-400" />
                  <span>Capture docs/selfie</span> <ArrowRight className="h-3 w-3 text-slate-400" />
                  <span>Submit via API</span> <ArrowRight className="h-3 w-3 text-slate-400" />
                  <span>Poll status</span> <ArrowRight className="h-3 w-3 text-slate-400" />
                  <span>Webhook fires</span>
                </div>
              </div>
            </div>
          </Section>

          <Section title="AML & Sanctions Screening" subtitle="Anti-money laundering and watchlist checks" icon={Search} defaultOpen={false}>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                NOBIS automatically screens applicants against global sanctions lists, PEP databases, and criminal watchlists. Screening runs automatically when configured in your subscription plan.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-lg border border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">OpenSanctions</h4>
                  <p className="text-xs text-slate-500">Open-source sanctions and PEP database covering 100+ data sources worldwide including UN, EU, and US OFAC lists.</p>
                </div>
                <div className="p-4 rounded-lg border border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">AML Watcher</h4>
                  <p className="text-xs text-slate-500">Commercial AML screening with real-time monitoring, adverse media checks, and PEP coverage across 240+ countries.</p>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Risk & Fraud Detection" subtitle="Multi-signal risk assessment" icon={Activity} defaultOpen={false}>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                NOBIS analyzes multiple signals during verification to assess fraud risk and flag suspicious activity.
              </p>
              <div className="space-y-2">
                {[
                  { signal: "IP Geolocation", desc: "Detects VPN/proxy usage and flags location mismatches against declared country.", icon: Globe },
                  { signal: "Biometric Confidence", desc: "Face match score and liveness confidence from IDMission.", icon: ScanFace },
                  { signal: "Document Authenticity", desc: "Detects edited, photocopied, or screen-captured documents.", icon: CreditCard },
                  { signal: "Biometric Deduplication", desc: "Checks if the same face has been used in a previous verification (configurable per client).", icon: Fingerprint },
                  { signal: "Velocity Checks", desc: "Flags repeated verification attempts from the same IP, device, or phone number.", icon: Zap },
                ].map((s) => (
                  <div key={s.signal} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
                      <s.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{s.signal}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
