import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

// Debug logging system
const authLog: string[] = [];
const log = (msg: string) => {
  const timestamp = new Date().toLocaleTimeString();
  const entry = `[${timestamp}] ${msg}`;
  authLog.push(entry);
  console.log(`%cAuthDebug: ${msg}`, 'color: #3b82f6; font-weight: bold');
  if (authLog.length > 50) authLog.shift();
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
  updateAccountType: (type: 'company' | 'explorer') => Promise<void>;
  debugLogs: string[];
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
  const [localAccountType, setLocalAccountType] = useState<'company' | 'explorer' | null>(null);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
      setIsAdmin(!!data);
      log(`Admin check: ${!!data}`);
    } catch (err) {
      log(`Admin check error: ${err}`);
      setIsAdmin(false);
    }
  };

  const fetchProfileData = async (currentUser: User) => {
    try {
      // 1. Fetch base profile
      const { data: baseProfile, error: baseError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (!baseError && baseProfile) {
        log(`Base profile found. Onboarding (db): ${baseProfile.onboarding_completed}`);
        setUserProfile(baseProfile);
      } else {
        log(`Base profile missing or error: ${baseError?.message}`);
      }

      // 2. Fetch specific profile based on metadata or base profile
      const type = (currentUser?.user_metadata?.account_type as 'company' | 'explorer') ||
        (baseProfile?.account_type as 'company' | 'explorer') ||
        'company';

      let isActualOnboardingCompleted = !!baseProfile?.onboarding_completed;

      if (type === 'explorer') {
        const { data, error } = await (supabase.from('explorer_profiles' as any).select('*').eq('user_id', currentUser.id).maybeSingle() as any);
        if (error) log(`Explorer profile fetch error: ${error.message}`);
        setExplorerProfile(data);
        log(`Explorer profile: ${data ? 'Found' : 'Missing'}`);

        // Repair logic: If base says done but specific is missing, force re-onboard
        if (!data && isActualOnboardingCompleted) {
          log('Inconsistent state: Base onboarding is true but Explorer profile is missing. Forcing local re-onboard.');
          isActualOnboardingCompleted = false;
        }
      } else {
        const { data, error } = await (supabase.from('company_profiles' as any).select('*').eq('user_id', currentUser.id).maybeSingle() as any);
        if (error) log(`Company profile fetch error: ${error.message}`);
        setCompanyProfile(data);
        setIsInvestor(!!data?.is_investor);
        log(`Company profile: ${data ? 'Found' : 'Missing'}, Investor: ${!!data?.is_investor}`);

        // Repair logic: If base says done but specific is missing, force re-onboard
        if (!data && isActualOnboardingCompleted) {
          log('Inconsistent state: Base onboarding is true but Company profile is missing. Forcing local re-onboard.');
          isActualOnboardingCompleted = false;
        }
      }

      // Final decision on onboarding completion
      let finalOnboardingStatus = isActualOnboardingCompleted;

      // Admin bypass: If user is admin, they shouldn't be forced to re-onboard 
      // just because they don't have a specific explorer/company profile
      if (isAdmin) {
        log('Admin detected: Bypassing specialized profile check for onboarding status.');
        finalOnboardingStatus = true;
      }

      setOnboardingCompleted(finalOnboardingStatus);
    } catch (err) {
      log(`Profile fetch error: ${err}`);
    }
  };

  const handleAuthStateChange = async (event: AuthChangeEvent, currentSession: Session | null) => {
    log(`Event: ${event} | Session: ${!!currentSession}`);

    setSession(currentSession);
    const currentUser = currentSession?.user ?? null;
    setUser(currentUser);

    if (currentUser) {
      await checkAdminRole(currentUser.id);
      await fetchProfileData(currentUser);
    } else {
      setExplorerProfile(null);
      setCompanyProfile(null);
      setUserProfile(null);
      setIsAdmin(false);
      setIsInvestor(false);
      setOnboardingCompleted(false);
    }

    setLoading(false);
    log('State update complete. Loading: false');
  };

  useEffect(() => {
    log('Initializing AuthProvider...');

    const init = async () => {
      try {
        log('Running initial getSession...');
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        await handleAuthStateChange('INITIAL_SESSION' as AuthChangeEvent, initialSession);
      } catch (err) {
        log(`Initial check error: ${err}`);
        setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      handleAuthStateChange(event, session);
    });

    return () => {
      log('Unmounting AuthProvider, unsubscribing.');
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) await fetchProfileData(user);
  };

  const updateAccountType = async (type: 'company' | 'explorer') => {
    if (!user) return;
    try {
      log(`Updating account type to: ${type}`);
      // Update Supabase Auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { account_type: type }
      });
      if (authError) throw authError;

      // Update public.profiles if it exists, or it will be created in onboarding
      await supabase.from('profiles').update({ account_type: type }).eq('id', user.id);

      setLocalAccountType(type);
      log('Account type updated successfully');
    } catch (err) {
      log(`Update account type error: ${err}`);
    }
  };

  const toggleInvestorMode = async () => {
    if (!user || accountType !== 'company') return;
    try {
      const newStatus = !isInvestor;
      const { error } = await (supabase
        .from('company_profiles' as any)
        .update({ is_investor: newStatus })
        .eq('user_id', user.id) as any);

      if (error) throw error;
      setIsInvestor(newStatus);
      log(`Investor mode toggled: ${newStatus}`);
    } catch (err) {
      log(`Toggle investor error: ${err}`);
    }
  };

  const logout = async () => {
    log('--- Logout Started ---');
    try {
      setUser(null);
      setSession(null);
      setLoading(false);

      const { error } = await supabase.auth.signOut();
      if (error) log(`SignOut error: ${error.message}`);

      log('SignOut complete. Soft redirecting.');
      window.location.replace('/');
    } catch (err) {
      log(`Logout crash: ${err}`);
      window.location.replace('/');
    }
  };

  // Precedence: Local change -> Metadata -> Default
  const accountType = localAccountType ||
    (user?.user_metadata?.account_type as 'company' | 'explorer') ||
    'company';

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
      toggleInvestorMode,
      updateAccountType,
      debugLogs: authLog
    }}>
      {children}
      {window.location.search.includes('debug=true') && (
        <div className="fixed bottom-0 left-0 right-0 max-h-64 overflow-y-auto bg-black/90 text-green-400 font-mono text-[10px] p-2 z-[9999] border-t border-green-500/30">
          <div className="flex justify-between border-b border-green-900 pb-1 mb-1">
            <span>Auth Debug Console</span>
            <span>User: {user ? user.email : 'null'} | Onboarding: {onboardingCompleted ? 'Yes' : 'No'}</span>
          </div>
          {authLog.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
