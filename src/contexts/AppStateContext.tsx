import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { getClientProfile } from "@/services/auth";
import { useAxiosReady } from "@/contexts/AxiosReadyContext";

interface User {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  companyName?: string;
  [key: string]: unknown;
}

interface AppStateContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  refetchUserProfile: () => Promise<void>;
}

const AppStateCtx = createContext<AppStateContextType | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, isLoading: auth0Loading } = useAuth0();
  const axiosReady = useAxiosReady();

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getClientProfile();
      if (data?.user) {
        setUser(data.user);
      }
    } catch (error) {
      // The 401 retry interceptor in api.ts will attempt a token
      // refresh automatically. If it still fails, we just log it.
      // ProtectedRoute will handle redirecting to /login if the
      // Auth0 session expires (isAuthenticated flips to false).
      console.error("Failed to fetch user profile:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetchUserProfile = useCallback(async () => {
    try {
      const data = await getClientProfile();
      if (data?.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error("Failed to refetch user profile:", error);
    }
  }, []);

  useEffect(() => {
    // ALL three conditions must be true:
    //  1. Auth0 has finished its initial load
    //  2. The user is authenticated
    //  3. The Axios interceptor is attached AND a token has been pre-fetched
    if (!auth0Loading && isAuthenticated && axiosReady) {
      fetchUser();
    }
  }, [auth0Loading, isAuthenticated, axiosReady, fetchUser]);

  return (
    <AppStateCtx.Provider value={{ user, setUser, loading, refetchUserProfile }}>
      {children}
    </AppStateCtx.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateCtx);
  if (context === undefined) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
}
