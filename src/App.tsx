import { Component, type ErrorInfo, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { ToastProvider } from "@/features/toast/ToastProvider";

// import Index from "./pages/Index"; // Landing page — not used yet
import Login from "./pages/Login";
import OnboardingPage from "./pages/OnboardingPage";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
// Templates page removed — will be reimplemented
// import Templates from "./pages/Templates";
import { WizardPage } from "@/features/editor/wizard/WizardPage";
import StudioPage from "@/app/create/StudioPage";
import RefinementPage from "./pages/RefinementPage";
import Billing from "./pages/Billing";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import AppShell from "./components/AppShell";
import { SupportChat } from "./components/SupportChat";
import NotFound from "./pages/NotFound";
import { AdminRoute } from "@/features/admin/AdminRoute";
import { AdminShell } from "@/features/admin/AdminShell";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminFinance from "./pages/admin/AdminFinance";
import AdminGenerations from "./pages/admin/AdminGenerations";
import AdminTokens from "./pages/admin/AdminTokens";

// ── Error Boundary — exibe erro real em vez de tela branca ──────────────────
class AppErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[AppErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: "monospace", color: "#DC2626", background: "#FAFAF8", minHeight: "100vh" }}>
          <h1 style={{ fontSize: 20, marginBottom: 16 }}>Erro na aplicação</h1>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, color: "#991B1B" }}>
            {this.state.error.message}
          </pre>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 11, color: "#6B7280", marginTop: 12 }}>
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 24, padding: "8px 16px", background: "#F97316", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient();

const App = () => (
  <AppErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Root → login (if not authenticated, ProtectedRoute redirects) */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/onboarding" element={<OnboardingPage />} />

                {/* All /app/* routes are protected — require active Supabase session */}
                <Route path="/app" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="projects" element={<Projects />} />
                  <Route path="create" element={<WizardPage />} />
                  <Route path="create/studio" element={<StudioPage />} />
                  <Route path="refine/:id" element={<RefinementPage />} />
                  <Route path="billing" element={<Billing />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="help" element={<Help />} />
                </Route>

                {/* Admin routes — isolated from /app, own layout + guard */}
                <Route path="/admin" element={<AdminRoute><AdminShell /></AdminRoute>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="finance" element={<AdminFinance />} />
                  <Route path="generations" element={<AdminGenerations />} />
                  <Route path="tokens" element={<AdminTokens />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            <SupportChat />
          </TooltipProvider>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </AppErrorBoundary>
);

export default App;
