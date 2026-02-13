import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import ProtectedRoute from "./components/ProtectedRoute";
import { AdminLayout } from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Applicants from "./pages/admin/Applicants";
import ApplicantDetails from "./pages/admin/ApplicantDetails";
import Flows from "./pages/admin/Flows";
import BrandingSettings from "./pages/admin/BrandingSettings";
import AmlScreening from "./pages/admin/AmlScreening";
import RiskFraudQueue from "./pages/admin/RiskFraudQueue";
import RiskFraudDetails from "./pages/admin/RiskFraudDetails";
import AuditLog from "./pages/admin/AuditLog";
import DevSpace from "./pages/admin/DevSpace";
import Settings from "./pages/admin/Settings";
import AdminProfile from "./pages/admin/AdminProfile";
import { BrandingProvider } from "./contexts/BrandingContext";
import { AppStateProvider } from "./contexts/AppStateContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrandingProvider>
      <AppStateProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/callback" element={<AuthCallback />} />

              {/* Protected client routes — maps 1:1 to old /client/* tree */}
              <Route
                path="/client"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="users" element={<Applicants />} />
                <Route path="users/:id" element={<ApplicantDetails />} />
                <Route path="flows" element={<Flows />} />
                <Route path="aml-sanctions" element={<AmlScreening />} />
                <Route path="aml-sanctions/:id" element={<ApplicantDetails />} />
                <Route path="risk-fraud" element={<RiskFraudQueue />} />
                <Route path="risk-fraud/:id" element={<RiskFraudDetails />} />
                <Route path="activity" element={<AuditLog />} />
                <Route path="admin-profile" element={<AdminProfile />} />
                <Route path="settings" element={<Settings />} />
                <Route path="settings/branding" element={<BrandingSettings />} />
                <Route path="dev-space" element={<DevSpace />} />
              </Route>

              {/* Root redirect */}
              <Route path="/" element={<Navigate to="/client" replace />} />
              <Route
                path="/dashboard"
                element={<Navigate to="/client" replace />}
              />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AppStateProvider>
    </BrandingProvider>
  </QueryClientProvider>
);

export default App;
