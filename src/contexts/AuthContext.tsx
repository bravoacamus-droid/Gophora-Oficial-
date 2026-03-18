import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  accountType: 'company' | 'explorer';
  isAdmin: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
      setIsAdmin(!!data);
    } catch {
      setIsAdmin(false);
    }
  };

  const checkSession = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    setSession(currentSession);
    setUser(currentSession?.user ?? null);
    if (currentSession?.user) {
      checkAdminRole(currentSession.user.id);
      await supabase.rpc('update_login_heartbeat', { _user_id: currentSession.user.id });
    }
    setLoading(false);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        checkAdminRole(session.user.id);
        if (event === 'SIGNED_IN') {
          await supabase.rpc('update_login_heartbeat', { _user_id: session.user.id });
        }
      } else {
        setIsAdmin(false);
      }
    });

    checkSession();

    // Heartbeat interval (every 4 minutes, since timeout is 5m)
    const intervalId = setInterval(async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession?.user) {
        await supabase.rpc('update_login_heartbeat', { _user_id: currentSession.user.id });
      }
    }, 1000 * 60 * 4);

    return () => {
      subscription.unsubscribe();
      clearInterval(intervalId);
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
  };

  const accountType = (user?.user_metadata?.account_type as 'company' | 'explorer') || 'company';

  return (
    <AuthContext.Provider value={{ user, session, loading, accountType, isAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
