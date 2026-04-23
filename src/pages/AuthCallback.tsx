import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Rocket } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const redirectFor = (accountType: string) =>
      accountType === 'company' ? '/company' : '/explorer';

    const timeoutId = setTimeout(() => {
      toast.error('No pudimos verificar tu sesión. Intenta iniciar sesión de nuevo.');
      navigate('/login', { replace: true });
    }, 8000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        clearTimeout(timeoutId);
        const accountType = session.user.user_metadata?.account_type || 'company';
        navigate(redirectFor(accountType), { replace: true });
      } else if (event === 'TOKEN_REFRESHED') {
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            clearTimeout(timeoutId);
            const accountType = user.user_metadata?.account_type || 'company';
            navigate(redirectFor(accountType), { replace: true });
          }
        });
      }
    });

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (session?.user) {
        clearTimeout(timeoutId);
        const accountType = session.user.user_metadata?.account_type || 'company';
        navigate(redirectFor(accountType), { replace: true });
      } else if (error) {
        clearTimeout(timeoutId);
        toast.error(error.message || 'Error al verificar la sesión');
        navigate('/login', { replace: true });
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
