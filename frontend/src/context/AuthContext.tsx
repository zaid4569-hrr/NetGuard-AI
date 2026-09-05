import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  organizationName: string;
  activeWorkspaceId: string;
  onboardingCompleted: boolean;
  preferredVendors: string[];
  securityPriorities: string[];
}

export interface Workspace {
  id: string;
  name: string;
  role: 'owner' | 'admin' | 'analyst' | 'auditor';
}

interface AuthContextType {
  user: UserProfile | null;
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSupabaseConnected: boolean;
  login: (email: string, password: string, rememberSession?: boolean) => Promise<{ success: boolean; error?: string }>;
  signup: (fullName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: (data: { organizationName: string; preferredVendors: string[]; securityPriorities: string[] }) => Promise<void>;
  switchWorkspace: (workspaceId: string) => void;
  loginAsDemoUser: () => Promise<void>;
}

const DEFAULT_DEMO_USER: UserProfile = {
  id: 'demo-secops-01',
  email: 'secops@netguard.ai',
  fullName: 'Alex Vance',
  organizationName: 'Global Cyber Defense Corp',
  activeWorkspaceId: 'ws-prod-01',
  onboardingCompleted: true,
  preferredVendors: ['Cisco', 'Fortinet', 'Juniper', 'Palo Alto'],
  securityPriorities: ['Network Hardening', 'CIS Compliance', 'Management Plane Security']
};

const DEFAULT_WORKSPACES: Workspace[] = [
  { id: 'ws-prod-01', name: 'Enterprise Production Core', role: 'owner' },
  { id: 'ws-lab-02', name: 'Air-Gapped Lab Cluster', role: 'admin' },
  { id: 'ws-audit-03', name: 'PCI-DSS Compliance Audit', role: 'auditor' }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>(DEFAULT_WORKSPACES);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('ws-prod-01');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session on startup
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isSupabaseConfigured) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Load user profile from Supabase
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              setUser({
                id: profile.id,
                email: profile.email || session.user.email || '',
                fullName: profile.full_name || 'Security Operator',
                avatarUrl: profile.avatar_url,
                organizationName: profile.organization_name || 'NetGuard SecOps',
                activeWorkspaceId: profile.active_workspace_id || 'ws-prod-01',
                onboardingCompleted: Boolean(profile.onboarding_completed),
                preferredVendors: profile.preferred_vendors || ['Cisco', 'Fortinet'],
                securityPriorities: profile.security_priorities || ['Hardening', 'Compliance']
              });
            } else {
              // Fallback user from session metadata
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                fullName: session.user.user_metadata?.full_name || 'Security Analyst',
                organizationName: 'SecOps Workspace',
                activeWorkspaceId: 'ws-prod-01',
                onboardingCompleted: false,
                preferredVendors: ['Cisco'],
                securityPriorities: ['Network Hardening']
              });
            }
          }
        } else {
          // Local offline fallback: restore saved session from localStorage
          const savedSession = localStorage.getItem('netguard_user_session');
          if (savedSession) {
            const parsed = JSON.parse(savedSession);
            setUser(parsed);
            if (parsed.activeWorkspaceId) {
              setActiveWorkspaceId(parsed.activeWorkspaceId);
            }
          }
        }
      } catch (err) {
        console.warn('Auth initialization fallback to offline mode:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen to Supabase auth state changes if configured
    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setUser({
              id: profile.id,
              email: profile.email,
              fullName: profile.full_name,
              organizationName: profile.organization_name,
              activeWorkspaceId: profile.active_workspace_id,
              onboardingCompleted: profile.onboarding_completed,
              preferredVendors: profile.preferred_vendors || [],
              securityPriorities: profile.security_priorities || []
            });
          }
        } else {
          setUser(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // Login handler
  const login = async (email: string, password: string, rememberSession = true): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }
        if (data.user) {
          // Profile handled via onAuthStateChange
          return { success: true };
        }
      } else {
        // Local simulation: allow login with any valid formatted email/password or demo credentials
        if (!email || !password) {
          setIsLoading(false);
          return { success: false, error: 'Please provide both email and password.' };
        }
        if (password.length < 6) {
          setIsLoading(false);
          return { success: false, error: 'Password must be at least 6 characters.' };
        }

        const localUser: UserProfile = {
          id: 'user-' + Math.random().toString(36).substring(2, 9),
          email,
          fullName: email.split('@')[0].replace('.', ' ').replace(/^\w/, c => c.toUpperCase()),
          organizationName: 'Enterprise Security Workspace',
          activeWorkspaceId: 'ws-prod-01',
          onboardingCompleted: true,
          preferredVendors: ['Cisco', 'Fortinet', 'Juniper'],
          securityPriorities: ['Network Hardening', 'CIS Compliance']
        };

        setUser(localUser);
        if (rememberSession) {
          localStorage.setItem('netguard_user_session', JSON.stringify(localUser));
        }
        setIsLoading(false);
        return { success: true };
      }
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Authentication error occurred.' };
    }
  };

  // Signup handler
  const signup = async (fullName: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
        });
        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }
        if (data.user) {
          return { success: true };
        }
      } else {
        const newUser: UserProfile = {
          id: 'user-' + Math.random().toString(36).substring(2, 9),
          email,
          fullName,
          organizationName: `${fullName}'s Security Lab`,
          activeWorkspaceId: 'ws-prod-01',
          onboardingCompleted: false, // Triggers onboarding flow
          preferredVendors: ['Cisco'],
          securityPriorities: ['Network Hardening']
        };

        setUser(newUser);
        localStorage.setItem('netguard_user_session', JSON.stringify(newUser));
        setIsLoading(false);
        return { success: true };
      }
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Registration failed.' };
    }
  };

  // Logout handler
  const logout = async () => {
    setIsLoading(true);
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('netguard_user_session');
    setUser(null);
    setIsLoading(false);
  };

  // Forgot password handler
  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    }
    // Simulated reset response
    return { success: true };
  };

  // Profile update
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('netguard_user_session', JSON.stringify(updated));

    if (isSupabaseConfigured) {
      await supabase.from('profiles').update({
        full_name: updated.fullName,
        organization_name: updated.organizationName,
        preferred_vendors: updated.preferredVendors,
        security_priorities: updated.securityPriorities,
        onboarding_completed: updated.onboardingCompleted
      }).eq('id', user.id);
    }
  };

  // Onboarding completion
  const completeOnboarding = async (data: {
    organizationName: string;
    preferredVendors: string[];
    securityPriorities: string[];
  }) => {
    if (!user) return;
    const updated: UserProfile = {
      ...user,
      organizationName: data.organizationName,
      preferredVendors: data.preferredVendors,
      securityPriorities: data.securityPriorities,
      onboardingCompleted: true
    };
    setUser(updated);
    localStorage.setItem('netguard_user_session', JSON.stringify(updated));

    if (isSupabaseConfigured) {
      await supabase.from('profiles').update({
        organization_name: data.organizationName,
        preferred_vendors: data.preferredVendors,
        security_priorities: data.securityPriorities,
        onboarding_completed: true
      }).eq('id', user.id);
    }
  };

  // Switch workspace
  const switchWorkspace = (wsId: string) => {
    setActiveWorkspaceId(wsId);
    if (user) {
      const updated = { ...user, activeWorkspaceId: wsId };
      setUser(updated);
      localStorage.setItem('netguard_user_session', JSON.stringify(updated));
    }
  };

  // Quick Demo account for hackathon evaluation
  const loginAsDemoUser = async () => {
    setIsLoading(true);
    setUser(DEFAULT_DEMO_USER);
    localStorage.setItem('netguard_user_session', JSON.stringify(DEFAULT_DEMO_USER));
    setIsLoading(false);
  };

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];

  return (
    <AuthContext.Provider
      value={{
        user,
        workspaces,
        activeWorkspace,
        isAuthenticated: Boolean(user),
        isLoading,
        isSupabaseConnected: isSupabaseConfigured,
        login,
        signup,
        logout,
        resetPassword,
        updateProfile,
        completeOnboarding,
        switchWorkspace,
        loginAsDemoUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
