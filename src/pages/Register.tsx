import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Compass, Mail, ShieldCheck, RefreshCw, Github } from 'lucide-react';
import { toast } from 'sonner';

const Register = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountType, setAccountType] = useState<'company' | 'explorer'>(
    (searchParams.get('type') as 'company' | 'explorer') || 'company'
  );
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [resending, setResending] = useState(false);
  const [passwordStats, setPasswordStats] = useState({ score: 0, reqs: { length: false, letter: false, number: false, symbol: false } });

  // Handle password strength
  useEffect(() => {
    const p = password;
    const reqs = {
      length: p.length >= 8,
      letter: /[A-Za-z]/.test(p),
      number: /[0-9]/.test(p),
      symbol: /[!@#$%^&*(),.?":{}|<>]/.test(p)
    };
    const score = Object.values(reqs).filter(Boolean).length;
    setPasswordStats({ score, reqs });
  }, [password]);

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.hostname === 'localhost'
            ? `${window.location.origin}/auth/callback`
            : 'https://gophora.vercel.app/auth/callback',
          queryParams: {
            account_type: accountType
          }
        }
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || `Error al conectar con ${provider}`);
    }
  };

  // Listen for auth state changes - user clicks email link and comes back verified
  useEffect(() => {
    if (step !== 'verify') return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        toast.success('¡Cuenta verificada exitosamente!');
        const type = session.user.user_metadata?.account_type || accountType;
        navigate(type === 'company' ? '/company' : '/explorer');
      }
    });

    return () => subscription.unsubscribe();
  }, [step, accountType, navigate]);

  const checkUsername = async (value: string) => {
    if (!value.trim() || value.length < 3) {
      setUsernameError('El nombre de usuario debe tener al menos 3 caracteres');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setUsernameError('Solo letras, números y guión bajo');
      return false;
    }
    const { data } = await supabase.from('profiles').select('id').eq('username', value.toLowerCase()).maybeSingle();
    if (data) {
      setUsernameError('Este nombre de usuario ya está en uso');
      return false;
    }
    setUsernameError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (passwordStats.score < 4) {
      toast.error('La contraseña no cumple con los requisitos de seguridad');
      return;
    }
    if (accountType === 'explorer') {
      const valid = await checkUsername(username);
      if (!valid) return;
    }
    setLoading(true);
    try {
      // Check if email already exists securely
      const { data: emailExists, error: emailError } = await (supabase.rpc as any)('check_email_exists', { lookup_email: email });
      if (emailError) {
        console.error('Error verificando correo:', emailError);
      } else if (emailExists) {
        toast.error('Este correo ya está registrado. Por favor, inicia sesión.');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { account_type: accountType, username: accountType === 'explorer' ? username.toLowerCase() : undefined },
        },
      });
      if (error) throw error;
      toast.success('¡Correo de verificación enviado!');
      setStep('verify');
    } catch (err: any) {
      toast.error(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (error) throw error;
      toast.success('¡Correo reenviado! Revisa tu bandeja de entrada');
    } catch (err: any) {
      toast.error(err.message || 'Error al reenviar correo');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="font-heading text-2xl font-bold tracking-wider">GOPHORA</span>
          </div>
          {step === 'register' ? (
            <h1 className="text-2xl font-heading font-bold">{t('auth.join')} GOPHORA</h1>
          ) : (
            <h1 className="text-2xl font-heading font-bold">Verifica tu correo</h1>
          )}
        </div>

        {step === 'register' ? (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border/50 bg-card p-6">
            <div>
              <Label className="font-heading text-xs tracking-wider uppercase">{t('auth.account_type')}</Label>
              <div className="grid grid-cols-2 gap-3 mt-1.5">
                <button
                  type="button"
                  onClick={() => setAccountType('company')}
                  className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all ${accountType === 'company'
                    ? 'border-primary bg-primary/10 glow-primary'
                    : 'border-border hover:border-primary/30'
                    }`}
                >
                  <Building2 className={`h-6 w-6 ${accountType === 'company' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-heading font-semibold ${accountType === 'company' ? 'text-primary' : 'text-muted-foreground'}`}>
                    {t('auth.company')}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('explorer')}
                  className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all ${accountType === 'explorer'
                    ? 'border-primary bg-primary/10 glow-primary'
                    : 'border-border hover:border-primary/30'
                    }`}
                >
                  <Compass className={`h-6 w-6 ${accountType === 'explorer' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-heading font-semibold ${accountType === 'explorer' ? 'text-primary' : 'text-muted-foreground'}`}>
                    {t('auth.explorer')}
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 font-heading tracking-wide border-border hover:bg-muted transition-all"
                onClick={() => handleSocialLogin('google')}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 font-heading tracking-wide border-border hover:bg-muted transition-all"
                onClick={() => handleSocialLogin('github')}
              >
                <Github className="w-4 h-4" />
                GitHub
              </Button>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-heading tracking-wider">O con correo</span>
              </div>
            </div>

            {accountType === 'explorer' && (
              <div>
                <Label htmlFor="username" className="font-heading text-xs tracking-wider uppercase">Nombre de usuario</Label>
                <Input id="username" type="text" value={username} onChange={e => { setUsername(e.target.value); setUsernameError(''); }} placeholder="ej: explorer_pro" required className="mt-1.5" />
                {usernameError && <p className="text-xs text-destructive mt-1">{usernameError}</p>}
              </div>
            )}
            <div>
              <Label htmlFor="email" className="font-heading text-xs tracking-wider uppercase">{t('auth.email')}</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="password" className="font-heading text-xs tracking-wider uppercase">{t('auth.password')}</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1.5" />
              {password.length > 0 && (
                <div className="mt-3 space-y-2 p-3 bg-muted/30 rounded-lg border border-border/40">
                  <div className="flex gap-1 h-1.5">
                    {[1, 2, 3, 4].map(level => (
                      <div
                        key={level}
                        className={`flex-1 rounded-full transition-all duration-300 ${passwordStats.score >= level
                          ? passwordStats.score === 4
                            ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]'
                            : passwordStats.score === 3
                              ? 'bg-yellow-400'
                              : passwordStats.score === 2
                                ? 'bg-orange-500'
                                : 'bg-red-500'
                          : 'bg-muted-foreground/20'
                          }`}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs font-body mt-2">
                    <span className={`transition-colors flex items-center gap-1 ${passwordStats.reqs.length ? 'text-green-500 font-medium' : 'text-muted-foreground'}`}>
                      {passwordStats.reqs.length ? '✓' : '○'} Mín. 8 caracteres
                    </span>
                    <span className={`transition-colors flex items-center gap-1 ${passwordStats.reqs.symbol ? 'text-green-500 font-medium' : 'text-muted-foreground'}`}>
                      {passwordStats.reqs.symbol ? '✓' : '○'} 1 Símbolo (!@#$)
                    </span>
                    <span className={`transition-colors flex items-center gap-1 ${passwordStats.reqs.letter ? 'text-green-500 font-medium' : 'text-muted-foreground'}`}>
                      {passwordStats.reqs.letter ? '✓' : '○'} 1 Letra
                    </span>
                    <span className={`transition-colors flex items-center gap-1 ${passwordStats.reqs.number ? 'text-green-500 font-medium' : 'text-muted-foreground'}`}>
                      {passwordStats.reqs.number ? '✓' : '○'} 1 Número
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="confirm" className="font-heading text-xs tracking-wider uppercase">{t('auth.confirm_password')}</Label>
              <Input id="confirm" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="mt-1.5" />
            </div>
            <Button type="submit" className="w-full font-heading tracking-wide" disabled={loading}>
              {loading ? 'Creando cuenta...' : t('auth.register')}
            </Button>
            <p className="text-center text-sm text-muted-foreground font-body">
              {t('auth.have_account')}{' '}
              <Link to="/login" className="text-primary hover:underline font-semibold">{t('nav.login')}</Link>
            </p>
          </form>
        ) : (
          <div className="space-y-6 rounded-xl border border-border/50 bg-card p-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-body text-foreground">
                  Enviamos un enlace de verificación a:
                </p>
                <p className="text-primary font-heading font-semibold">{email}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <span className="text-sm font-heading font-semibold">Pasos para verificar:</span>
                </div>
                <ol className="text-sm text-muted-foreground font-body text-left space-y-1 list-decimal list-inside">
                  <li>Abre tu correo electrónico</li>
                  <li>Busca el correo de <span className="text-foreground font-semibold">GOPHORA</span></li>
                  <li>Haz click en el enlace <span className="text-foreground font-semibold">"Confirm your mail"</span></li>
                  <li>Vuelve aquí e inicia sesión</li>
                </ol>
              </div>
              <p className="text-xs text-muted-foreground font-body">
                ⚠️ Si no lo ves, revisa tu carpeta de <span className="font-semibold">spam</span> o correo no deseado
              </p>
            </div>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full font-heading tracking-wide gap-2"
                onClick={handleResend}
                disabled={resending}
              >
                <RefreshCw className={`h-4 w-4 ${resending ? 'animate-spin' : ''}`} />
                {resending ? 'Reenviando...' : '¿No recibiste el correo? Reenviar'}
              </Button>

              <Link to="/login" className="block">
                <Button variant="default" className="w-full font-heading tracking-wide gap-2">
                  Ya verifiqué mi correo → Iniciar sesión
                </Button>
              </Link>

              <button
                type="button"
                onClick={() => setStep('register')}
                className="w-full text-xs text-muted-foreground hover:text-foreground font-body text-center"
              >
                ← Volver al registro
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
