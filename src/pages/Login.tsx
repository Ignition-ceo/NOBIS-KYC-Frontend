import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, LogIn } from "lucide-react";
import nobisLogoWhite from "@/assets/nobis-logo-white.png";
import tsttLogoWhite from "@/assets/tstt-logo-white.png";
import caribbeanPeople from "@/assets/caribbean-people.webp";

// Domain-based branding config
const getBranding = () => {
  const hostname = window.location.hostname;

  // TSTT instance
  if (hostname.includes("portal.getnobis.com")) {
    return {
      logo: tsttLogoWhite,
      logoAlt: "TSTT",
      logoHeight: "h-24",
      headline: "National Onboarding Biometric Identification System",
      subtitle: "KYC, AML screening, and fraud prevention for Trinidad & Tobago.",
      bgColor: "#0125cf",
      gradientFrom: "#0043FF",
      gradientTo: "#0125cf",
      accentColor: "#0125cf",
      showPoweredBy: true,
      welcomeTitle: "Welcome Back",
      tagline: "FRICTIONLESS ONBOARDING. SMARTER COMPLIANCE.",
      description: "Verify instantly, stay compliant, automate with AI \u2013 you're in control.",
    };
  }

  // NOBIS platform (default / platform.getnobis.com / localhost)
  return {
    logo: nobisLogoWhite,
    logoAlt: "NOBIS",
    logoHeight: "h-16",
    headline: "Identity Verification & Compliance Platform",
    subtitle: "KYC, AML screening, and fraud prevention \u2014 powered by AI.",
    bgColor: "#0F1B4C",
    gradientFrom: "#0043FF",
    gradientTo: "#0F1B4C",
    accentColor: "#0F1B4C",
    showPoweredBy: false,
    welcomeTitle: "Welcome Back",
    tagline: "FRICTIONLESS ONBOARDING. SMARTER COMPLIANCE.",
    description: "Verify instantly, stay compliant, automate with AI \u2013 you're in control.",
  };
};

const Login = () => {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const navigate = useNavigate();
  const branding = getBranding();

  // If already authenticated, skip login page
  useEffect(() => {
    if (isAuthenticated) navigate("/client", { replace: true });
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    try {
      setIsRedirecting(true);
      await loginWithRedirect({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          redirect_uri: `${window.location.origin}/callback`,
        },
      });
    } catch (e) {
      console.error("Auth0 login redirect failed:", e);
      setIsRedirecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex">
      {/* Left side — Sign-in CTA */}
      <div className="w-full lg:w-1/2 h-full flex justify-center items-center bg-white">
        <div className="w-full max-w-md px-8 text-center">
          {/* Header */}
          <div className="mb-10">
            <h1
              className="text-4xl font-bold mb-2"
              style={{ color: branding.accentColor }}
            >
              {branding.welcomeTitle}
            </h1>
            <div
              className="w-16 h-1 mx-auto rounded-full mb-6"
              style={{
                background: `linear-gradient(to right, ${branding.gradientFrom}, ${branding.gradientTo})`,
              }}
            />
            <h2
              className="text-lg font-semibold tracking-wide"
              style={{ color: branding.accentColor }}
            >
              {branding.tagline}
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed mt-2">
              {branding.description}
            </p>
          </div>

          {/* Sign-in Button */}
          <Button
            onClick={handleLogin}
            disabled={isRedirecting}
            className="w-full h-[52px] rounded-2xl text-white text-base font-medium gap-2"
            style={{
              background: `linear-gradient(to right, ${branding.gradientFrom}, ${branding.gradientTo})`,
            }}
          >
            {isRedirecting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Redirecting to sign in...
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                Sign In
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground mt-6">
            Secured by Auth0. Your credentials are never stored on our servers.
          </p>
        </div>
      </div>

      {/* Right side — Branding */}
      <div
        className="hidden lg:flex w-1/2 h-full relative overflow-hidden items-center justify-center"
        style={{ backgroundColor: branding.bgColor }}
      >
        <div className="absolute inset-0">
          <img
            src={caribbeanPeople}
            alt="Verification Platform"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="relative z-10 text-center px-12 flex flex-col items-center justify-center h-full">
          <div className="flex-1 flex flex-col items-center justify-center">
            <img
              src={branding.logo}
              alt={branding.logoAlt}
              className={`${branding.logoHeight} mx-auto mb-8`}
            />
            <h2 className="text-2xl font-bold text-white mb-4">
              {branding.headline}
            </h2>
            <p className="text-white/80 text-base max-w-lg mx-auto">
              {branding.subtitle}
            </p>
          </div>
          {branding.showPoweredBy && (
            <div className="pb-8 flex items-center gap-2 opacity-60">
              <span className="text-white/70 text-xs">Powered by</span>
              <img src={nobisLogoWhite} alt="NOBIS" className="h-5" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
