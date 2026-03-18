import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider, dehydrate, hydrate } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import Dash2Page from "@/pages/Dash2Page";
import GestorAiPage from "@/pages/GestorAiPage";
import MyAccountPage from "@/pages/MyAccountPage";
import NfseListPage from "@/pages/NfseListPage";
import NfseDetailPage from "@/pages/NfseDetailPage";
import NfseEmitPage from "@/pages/NfseEmitPage";
import NfseQuickEmitPage from "@/pages/NfseQuickEmitPage";
import EmpresasPage from "@/pages/EmpresasPage";
import EmpresaFormPage from "@/pages/EmpresaFormPage";
import TomadoresPage from "@/pages/TomadoresPage";
import TomadorFormPage from "@/pages/TomadorFormPage";
import CertificadoDigitalPage from "@/pages/CertificadoDigitalPage";
import UsersPage from "@/pages/UsersPage";
import UserFormPage from "@/pages/UserFormPage";
import NotFound from "@/pages/NotFound";
import { ThemeProvider } from "@/components/theme-provider";

const DASHBOARD_CACHE_STORAGE_KEY = "zera_dashboard_cache_v1";
const DASHBOARD_CACHE_MAX_AGE_MS = 1000 * 60 * 15;

const isDashboardQueryKey = (queryKey: readonly unknown[]) => {
  const [first, second] = queryKey;

  if (first === 'nfse-dashboard-bi-summary-v1' || first === 'nfse-dashboard-list-v3') {
    return true;
  }

  if (first === 'empresas' && (second === 'dashboard-header' || second === 'gestor-ai-header')) {
    return true;
  }

  if (first === 'nfse' && (second === 'dashboard-rbt12' || second === 'gestor-ai-rbt12')) {
    return true;
  }

  return false;
};

const loadDashboardCache = () => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(DASHBOARD_CACHE_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { timestamp?: number; state?: unknown };
    if (!parsed?.timestamp || !parsed?.state) return null;

    if (Date.now() - parsed.timestamp > DASHBOARD_CACHE_MAX_AGE_MS) {
      window.localStorage.removeItem(DASHBOARD_CACHE_STORAGE_KEY);
      return null;
    }

    return parsed.state;
  } catch {
    return null;
  }
};

const saveDashboardCache = (client: QueryClient) => {
  if (typeof window === 'undefined') return;

  try {
    const state = dehydrate(client, {
      shouldDehydrateQuery: (query) => isDashboardQueryKey(query.queryKey),
    });

    window.localStorage.setItem(
      DASHBOARD_CACHE_STORAGE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        state,
      }),
    );
  } catch {
    // best-effort persistence only
  }
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

const persistedDashboardState = loadDashboardCache();
if (persistedDashboardState) {
  hydrate(queryClient, persistedDashboardState);
}

const Router = import.meta.env.VITE_ROUTER_MODE === "hash" ? HashRouter : BrowserRouter;

const QueryPersistenceBridge = () => {
  useEffect(() => {
    let timeoutId: number | null = null;

    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      if (typeof window === 'undefined') return;
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        saveDashboardCache(queryClient);
      }, 250);
    });

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <QueryPersistenceBridge />
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Router>
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
                <Route path="/dash2" element={<Dash2Page />} />
                <Route path="/gestor-ai" element={<GestorAiPage />} />
                <Route path="/account" element={<MyAccountPage />} />
                <Route path="/nfse" element={<NfseListPage />} />
                <Route path="/nfse/nova" element={<NfseEmitPage />} />
                <Route path="/nfse/rapida" element={<NfseQuickEmitPage />} />
                <Route path="/nfse/:id" element={<NfseDetailPage />} />
                <Route path="/empresas" element={<EmpresasPage />} />
                <Route path="/empresas/nova" element={<EmpresaFormPage />} />
                <Route path="/empresas/:id" element={<EmpresaFormPage />} />
                <Route path="/tomadores" element={<TomadoresPage />} />
                <Route path="/tomadores/novo" element={<TomadorFormPage />} />
                <Route path="/tomadores/:id" element={<TomadorFormPage />} />
                <Route path="/certificado-digital" element={<CertificadoDigitalPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/users/novo" element={<UserFormPage />} />
                <Route path="/users/:id" element={<UserFormPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
