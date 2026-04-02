import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

// Helper to wrap Supabase calls with a timeout (using <T,> for TSX compatibility)
const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number = 8000): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Supabase request timeout')), timeoutMs)
  );
  return Promise.race([promise, timeoutPromise]);
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  accountType: 'company' | 'explorer';
  explorerProfile: any | null;
  companyProfile: any | null;
  userProfile: any | null;
  onboardingCompleted: boolean;
  isAdmin: boolean;
  isInvestor: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  toggleInvestorMode: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [explorerProfile, setExplorerProfile] = useState<any | null>(null);
  const [companyProfile, setCompanyProfile] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [isInvestor, setIsInvestor] = useState(false);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
      setIsAdmin(!!data);
    } catch (err) {
      console.error('Error checking admin role:', err);
      setIsAdmin(false);
    }
  };

  const refreshProfile = async () => {
    if (!user) {
      console.log('refreshProfile: No user found');
      return;
    }

    try {
      const type = (user?.user_metadata?.account_type as 'company' | 'explorer') || 'company';
      console.log('refreshProfile: Refreshing for type:', type);

      if (type === 'explorer') {
        const { data, error } = await (supabase
          .from('explorer_profiles' as any)
          .select('*')
          .eq('user_id', user.id)
          .single() as any);

        if (!error) setExplorerProfile(data);
      } else {
        const { data, error } = await (supabase
          .from('company_profiles' as any)
          .select('*')
          .eq('user_id', user.id)
          .single() as any);

        if (!error) {
          setCompanyProfile(data);
          setIsInvestor(!!data?.is_investor);
        }
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
    }
  };

  const checkSession = async () => {
    try {
      console.log('checkSession: Getting session with timeout...');
      // Use race condition to avoid hanging forever if Supabase is unreachable
      const { data: { session: currentSession } } = await withTimeout(supabase.auth.getSession());

      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);
      console.log('checkSession: Current user found:', !!currentUser);

      if (currentUser) {
        checkAdminRole(currentUser.id);

        // Fetch specific profile
        const type = (currentUser?.user_metadata?.account_type as 'company' | 'explorer') || 'company';
        if (type === 'explorer') {
          const { data } = await (supabase.from('explorer_profiles' as any).select('*').eq('user_id', currentUser.id).single() as any);
          setExplorerProfile(data);
        } else {
          const { data } = await (supabase.from('company_profiles' as any).select('*').eq('user_id', currentUser.id).single() as any);
          setCompanyProfile(data);
          setIsInvestor(!!data?.is_investor);
        }

        // Start heartbeat but don't block the initial load
        (supabase.rpc as any)('update_login_heartbeat', { _user_id: currentUser.id })
          .catch((err: any) => {
            console.error('Heartbeat error:', err);
          });
      }
    } catch (err) {
      console.error('checkSession error or timeout:', err);
      // Even on error, we must set loading to false to show the app
      setSession(null);
      setUser(null);
    } finally {
      console.log('checkSession: Finishing, setting loading false');
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        checkAdminRole(session.user.id);

        // Fetch profile on auth change
        const type = (session.user?.user_metadata?.account_type as 'company' | 'explorer') || 'company';
        if (type === 'explorer') {
          const { data } = await (supabase.from('explorer_profiles' as any).select('*').eq('user_id', session.user.id).single() as any);
          setExplorerProfile(data);
        } else {
          const { data } = await (supabase.from('company_profiles' as any).select('*').eq('user_id', session.user.id).single() as any);
          setCompanyProfile(data);
          setIsInvestor(!!data?.is_investor);
        }

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
      console.log('AuthState changed. event:', event, 'session:', !!session);
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

  const toggleInvestorMode = async () => {
    if (!user || user?.user_metadata?.account_type !== 'company') return;
    try {
      const newStatus = !isInvestor;
      const { error } = await (supabase
        .from('company_profiles' as any)
        .update({ is_investor: newStatus })
        .eq('user_id', user.id) as any);

      if (error) throw error;
      setIsInvestor(newStatus);
    } catch (err) {
      console.error('Error toggling investor mode:', err);
    }
  };

  const logout = async () => {
    console.log('Logout initiated...');
    try {
      // Clear ALL local state immediately so UI updates before any network calls
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setExplorerProfile(null);
      setCompanyProfile(null);

      // Attempt to clear session on server, but with a short timeout
      const sessionData = await withTimeout(supabase.auth.getSession(), 2000).catch(() => null);
      if (sessionData?.data?.session?.user) {
        (supabase.rpc as any)('delete_login_heartbeat', { _user_id: sessionData.data.session.user.id }).catch(() => { });
      }

      await withTimeout(supabase.auth.signOut(), 3000).catch(() => { });
    } catch (error) {
      console.error('Logout process warning:', error);
    } finally {
      // Force return to landing no matter what
      console.log('Logout complete, redirecting.');
      window.location.href = '/';
    }
  };

  const accountType = (user?.user_metadata?.account_type as 'company' | 'explorer') || 'company';

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      accountType,
      userProfile,
      onboardingCompleted,
      explorerProfile,
      companyProfile,
      isAdmin,
      isInvestor,
      logout,
      refreshProfile,
      toggleInvestorMode
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
