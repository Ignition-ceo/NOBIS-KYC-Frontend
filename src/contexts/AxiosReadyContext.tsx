// src/contexts/AxiosReadyContext.tsx
// ─────────────────────────────────────────────────────────
// Tiny context that lets any component know when the Axios
// auth interceptor has been attached and is ready to use.
// ─────────────────────────────────────────────────────────
import { createContext, useContext } from "react";

export const AxiosReadyContext = createContext(false);

export const useAxiosReady = () => useContext(AxiosReadyContext);
