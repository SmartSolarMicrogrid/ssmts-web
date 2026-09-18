import React, { createContext, useContext, useState } from 'react';
import type { AuthUser, UserRole } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | null;
  login: (email: string, password: string, roleOverride?: UserRole) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_CREDENTIALS = [
  { id: 'USR001', name: 'Amara Silva',    email: 'admin@ssmts.lk',    password: 'admin123', role: 'Backoffice'   as UserRole },
  { id: 'USR002', name: 'Kavinda Perera', email: 'operator@ssmts.lk', password: 'op123',    role: 'GridOperator' as UserRole },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = (email: string, password: string, roleOverride?: UserRole): boolean => {
    if (roleOverride) {
      setUser({
        id: 'DEMO',
        name: roleOverride === 'Backoffice' ? 'Demo Backoffice' : 'Demo Grid Operator',
        email: email || 'demo@ssmts.lk',
        role: roleOverride,
      });
      return true;
    }
    const found = MOCK_CREDENTIALS.find(u => u.email === email && u.password === password);
    if (found) {
      const { password: _p, ...authUser } = found;
      setUser(authUser);
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, role: user?.role ?? null, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
