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
import { Outlet } from 'react-router-dom';

const AppShell = () => (
  <div className="min-h-screen bg-[#FFFAF0]">
    <Outlet />
  </div>
);

const SEOHead = () => null;

// Settings & Theme
import { ThemeProvider } from './lib/design/ThemeContext';
import { AtmosphereProvider } from './lib/design/AtmosphereContext';
import { MotionProvider } from './lib/design/MotionContext';
import { PlacementProvider } from './lib/placement/PlacementContext';

// New Pipeline
import { NewSpreadPage } from './new/routes/NewSpreadPage';
import { ProjectContextPage } from './new/routes/ProjectContextPage';
import { NewProjectOnboarding } from './new/routes/onboarding/NewProjectOnboarding';
import { OnboardingFlow } from './new/routes/onboarding/OnboardingFlow';
import { DeskWorkspacePage } from './new/routes/DeskWorkspacePage';
import { ProjectsPage } from './new/routes/ProjectsPage';
import { SettingsPage } from './features/settings';
import { PricingPage } from './new/routes/PricingPage';
import { BlueprintGalleryPage } from './new/routes/BlueprintGalleryPage';
import { TermsPage } from './new/routes/TermsPage';
import { PrivacyPage } from './new/routes/PrivacyPage';
import { ToastContainer } from './new/components/Toast';
import CoherenceScanPage from './new/routes/CoherenceScanPage';
import { WorkspaceShellDemo } from './new/routes/WorkspaceShellDemo';

// ============================================================
// App Component
// ============================================================

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <ThemeProvider>
            <AtmosphereProvider>
              <PlacementProvider>
                <MotionProvider>
                  <SEOHead />
                  <Routes>

                    {/* ============================================ */}
                    {/* PUBLIC ROUTES */}
                    {/* ============================================ */}

                    <Route path="/" element={<Navigate to="/projects" replace />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/blueprints" element={<BlueprintGalleryPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />

                    <Route
                      path="/login"
                      element={
                        <GuestRoute redirectTo="/projects">
                          <LoginForm />
                        </GuestRoute>
                      }
                    />

                    <Route
                      path="/signup"
                      element={
                        <GuestRoute redirectTo="/projects">
                          <SignupForm />
                        </GuestRoute>
                      }
                    />

                    <Route
                      path="/forgot-password"
                      element={
                        <GuestRoute redirectTo="/projects">
                          <ForgotPasswordForm />
                        </GuestRoute>
                      }
                    />

                    {/* ============================================ */}
                    {/* AUTH CALLBACK & PASSWORD RESET */}
                    {/* ============================================ */}

                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/reset-password" element={<ResetPasswordForm />} />

                    {/* ============================================ */}
                    {/* PROTECTED ROUTES */}
                    {/* ============================================ */}

                    <Route element={
                      <ProtectedRoute>
                        <AppShell />
                      </ProtectedRoute>
                    }>
                      <Route path="/projects" element={<ProjectsPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/dashboard" element={<Navigate to="/projects" replace />} />
                    </Route>



                    {/* Streamlined Onboarding Flow */}
                    <Route
                      path="/new"
                      element={
                        <ProtectedRoute>
                          <OnboardingFlow />
                        </ProtectedRoute>
                      }
                    />

                    {/* Legacy Onboarding (kept for compatibility) */}
                    <Route
                      path="/onboarding/new-project"
                      element={
                        <ProtectedRoute>
                          <NewProjectOnboarding />
                        </ProtectedRoute>
                      }
                    />

                    {/* ============================================ */}
                    {/* NEW PIPELINE ROUTES */}
                    {/* ============================================ */}

                    <Route
                      path="/p/:projectId/spread"
                      element={
                        <ProtectedRoute>
                          <NewSpreadPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/p/:projectId/context"
                      element={
                        <ProtectedRoute>
                          <ProjectContextPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/p/:projectId/production"
                      element={
                        <ProtectedRoute>
                          <DeskWorkspacePage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Coherence Scan */}
                    <Route
                      path="/coherence-scan"
                      element={
                        <ProtectedRoute>
                          <CoherenceScanPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/coherence-scan/:scanId"
                      element={
                        <ProtectedRoute>
                          <CoherenceScanPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Workspace Shell Demo */}
                    <Route
                      path="/workspace-shell-demo"
                      element={
                        <ProtectedRoute>
                          <WorkspaceShellDemo />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/p/:projectId/workspace-shell-demo"
                      element={
                        <ProtectedRoute>
                          <WorkspaceShellDemo />
                        </ProtectedRoute>
                      }
                    />

                    {/* ============================================ */}
                    {/* CATCH-ALL */}
                    {/* ============================================ */}

                    {/* 404 - redirect to home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                  <ToastContainer />
                </MotionProvider>
              </PlacementProvider>
            </AtmosphereProvider>
          </ThemeProvider>

        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
