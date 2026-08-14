import { createContext, useEffect, useRef, useState } from "react";
import { apiFetch, setAccessToken, tryRestoreSession } from "../api/client";
import { login as loginRequest, logout as logoutRequest } from "../api/auth";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const didBootstrap = useRef(false);

  useEffect(() => {
    // StrictMode runs effects twice in dev. Without this guard we would fire
    // two /auth/refresh calls; the second would reuse an already-rotated
    // cookie and trip the backend reuse detection.
    if (didBootstrap.current) return;
    didBootstrap.current = true;

    (async () => {
      const restored = await tryRestoreSession();
      if (restored) {
        try {
          setUser(await apiFetch("/auth/me"));
        } catch {
          setUser(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  async function login(email, password) {
    await loginRequest(email, password);
    setUser(await apiFetch("/auth/me"));
  }

  async function logout() {
    try {
      await logoutRequest();
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }

  const value = { user, loading, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
