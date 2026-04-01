import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Rocket } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('AuthCallback initialized. Hash:', window.location.hash);

    const timeoutId = setTimeout(() => {
      console.warn('AuthCallback timeout: No session detected after 8s. Redirecting to login.');
      navigate('/login', { replace: true });
    }, 8000);

    // Supabase processes the token from the URL hash automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event in callback:', event, !!session);
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        clearTimeout(timeoutId);
        const accountType = session.user.user_metadata?.account_type || 'company';
        console.log('Session confirmed. Navigating to:', accountType);
        navigate(accountType === 'company' ? '/company' : '/explorer', { replace: true });
      } else if (event === 'TOKEN_REFRESHED') {
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            clearTimeout(timeoutId);
            const accountType = user.user_metadata?.account_type || 'company';
            navigate(accountType === 'company' ? '/company' : '/explorer', { replace: true });
          }
        });
      }
    });

    // Also check if we already have a session after the URL hash is processed
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('Direct session check in callback:', !!session, error?.message);
      if (session?.user) {
        clearTimeout(timeoutId);
        const accountType = session.user.user_metadata?.account_type || 'company';
        navigate(accountType === 'company' ? '/company' : '/explorer', { replace: true });
      } else if (error) {
        console.error('Session error in callback:', error);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 mb-4">
          <Rocket className="h-8 w-8 text-primary animate-pulse" />
          <span className="font-heading text-2xl font-bold tracking-wider">GOPHORA</span>
        </div>
        <div className="space-y-2">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground font-body">Verificando tu cuenta...</p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
