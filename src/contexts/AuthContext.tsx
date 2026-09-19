import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthUser, UserRole } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const cached = localStorage.getItem('ssmts_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem('ssmts_token');
    const cached = localStorage.getItem('ssmts_user');
    // If no token, we are definitely not logged in -> not loading
    if (!token) return false;
    // If we have token and cached user, we can render immediately without blocking
    if (cached) return false;
    // Only block if we have a token but no cached user yet
    return true;
  });

  // Rehydrate authenticated session from JWT token on reload
  useEffect(() => {
    async function rehydrateUser() {
      const token = localStorage.getItem('ssmts_token');
      if (token) {
        try {
          const profile = await authApi.getMe();
          setUser(profile);
          localStorage.setItem('ssmts_user', JSON.stringify(profile));
        } catch {
          // If token expired or unauthorized, logout
          authApi.logout();
          localStorage.removeItem('ssmts_user');
          setUser(null);
        }
      } else {
        localStorage.removeItem('ssmts_user');
        setUser(null);
      }
      setLoading(false);
    }
    rehydrateUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await authApi.login(email, password);
      setUser(res.user);
      localStorage.setItem('ssmts_user', JSON.stringify(res.user));
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    authApi.logout();
    localStorage.removeItem('ssmts_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        login,
        logout,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
