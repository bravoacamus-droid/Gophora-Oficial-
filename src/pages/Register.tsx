import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Rocket, Building2, Compass, Mail, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const Register = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountType, setAccountType] = useState<'company' | 'explorer'>(
    (searchParams.get('type') as 'company' | 'explorer') || 'company'
  );
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [otpCode, setOtpCode] = useState('');
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { account_type: accountType },
        },
      });
      if (error) throw error;
      toast.success('¡Código de verificación enviado a tu correo!');
      setStep('verify');
    } catch (err: any) {
      toast.error(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      toast.error('Ingresa el código de 6 dígitos');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'signup',
      });
      if (error) throw error;
      toast.success('¡Cuenta verificada exitosamente!');
      navigate(accountType === 'company' ? '/company' : '/explorer');
    } catch (err: any) {
      toast.error(err.message || 'Código inválido o expirado');
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
      toast.success('¡Código reenviado! Revisa tu correo');
    } catch (err: any) {
      toast.error(err.message || 'Error al reenviar código');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Rocket className="h-8 w-8 text-primary" />
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
                  className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all ${
                    accountType === 'company'
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
                  className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all ${
                    accountType === 'explorer'
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
            <div>
              <Label htmlFor="email" className="font-heading text-xs tracking-wider uppercase">{t('auth.email')}</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="password" className="font-heading text-xs tracking-wider uppercase">{t('auth.password')}</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1.5" />
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
          <form onSubmit={handleVerify} className="space-y-6 rounded-xl border border-border/50 bg-card p-6">
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground font-body">
                Enviamos un código de 6 dígitos a{' '}
                <span className="text-foreground font-semibold">{email}</span>
              </p>
              <p className="text-xs text-muted-foreground font-body">
                Revisa tu bandeja de entrada y la carpeta de spam
              </p>
            </div>

            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button type="submit" className="w-full font-heading tracking-wide gap-2" disabled={loading || otpCode.length !== 6}>
              <ShieldCheck className="h-4 w-4" />
              {loading ? 'Verificando...' : 'Verificar cuenta'}
            </Button>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-sm text-primary hover:underline font-heading disabled:opacity-50"
              >
                {resending ? 'Reenviando...' : '¿No recibiste el código? Reenviar'}
              </button>
              <div>
                <button
                  type="button"
                  onClick={() => { setStep('register'); setOtpCode(''); }}
                  className="text-xs text-muted-foreground hover:text-foreground font-body"
                >
                  ← Volver al registro
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Register;
