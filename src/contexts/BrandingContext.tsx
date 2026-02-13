 import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
 
 // Default NOBIS blue and sidebar mode configuration
 const DEFAULT_ACCENT_COLOR = "#0125cf";
 const DEFAULT_SIDEBAR_MODE = "tinted" as const;
 const TENANT_ID = "demo-tenant";
 const STORAGE_KEY = "nobis_tenant_branding";
 
 export interface TenantBranding {
   tenantId: string;
   logoUrl: string | null;
   accentColor: string;
  sidebarColorMode: "neutral" | "match" | "tinted";
   poweredByPlacement: "sidebar" | "footer";
   updatedAt: string;
 }
 
 interface BrandingContextType {
   branding: TenantBranding;
   updateBranding: (updates: Partial<Omit<TenantBranding, "tenantId" | "updatedAt">>) => void;
   resetToDefaults: () => void;
   isLoading: boolean;
 }
 
 const defaultBranding: TenantBranding = {
   tenantId: TENANT_ID,
   logoUrl: null,
   accentColor: DEFAULT_ACCENT_COLOR,
  sidebarColorMode: DEFAULT_SIDEBAR_MODE,
   poweredByPlacement: "footer",
   updatedAt: new Date().toISOString(),
 };
 
 const BrandingContext = createContext<BrandingContextType | undefined>(undefined);
 
 export function BrandingProvider({ children }: { children: ReactNode }) {
   const [branding, setBranding] = useState<TenantBranding>(defaultBranding);
   const [isLoading, setIsLoading] = useState(true);
 
   // Load branding from localStorage on mount
   useEffect(() => {
     const stored = localStorage.getItem(STORAGE_KEY);
     if (stored) {
       try {
         const parsed = JSON.parse(stored);
         setBranding({ ...defaultBranding, ...parsed });
       } catch (e) {
         console.warn("Failed to parse branding settings:", e);
       }
     }
     setIsLoading(false);
   }, []);
 
    // Apply accent color and sidebar theme to CSS variables
    useEffect(() => {
      if (branding.accentColor) {
        const color = branding.accentColor;
        const hsl = hexToHSL(color);
        if (hsl) {
          document.documentElement.style.setProperty("--primary", hsl);
          document.documentElement.style.setProperty("--accent", hsl);
          document.documentElement.style.setProperty("--ring", hsl);
          
          // Apply sidebar colors based on mode
          applySidebarColors(hsl, branding.sidebarColorMode);
        }
      }
    }, [branding.accentColor, branding.sidebarColorMode]);
 
   const updateBranding = (updates: Partial<Omit<TenantBranding, "tenantId" | "updatedAt">>) => {
     const updated: TenantBranding = {
       ...branding,
       ...updates,
       updatedAt: new Date().toISOString(),
     };
     setBranding(updated);
     localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
   };
 
   const resetToDefaults = () => {
     setBranding(defaultBranding);
     localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultBranding));
     // Reset CSS variables
     const hsl = hexToHSL(DEFAULT_ACCENT_COLOR);
     if (hsl) {
       document.documentElement.style.setProperty("--primary", hsl);
       document.documentElement.style.setProperty("--accent", hsl);
       document.documentElement.style.setProperty("--ring", hsl);
        
        // Reset sidebar variables using default mode
        applySidebarColors(hsl, DEFAULT_SIDEBAR_MODE);
     }
   };
 
   return (
     <BrandingContext.Provider value={{ branding, updateBranding, resetToDefaults, isLoading }}>
       {children}
     </BrandingContext.Provider>
   );
 }
 
 export function useBranding() {
   const context = useContext(BrandingContext);
   if (context === undefined) {
     throw new Error("useBranding must be used within a BrandingProvider");
   }
   return context;
 }
 
 // Utility: Convert hex color to HSL string (without hsl() wrapper)
 function hexToHSL(hex: string): string | null {
   // Remove # if present
   hex = hex.replace(/^#/, "");
 
   // Parse hex
   let r = 0, g = 0, b = 0;
   if (hex.length === 3) {
     r = parseInt(hex[0] + hex[0], 16);
     g = parseInt(hex[1] + hex[1], 16);
     b = parseInt(hex[2] + hex[2], 16);
   } else if (hex.length === 6) {
     r = parseInt(hex.substring(0, 2), 16);
     g = parseInt(hex.substring(2, 4), 16);
     b = parseInt(hex.substring(4, 6), 16);
   } else {
     return null;
   }
 
   // Convert to 0-1 range
   r /= 255;
   g /= 255;
   b /= 255;
 
   const max = Math.max(r, g, b);
   const min = Math.min(r, g, b);
   let h = 0, s = 0;
   const l = (max + min) / 2;
 
   if (max !== min) {
     const d = max - min;
     s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
     switch (max) {
       case r:
         h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
         break;
       case g:
         h = ((b - r) / d + 2) / 6;
         break;
       case b:
         h = ((r - g) / d + 4) / 6;
         break;
     }
   }
 
   // Return HSL values space-separated (for CSS variable format)
   return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
 }
 
 // Apply sidebar colors based on mode
 function applySidebarColors(accentHsl: string, mode: "neutral" | "match" | "tinted") {
   const hslParts = accentHsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
   if (!hslParts) return;
   
   const h = parseInt(hslParts[1]);
   const s = parseInt(hslParts[2]);
   const l = parseInt(hslParts[3]);
   
   if (mode === "neutral") {
     // Neutral dark sidebar - no accent tint
     document.documentElement.style.setProperty("--sidebar-background", "220 15% 15%");
     document.documentElement.style.setProperty("--sidebar-primary", "220 15% 25%");
     document.documentElement.style.setProperty("--sidebar-accent", "220 15% 22%");
   } else if (mode === "match") {
     // Exact accent color for sidebar
     document.documentElement.style.setProperty("--sidebar-background", accentHsl);
     document.documentElement.style.setProperty("--sidebar-primary", `${h} ${s}% ${Math.min(l + 10, 90)}%`);
     document.documentElement.style.setProperty("--sidebar-accent", `${h} ${s}% ${Math.min(l + 5, 80)}%`);
   } else {
     // Tinted (darkened accent) - default
     const sidebarBgL = Math.max(12, l - 30);
     document.documentElement.style.setProperty("--sidebar-background", `${h} ${Math.min(s + 10, 100)}% ${sidebarBgL}%`);
     document.documentElement.style.setProperty("--sidebar-primary", `${h} ${s}% ${Math.min(sidebarBgL + 15, 50)}%`);
     document.documentElement.style.setProperty("--sidebar-accent", `${h} ${Math.max(s - 15, 50)}% ${Math.min(sidebarBgL + 8, 40)}%`);
   }
 }
 
 // Export for use in settings page
 export function getSidebarPreviewColor(accentHex: string, mode: "neutral" | "match" | "tinted"): string {
   if (mode === "neutral") return "#262a33";
   if (mode === "match") return accentHex;
   
   // Tinted: darken the accent
   const hsl = hexToHSL(accentHex);
   if (!hsl) return accentHex;
   
   const hslParts = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
   if (!hslParts) return accentHex;
   
   const h = parseInt(hslParts[1]);
   const s = Math.min(parseInt(hslParts[2]) + 10, 100);
   const l = Math.max(12, parseInt(hslParts[3]) - 30);
   
   return hslToHex(h, s, l);
 }
 
 // Convert HSL values to hex
 function hslToHex(h: number, s: number, l: number): string {
   s /= 100;
   l /= 100;
   const a = s * Math.min(l, 1 - l);
   const f = (n: number) => {
     const k = (n + h / 30) % 12;
     const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
     return Math.round(255 * color).toString(16).padStart(2, '0');
   };
   return `#${f(0)}${f(8)}${f(4)}`;
 }
 
 export { DEFAULT_ACCENT_COLOR, DEFAULT_SIDEBAR_MODE };