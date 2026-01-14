import React, { createContext, useContext, useState, ReactNode } from 'react';

export type AppMode = 'report' | 'audit' | 'present';

interface AuthContextType {
  user: string | null;
  login: (name: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  validatePassword: (name: string, password: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const COORDINATORS: Record<string, string> = {
  'Max': 'max123',
  'Miko': 'miko123',
  'Micha': 'micha123',
  'Michael': 'michael123',
  'Bel': 'bel123'
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<string | null>(localStorage.getItem('ipc_user'));
  const [appMode, setAppMode] = useState<AppMode>('report');

  const login = (name: string, password: string) => {
    if (COORDINATORS[name] === password) {
      setUser(name);
      localStorage.setItem('ipc_user', name);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setAppMode('report');
    localStorage.removeItem('ipc_user');
  };

  const validatePassword = (name: string, password: string) => {
    return COORDINATORS[name] === password;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, appMode, setAppMode, validatePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};