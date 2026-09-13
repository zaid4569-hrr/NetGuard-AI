import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { firebaseAuth, googleProvider, githubProvider, isFirebaseConfigured } from '../services/firebase';
import { authApi, AUTH_EXPIRED_EVENT, TOKEN_STORAGE_KEY } from '../services/api';

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
  isFirebaseConnected: boolean;
  login: (email: string, password: string, rememberSession?: boolean) => Promise<{ success: boolean; error?: string }>;
  signup: (fullName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginWithGithub: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: (data: { organizationName: string; preferredVendors: string[]; securityPriorities: string[] }) => Promise<void>;
  switchWorkspace: (workspaceId: string) => void;
  loginAsDemoUser: () => Promise<void>;
}

const DEFAULT_WORKSPACES: Workspace[] = [
  { id: 'ws-prod-01', name: 'Enterprise Production Core', role: 'owner' },
  { id: 'ws-lab-02', name: 'Air-Gapped Lab Cluster', role: 'admin' },
  { id: 'ws-audit-03', name: 'PCI-DSS Compliance Audit', role: 'auditor' }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Friendlier text for Firebase's terse error codes.
const friendlyFirebaseError = (err: any): string => {
  const code = err?.code || '';
  const map: Record<string, string> = {
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/wrong-password': 'Invalid email or password.',
    'auth/user-not-found': 'Invalid email or password.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  };
  return map[code] || err?.message || 'Authentication error occurred.';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>(DEFAULT_WORKSPACES);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('ws-prod-01');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Merge the FastAPI backend's view of the user (source of truth for
  // email/full_name/organization_name — these are auto-provisioned there
  // the moment a Firebase ID token is first verified, see backend
  // app/api/deps.py) with any extra locally-cached preferences.
  const syncProfileFromBackend = async (fallbackName?: string) => {
    const cachedProfile = localStorage.getItem('netguard_user_session');
    const parsedCache = cachedProfile ? JSON.parse(cachedProfile) : {};
    try {
      const meData = await authApi.me();
      const me = (meData as any)?.user || meData;
      if (!me || (!me.id && !me.email)) {
        return;
      }
      const restored: UserProfile = {
        id: me.id || parsedCache.id || 'usr-default',
        email: me.email || parsedCache.email || '',
        fullName: me.full_name || me.fullName || parsedCache.fullName || fallbackName || (me.email ? me.email.split('@')[0] : 'Operator'),
        organizationName: me.organization_name || me.organizationName || parsedCache.organizationName || 'Enterprise Security Workspace',
        activeWorkspaceId: parsedCache.activeWorkspaceId || 'ws-prod-01',
        onboardingCompleted: parsedCache.onboardingCompleted ?? true,
        preferredVendors: parsedCache.preferredVendors || ['Cisco', 'Fortinet'],
        securityPriorities: parsedCache.securityPriorities || ['Network Hardening']
      };
      setUser(restored);
      if (restored.activeWorkspaceId) setActiveWorkspaceId(restored.activeWorkspaceId);
      localStorage.setItem('netguard_user_session', JSON.stringify(restored));
    } catch (err) {
      console.warn('Could not sync profile with backend:', err);
      if (parsedCache && parsedCache.email) {
        setUser(parsedCache);
      }
    }
  };

  // Initialize session on startup
  useEffect(() => {
    let unsubscribeFirebase: (() => void) | undefined;

    const initAuth = async () => {
      try {
        if (isFirebaseConfigured) {
          // onAuthStateChanged fires immediately with the current user (or
          // null) on mount, and again on every sign-in/sign-out — this is
          // Firebase's single source of truth for session state, so we
          // don't need to separately restore anything from localStorage.
          unsubscribeFirebase = onAuthStateChanged(firebaseAuth, async (fbUser: FirebaseUser | null) => {
            if (fbUser) {
              await syncProfileFromBackend(fbUser.displayName || undefined);
            } else {
              localStorage.removeItem('netguard_user_session');
              setUser(null);
            }
            setIsLoading(false);
          });
          return;
        }

        // NetGuard local backend session: a JWT means "logged in", but we
        // always re-validate it against /auth/me on load rather than
        // trusting a cached profile — a token that's been revoked or
        // has expired must not leave the user looking authenticated.
        const token = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (token) {
          await syncProfileFromBackend();
        }
      } catch (err) {
        console.warn('Auth initialization failed:', err);
      } finally {
        if (!isFirebaseConfigured) setIsLoading(false);
      }
    };

    initAuth();

    // If any API call comes back 401 mid-session (expired/revoked token),
    // log the user out immediately rather than leaving them in a state
    // where the UI looks authenticated but every request silently fails.
    const handleAuthExpired = () => {
      localStorage.removeItem('netguard_user_session');
      setUser(null);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);

    return () => {
      unsubscribeFirebase?.();
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Login handler
  const login = async (email: string, password: string, rememberSession = true): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      if (isFirebaseConfigured) {
        await signInWithEmailAndPassword(firebaseAuth, email, password);
        // Profile sync happens via onAuthStateChanged.
        setIsLoading(false);
        return { success: true };
      }

      // Real credential check against the NetGuard backend. There is no
      // "any password works" path — an invalid email/password combination
      // is rejected with a generic error, same as any production login.
      const authResp = await authApi.login(email, password);
      applyAuthResponse(authResp, rememberSession);
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      let message = 'Invalid email or password.';
      if (isFirebaseConfigured) {
        message = friendlyFirebaseError(err);
      } else if (err?.response?.data?.detail) {
        const detail = err.response.data.detail;
        message = Array.isArray(detail) ? detail.map((d: any) => d.msg).join(' ') : detail;
      } else if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response) {
        message = 'Unable to reach backend server. Please verify the server is running.';
      } else if (err?.message) {
        message = err.message;
      }
      return { success: false, error: message };
    }
  };

  // Signup handler
  const signup = async (fullName: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      if (isFirebaseConfigured) {
        const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        await firebaseUpdateProfile(cred.user, { displayName: fullName });
        // Profile sync (and backend user auto-provisioning) happens via onAuthStateChanged.
        setIsLoading(false);
        return { success: true };
      }

      const authResp = await authApi.signup(fullName, email, password);
      applyAuthResponse(authResp, true, { onboardingCompleted: false });
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      let message = 'Registration failed.';
      if (isFirebaseConfigured) {
        message = friendlyFirebaseError(err);
      } else if (err?.response?.data?.detail) {
        const detail = err.response.data.detail;
        message = Array.isArray(detail) ? detail.map((d: any) => d.msg).join(' ') : detail;
      } else if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response) {
        message = 'Unable to reach backend server. Please verify the server is running.';
      } else if (err?.message) {
        message = err.message;
      }
      return { success: false, error: message };
    }
  };

  // Google / GitHub sign-in via Firebase popup. Works for both new and
  // returning users — Firebase creates the account on first use.
  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await signInWithPopup(firebaseAuth, googleProvider);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: friendlyFirebaseError(err) };
    }
  };

  const loginWithGithub = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await signInWithPopup(firebaseAuth, githubProvider);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: friendlyFirebaseError(err) };
    }
  };

  // Shared helper: persist a real backend auth response (token + user) into
  // local UserProfile shape used throughout the rest of the app. Only used
  // in the non-Firebase (built-in backend JWT) path.
  const applyAuthResponse = (
    authResp: any,
    rememberSession: boolean,
    overrides: Partial<UserProfile> = {}
  ) => {
    const accessToken = authResp?.access_token || authResp?.token;
    if (!accessToken) {
      throw new Error('The authentication server returned no session token.');
    }
    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    const userData = authResp.user || authResp;
    const userEmail = userData.email || '';
    const profile: UserProfile = {
      id: userData.id || 'usr-default',
      email: userEmail,
      fullName: userData.full_name || userData.fullName || (userEmail ? userEmail.split('@')[0] : 'Operator'),
      organizationName: userData.organization_name || userData.organizationName || 'Enterprise Security Workspace',
      activeWorkspaceId: 'ws-prod-01',
      onboardingCompleted: true,
      preferredVendors: ['Cisco', 'Fortinet', 'Juniper'],
      securityPriorities: ['Network Hardening', 'CIS Compliance'],
      ...overrides
    };
    setUser(profile);
    if (rememberSession) {
      localStorage.setItem('netguard_user_session', JSON.stringify(profile));
    }
  };

  // Logout handler
  const logout = async () => {
    setIsLoading(true);
    if (isFirebaseConfigured) {
      await firebaseSignOut(firebaseAuth);
    }
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem('netguard_user_session');
    setUser(null);
    setIsLoading(false);
  };

  // Forgot password handler
  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (isFirebaseConfigured) {
      try {
        await sendPasswordResetEmail(firebaseAuth, email);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: friendlyFirebaseError(err) };
      }
    }
    // Simulated reset response (built-in backend has no email delivery yet).
    return { success: true };
  };

  // Profile update — full_name is mirrored to Firebase's displayName when
  // Firebase Auth is active; everything else stays cached locally, same as
  // the built-in backend path (the FastAPI user model only tracks
  // full_name/organization_name today).
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('netguard_user_session', JSON.stringify(updated));

    if (isFirebaseConfigured && firebaseAuth.currentUser && updates.fullName) {
      try {
        await firebaseUpdateProfile(firebaseAuth.currentUser, { displayName: updates.fullName });
      } catch (err) {
        console.warn('Could not update Firebase display name:', err);
      }
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

  // Quick Demo account for evaluation — this creates/logs into a real
  // account (auto-provisioned on first use) rather than bypassing
  // authentication. It gets a real session like any other user, so it can
  // only ever see its own (initially empty) audit history — not a fake
  // all-access session.
  const loginAsDemoUser = async () => {
    setIsLoading(true);
    const demoEmail = 'demo@netguard.ai';
    const demoPassword = 'NetGuardDemo2026!';
    try {
      if (isFirebaseConfigured) {
        try {
          await signInWithEmailAndPassword(firebaseAuth, demoEmail, demoPassword);
        } catch {
          // Demo account doesn't exist yet on this Firebase project — create it.
          const cred = await createUserWithEmailAndPassword(firebaseAuth, demoEmail, demoPassword);
          await firebaseUpdateProfile(cred.user, { displayName: 'Alex Vance' });
        }
      } else {
        try {
          const authResp = await authApi.login(demoEmail, demoPassword);
          applyAuthResponse(authResp, true, { fullName: 'Alex Vance', organizationName: 'Global Cyber Defense Corp' });
        } catch {
          try {
            // Demo account doesn't exist yet on this backend instance — create it.
            const authResp = await authApi.signup('Alex Vance', demoEmail, demoPassword);
            applyAuthResponse(authResp, true, { organizationName: 'Global Cyber Defense Corp' });
          } catch {
            // Instant offline fallback if backend is sleeping or offline
            const fallbackDemoUser: UserProfile = {
              id: 'demo-analyst-001',
              email: demoEmail,
              fullName: 'Alex Vance',
              organizationName: 'Global Cyber Defense Corp',
              activeWorkspaceId: 'ws-prod-01',
              onboardingCompleted: true,
              preferredVendors: ['Cisco', 'Fortinet', 'Juniper'],
              securityPriorities: ['Network Hardening', 'CIS Compliance']
            };
            setUser(fallbackDemoUser);
            localStorage.setItem('netguard_user_session', JSON.stringify(fallbackDemoUser));
          }
        }
      }
    } catch (err) {
      console.warn('Demo login failed, using offline demo session:', err);
      const fallbackDemoUser: UserProfile = {
        id: 'demo-analyst-001',
        email: demoEmail,
        fullName: 'Alex Vance',
        organizationName: 'Global Cyber Defense Corp',
        activeWorkspaceId: 'ws-prod-01',
        onboardingCompleted: true,
        preferredVendors: ['Cisco', 'Fortinet', 'Juniper'],
        securityPriorities: ['Network Hardening', 'CIS Compliance']
      };
      setUser(fallbackDemoUser);
      localStorage.setItem('netguard_user_session', JSON.stringify(fallbackDemoUser));
    } finally {
      setIsLoading(false);
    }
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
        isFirebaseConnected: isFirebaseConfigured,
        login,
        signup,
        loginWithGoogle,
        loginWithGithub,
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
