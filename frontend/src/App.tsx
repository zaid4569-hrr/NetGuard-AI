import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GitCompare, Wrench, CheckSquare, FileText, Network, Sparkles, TrendingUp } from 'lucide-react';

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Public marketing pages
import { LandingPage } from './pages/LandingPage';
import { PlatformPage } from './pages/PlatformPage';
import { VendorsPage } from './pages/VendorsPage';
import { DocsPage } from './pages/DocsPage';
import { AboutPage } from './pages/AboutPage';

// Auth pages
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Onboarding } from './pages/Onboarding';

// Application pages
import { Dashboard } from './pages/Dashboard';
import { SecurityCenter } from './pages/SecurityCenter';
import { AuditPage } from './pages/AuditPage';
import { DevicesPage } from './pages/DevicesPage';
import { DeviceDetailRoute } from './pages/DeviceDetailRoute';
import { FindingsPage } from './pages/FindingsPage';
import { RuleCatalog } from './pages/RuleCatalog';
import { SettingsPage } from './pages/SettingsPage';
import { ReportsPage } from './pages/ReportsPage';
import { ConfigAdvisorPage } from './pages/ConfigAdvisorPage';
import { ComingSoon } from './pages/ComingSoon';

const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    <AuthProvider>
      <NotificationProvider>{children}</NotificationProvider>
    </AuthProvider>
  </ThemeProvider>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppProviders>
        <Routes>
          {/* Public marketing site */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/platform" element={<PlatformPage />} />
          <Route path="/vendors" element={<VendorsPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/about" element={<AboutPage />} />

          {/* Authentication */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Onboarding — authenticated, but does not require onboarding to already be complete */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute requireOnboarding={false}>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          {/* Authenticated application shell */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/security-center" element={<SecurityCenter />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="/devices" element={<DevicesPage />} />
            <Route path="/devices/:id" element={<DeviceDetailRoute />} />
            <Route path="/findings" element={<FindingsPage />} />
            <Route
              path="/compare"
              element={
                <ComingSoon
                  icon={GitCompare}
                  title="Configuration Comparison"
                  description="Compare two configurations side-by-side and see how your security score changes before and after remediation."
                />
              }
            />
            <Route
              path="/remediation"
              element={
                <ConfigAdvisorPage />
              }
            />
            <Route
              path="/ai-copilot"
              element={
                <ComingSoon
                  icon={Sparkles}
                  title="AI Security Copilot"
                  description="Ask natural-language questions about your audit findings once an AI provider is configured."
                />
              }
            />
            <Route
              path="/network-map"
              element={
                <ComingSoon
                  icon={Network}
                  title="Network Map"
                  description="A visual topology of your audited devices, colored by security posture, is coming soon."
                />
              }
            />
            <Route
              path="/security-trends"
              element={
                <ComingSoon
                  icon={TrendingUp}
                  title="Security Trends"
                  description="Track your security posture across audits over time."
                />
              }
            />
            <Route
              path="/compliance"
              element={
                <ComingSoon
                  icon={CheckSquare}
                  title="Compliance Center"
                  description="CIS, NIST, ISO 27001, PCI DSS, and SOC 2 control mappings will appear here as they're implemented."
                />
              }
            />
            <Route path="/rules" element={<RuleCatalog />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/profile" element={<SettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppProviders>
    </BrowserRouter>
  );
};

export default App;
