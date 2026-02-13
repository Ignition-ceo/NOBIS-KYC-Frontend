import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AdminSidebar, MobileSidebarTrigger } from "./AdminSidebar";
import { useBranding } from "@/contexts/BrandingContext";

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { branding } = useBranding();

  return (
    <div className="flex min-h-screen w-full">
      <AdminSidebar 
        mobileOpen={mobileOpen} 
        onMobileOpenChange={setMobileOpen} 
      />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 bg-background overflow-auto">
          {/* Mobile Header */}
          <div className="lg:hidden sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-4 py-3">
            <MobileSidebarTrigger onClick={() => setMobileOpen(true)} />
          </div>
          <div className="p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
        
        {/* Footer - Powered by NOBIS */}
        {branding.poweredByPlacement === "footer" && (
          <footer className="border-t bg-card py-3 px-6">
            <p className="text-xs text-muted-foreground text-center">
              Powered by <span className="font-semibold text-foreground">NOBIS</span>
            </p>
          </footer>
        )}
      </div>
    </div>
  );
}
