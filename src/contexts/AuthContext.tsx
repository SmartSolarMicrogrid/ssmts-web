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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate authenticated session from JWT token on reload
  useEffect(() => {
    async function rehydrateUser() {
      const token = localStorage.getItem('ssmts_token');
      if (token) {
        try {
          const profile = await authApi.getMe();
          setUser(profile);
        } catch {
          authApi.logout();
          setUser(null);
        }
      }
      setLoading(false);
    }
    rehydrateUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await authApi.login(email, password);
      setUser(res.user);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    authApi.logout();
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
