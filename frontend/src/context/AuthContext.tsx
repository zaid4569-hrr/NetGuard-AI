import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

export interface UserProfile { id: string; email: string; fullName: string; organizationName: string; onboardingCompleted: boolean; preferredVendors: string[]; securityPriorities: string[]; avatarUrl?: string; activeWorkspaceId?: string; }
export interface Workspace { id: string; name: string; role: 'owner' | 'admin' | 'analyst' | 'auditor'; }
interface AuthContextType {
  user: UserProfile | null; workspaces: Workspace[]; activeWorkspace: Workspace | null; isAuthenticated: boolean; isLoading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<{success:boolean; error?:string}>;
  signup: (name: string, email: string, password: string) => Promise<{success:boolean; error?:string}>;
  logout: () => Promise<void>; resetPassword: (email:string) => Promise<{success:boolean; error?:string}>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>; completeOnboarding: (data: {organizationName:string; preferredVendors:string[]; securityPriorities:string[]}) => Promise<void>; switchWorkspace: (id:string) => void;
  loginAsDemoUser: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const TOKEN_KEY = 'netguard_session_token';
const token = () => sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
export const getAuthToken = token;
const saveToken = (value: string, remember: boolean) => { sessionStorage.removeItem(TOKEN_KEY); localStorage.removeItem(TOKEN_KEY); (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, value); };
const clearToken = () => { sessionStorage.removeItem(TOKEN_KEY); localStorage.removeItem(TOKEN_KEY); };

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [user, setUser] = useState<UserProfile | null>(null); const [isLoading, setIsLoading] = useState(true);
  const workspaces: Workspace[] = user ? [{id: 'local', name: user.organizationName, role: 'owner'}] : [];
  useEffect(() => { const restore = async () => { const saved = token(); if (!saved) { setIsLoading(false); return; } try { const {data} = await axios.get('/api/auth/me', {headers:{Authorization:`Bearer ${saved}`}}); setUser(data.user); } catch { clearToken(); } finally { setIsLoading(false); } }; restore(); }, []);
  const authenticate = async (path: string, body: object, remember = true) => { try { const {data} = await axios.post(`/api/auth/${path}`, body); saveToken(data.token, remember); setUser(data.user); return {success:true}; } catch (error) { const detail = axios.isAxiosError(error) ? error.response?.data?.detail : null; return {success:false, error: typeof detail === 'string' ? detail : 'Unable to authenticate. Check your details and try again.'}; } };
  const login = async (email:string,password:string,remember=true) => { setIsLoading(true); const result = await authenticate('login',{email,password},remember); setIsLoading(false); return result; };
  const signup = async (fullName:string,email:string,password:string) => { setIsLoading(true); const result = await authenticate('signup',{full_name:fullName,email,password}); setIsLoading(false); return result; };
  const logout = async () => { const saved = token(); try { if(saved) await axios.post('/api/auth/logout', {}, {headers:{Authorization:`Bearer ${saved}`}}); } finally { clearToken(); setUser(null); } };
  const unavailable = async () => ({success:false, error:'Password reset is not configured for local-only accounts. Contact your local administrator.'});
  const updateProfile = async (updates: Partial<UserProfile>) => { if(user) setUser({...user,...updates}); };
  const completeOnboarding = async (data: {organizationName:string; preferredVendors:string[]; securityPriorities:string[]}) => { if(user) setUser({...user,...data,onboardingCompleted:true}); };
  const switchWorkspace = () => undefined;
  const loginAsDemoUser = async () => { throw new Error('Demo access is disabled. Create an account and upload a configuration to begin.'); };
  return <AuthContext.Provider value={{user,workspaces,activeWorkspace:workspaces[0] || null,isAuthenticated:!!user,isLoading,login,signup,logout,resetPassword:unavailable,updateProfile,completeOnboarding,switchWorkspace,loginAsDemoUser}}>{children}</AuthContext.Provider>;
};
export const useAuth = () => { const value = useContext(AuthContext); if(!value) throw new Error('useAuth must be used within an AuthProvider'); return value; };
