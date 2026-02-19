import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import {
  LayoutDashboard,
  Users,
  GitBranch,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  ScrollText,
  Code2,
  UserCog,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  Menu,
  X,
  Paintbrush,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import nobisLogoWhite from "@/assets/nobis-logo-white.png";
import { useBranding } from "@/contexts/BrandingContext";

const STORAGE_KEY = "nobis_admin_sidebar_collapsed";

interface NavItem {
  key: string;
  label: string;
  icon: React.ElementType;
  route: string;
}

const primaryNavItems: NavItem[] = [
  { key: "dashboard", label: "Overview", icon: LayoutDashboard, route: "/client" },
  { key: "applicants", label: "Users", icon: Users, route: "/client/users" },
  { key: "flows", label: "Flows", icon: GitBranch, route: "/client/flows" },
  { key: "aml", label: "AML / Sanctions", icon: ShieldCheck, route: "/client/aml-sanctions" },
  { key: "risk", label: "Risk & Fraud", icon: AlertTriangle, route: "/client/risk-fraud" },
];

const secondaryNavItems: NavItem[] = [
  { key: "activity", label: "Activity", icon: ScrollText, route: "/client/activity" },
  { key: "dev", label: "Dev Space", icon: Code2, route: "/client/dev-space" },
];

const accountNavItems: NavItem[] = [
  { key: "admin-profile", label: "Admin Profile", icon: UserCog, route: "/client/admin-profile" },
  { key: "settings", label: "Settings", icon: Settings, route: "/client/settings" },
  { key: "branding", label: "Branding", icon: Paintbrush, route: "/client/settings/branding" },
];

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

export function AdminSidebar({ mobileOpen, onMobileOpenChange }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "true";
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { branding } = useBranding();
  const { logout: auth0Logout } = useAuth0();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  const handleLogout = () => {
    auth0Logout({ logoutParams: { returnTo: window.location.origin + "/login" } });
  };

  const handleNavClick = () => {
    // Close mobile drawer when navigating
    if (onMobileOpenChange) {
      onMobileOpenChange(false);
    }
  };

  // Check if route is active, including child routes
  // Check if route is active - uses EXACT match for leaf routes
  // For parent routes with children, only match exactly (not prefix)
  const isRouteActive = (route: string, key: string) => {
    const pathname = location.pathname;
    
    // Dashboard is the index route — only exact match
    if (key === "dashboard") {
      return pathname === "/client" || pathname === "/client/";
    }
    // Settings is a parent - only active on exact match
    if (key === "settings") {
      return pathname === route;
    }
    // Branding is a child of settings - exact match
    if (key === "branding") {
      return pathname === route;
    }
    // These have child detail pages
    if (key === "applicants") {
      return pathname === route || pathname.startsWith("/client/users/");
    }
    if (key === "risk") {
      return pathname === route || pathname.startsWith("/client/risk-fraud/");
    }
    if (key === "aml") {
      return pathname === route || pathname.startsWith("/client/aml-sanctions/");
    }
    return pathname === route;
  };

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = isRouteActive(item.route, item.key);
    const Icon = item.icon;

    const linkContent = (
      <NavLink
        to={item.route}
        onClick={handleNavClick}
        end={item.key === "settings" || item.key === "branding"}
        className={cn(
          "sidebar-nav-item",
          isActive && "active",
          collapsed && "collapsed"
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  // Mobile nav item (always expanded)
  const MobileNavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = isRouteActive(item.route, item.key);
    const Icon = item.icon;

    return (
      <NavLink
        to={item.route}
        onClick={handleNavClick}
        end={item.key === "settings" || item.key === "branding"}
        className={cn(
          "sidebar-nav-item",
          isActive && "active"
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span>{item.label}</span>
      </NavLink>
    );
  };

  const sidebarContent = (isMobile: boolean = false) => {
    const NavComponent = isMobile ? MobileNavItemComponent : NavItemComponent;
    const showExpanded = isMobile || !collapsed;

    return (
      <>
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-3">
            <img
              src={branding.logoUrl || nobisLogoWhite}
              alt="Logo"
              className={cn(
                "object-contain transition-all duration-200",
                showExpanded ? "h-8 w-auto max-w-[120px]" : "h-7 w-7"
              )}
            />
          </div>
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="h-8 w-8 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/80 hover:bg-white/[0.12] hover:text-white"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        {/* Search */}
        {showExpanded && (
          <div className="px-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/45" />
              <Input
                placeholder="Search"
                className="pl-9 h-9 bg-white/[0.06] border-white/[0.08] text-white/90 placeholder:text-white/45 focus-visible:ring-sidebar-primary"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {/* Primary Section */}
          <div className="space-y-1">
            {primaryNavItems.map((item) => (
              <NavComponent key={item.key} item={item} />
            ))}
          </div>

          {/* Divider */}
          <div className="h-px bg-white/10 mx-1" />

          {/* Secondary Section */}
          <div className="space-y-1">
            {secondaryNavItems.map((item) => (
              <NavComponent key={item.key} item={item} />
            ))}
          </div>

          {/* Divider */}
          <div className="h-px bg-white/10 mx-1" />

          {/* Account Section */}
          <div className="space-y-1">
            {accountNavItems.map((item) => (
              <NavComponent key={item.key} item={item} />
            ))}
          </div>
        </nav>

        {/* Footer - Logout */}
        <div className="p-3 mt-auto">
          {/* Powered by NOBIS - Sidebar placement */}
          {branding.poweredByPlacement === "sidebar" && showExpanded && (
            <div className="mb-3 px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
              <p className="text-[10px] text-white/50 text-center">
                Powered by <span className="font-semibold text-white/70">NOBIS</span>
              </p>
            </div>
          )}
          {branding.poweredByPlacement === "sidebar" && !showExpanded && (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div className="mb-3 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                  <span className="text-[9px] font-bold text-white/50">N</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">Powered by NOBIS</TooltipContent>
            </Tooltip>
          )}
          {!showExpanded ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="w-full h-11 rounded-xl bg-white/[0.06] border border-white/10 text-white/90 hover:bg-white/[0.12] hover:text-white"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full h-11 justify-start gap-3 rounded-xl bg-white/[0.06] border border-white/10 text-white/90 hover:bg-white/[0.12] hover:text-white"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </Button>
          )}
        </div>
      </>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "sidebar-gradient sticky top-0 h-screen flex-col border-r border-white/[0.06] transition-all duration-200 hidden lg:flex",
          collapsed ? "w-20" : "w-[280px]"
        )}
      >
        {sidebarContent(false)}
      </aside>

      {/* Mobile Drawer */}
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent 
          side="left" 
          className="sidebar-gradient !bg-transparent w-[300px] p-0 border-r border-white/[0.06] flex flex-col"
        >
          {sidebarContent(true)}
        </SheetContent>
      </Sheet>
    </>
  );
}

// Mobile toggle button component for use in AdminLayout
export function MobileSidebarTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="lg:hidden h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
