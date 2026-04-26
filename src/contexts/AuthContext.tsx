import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'user' | 'admin';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

const DEMO_USER: User = {
  id: '1',
  email: 'demo@apt.coach',
  name: 'Alex Johnson',
  role: 'admin', // Demo user has admin for development
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('apt_coach_user');
    if (saved) setUser(JSON.parse(saved));
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    if (email && password) {
      const u = { ...DEMO_USER, email };
      setUser(u);
      localStorage.setItem('apt_coach_user', JSON.stringify(u));
    } else {
      throw new Error('Invalid credentials');
    }
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('apt_coach_user');
  };

  const hasRole = (role: UserRole) => user?.role === role;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, isLoading, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};
