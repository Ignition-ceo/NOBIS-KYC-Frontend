import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Search, ArrowUpRight, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

// Mock PoA queue data
const mockPoaQueue = [
  {
    id: "1",
    applicantId: "696bf4ec27940c2a1fa5fc77",
    fullName: "JESTON J LETT",
    selfieUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    flowName: "EnhancedKYC",
    poaStatus: "VERIFIED",
    checkedAt: "Jan 18, 2026 09:15",
    billType: "Utility Bill",
  },
  {
    id: "2",
    applicantId: "a1b2c3d4e5f6g7h8i9j0",
    fullName: "Maria Santos",
    selfieUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    flowName: "PoA Required",
    poaStatus: "PENDING",
    checkedAt: "Jan 17, 2026 14:30",
    billType: "Bank Statement",
  },
  {
    id: "3",
    applicantId: "x9y8z7w6v5u4t3s2r1",
    fullName: "James Wilson",
    selfieUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    flowName: "EnhancedKYC",
    poaStatus: "FAILED",
    checkedAt: "Jan 16, 2026 11:20",
    billType: "Utility Bill",
  },
  {
    id: "4",
    applicantId: "m1n2o3p4q5r6s7t8u9",
    fullName: "Sarah Chen",
    selfieUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    flowName: "Default",
    poaStatus: "VERIFIED",
    checkedAt: "Jan 15, 2026 16:45",
    billType: "Utility Bill",
  },
];

const statusConfig: Record<string, { label: string; className: string }> = {
  VERIFIED: { label: "Verified", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  PENDING: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200" },
  FAILED: { label: "Failed", className: "bg-red-50 text-red-700 border-red-200" },
  REJECTED: { label: "Rejected", className: "bg-red-50 text-red-700 border-red-200" },
};

export default function ProofOfAddress() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredQueue = mockPoaQueue.filter((item) => {
    const matchesSearch =
      item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.applicantId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.poaStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Proof of Address</h1>
        <p className="text-muted-foreground">
          Review and manage address verification documents
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{mockPoaQueue.length}</p>
                <p className="text-xs text-muted-foreground">Total PoA Checks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">
                  {mockPoaQueue.filter((i) => i.poaStatus === "VERIFIED").length}
                </p>
                <p className="text-xs text-muted-foreground">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">
                  {mockPoaQueue.filter((i) => i.poaStatus === "PENDING").length}
                </p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {mockPoaQueue.filter((i) => i.poaStatus === "FAILED" || i.poaStatus === "REJECTED").length}
                </p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Table */}
      <Card className="shadow-lg border-border/60">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-base font-semibold text-foreground">
              Proof of Address Queue
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search applicant..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 w-[220px] rounded-xl"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-10 rounded-xl">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">Applicant</TableHead>
                <TableHead className="font-semibold">Flow</TableHead>
                <TableHead className="font-semibold">Bill Type</TableHead>
                <TableHead className="font-semibold">PoA Status</TableHead>
                <TableHead className="font-semibold">Reviewed</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQueue.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <MapPin className="h-8 w-8" />
                      <p>No PoA records found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredQueue.map((item) => {
                  const status = statusConfig[item.poaStatus] || statusConfig.PENDING;
                  return (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => navigate(`/admin/applicants/${item.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-border">
                            <AvatarImage src={item.selfieUrl} alt={item.fullName} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getInitials(item.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{item.fullName}</p>
                            <p className="text-xs text-muted-foreground">ID: {item.applicantId.slice(0, 12)}...</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">{item.flowName}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">{item.billType}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.className}`}
                        >
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{item.checkedAt}</span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/applicants/${item.id}`);
                          }}
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
