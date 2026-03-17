import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event which fires when
    // Supabase processes the recovery token from the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setSessionReady(true);
        setInitializing(false);
      } else if (event === 'SIGNED_IN' && session) {
        // Sometimes the event comes as SIGNED_IN with a recovery type
        setSessionReady(true);
        setInitializing(false);
      }
    });

    // Also check if there's already an active session (e.g. page refresh)
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionReady(true);
      }
      // Give Supabase time to process the URL hash tokens
      setTimeout(() => setInitializing(false), 3000);
    };

    checkExistingSession();

    return () => subscription.unsubscribe();
  }, []);

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
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('¡Contraseña actualizada exitosamente!');
      // Sign out so user logs in with new password
      await supabase.auth.signOut();
      navigate('/login', { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="font-heading text-2xl font-bold tracking-wider">GOPHORA</span>
          </div>
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground font-body">Verificando enlace de recuperación...</p>
        </div>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="font-heading text-2xl font-bold tracking-wider">GOPHORA</span>
          </div>
          <p className="text-muted-foreground font-body">
            El enlace de recuperación ha expirado o es inválido. Solicita uno nuevo desde el inicio de sesión.
          </p>
          <Button onClick={() => navigate('/login')} className="font-heading tracking-wide">
            Ir a iniciar sesión
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="font-heading text-2xl font-bold tracking-wider">GOPHORA</span>
          </div>
          <h1 className="text-2xl font-heading font-bold">Nueva contraseña</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border/50 bg-card p-6">
          <div className="flex items-center justify-center gap-2 text-primary mb-2">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-sm font-heading font-semibold">Ingresa tu nueva contraseña</span>
          </div>
          <div>
            <Label htmlFor="password" className="font-heading text-xs tracking-wider uppercase">Nueva contraseña</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="confirm" className="font-heading text-xs tracking-wider uppercase">Confirmar contraseña</Label>
            <Input id="confirm" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="mt-1.5" />
          </div>
          <Button type="submit" className="w-full font-heading tracking-wide" disabled={loading}>
            {loading ? 'Actualizando...' : 'Actualizar contraseña'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
