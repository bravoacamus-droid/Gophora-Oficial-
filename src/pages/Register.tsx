import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Rocket, Building2, Compass } from 'lucide-react';
import { toast } from 'sonner';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
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
      toast.success('Account created successfully!');
      navigate(accountType === 'company' ? '/company' : '/explorer');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-heading font-bold">{t('auth.join')} GOPHORA</h1>
        </div>
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
            {loading ? 'Creating account...' : t('auth.register')}
          </Button>
          <p className="text-center text-sm text-muted-foreground font-body">
            {t('auth.have_account')}{' '}
            <Link to="/login" className="text-primary hover:underline font-semibold">{t('nav.login')}</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
