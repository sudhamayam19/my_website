import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { clearToken, hasToken, signIn } from "@/lib/mobile-api";

interface AuthContextValue {
  isAuthenticated: boolean;
  isHydrating: boolean;
  signInWithPassword: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    hasToken()
      .then((tokenExists) => setIsAuthenticated(tokenExists))
      .finally(() => setIsHydrating(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      isHydrating,
      signInWithPassword: async (username: string, password: string) => {
        await signIn(username, password);
        setIsAuthenticated(true);
      },
      signOut: async () => {
        await clearToken();
        setIsAuthenticated(false);
      },
    }),
    [isAuthenticated, isHydrating],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return value;
}
