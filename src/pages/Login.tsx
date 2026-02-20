import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, LogIn } from "lucide-react";
import nobisLogoWhite from "@/assets/nobis-logo-white.png";
import caribbeanPeople from "@/assets/caribbean-people.webp";

const Login = () => {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const navigate = useNavigate();

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
            <h1 className="text-4xl font-bold text-[#0125cf] mb-2">
              Welcome Back
            </h1>
            <div className="w-16 h-1 bg-gradient-to-r from-[#0043FF] to-[#0125cf] mx-auto rounded-full mb-6" />
            <h2 className="text-lg font-semibold text-[#0125cf] tracking-wide">
              FRICTIONLESS ONBOARDING. SMARTER COMPLIANCE.
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed mt-2">
              Verify instantly, stay compliant, automate with AI – you&apos;re
              in control.
            </p>
          </div>

          {/* Sign-in Button */}
          <Button
            onClick={handleLogin}
            disabled={isRedirecting}
            className="w-full h-[52px] rounded-2xl text-white text-base font-medium gap-2"
            style={{
              background: "linear-gradient(to right, #0043FF, #0125cf)",
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
      <div className="hidden lg:flex w-1/2 h-full bg-[#0125cf] relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0">
          <img
            src={caribbeanPeople}
            alt="NOBIS KYC"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="relative z-10 text-center px-12">
          <img
            src={nobisLogoWhite}
            alt="NOBIS"
            className="h-20 mx-auto mb-8"
          />
          <h2 className="text-2xl font-bold text-white mb-4">
            National Onboarding Biometric Identification System
          </h2>
          <p className="text-white/80 text-base max-w-lg mx-auto">
            KYC, AML screening, and fraud prevention for Trinidad &amp;
            Tobago.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
