import { useEffect, useRef, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { attachAuthInterceptor } from "@/lib/api";
import { AxiosReadyContext } from "@/contexts/AxiosReadyContext";

const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

/**
 * Attaches the Axios request interceptor once Auth0 is ready,
 * pre-fetches a token to warm the cache, then signals readiness
 * to the rest of the app via AxiosReadyContext.
 *
 * Wrap your app tree with this component so that any component
 * (e.g. AppStateContext) can call useAxiosReady() before firing
 * authenticated requests.
 */
export default function AuthAxiosBootstrap({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const attached = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isLoading || attached.current) return;
    attached.current = true;

    const tokenGetter = (opts: Record<string, unknown> = {}) =>
      getAccessTokenSilently({
        authorizationParams: { audience },
        ...opts,
      });

    const detach = attachAuthInterceptor(tokenGetter);

    // If the user is already authenticated (e.g. cached session),
    // pre-fetch a token so the interceptor has it ready before any
    // API calls fire. Only mark ready AFTER the token is available.
    if (isAuthenticated) {
      tokenGetter()
        .then(() => {
          setReady(true);
        })
        .catch((err) => {
          console.warn(
            "[AuthAxiosBootstrap] Token pre-fetch failed — marking ready anyway:",
            err
          );
          setReady(true);
        });
    } else {
      // Not authenticated — mark ready so the app can render
      // (ProtectedRoute will redirect to /login)
      setReady(true);
    }

    return detach;
  }, [isLoading, isAuthenticated, getAccessTokenSilently]);

  return (
    <AxiosReadyContext.Provider value={ready}>
      {children}
    </AxiosReadyContext.Provider>
  );
}
