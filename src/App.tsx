// ============================================================
// CODRA APP - Main Application Entry
// src/App.tsx
// Example routing setup with auth integration
// ============================================================


import { lazy, Suspense } from 'react';
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
  <div className="min-h-screen bg-[var(--ui-bg)]">
    <Outlet />
  </div>
);

const SEOHead = () => null;

// Settings & Theme
import { ThemeProvider } from './lib/design/ThemeContext';
import { AtmosphereProvider } from './lib/design/AtmosphereContext';
import { MotionProvider } from './lib/design/MotionContext';
import { PlacementProvider } from './lib/placement/PlacementContext';

// New Pipeline — static (lightweight routes)
import { ProjectContextPage } from './new/routes/ProjectContextPage';
import { OnboardingEntry } from './new/routes/onboarding/OnboardingEntry';
import { ProjectsPage } from './new/routes/ProjectsPage';
import { SettingsPage } from './features/settings';
import { PricingPage } from './new/routes/PricingPage';
import { BlueprintGalleryPage } from './new/routes/BlueprintGalleryPage';
import { TermsPage } from './new/routes/TermsPage';
import { PrivacyPage } from './new/routes/PrivacyPage';
import { ToastContainer } from './new/components/Toast';
import { WorkspaceShellDemo } from './new/routes/WorkspaceShellDemo';
import { ConnectionIndicator } from './components/ConnectionIndicator';

// Heavy routes — lazy-loaded so their chunks (monaco, xyflow, recharts) are
// not included in the main bundle download for users on lightweight routes.
const WorkspacePage = lazy(() =>
  import('./new/routes/WorkspacePage').then(m => ({ default: m.WorkspacePage }))
);
const CoherenceScanPage = lazy(() => import('./new/routes/CoherenceScanPage'));
const MetricsDashboard = lazy(() =>
  import('./pages/Admin/MetricsDashboard').then(m => ({ default: m.MetricsDashboard }))
);

// Fallback shown while heavy chunks load
const RouteLoader = () => (
  <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
    <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-zinc-400 animate-spin" />
  </div>
);

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
                      <Route path="/admin/metrics" element={<Suspense fallback={<RouteLoader />}><MetricsDashboard /></Suspense>} />
                    </Route>



                    {/* Streamlined Onboarding Flow */}
                    <Route
                      path="/new"
                      element={
                        <ProtectedRoute>
                          <OnboardingEntry />
                        </ProtectedRoute>
                      }
                    />

                    {/* Legacy Onboarding (kept for compatibility) */}
                    <Route
                      path="/onboarding/new-project"
                      element={
                        <ProtectedRoute>
                          <Navigate to="/new?mode=detailed" replace />
                        </ProtectedRoute>
                      }
                    />

                    {/* ============================================ */}
                    {/* NEW PIPELINE ROUTES */}
                    {/* ============================================ */}

                    <Route
                      path="/p/:projectId/spread"
                      element={<Navigate replace to="../workspace" />}
                    />

                    <Route
                      path="/p/:projectId/workspace"
                      element={
                        <ProtectedRoute>
                          <Suspense fallback={<RouteLoader />}>
                            <WorkspacePage />
                          </Suspense>
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

                    {/* Legacy production route - redirect to workspace */}
                    <Route
                      path="/p/:projectId/production"
                      element={<Navigate to="../workspace" replace />}
                    />

                    {/* Coherence Scan */}
                    <Route
                      path="/coherence-scan"
                      element={
                        <ProtectedRoute>
                          <Suspense fallback={<RouteLoader />}>
                            <CoherenceScanPage />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/coherence-scan/:scanId"
                      element={
                        <ProtectedRoute>
                          <Suspense fallback={<RouteLoader />}>
                            <CoherenceScanPage />
                          </Suspense>
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
                    
                    {/* Admin Routes */}
                    <Route
                      path="/admin/metrics"
                      element={
                        <ProtectedRoute>
                          <Suspense fallback={<RouteLoader />}>
                            <MetricsDashboard />
                          </Suspense>
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
                  {/* Global connection status indicator */}
                  <div className="fixed top-4 right-4 z-[9998]">
                    <ConnectionIndicator />
                  </div>
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
