import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/features/auth/fake-auth";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import EditorPage from "@/features/editor/EditorPage";
import { WizardPage } from "@/features/editor/wizard/WizardPage";
import Billing from "./pages/Billing";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import AppShell from "./components/AppShell";
import NotFound from "./pages/NotFound";

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

              <Route path="/app" element={<AppShell />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="projects" element={<Projects />} />
                <Route path="projects/:id" element={<EditorPage />} />
                <Route path="create" element={<WizardPage />} />
                <Route path="billing" element={<Billing />} />
                <Route path="settings" element={<Settings />} />
                <Route path="help" element={<Help />} />
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