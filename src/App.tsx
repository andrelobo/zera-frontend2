import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import MyAccountPage from "@/pages/MyAccountPage";
import NfseListPage from "@/pages/NfseListPage";
import NfseDetailPage from "@/pages/NfseDetailPage";
import NfseEmitPage from "@/pages/NfseEmitPage";
import EmpresasPage from "@/pages/EmpresasPage";
import EmpresaFormPage from "@/pages/EmpresaFormPage";
import UsersPage from "@/pages/UsersPage";
import UserFormPage from "@/pages/UserFormPage";
import NotFound from "@/pages/NotFound";
import { ThemeProvider } from "@/components/theme-provider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<DashboardPage />} />
                <Route path="/account" element={<MyAccountPage />} />
                <Route path="/nfse" element={<NfseListPage />} />
                <Route path="/nfse/nova" element={<NfseEmitPage />} />
                <Route path="/nfse/:id" element={<NfseDetailPage />} />
                <Route path="/empresas" element={<EmpresasPage />} />
                <Route path="/empresas/nova" element={<EmpresaFormPage />} />
                <Route path="/empresas/:id" element={<EmpresaFormPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/users/novo" element={<UserFormPage />} />
                <Route path="/users/:id" element={<UserFormPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
