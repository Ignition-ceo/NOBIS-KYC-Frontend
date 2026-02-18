import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  Shield,
  UserPlus,
  CheckCircle2,
  XCircle,
  FileEdit,
  Mail,
  StickyNote,
  Settings,
  AlertTriangle,
  Loader2,
} from "lucide-react";

// ── Event config ──
const eventConfig: Record<string, { label: string; className: string; icon: any }> = {
  status_changed: {
    label: "Status Changed",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    icon: FileEdit,
  },
  verification_completed: {
    label: "Verification Completed",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  verification_failed: {
    label: "Verification Failed",
    className: "bg-red-50 text-red-700 border-red-200",
    icon: XCircle,
  },
  applicant_created: {
    label: "Applicant Created",
    className: "bg-purple-50 text-purple-700 border-purple-200",
    icon: UserPlus,
  },
  note_added: {
    label: "Note Added",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: StickyNote,
  },
  email_sent: {
    label: "Email Sent",
    className: "bg-sky-50 text-sky-700 border-sky-200",
    icon: Mail,
  },
  settings_updated: {
    label: "Settings Updated",
    className: "bg-slate-50 text-slate-700 border-slate-200",
    icon: Settings,
  },
  resource_accessed: {
    label: "Resource Accessed",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: Shield,
  },
};

const defaultEvent = {
  label: "Event",
  className: "bg-slate-50 text-slate-600 border-slate-200",
  icon: ClipboardList,
};

// ── Actor display ──
function getActorDisplay(actor: any) {
  if (!actor) return { initials: "?", label: "Unknown", sublabel: "" };
  const type = actor.type?.toLowerCase() || "";
  const id = actor.id || "";

  if (type === "admin") {
    const email = id;
    const name = email.split("@")[0]?.replace(/[._-]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) || "Admin";
    return { initials: name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(), label: name, sublabel: email, color: "bg-blue-600" };
  }
  if (type === "system") {
    return { initials: "SYS", label: "System", sublabel: "", color: "bg-slate-500" };
  }
  if (type === "api" || type === "api_key") {
    return { initials: "API", label: "API Key", sublabel: id, color: "bg-orange-500" };
  }
  return { initials: id.slice(0, 2).toUpperCase(), label: id, sublabel: type, color: "bg-slate-400" };
}

// ── Format date ──
function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return { date, time, relative: isToday ? "Today" : isYesterday ? "Yesterday" : "" };
}

export default function AuditLog() {
  const [events, setEvents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [distinctActions, setDistinctActions] = useState<string[]>([]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", limit.toString());
      if (actionFilter && actionFilter !== "all") params.set("action", actionFilter);
      if (search.trim()) params.set("search", search.trim());
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await api.get(`/audit?${params.toString()}`);
      setEvents(res.data.events || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch audit events:", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, actionFilter, search, startDate, endDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    api.get("/audit/actions").then((res) => {
      setDistinctActions(res.data.actions || []);
    }).catch(() => {});
  }, []);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [actionFilter, search, startDate, endDate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Log</h1>
        <p className="text-sm text-slate-500 mt-1">Track all system activities and changes</p>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <ClipboardList className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Activity Log</h2>
            <p className="text-xs text-slate-500">{total} {total === 1 ? "entry" : "entries"} found</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by actor, applicant, or event..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-white border-slate-200 text-sm"
            />
          </div>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-10 bg-white border-slate-200 text-sm">
              <SelectValue placeholder="All Events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {distinctActions.map((a) => (
                <SelectItem key={a} value={a}>
                  {eventConfig[a]?.label || a.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-9 h-10 w-[150px] bg-white border-slate-200 text-sm"
                placeholder="Start date"
              />
            </div>
            <span className="text-slate-400 text-xs">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-10 w-[150px] bg-white border-slate-200 text-sm"
              placeholder="End date"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
              <ClipboardList className="h-7 w-7 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-500">No audit events found</p>
            <p className="text-xs text-slate-400 mt-1">Events will appear here as actions occur in the system.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Timestamp</th>
                  <th className="text-left py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Actor</th>
                  <th className="text-left py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Event</th>
                  <th className="text-left py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Subject</th>
                  <th className="text-left py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event: any) => {
                  const cfg = eventConfig[event.action] || defaultEvent;
                  const IconComp = cfg.icon;
                  const actor = getActorDisplay(event.actor);
                  const dt = formatDate(event.createdAt);
                  const meta = event.metadata || {};

                  return (
                    <tr key={event._id} className="border-b border-slate-50 hover:bg-slate-25 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="text-[13px] font-medium text-slate-900">{dt.date}</p>
                        <p className="text-[11px] text-slate-400">{dt.time}</p>
                        {dt.relative && <p className="text-[10px] text-slate-400">{dt.relative}</p>}
                      </td>

                      {/* Actor */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-8 w-8 rounded-full ${actor.color || "bg-slate-400"} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-[10px] font-bold text-white">{actor.initials}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-slate-900 truncate">{actor.label}</p>
                            {actor.sublabel && <p className="text-[11px] text-slate-400 truncate">{actor.sublabel}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Event */}
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${cfg.className}`}>
                          {cfg.label}
                        </Badge>
                      </td>

                      {/* Subject */}
                      <td className="py-3.5 px-4">
                        <p className="text-[13px] font-medium text-slate-900 truncate max-w-[200px]">
                          {meta.applicantName || event.object_id}
                        </p>
                        {meta.applicantName && (
                          <p className="text-[11px] text-slate-400 font-mono truncate">{event.object_id}</p>
                        )}
                      </td>

                      {/* Details */}
                      <td className="py-3.5 px-4">
                        <p className="text-[12px] text-slate-500 leading-relaxed max-w-[300px] truncate">
                          {meta.note || meta.reason || meta.verificationType || "—"}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-[12px] text-slate-500">
              {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(1)}>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 py-1 text-[12px] font-semibold text-slate-700 bg-slate-100 rounded-md">{page}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
