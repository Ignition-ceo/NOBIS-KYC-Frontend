import { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const { isAuthenticated, isLoading, error } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/client", { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

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
