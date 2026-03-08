import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  accountType: 'company' | 'explorer';
  verified: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => void;
  register: (email: string, password: string, accountType: 'company' | 'explorer') => void;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('gophora-user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (email: string, _password: string) => {
    const isAdmin = email === 'admin@gophora.com';
    const u: User = {
      id: crypto.randomUUID(),
      email,
      accountType: isAdmin ? 'company' : (localStorage.getItem('gophora-last-type') as 'company' | 'explorer') || 'company',
      verified: true,
    };
    setUser(u);
    localStorage.setItem('gophora-user', JSON.stringify(u));
  };

  const register = (email: string, _password: string, accountType: 'company' | 'explorer') => {
    const u: User = {
      id: crypto.randomUUID(),
      email,
      accountType,
      verified: true,
    };
    setUser(u);
    localStorage.setItem('gophora-user', JSON.stringify(u));
    localStorage.setItem('gophora-last-type', accountType);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('gophora-user');
  };

  const isAdmin = user?.email === 'admin@gophora.com';

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
