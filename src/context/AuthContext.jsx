import { createContext, useContext, useState, useMemo, useCallback } from 'react';

const AuthContext = createContext(null);

function readPersistedAuth() {
  try {
    const raw = localStorage.getItem('vibora_auth');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const persisted = readPersistedAuth();

  const [user, setUser] = useState(persisted?.user ?? null);
  const [loading] = useState(false);

  const login = useCallback((userData) => {
    setUser(userData);
    try {
      localStorage.setItem('vibora_auth', JSON.stringify({ user: userData }));
    } catch {
      // storage full or unavailable
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem('vibora_auth');
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, loading, login, logout }),
    [user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>.');
  }
  return context;
}