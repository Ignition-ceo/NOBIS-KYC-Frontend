import { useState, useMemo, useCallback, useEffect } from "react";
import {
  ScrollText,
  Search,
  Filter,
  Calendar,
  ChevronRight,
  User,
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  Settings,
  Eye,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

// TODO: Replace with auth context tenant ID
const TENANT_ID = "demo-tenant";
const API_BASE = "https://backend-api.getnobis.com";

// Event type definitions
const EVENT_TYPES = [
  { id: "all", label: "All Events", icon: Filter },
  { id: "applicant.created", label: "Applicant Created", icon: User },
  { id: "applicant.updated", label: "Applicant Updated", icon: User },
  { id: "applicant.status_changed", label: "Status Changed", icon: ShieldCheck },
  { id: "verification.completed", label: "Verification Completed", icon: FileCheck },
  { id: "verification.failed", label: "Verification Failed", icon: AlertTriangle },
  { id: "settings.updated", label: "Settings Updated", icon: Settings },
] as const;

type EventType = (typeof EVENT_TYPES)[number]["id"];

interface AuditEntry {
  id: string;
  timestamp: string;
  actor: {
    id: string;
    name: string;
    email?: string;
    type: "user" | "system" | "api";
  };
  event: EventType;
  applicantId?: string;
  applicantName?: string;
  status?: "success" | "failure" | "pending";
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  note?: string;
}

// Demo data for when API is not available
const generateDemoAuditData = (): AuditEntry[] => {
  const now = new Date();
  const entries: AuditEntry[] = [
    {
      id: "audit_1",
      timestamp: new Date(now.getTime() - 1000 * 60 * 5).toISOString(),
      actor: { id: "admin_1", name: "John Admin", email: "john@nobis.com", type: "user" },
      event: "applicant.status_changed",
      applicantId: "NB-CC-0001",
      applicantName: "Carol Collymore",
      status: "success",
      details: { previousStatus: "NEEDS_REVIEW", newStatus: "APPROVED", reason: "Manual approval after document review" },
      ipAddress: "192.168.1.100",
      note: "Needs Review → Approved (Manual override by John Admin)",
    },
    {
      id: "audit_2",
      timestamp: new Date(now.getTime() - 1000 * 60 * 15).toISOString(),
      actor: { id: "system", name: "System", type: "system" },
      event: "verification.completed",
      applicantId: "NB-29013",
      applicantName: "John Smith",
      status: "success",
      details: { verificationType: "idv", confidenceScore: 98.5, checksCompleted: ["id_document", "selfie", "liveness"], duration: "2m 15s" },
      note: "BasicKYC completed in 2m 15s",
    },
    {
      id: "audit_3",
      timestamp: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
      actor: { id: "api_key_prod", name: "API Key (Production)", email: "api-prod@nobis.com", type: "api" },
      event: "applicant.created",
      applicantId: "NB-29020",
      applicantName: "Marcus Baptiste",
      status: "success",
      details: { source: "api", flowName: "SimpleKYC", documentType: "National ID" },
      ipAddress: "10.0.0.55",
      note: "Created via API key (Prod) - source: /v1/applicants",
    },
    {
      id: "audit_4",
      timestamp: new Date(now.getTime() - 1000 * 60 * 45).toISOString(),
      actor: { id: "admin_2", name: "Sarah Manager", email: "sarah@nobis.com", type: "user" },
      event: "settings.updated",
      status: "success",
      details: { section: "webhooks", action: "created", webhookUrl: "https://example.com/webhook" },
      ipAddress: "192.168.1.105",
      note: "Webhook URL updated - https://example.com/webhook",
    },
    {
      id: "audit_5",
      timestamp: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
      actor: { id: "system", name: "System", type: "system" },
      event: "verification.failed",
      applicantId: "NB-29015",
      applicantName: "Curtis Williams",
      status: "failure",
      details: { verificationType: "idv", reason: "Document expired", documentExpiryDate: "2023-06-15" },
      note: "Failed at ID Verification (Document expired: 2023-06-15)",
    },
    {
      id: "audit_6",
      timestamp: new Date(now.getTime() - 1000 * 60 * 90).toISOString(),
      actor: { id: "admin_1", name: "John Admin", email: "john@nobis.com", type: "user" },
      event: "applicant.status_changed",
      applicantId: "NB-29015",
      applicantName: "Curtis Williams",
      status: "success",
      details: { previousStatus: "NEEDS_REVIEW", newStatus: "REJECTED", reason: "Document verification failed" },
      ipAddress: "192.168.1.100",
      note: "Needs Review → Rejected (Document verification failed)",
    },
    {
      id: "audit_7",
      timestamp: new Date(now.getTime() - 1000 * 60 * 120).toISOString(),
      actor: { id: "api_key_staging", name: "API Key (Staging)", email: "api-staging@nobis.com", type: "api" },
      event: "applicant.created",
      applicantId: "NB-29019",
      applicantName: "Shania Pierre",
      status: "success",
      details: { source: "api", flowName: "Default", documentType: "National ID" },
      ipAddress: "10.0.0.60",
      note: "Created via API key (Staging) - source: /v1/applicants",
    },
    {
      id: "audit_8",
      timestamp: new Date(now.getTime() - 1000 * 60 * 180).toISOString(),
      actor: { id: "system", name: "System", type: "system" },
      event: "verification.completed",
      applicantId: "NB-29018",
      applicantName: "Kira Mohammed",
      status: "success",
      details: { verificationType: "enhanced_kyc", confidenceScore: 99.2, checksCompleted: ["id_document", "selfie", "liveness", "poa"], duration: "4m 32s" },
      note: "EnhancedKYC completed in 4m 32s",
    },
    {
      id: "audit_9",
      timestamp: new Date(now.getTime() - 1000 * 60 * 240).toISOString(),
      actor: { id: "admin_2", name: "Sarah Manager", email: "sarah@nobis.com", type: "user" },
      event: "applicant.updated",
      applicantId: "NB-29014",
      applicantName: "Cindy Alexander",
      status: "success",
      details: { updatedFields: ["email", "phone"], previousEmail: "cindy.old@example.com", newEmail: "cindy.alexander@example.com" },
      ipAddress: "192.168.1.105",
      note: "Updated fields: email, phone",
    },
    {
      id: "audit_10",
      timestamp: new Date(now.getTime() - 1000 * 60 * 300).toISOString(),
      actor: { id: "system", name: "System", type: "system" },
      event: "verification.completed",
      applicantId: "NB-CC-0001",
      applicantName: "Carol Collymore",
      status: "success",
      details: { verificationType: "enhanced_kyc", confidenceScore: 97.4, checksCompleted: ["id_document", "selfie", "liveness", "poa"], livenessScore: 97.4, matchScore: 92.3, duration: "3m 48s" },
      note: "EnhancedKYC completed in 3m 48s (Liveness: 97.4%, Match: 92.3%)",
    },
  ];
  return entries;
};

const eventConfig: Record<string, { label: string; color: string; icon: typeof User }> = {
  "applicant.created": { label: "Applicant Created", color: "bg-blue-50 text-blue-700 border-blue-200", icon: User },
  "applicant.updated": { label: "Applicant Updated", color: "bg-slate-50 text-slate-700 border-slate-200", icon: User },
  "applicant.status_changed": { label: "Status Changed", color: "bg-purple-50 text-purple-700 border-purple-200", icon: ShieldCheck },
  "verification.completed": { label: "Verification Completed", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: FileCheck },
  "verification.failed": { label: "Verification Failed", color: "bg-red-50 text-red-700 border-red-200", icon: AlertTriangle },
  "settings.updated": { label: "Settings Updated", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Settings },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  success: { label: "Success", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  failure: { label: "Failed", color: "bg-red-50 text-red-700 border-red-200" },
  pending: { label: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200" },
};

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Fetch audit entries
  const fetchAuditEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange?.from) params.set("from", dateRange.from.toISOString());
      if (dateRange?.to) params.set("to", dateRange.to.toISOString());
      if (searchQuery) params.set("q", searchQuery);
      if (eventTypeFilter !== "all") params.set("type", eventTypeFilter);

      const response = await fetch(`${API_BASE}/audit/${TENANT_ID}?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries || data || []);
      } else {
        // TODO: Wire to backend audit endpoint when available
        console.warn("Audit API not available, using demo data");
        setEntries(generateDemoAuditData());
      }
    } catch (error) {
      console.error("Failed to fetch audit entries:", error);
      // Use demo data on error
      setEntries(generateDemoAuditData());
    } finally {
      setLoading(false);
    }
  }, [dateRange, searchQuery, eventTypeFilter]);

  useEffect(() => {
    fetchAuditEntries();
  }, [fetchAuditEntries]);

  // Filter entries client-side for demo
  const filteredEntries = useMemo(() => {
    let result = [...entries];

    // Event type filter
    if (eventTypeFilter !== "all") {
      result = result.filter((entry) => entry.event === eventTypeFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (entry) =>
          entry.actor.name.toLowerCase().includes(query) ||
          entry.applicantId?.toLowerCase().includes(query) ||
          entry.applicantName?.toLowerCase().includes(query) ||
          entry.event.toLowerCase().includes(query)
      );
    }

    // Date range filter
    if (dateRange?.from) {
      const from = new Date(dateRange.from);
      from.setHours(0, 0, 0, 0);
      result = result.filter((entry) => new Date(entry.timestamp) >= from);
    }
    if (dateRange?.to) {
      const to = new Date(dateRange.to);
      to.setHours(23, 59, 59, 999);
      result = result.filter((entry) => new Date(entry.timestamp) <= to);
    }

    return result;
  }, [entries, eventTypeFilter, searchQuery, dateRange]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: format(date, "MMM d, yyyy"),
      time: format(date, "h:mm:ss a"),
    };
  };

  const clearFilters = () => {
    setSearchQuery("");
    setEventTypeFilter("all");
    setDateRange(undefined);
  };

  const hasActiveFilters = searchQuery || eventTypeFilter !== "all" || dateRange;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
        <p className="text-muted-foreground">
          Track all system activities and changes
        </p>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ScrollText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Activity Log</CardTitle>
              <CardDescription>
                {filteredEntries.length} entries found
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by actor, applicant, or event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Event Type */}
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Event type" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 min-w-[200px] justify-start">
                  <Calendar className="h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d")}
                      </>
                    ) : (
                      format(dateRange.from, "MMM d, yyyy")
                    )
                  ) : (
                    "Select date range"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="gap-2">
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ScrollText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No audit entries found</p>
              <p className="text-sm text-muted-foreground/70">
                {hasActiveFilters
                  ? "Try adjusting your filters"
                  : "Activity will appear here when events occur"}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden w-full">
              <Table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[160px]" />
                  <col className="w-[220px]" />
                  <col className="w-[180px]" />
                  <col className="w-[220px]" />
                  <col style={{ minWidth: "320px" }} />
                  <col className="w-[120px]" />
                  <col className="w-[64px]" />
                </colgroup>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider">Timestamp</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider">Actor</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider">Event</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider">Subject</TableHead>
                    <TableHead className="py-3 px-5 text-xs font-semibold uppercase tracking-wider">Notes</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-right">Status</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-center">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => {
                    const { date, time } = formatTimestamp(entry.timestamp);
                    const eventInfo = eventConfig[entry.event] || {
                      label: entry.event,
                      color: "bg-slate-50 text-slate-700 border-slate-200",
                      icon: Filter,
                    };
                    const statusInfo = entry.status
                      ? statusConfig[entry.status]
                      : null;

                    // Generate subject fallback for non-applicant events
                    const getSubject = () => {
                      if (entry.applicantId) {
                        return {
                          primary: entry.applicantName || "Unknown Applicant",
                          secondary: entry.applicantId,
                        };
                      }
                      // Fallback for settings/org events
                      if (entry.event === "settings.updated") {
                        return {
                          primary: "Org Settings",
                          secondary: `Tenant: ${TENANT_ID}`,
                        };
                      }
                      return {
                        primary: "System Event",
                        secondary: entry.actor.name,
                      };
                    };

                    const subject = getSubject();

                    return (
                      <TableRow key={entry.id} className="hover:bg-muted/30 align-top">
                        <TableCell className="py-2.5 px-4">
                          <div className="leading-tight">
                            <p className="text-sm font-medium">{date}</p>
                            <p className="text-xs text-muted-foreground leading-tight">{time}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 px-4">
                          <div className="flex items-start gap-2">
                            <div
                              className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                                entry.actor.type === "system"
                                  ? "bg-slate-100 text-slate-600"
                                  : entry.actor.type === "api"
                                  ? "bg-purple-100 text-purple-600"
                                  : "bg-primary/10 text-primary"
                              }`}
                            >
                              {entry.actor.type === "system"
                                ? "SYS"
                                : entry.actor.type === "api"
                                ? "API"
                                : entry.actor.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                            </div>
                            <div className="min-w-0 leading-tight">
                              <p className="text-sm font-medium truncate">
                                {entry.actor.name}
                              </p>
                              {entry.actor.email && (
                                <p className="text-xs text-muted-foreground truncate leading-tight">
                                  {entry.actor.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 px-4">
                          <Badge className={`${eventInfo.color} font-normal text-xs py-0.5 px-2`}>
                            {eventInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2.5 px-4">
                          <div className="leading-tight">
                            <p className="text-sm font-semibold truncate">
                              {subject.primary}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono leading-tight truncate">
                              {subject.secondary}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 px-5">
                          <div className="leading-snug">
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              <span className="font-medium text-muted-foreground/70">Note:</span>{" "}
                              {entry.note || "—"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 px-4 text-right">
                          {statusInfo ? (
                            <Badge className={`${statusInfo.color} font-normal text-xs py-0.5 px-2`}>
                              {statusInfo.label}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2.5 px-4 align-middle">
                          <div className="flex justify-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-muted/80 rounded-lg"
                              onClick={() => setSelectedEntry(entry)}
                            >
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Drawer */}
      <Sheet open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <SheetContent className="sm:max-w-[500px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Event Details</SheetTitle>
            <SheetDescription>
              Full details of the audit entry
            </SheetDescription>
          </SheetHeader>
          {selectedEntry && (
            <div className="mt-6 space-y-6">
              {/* Event Info */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Event
                  </label>
                  <p className="text-sm font-medium mt-1">
                    {eventConfig[selectedEntry.event]?.label || selectedEntry.event}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Timestamp
                  </label>
                  <p className="text-sm font-medium mt-1">
                    {format(new Date(selectedEntry.timestamp), "PPpp")}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Actor
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        selectedEntry.actor.type === "system"
                          ? "bg-slate-100 text-slate-600"
                          : selectedEntry.actor.type === "api"
                          ? "bg-purple-100 text-purple-600"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {selectedEntry.actor.type === "system"
                        ? "SYS"
                        : selectedEntry.actor.type === "api"
                        ? "API"
                        : selectedEntry.actor.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{selectedEntry.actor.name}</p>
                      {selectedEntry.actor.email && (
                        <p className="text-xs text-muted-foreground">
                          {selectedEntry.actor.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                {selectedEntry.applicantId && (
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider">
                      Applicant
                    </label>
                    <p className="text-sm font-medium mt-1">
                      {selectedEntry.applicantName || selectedEntry.applicantId}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {selectedEntry.applicantId}
                    </p>
                  </div>
                )}
                {selectedEntry.status && (
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider">
                      Status
                    </label>
                    <div className="mt-1">
                      <Badge
                        className={`${statusConfig[selectedEntry.status]?.color} font-normal`}
                      >
                        {statusConfig[selectedEntry.status]?.label}
                      </Badge>
                    </div>
                  </div>
                )}
                {selectedEntry.ipAddress && (
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider">
                      IP Address
                    </label>
                    <p className="text-sm font-mono mt-1">{selectedEntry.ipAddress}</p>
                  </div>
                )}
              </div>

              {/* JSON Payload */}
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Full Payload
                </label>
                <pre className="mt-2 p-4 bg-muted rounded-lg overflow-x-auto text-xs font-mono">
                  {JSON.stringify(selectedEntry.details, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
