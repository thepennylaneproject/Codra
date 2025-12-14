// ============================================================
// CODRA APP - Main Application Entry
// src/App.tsx
// Example routing setup with auth integration
// ============================================================


import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth/AuthProvider';
import {
  ProtectedRoute,
  GuestRoute,
  LoginForm,
  SignupForm,
  ForgotPasswordForm,
  ResetPasswordForm,
} from './components/auth';
import { AuthCallback } from './pages/auth/AuthCallback';
import { BillingSettingsPage } from './pages/BillingSettings';
import { AIPlayground } from './pages/AIPlayground';
import { LandingPage } from './pages/LandingPage';

import { Dashboard } from './components/Dashboard';
import { PromptLibrary } from './components/prompts/PromptLibrary';
import { PromptEditor } from './components/prompts/PromptEditor';
import { StudioPage } from './pages/StudioPage';
import { CodeWorkspace } from './components/editor/CodeWorkspace';
import { AppShell } from './components/layout/AppShell';
import { SEOHead } from './components/seo/SEOHead';

// Settings & Theme
import { ThemeProvider } from './lib/design/ThemeContext';
import { AtmosphereProvider } from './lib/design/AtmosphereContext';
import { PlacementProvider } from './lib/placement/PlacementContext';
import { PlacementLayer } from './components/layout/PlacementLayer';
import { SettingsLayout } from './pages/settings/SettingsLayout';
import { ProfileSettings } from './pages/settings/ProfileSettings';
import { AppearanceSettings } from './pages/settings/AppearanceSettings';
import { CredentialsSettings } from './pages/settings/CredentialsSettings';
import { IntegrationsSettings } from './pages/settings/IntegrationsSettings';
import { DeploySettings } from './pages/settings/DeploySettings';
import { NotificationSettings } from './pages/settings/NotificationSettings';
import { AdvancedSettings } from './pages/settings/AdvancedSettings';


// Projects / Architect
import { ProjectsListPage } from './pages/ProjectsListPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { ProjectIntakeWizard } from './components/architect/intake/ProjectIntakeWizard';

// Asset Library
import { AssetsPage } from './pages/AssetsPage';
import { AssetsManifestPage } from './pages/AssetsManifestPage';

// Removed placeholder components

import { FlowEditor } from './components/flow/FlowEditor';
import { NodePalette } from './components/flow/NodePalette';

const FlowBuilder = () => (
  <div className="flex h-screen bg-zinc-950">
    <NodePalette />
    <div className="flex-1 h-full">
      <FlowEditor />
    </div>
  </div>
);


import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { AdminDashboard } from './pages/admin/AdminDashboard';

// ============================================================
// App Component
// ============================================================

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <AtmosphereProvider>
              <PlacementProvider>
                <PlacementLayer />
                <SEOHead />
                <Routes>

                  {/* ============================================ */}
                  {/* PUBLIC ROUTES (Guest only - redirect if authenticated) */}
                  {/* ============================================ */}

                  {/* Main Landing Page (Public) */}
                  <Route path="/" element={<LandingPage />} />

                  <Route
                    path="/login"
                    element={
                      <GuestRoute redirectTo="/dashboard">
                        <LoginForm />
                      </GuestRoute>
                    }
                  />

                  <Route
                    path="/signup"
                    element={
                      <GuestRoute redirectTo="/dashboard">
                        <SignupForm />
                      </GuestRoute>
                    }
                  />

                  <Route
                    path="/forgot-password"
                    element={
                      <GuestRoute redirectTo="/dashboard">
                        <ForgotPasswordForm />
                      </GuestRoute>
                    }
                  />

                  {/* ============================================ */}
                  {/* AUTH CALLBACK (handles OAuth and magic links) */}
                  {/* ============================================ */}

                  <Route path="/auth/callback" element={<AuthCallback />} />

                  {/* Reset password - accessible when user has recovery session */}
                  <Route path="/reset-password" element={<ResetPasswordForm />} />

                  {/* ============================================ */}
                  {/* PROTECTED ROUTES (require authentication) */}
                  {/* ============================================ */}

                  {/* App Shell Layout */}
                  <Route element={
                    <ProtectedRoute>
                      <AppShell />
                    </ProtectedRoute>
                  }>
                    {/* Main dashboard */}
                    <Route path="/dashboard" element={<Dashboard />} />

                    {/* Admin console - keeping its own layout for now or nesting? 
                  The plan implies global shell. Admin might want distinct look but let's wrap it for consistency 
                  unless it has its own full page layout. AdminLayout usually has its own sidebar.
                  Let's exclude Admin from AppShell if it has AdminLayout.
              */}

                    {/* Projects / Architect */}
                    <Route path="/projects" element={<ProjectsListPage />} />
                    <Route path="/projects/new" element={<ProjectIntakeWizard />} />
                    <Route path="/projects/:id" element={<ProjectDetailPage />} />

                    {/* Asset Library */}
                    <Route path="/assets" element={<AssetsPage />} />
                    <Route path="/assets/manifests" element={<AssetsManifestPage />} />

                    {/* AI Playground */}
                    <Route path="/ai" element={<AIPlayground />} />

                    {/* Settings */}
                    <Route path="/settings" element={<SettingsLayout />}>
                      <Route index element={<Navigate to="profile" replace />} />
                      <Route path="profile" element={<ProfileSettings />} />
                      <Route path="appearance" element={<AppearanceSettings />} />
                      <Route path="credentials" element={<CredentialsSettings />} />
                      <Route path="billing" element={<BillingSettingsPage />} />
                      <Route path="integrations" element={<IntegrationsSettings />} />
                      <Route path="deploy" element={<DeploySettings />} />
                      <Route path="notifications" element={<NotificationSettings />} />
                      <Route path="advanced" element={<AdvancedSettings />} />
                    </Route>

                    {/* Prompt Library */}
                    <Route path="/prompts" element={<PromptLibrary />} />
                    <Route path="/prompts/:id" element={<PromptEditor />} />

                    {/* Studio & Tools */}
                    <Route path="/studio" element={<StudioPage />} />
                    <Route path="/studio/code" element={<CodeWorkspace />} />
                    <Route path="/flow" element={<FlowBuilder />} />

                    {/* Plan Restricted */}
                    <Route path="/pro/*" element={
                      <div className="min-h-screen p-8">
                        <h1 className="text-2xl font-bold text-zinc-100">Pro Features</h1>
                      </div>
                    } />
                    <Route path="/team/*" element={
                      <div className="min-h-screen p-8">
                        <h1 className="text-2xl font-bold text-zinc-100">Team Features</h1>
                      </div>
                    } />
                  </Route>

                  {/* Admin Console (Separate Layout) */}
                  <Route
                    path="/admin/*"
                    element={
                      <ProtectedRoute>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Onboarding (Separate Layout) */}
                  <Route
                    path="/onboarding"
                    element={
                      <ProtectedRoute>
                        <OnboardingWizard />
                      </ProtectedRoute>
                    }
                  />

                  {/* ============================================ */}
                  {/* CATCH-ALL */}
                  {/* ============================================ */}

                  {/* 404 - redirect to home */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </PlacementProvider>
            </AtmosphereProvider>
          </ThemeProvider>

        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
