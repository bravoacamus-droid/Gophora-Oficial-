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
    } catch (err) {
      console.error('Error checking admin role:', err);
      setIsAdmin(false);
    }
  };

  const checkSession = async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        checkAdminRole(currentSession.user.id);
        // Start heartbeat but don't block the initial load
        (supabase.rpc as any)('update_login_heartbeat', { _user_id: currentSession.user.id })
          .catch((err: any) => {
            console.error('Heartbeat error:', err);
          });
      }
    } catch (err) {
      console.error('Session check error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        checkAdminRole(session.user.id);
        if (event === 'SIGNED_IN') {
          try {
            await (supabase.rpc as any)('update_login_heartbeat', { _user_id: session.user.id });
          } catch (err) {
            console.error('Sign-in heartbeat error:', err);
          }
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    checkSession();

    // Heartbeat interval (every 4 minutes, since timeout is 5m)
    const intervalId = setInterval(async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession?.user) {
          await (supabase.rpc as any)('update_login_heartbeat', { _user_id: currentSession.user.id });
        }
      } catch (err) {
        console.error('Interval heartbeat error:', err);
      }
    }, 1000 * 60 * 4);

    return () => {
      subscription.unsubscribe();
      clearInterval(intervalId);
    };
  }, []);

  const logout = async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession?.user) {
        // Try deleting heartbeat, but don't block logout if it fails
        await (supabase.rpc as any)('delete_login_heartbeat', { _user_id: currentSession.user.id });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      // Force reload or navigation if needed, but onAuthStateChange should handle it
      window.location.href = '/';
    }
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
