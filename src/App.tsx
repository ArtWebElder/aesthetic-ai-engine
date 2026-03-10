import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/features/auth/AuthProvider";

import Index from "./pages/Index";
import Login from "./pages/Login";
import OnboardingPage from "./pages/OnboardingPage";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Templates from "./pages/Templates";
import { WizardPage } from "@/features/editor/wizard/WizardPage";
import StudioPage from "@/app/create/StudioPage";
import RefinementPage from "./pages/RefinementPage";
import Billing from "./pages/Billing";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import AppShell from "./components/AppShell";
import NotFound from "./pages/NotFound";
import { AdminRoute } from "@/features/admin/AdminRoute";
import { AdminShell } from "@/features/admin/AdminShell";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminFinance from "./pages/admin/AdminFinance";
import AdminGenerations from "./pages/admin/AdminGenerations";
import AdminTokens from "./pages/admin/AdminTokens";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/onboarding" element={<OnboardingPage />} />

              <Route path="/app" element={<AppShell />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="projects" element={<Projects />} />
                <Route path="templates" element={<Templates />} />
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
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
