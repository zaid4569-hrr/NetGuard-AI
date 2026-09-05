import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireOnboarding = true 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080B11] flex flex-col items-center justify-center text-slate-200">
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 flex items-center justify-center animate-pulse">
            <Shield className="w-7 h-7 text-cyan-400" />
          </div>
          <div className="absolute inset-0 rounded-2xl border-2 border-cyan-500/40 border-t-transparent animate-spin" />
        </div>
        <p className="text-sm font-medium tracking-wide text-slate-400">Authenticating SecOps Session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to onboarding if new account and onboarding is required
  if (requireOnboarding && user && !user.onboardingCompleted && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
