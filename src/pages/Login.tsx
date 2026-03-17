import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Rocket } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Point 1: Check if already logged in elsewhere
      const { data: isAlreadyLoggedIn, error: checkError } = await supabase.rpc('check_is_logged_in', { _email: email });

      if (!checkError && isAlreadyLoggedIn) {
        toast.error('Sesión activa en otro dispositivo. Por favor cierra la otra sesión primero.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Update heartbeat after successful login
      await supabase.rpc('update_login_heartbeat', { _user_id: data.user.id });

      const accountType = data.user?.user_metadata?.account_type || 'company';
      navigate(accountType === 'explorer' ? '/explorer' : '/company');
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Ingresa tu correo electrónico');
      return;
    }
    setResetLoading(true);
    try {
      const siteUrl = window.location.origin.includes('localhost')
        ? window.location.origin
        : 'https://gophora.lovable.app';
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/reset-password`,
      });
      if (error) throw error;
      toast.success('¡Enlace de recuperación enviado! Revisa tu correo');
      setResetMode(false);
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar enlace');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="font-heading text-2xl font-bold tracking-wider">GOPHORA</span>
          </div>
          <h1 className="text-2xl font-heading font-bold">{t('auth.welcome_back')} GOPHORA</h1>
        </div>
        {resetMode ? (
          <form onSubmit={handleResetPassword} className="space-y-4 rounded-xl border border-border/50 bg-card p-6">
            <p className="text-sm text-muted-foreground font-body text-center">
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </p>
            <div>
              <Label htmlFor="email" className="font-heading text-xs tracking-wider uppercase">{t('auth.email')}</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1.5" />
            </div>
            <Button type="submit" className="w-full font-heading tracking-wide" disabled={resetLoading}>
              {resetLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </Button>
            <button type="button" onClick={() => setResetMode(false)} className="w-full text-xs text-muted-foreground hover:text-foreground font-body text-center">
              ← Volver al inicio de sesión
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border/50 bg-card p-6">
            <div>
              <Label htmlFor="email" className="font-heading text-xs tracking-wider uppercase">{t('auth.email')}</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="password" className="font-heading text-xs tracking-wider uppercase">{t('auth.password')}</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1.5" />
            </div>
            <button type="button" onClick={() => setResetMode(true)} className="text-xs text-primary hover:underline font-body">
              ¿Olvidaste tu contraseña?
            </button>
            <Button type="submit" className="w-full font-heading tracking-wide" disabled={loading}>
              {loading ? 'Signing in...' : t('auth.login')}
            </Button>
            <p className="text-center text-sm text-muted-foreground font-body">
              {t('auth.no_account')}{' '}
              <Link to="/register" className="text-primary hover:underline font-semibold">{t('nav.register')}</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
