 import { useState, useRef } from "react";
 import { Upload, Trash2, Palette, Eye, Check, RotateCcw } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
 } from "@/components/ui/card";
 import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
 import { useToast } from "@/hooks/use-toast";
 import { useBranding, DEFAULT_ACCENT_COLOR, DEFAULT_SIDEBAR_MODE, getSidebarPreviewColor } from "@/contexts/BrandingContext";
 import nobisLogoWhite from "@/assets/nobis-logo-white.png";
 
 // Color presets with NOBIS Blue as default
 const COLOR_PRESETS = [
   { name: "NOBIS Blue", value: "#0125cf" },
   { name: "Ocean", value: "#0891b2" },
   { name: "Forest", value: "#059669" },
   { name: "Sunset", value: "#ea580c" },
   { name: "Berry", value: "#9333ea" },
   { name: "Slate", value: "#475569" },
 ];
 
 export default function BrandingSettings() {
   const { toast } = useToast();
   const { branding, updateBranding, resetToDefaults } = useBranding();
   const fileInputRef = useRef<HTMLInputElement>(null);
 
   // Local state for form
   const [logoPreview, setLogoPreview] = useState<string | null>(branding.logoUrl);
   const [accentColor, setAccentColor] = useState(branding.accentColor);
  const [sidebarMode, setSidebarMode] = useState<"neutral" | "match" | "tinted">(branding.sidebarColorMode);
   const [placement, setPlacement] = useState<"sidebar" | "footer">(branding.poweredByPlacement);
   const [isSaving, setIsSaving] = useState(false);
  // Computed sidebar preview color
  const sidebarPreviewColor = getSidebarPreviewColor(accentColor, sidebarMode);
 
   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
 
     // Validate file size (max 2MB)
     if (file.size > 2 * 1024 * 1024) {
       toast({
         title: "File too large",
         description: "Please upload an image smaller than 2MB.",
         variant: "destructive",
       });
       return;
     }
 
     // Validate file type
     if (!file.type.startsWith("image/")) {
       toast({
         title: "Invalid file type",
         description: "Please upload a PNG, JPG, or SVG file.",
         variant: "destructive",
       });
       return;
     }
 
     // Read file as data URL for preview
     const reader = new FileReader();
     reader.onload = (event) => {
       setLogoPreview(event.target?.result as string);
     };
     reader.readAsDataURL(file);
   };
 
   const removeLogo = () => {
     setLogoPreview(null);
     if (fileInputRef.current) {
       fileInputRef.current.value = "";
     }
   };
 
   const saveLogoSettings = async () => {
     setIsSaving(true);
     try {
       updateBranding({ logoUrl: logoPreview });
       toast({
         title: "Logo Updated",
         description: "Your brand logo has been saved successfully.",
       });
     } catch (error) {
       toast({
         title: "Error",
         description: "Failed to save logo settings.",
         variant: "destructive",
       });
     } finally {
       setIsSaving(false);
     }
   };
 
   const saveThemeSettings = async () => {
     setIsSaving(true);
     try {
      updateBranding({ accentColor, sidebarColorMode: sidebarMode });
       toast({
         title: "Theme Updated",
        description: "Your theme settings have been applied.",
       });
     } catch (error) {
       toast({
         title: "Error",
         description: "Failed to save theme settings.",
         variant: "destructive",
       });
     } finally {
       setIsSaving(false);
     }
   };
 
   const savePlacementSettings = async () => {
     setIsSaving(true);
     try {
       updateBranding({ poweredByPlacement: placement });
       toast({
         title: "Placement Updated",
         description: `"Powered by NOBIS" will now appear in the ${placement}.`,
       });
     } catch (error) {
       toast({
         title: "Error",
         description: "Failed to save placement settings.",
         variant: "destructive",
       });
     } finally {
       setIsSaving(false);
     }
   };
 
   const handleResetAll = () => {
     resetToDefaults();
     setLogoPreview(null);
     setAccentColor(DEFAULT_ACCENT_COLOR);
    setSidebarMode(DEFAULT_SIDEBAR_MODE);
     setPlacement("footer");
     toast({
       title: "Branding Reset",
       description: "All branding settings have been reset to defaults.",
     });
   };
 
   return (
     <div className="space-y-6">
       {/* Header */}
       <div className="flex items-center justify-between">
         <div>
           <h1 className="text-2xl font-bold text-foreground">Branding</h1>
           <p className="text-muted-foreground">
             Customize your dashboard appearance with your brand identity
           </p>
         </div>
         <Button variant="outline" onClick={handleResetAll} className="gap-2">
           <RotateCcw className="h-4 w-4" />
           Reset to Defaults
         </Button>
       </div>
 
       {/* Brand Identity Card */}
       <Card>
         <CardHeader>
           <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
               <Upload className="h-5 w-5 text-primary" />
             </div>
             <div>
               <CardTitle className="text-lg">Brand Identity</CardTitle>
               <CardDescription>
                 Upload your company logo to replace the default NOBIS branding
               </CardDescription>
             </div>
           </div>
         </CardHeader>
         <CardContent className="space-y-6">
           {/* Logo Preview */}
           <div className="flex items-start gap-6">
             <div className="flex flex-col items-center gap-2">
               <div className="w-32 h-16 rounded-lg bg-sidebar flex items-center justify-center p-3">
                 <img
                   src={logoPreview || nobisLogoWhite}
                   alt="Logo preview"
                   className="max-h-full max-w-full object-contain"
                 />
               </div>
               <span className="text-xs text-muted-foreground">Dark background</span>
             </div>
             <div className="flex flex-col items-center gap-2">
               <div className="w-32 h-16 rounded-lg bg-muted border flex items-center justify-center p-3">
                 <img
                   src={logoPreview || nobisLogoWhite}
                   alt="Logo preview"
                   className="max-h-full max-w-full object-contain"
                   style={{ filter: logoPreview ? "none" : "invert(1) brightness(0.3)" }}
                 />
               </div>
               <span className="text-xs text-muted-foreground">Light background</span>
             </div>
           </div>
 
           {/* Upload Controls */}
           <div className="space-y-3">
             <input
               ref={fileInputRef}
               type="file"
               accept="image/png,image/jpeg,image/svg+xml"
               onChange={handleFileUpload}
               className="hidden"
             />
             <div className="flex gap-2">
               <Button
                 variant="outline"
                 onClick={() => fileInputRef.current?.click()}
                 className="gap-2"
               >
                 <Upload className="h-4 w-4" />
                 Upload Logo
               </Button>
               {logoPreview && (
                 <Button
                   variant="outline"
                   onClick={removeLogo}
                   className="gap-2 text-destructive hover:text-destructive"
                 >
                   <Trash2 className="h-4 w-4" />
                   Remove
                 </Button>
               )}
             </div>
             <p className="text-xs text-muted-foreground">
               PNG, JPG, or SVG. Max 2MB. Recommended height: 40px.
             </p>
           </div>
 
           <Button onClick={saveLogoSettings} disabled={isSaving}>
             {isSaving ? "Saving..." : "Save Logo"}
           </Button>
         </CardContent>
       </Card>
 
       {/* Theme Card */}
       <Card>
         <CardHeader>
           <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
               <Palette className="h-5 w-5 text-primary" />
             </div>
             <div>
               <CardTitle className="text-lg">Theme</CardTitle>
               <CardDescription>
                 Choose an accent color that reflects your brand
               </CardDescription>
             </div>
           </div>
         </CardHeader>
         <CardContent className="space-y-6">
           {/* Color Picker */}
           <div className="space-y-3">
             <Label>Accent Color</Label>
             <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 p-1 rounded-lg border bg-muted/30">
                 <input
                   type="color"
                   value={accentColor}
                   onChange={(e) => setAccentColor(e.target.value)}
                   className="w-10 h-10 rounded cursor-pointer border-0"
                 />
               </div>
               <Input
                 value={accentColor}
                 onChange={(e) => setAccentColor(e.target.value)}
                 placeholder="#0125cf"
                 className="w-32 font-mono"
               />
             </div>
           </div>
 
           {/* Color Presets */}
           <div className="space-y-3">
             <Label>Presets</Label>
             <div className="flex flex-wrap gap-2">
               {COLOR_PRESETS.map((preset) => (
                 <button
                   key={preset.value}
                   onClick={() => setAccentColor(preset.value)}
                   className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                     accentColor === preset.value
                       ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                       : "border-border hover:border-primary/50"
                   }`}
                 >
                   <div
                     className="w-5 h-5 rounded-full border"
                     style={{ backgroundColor: preset.value }}
                   />
                   <span className="text-sm font-medium">{preset.name}</span>
                   {accentColor === preset.value && (
                     <Check className="h-4 w-4 text-primary" />
                   )}
                 </button>
               ))}
             </div>
           </div>
 
           {/* Live Preview */}
           <div className="space-y-3">
             <Label className="flex items-center gap-2">
               <Eye className="h-4 w-4" />
               Live Preview
             </Label>
              <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg border bg-muted/30">
                {/* Color Swatches */}
                <div className="flex gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="w-10 h-10 rounded-lg border-2 border-white shadow-sm"
                      style={{ backgroundColor: accentColor }}
                    />
                    <span className="text-[10px] text-muted-foreground font-medium">Accent</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="w-10 h-10 rounded-lg border shadow-sm"
                      style={{ backgroundColor: sidebarPreviewColor }}
                    />
                    <span className="text-[10px] text-muted-foreground font-medium">Sidebar</span>
                  </div>
                </div>
                <div className="w-px h-10 bg-border" />
               <Button style={{ backgroundColor: accentColor }}>
                 Primary Button
               </Button>
               <Button variant="outline" style={{ borderColor: accentColor, color: accentColor }}>
                 Outline Button
               </Button>
               <a
                 href="#"
                 style={{ color: accentColor }}
                 className="underline text-sm font-medium"
                 onClick={(e) => e.preventDefault()}
               >
                 Link Style
               </a>
               <div
                 className="px-3 py-1.5 rounded-lg text-white text-sm font-medium"
                 style={{ backgroundColor: accentColor }}
               >
                 Active State
               </div>
             </div>
           </div>
 
            {/* Sidebar Color Mode */}
            <div className="space-y-3">
              <Label>Sidebar Color</Label>
              <p className="text-sm text-muted-foreground">
                Choose how the sidebar background relates to your accent color
              </p>
              <RadioGroup
                value={sidebarMode}
                onValueChange={(val) => setSidebarMode(val as "neutral" | "match" | "tinted")}
                className="grid grid-cols-3 gap-3"
              >
                <label
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    sidebarMode === "neutral"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <RadioGroupItem value="neutral" className="sr-only" />
                  <div
                    className="w-8 h-12 rounded"
                    style={{ backgroundColor: "#262a33" }}
                  />
                  <span className="text-xs font-medium">Neutral</span>
                </label>
                <label
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    sidebarMode === "match"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <RadioGroupItem value="match" className="sr-only" />
                  <div
                    className="w-8 h-12 rounded"
                    style={{ backgroundColor: accentColor }}
                  />
                  <span className="text-xs font-medium">Match Accent</span>
                </label>
                <label
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    sidebarMode === "tinted"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <RadioGroupItem value="tinted" className="sr-only" />
                  <div
                    className="w-8 h-12 rounded"
                    style={{ backgroundColor: getSidebarPreviewColor(accentColor, "tinted") }}
                  />
                  <span className="text-xs font-medium">Tinted (Dark)</span>
                </label>
              </RadioGroup>
            </div>

           <Button onClick={saveThemeSettings} disabled={isSaving}>
             {isSaving ? "Saving..." : "Save Theme"}
           </Button>
         </CardContent>
       </Card>
 
       {/* Powered by NOBIS Card */}
       <Card>
         <CardHeader>
           <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
               <img src={nobisLogoWhite} alt="NOBIS" className="h-5 w-5 object-contain" style={{ filter: "brightness(0) saturate(100%) invert(21%) sepia(93%) saturate(4981%) hue-rotate(228deg) brightness(91%) contrast(107%)" }} />
             </div>
             <div>
               <CardTitle className="text-lg">Powered by NOBIS</CardTitle>
               <CardDescription>
                 Choose where the NOBIS attribution appears in your dashboard
               </CardDescription>
             </div>
           </div>
         </CardHeader>
         <CardContent className="space-y-6">
           <div className="p-4 rounded-lg bg-muted/50 border border-primary/20">
             <p className="text-sm text-muted-foreground">
               <strong className="text-foreground">Note:</strong> The "Powered by NOBIS" 
               attribution is always displayed. You can choose its placement location below.
             </p>
           </div>
 
           <div className="space-y-3">
             <Label>Placement</Label>
             <RadioGroup
               value={placement}
               onValueChange={(val) => setPlacement(val as "sidebar" | "footer")}
               className="grid grid-cols-2 gap-4"
             >
               <label
                 className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                   placement === "sidebar"
                     ? "border-primary bg-primary/5"
                     : "border-border hover:border-primary/50"
                 }`}
               >
                 <RadioGroupItem value="sidebar" className="sr-only" />
                 <div className="w-16 h-24 rounded bg-sidebar flex flex-col">
                   <div className="flex-1" />
                   <div className="h-4 mx-1 mb-1 rounded-sm bg-white/20 flex items-center justify-center">
                     <span className="text-[6px] text-white/70">Powered by NOBIS</span>
                   </div>
                 </div>
                 <span className="font-medium text-sm">Sidebar</span>
               </label>
               <label
                 className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                   placement === "footer"
                     ? "border-primary bg-primary/5"
                     : "border-border hover:border-primary/50"
                 }`}
               >
                 <RadioGroupItem value="footer" className="sr-only" />
                 <div className="w-24 h-16 rounded border bg-card flex flex-col">
                   <div className="flex-1" />
                   <div className="h-4 border-t flex items-center justify-center">
                     <span className="text-[6px] text-muted-foreground">Powered by NOBIS</span>
                   </div>
                 </div>
                 <span className="font-medium text-sm">Footer</span>
               </label>
             </RadioGroup>
           </div>
 
           <Button onClick={savePlacementSettings} disabled={isSaving}>
             {isSaving ? "Saving..." : "Save Placement"}
           </Button>
         </CardContent>
       </Card>
     </div>
   );
 }