import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Rocket } from 'lucide-react';
import { toast } from 'sonner';

const AuthConfirm = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const handleConfirm = async () => {
            const tokenHash = searchParams.get('token_hash');
            const type = searchParams.get('type') as any; // 'signup', 'invite', 'magiclink', etc.
            const next = searchParams.get('next') || '/login';

            if (!tokenHash || !type) {
                console.error('AuthConfirm: Missing token_hash or type');
                navigate('/login', { replace: true });
                return;
            }

            console.log('AuthConfirm: Verifying OTP...', { type });

            try {
                const { error } = await supabase.auth.verifyOtp({
                    token_hash: tokenHash,
                    type,
                });

                if (error) {
                    console.error('AuthConfirm Error:', error.message);
                    toast.error('Error al verificar la cuenta: ' + error.message);
                    navigate('/login', { replace: true });
                } else {
                    console.log('AuthConfirm: Success! Redirecting to:', next);
                    toast.success('¡Cuenta verificada exitosamente!');
                    navigate(next, { replace: true });
                }
            } catch (err: any) {
                console.error('AuthConfirm Unexpected Error:', err);
                navigate('/login', { replace: true });
            }
        };

        handleConfirm();
    }, [navigate, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 mb-4">
                    <Rocket className="h-8 w-8 text-primary animate-pulse" />
                    <span className="font-heading text-2xl font-bold tracking-wider">GOPHORA</span>
                </div>
                <div className="space-y-2">
                    <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground font-body">Confirmando tu registro...</p>
                </div>
            </div>
        </div>
    );
};

export default AuthConfirm;
