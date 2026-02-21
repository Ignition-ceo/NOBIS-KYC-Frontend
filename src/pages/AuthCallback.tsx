import { useEffect, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
export default function AuthCallback() {
  const { isAuthenticated, isLoading, error, getAccessTokenSilently, user } = useAuth0();
  const navigate = useNavigate();
  const loggedRef = useRef(false);
  useEffect(() => {
    const completeLogin = async () => {
      if (!isLoading && isAuthenticated && !loggedRef.current) {
        loggedRef.current = true;
        try {
          // Ensure token is available for API calls
          const token = await getAccessTokenSilently();
          if (token) {
            // Log login event to audit
            await api.post("/audit/log", {
              action: "client_login",
              metadata: {
                source: "auth0",
                timestamp: new Date().toISOString(),
                note: `${user?.name || user?.email || "User"} logged in`,
              },
            }).catch(() => {});
          }
        } catch {
          // Don't block login if audit fails
        }
        navigate("/client", { replace: true });
      }
    };
    completeLogin();
  }, [isLoading, isAuthenticated, navigate, getAccessTokenSilently, user]);
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <div className="mt-4 text-muted-foreground">
          {error
            ? `Authentication error: ${error.message}`
            : "Completing secure sign-in..."}
        </div>
      </div>
    </div>
  );
}
