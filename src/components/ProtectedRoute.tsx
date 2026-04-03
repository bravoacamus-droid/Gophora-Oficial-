import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const { onboardingCompleted, isAdmin } = useAuth();
  const isAtOnboarding = window.location.pathname === '/onboarding';
  const isAtAdmin = window.location.pathname.startsWith('/admin');

  if (!onboardingCompleted && !isAtOnboarding && !isAtAdmin && !isAdmin) {
    return <Navigate to="/onboarding" replace />;
  }

  if (onboardingCompleted && isAtOnboarding) {
    const { accountType } = useAuth();
    return <Navigate to={accountType === 'company' ? '/company' : '/explorer'} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
