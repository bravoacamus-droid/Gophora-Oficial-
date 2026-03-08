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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate('/company');
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
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
          <h1 className="text-2xl font-heading font-bold">{t('auth.welcome_back')} GOPHORA</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border/50 bg-card p-6">
          <div>
            <Label htmlFor="email" className="font-heading text-xs tracking-wider uppercase">{t('auth.email')}</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="password" className="font-heading text-xs tracking-wider uppercase">{t('auth.password')}</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1.5" />
          </div>
          <Button type="submit" className="w-full font-heading tracking-wide" disabled={loading}>
            {loading ? 'Signing in...' : t('auth.login')}
          </Button>
          <p className="text-center text-sm text-muted-foreground font-body">
            {t('auth.no_account')}{' '}
            <Link to="/register" className="text-primary hover:underline font-semibold">{t('nav.register')}</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
