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
  Layers,
  Fingerprint,
  ScanFace,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  Search,
  Activity,
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

interface RegeneratedCreds {
  client_id: string;
  client_secret: string;
  token_endpoint: string;
  scopes: string[];
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
    <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-950">
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
  const [activeTab, setActiveTab] = useState<"credentials" | "docs" | "webhooks" | "platform">("credentials");

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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Developer Hub</h1>
        <p className="text-muted-foreground mt-1">
          API credentials, endpoint documentation, and integration guides
        </p>
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
      <div className="flex gap-1 border-b border-slate-200">
        {[
          { key: "credentials" as const, label: "API Keys", icon: Key },
          { key: "docs" as const, label: "Documentation", icon: BookOpen },
          { key: "webhooks" as const, label: "Webhooks", icon: Webhook },
          { key: "platform" as const, label: "Platform Guide", icon: Layers },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
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
                  code={`curl -X POST ${baseUrl}/applicants/sessions \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: req_$(uuidgen)" \\
  -d '{
    "external_ref": { "user_id": "your-user-123" },
    "return_url": "https://yourapp.com/verified",
    "cancel_url": "https://yourapp.com/cancelled"
  }'`}
                />
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-3">
                  <span className="font-semibold">Step 3:</span> Redirect user to the session URL, then poll for status
                </p>
                <CodeBlock
                  title="Check Session Status"
                  code={`curl -X GET ${baseUrl}/applicants/sessions/SESSION_ID \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"`}
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
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Token Lifetime</p>
                  <p className="text-sm font-mono text-slate-900">1 hour (3600s)</p>
                </div>
              </div>
              <CodeBlock
                title="Token Request"
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
  "expires_in": 3600,
  "tenant_id": "your_tenant_id",
  "scope": "nobis.sessions:write nobis.sessions:read"
}`}
              />
            </div>
          </Section>

          <Section title="API Endpoints" subtitle="All available endpoints for your integration" icon={FileJson}>
            <div>
              <div className="mb-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sessions</p>
              </div>
              <EndpointRow
                method="POST"
                path="/applicants/sessions"
                description="Create a new KYC verification session. Requires Idempotency-Key header."
                scopes={["nobis.sessions:write"]}
              />
              <EndpointRow
                method="GET"
                path="/applicants/sessions/:sessionId"
                description="Get session status and verification progress."
                scopes={["nobis.sessions:read"]}
              />
              <div className="mt-5 mb-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Applicants</p>
              </div>
              <EndpointRow
                method="GET"
                path="/applicants"
                description="List all applicants with pagination, filtering, and search."
                scopes={["nobis.verifications:read"]}
              />
              <EndpointRow
                method="GET"
                path="/applicants/:id"
                description="Get applicant details including verification results."
                scopes={["nobis.verifications:read"]}
              />
              <EndpointRow
                method="GET"
                path="/applicants/withAllDetails/:id"
                description="Get applicant with all verification results, risk scores, and screening data."
                scopes={["nobis.verifications:read"]}
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
                description="Create a new verification flow with custom modules and configuration."
              />
              <EndpointRow
                method="PATCH"
                path="/flows/:flowId"
                description="Update an existing flow's configuration."
              />
            </div>
          </Section>

          <Section title="Session Lifecycle" subtitle="Understanding verification states" icon={ArrowRight} defaultOpen={false}>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Each verification session moves through a defined set of states. Your integration should handle each state appropriately.
              </p>
              <div className="space-y-2">
                {[
                  { status: "pending", desc: "Session created, waiting for user to start verification", color: "bg-slate-100 text-slate-600 border-slate-200" },
                  { status: "processing", desc: "User has completed some steps, others still in progress", color: "bg-blue-50 text-blue-700 border-blue-200" },
                  { status: "verified", desc: "All verification steps passed successfully", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                  { status: "rejected", desc: "One or more verification steps failed", color: "bg-red-50 text-red-700 border-red-200" },
                  { status: "needs_review", desc: "Manual review required by your compliance team", color: "bg-amber-50 text-amber-700 border-amber-200" },
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

          <Section title="Error Handling" subtitle="Standard error response format" icon={AlertTriangle} defaultOpen={false}>
            <div className="space-y-3">
              <p className="text-sm text-slate-600">All errors follow a consistent JSON format:</p>
              <CodeBlock
                title="Error Response"
                code={`{
  "statusCode": 401,
  "message": "Invalid client credentials",
  "timestamp": "2026-03-01T12:00:00.000Z",
  "path": "/api/v2/auth/oauth/token"
}`}
              />
              <div className="space-y-2 mt-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Common Status Codes</p>
                {[
                  { code: "200", desc: "Success" },
                  { code: "201", desc: "Created (new session or resource)" },
                  { code: "400", desc: "Bad request — missing required fields" },
                  { code: "401", desc: "Unauthorized — invalid or expired token" },
                  { code: "403", desc: "Forbidden — insufficient scopes" },
                  { code: "404", desc: "Resource not found" },
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

      {/* ─── Tab: Webhooks ────────────────────────────────── */}
      {activeTab === "webhooks" && (
        <div className="space-y-4">
          <Section title="Webhook Events" subtitle="Events fired during the verification lifecycle" icon={Webhook}>
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Configure webhooks in <span className="font-semibold">Settings → Integrations</span> or per-flow in the flow editor.
                Each event includes the full payload with applicant data.
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
              code={`{
  "event": "verification.completed",
  "nobis": {
    "session_id": "sess_abc123",
    "tenant_id": "your_tenant_id",
    "verification_id": "669abc123def456"
  },
  "external_ref": {
    "user_id": "your-user-123"
  },
  "delivery_id": "dlv_unique_id",
  "timestamp": 1709251200
}

Headers:
  Content-Type: application/json
  Nobis-Signature: sha256=abc123...
  Nobis-Timestamp: 1709251200
  X-Webhook-Delivery: dlv_unique_id`}
            />
          </Section>

          <Section title="Signature Verification" subtitle="Verify webhook authenticity" icon={Shield} defaultOpen={false}>
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Every webhook includes an HMAC-SHA256 signature in the <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">Nobis-Signature</code> header.
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

          <Section title="Retry Policy" subtitle="Automatic retry with exponential backoff" icon={RefreshCw} defaultOpen={false}>
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Failed webhook deliveries are retried automatically with exponential backoff. All failures are logged
                to the dead letter queue for manual inspection.
              </p>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { attempt: "1st", delay: "4s" },
                  { attempt: "2nd", delay: "8s" },
                  { attempt: "3rd", delay: "16s" },
                  { attempt: "4th", delay: "32s" },
                  { attempt: "5th", delay: "64s" },
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
                  4xx errors (except 429) are not retried. 5xx and network errors trigger the retry sequence.
                  After 5 failed attempts, the delivery is moved to the dead letter queue.
                </p>
              </div>
            </div>
          </Section>
        </div>
      )}

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
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" /> OAuth2 API + hosted portal access</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" /> Real-time webhook event delivery</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Compliance</p>
                  <ul className="space-y-1.5 text-sm text-slate-600">
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" /> AML / Sanctions screening</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" /> PEP (Politically Exposed Persons) checks</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" /> Risk scoring & fraud detection</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" /> Full audit trail logging</li>
                  </ul>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Verification Modules" subtitle="Configurable identity verification pipeline" icon={Fingerprint}>
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Each verification flow consists of one or more modules. Modules are configured per flow and per subscription plan, allowing you to tailor the verification intensity to your use case.
              </p>

              <div className="space-y-3 mt-4">
                <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/30">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-slate-900">ID Document Verification</h4>
                      <p className="text-xs text-slate-500 mt-1">Captures and validates government-issued identity documents including national IDs, passports, and driver's licenses. Uses AI-powered OCR to extract document data and performs authenticity checks including hologram detection, tamper analysis, and MRZ validation.</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">OCR Extraction</span>
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Tamper Detection</span>
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">MRZ Validation</span>
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Document Classification</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-violet-200 bg-violet-50/30">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center flex-shrink-0">
                      <ScanFace className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-slate-900">Face Verification & Liveness</h4>
                      <p className="text-xs text-slate-500 mt-1">Captures a live selfie and performs biometric face matching against the ID document photo. Includes passive liveness detection to prevent spoofing with photos, videos, or masks. Ensures the person presenting the document is its rightful owner.</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">Face Matching</span>
                        <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">Liveness Detection</span>
                        <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">Anti-Spoofing</span>
                        <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">Biometric Scoring</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/30">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-slate-900">Email Verification</h4>
                      <p className="text-xs text-slate-500 mt-1">Sends a one-time verification code to the user's email address to confirm ownership and reachability. Validates email format, checks for disposable email providers, and confirms the mailbox exists.</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">OTP Verification</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Disposable Email Check</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Format Validation</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/30">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-slate-900">Phone Verification</h4>
                      <p className="text-xs text-slate-500 mt-1">Sends an SMS OTP to verify phone number ownership. Supports international numbers and validates carrier information. Useful as a secondary verification factor and for ongoing communication.</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">SMS OTP</span>
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">International Support</span>
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Carrier Lookup</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-rose-200 bg-rose-50/30">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-slate-900">Proof of Address</h4>
                      <p className="text-xs text-slate-500 mt-1">Accepts utility bills, bank statements, or government correspondence as proof of residential address. Extracts address data via OCR, validates recency (typically within 3 months), and cross-references against the applicant's declared information.</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">Document Upload</span>
                        <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">Address Extraction</span>
                        <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">Recency Check</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          <Section title="AML & Sanctions Screening" subtitle="Anti-money laundering and watchlist checks" icon={Search} defaultOpen={false}>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                NOBIS integrates with leading AML screening providers to automatically check applicants against global sanctions lists, PEP databases, and criminal watchlists. Screening runs automatically when configured in your subscription plan.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-lg border border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">OpenSanctions</h4>
                  <p className="text-xs text-slate-500">Open-source sanctions and PEP database covering 100+ data sources worldwide. Includes UN, EU, US OFAC, and country-specific sanctions lists.</p>
                </div>
                <div className="p-4 rounded-lg border border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">AML Watcher</h4>
                  <p className="text-xs text-slate-500">Commercial AML screening service with real-time monitoring, adverse media checks, and comprehensive PEP coverage across 240+ countries.</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Configurable Parameters</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-center">
                    <p className="text-xs font-semibold text-slate-500">Match Threshold</p>
                    <p className="text-sm text-slate-900 mt-1">0.5 &ndash; 0.9</p>
                    <p className="text-[10px] text-slate-400">Fuzzy matching sensitivity</p>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-center">
                    <p className="text-xs font-semibold text-slate-500">Dataset</p>
                    <p className="text-sm text-slate-900 mt-1">Sanctions / PEPs / All</p>
                    <p className="text-[10px] text-slate-400">Which lists to check</p>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-center">
                    <p className="text-xs font-semibold text-slate-500">Levels</p>
                    <p className="text-sm text-slate-900 mt-1">Off / Basic / Full</p>
                    <p className="text-[10px] text-slate-400">Screening depth</p>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Risk & Fraud Detection" subtitle="Multi-signal risk assessment" icon={Activity} defaultOpen={false}>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                NOBIS analyzes multiple signals during verification to assess fraud risk and flag suspicious activity. Risk scoring is automatic and configurable per subscription plan.
              </p>
              <div className="space-y-2">
                {[
                  { signal: "IP Geolocation", desc: "Detects VPN/proxy usage and compares IP location against declared country. Flags mismatches and high-risk jurisdictions.", icon: Globe },
                  { signal: "Device Intelligence", desc: "Analyzes browser fingerprint, device type, and session behavior for anomalies like emulators or automated tools.", icon: Activity },
                  { signal: "Biometric Confidence", desc: "Face match score between selfie and ID photo. Low confidence triggers manual review.", icon: ScanFace },
                  { signal: "Document Authenticity", desc: "Detects edited, photocopied, or screen-captured documents. Checks security features and font consistency.", icon: CreditCard },
                  { signal: "Velocity Checks", desc: "Flags repeated verification attempts from the same IP, device, or phone number within a short timeframe.", icon: Zap },
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

          <Section title="Flows & Configuration" subtitle="How verification pipelines work" icon={ArrowRight} defaultOpen={false}>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                A <span className="font-semibold">Flow</span> defines a reusable verification pipeline. Each flow specifies which modules to run, in what order, and what compliance checks to apply. Flows are linked to subscription plans that determine which modules are available.
              </p>
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Example: TSTT SIM Registration Flow</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {["Phone Verification", "Email Verification", "ID Document", "Face Match"].map((step, i, arr) => (
                    <div key={step} className="flex items-center gap-2">
                      <span className="text-xs font-medium bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg">{step}</span>
                      {i < arr.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-slate-300" />}
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-3 pt-3 border-t border-slate-200">
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Risk Level: 1</span>
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Sanctions: Basic</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">Max Uses: Unlimited</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Per-Flow Overrides</p>
                <p className="text-sm text-slate-600">Each flow can optionally override your organization's default settings:</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-lg border border-slate-200 bg-white text-center">
                    <Webhook className="h-4 w-4 text-violet-500 mx-auto mb-1" />
                    <p className="text-xs font-medium text-slate-900">Webhook URL</p>
                    <p className="text-[10px] text-slate-400">Per-flow endpoint</p>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 bg-white text-center">
                    <Globe className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
                    <p className="text-xs font-medium text-slate-900">Redirect URLs</p>
                    <p className="text-[10px] text-slate-400">Success & cancel destinations</p>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 bg-white text-center">
                    <Shield className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                    <p className="text-xs font-medium text-slate-900">Allowed Domains</p>
                    <p className="text-[10px] text-slate-400">Restrict redirect targets</p>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Integration Patterns" subtitle="Common integration architectures" icon={Terminal} defaultOpen={false}>
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Hosted Flow (Recommended)</h4>
                <p className="text-xs text-slate-500 mb-3">Redirect users to a NOBIS-hosted verification page. Simplest integration with no frontend work required.</p>
                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg font-mono">
                  Your App <ArrowRight className="h-3 w-3 text-slate-400" /> Create Session (API) <ArrowRight className="h-3 w-3 text-slate-400" /> Redirect to session_url <ArrowRight className="h-3 w-3 text-slate-400" /> NOBIS SDK <ArrowRight className="h-3 w-3 text-slate-400" /> Webhook / Redirect back
                </div>
              </div>
              <div className="p-4 rounded-lg border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Embedded SDK</h4>
                <p className="text-xs text-slate-500 mb-3">Embed the NOBIS verification widget directly in your application using an iframe or web component.</p>
                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg font-mono">
                  Your App <ArrowRight className="h-3 w-3 text-slate-400" /> Create Session <ArrowRight className="h-3 w-3 text-slate-400" /> Load SDK in iframe <ArrowRight className="h-3 w-3 text-slate-400" /> SDK posts results <ArrowRight className="h-3 w-3 text-slate-400" /> Webhook fires
                </div>
              </div>
              <div className="p-4 rounded-lg border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-900 mb-2">API-Only (Headless)</h4>
                <p className="text-xs text-slate-500 mb-3">Build your own verification UI and submit data directly to NOBIS APIs. Full control over the user experience.</p>
                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg font-mono">
                  Your UI <ArrowRight className="h-3 w-3 text-slate-400" /> Capture docs/selfie <ArrowRight className="h-3 w-3 text-slate-400" /> Submit via API <ArrowRight className="h-3 w-3 text-slate-400" /> Poll status <ArrowRight className="h-3 w-3 text-slate-400" /> Webhook fires
                </div>
              </div>
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
