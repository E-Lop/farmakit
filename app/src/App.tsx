import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { onlineManager } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { Dashboard } from "@/pages/Dashboard";
import { Login } from "@/pages/Login";
import { Scan } from "@/pages/Scan";
import { AddMedicine } from "@/pages/AddMedicine";
import { Cabinets } from "@/pages/Cabinets";
import { Settings } from "@/pages/Settings";
import { createIDBPersister } from "@/lib/queryPersister";
import { registerMutationDefaults } from "@/lib/mutationDefaults";
import { UpdateBanner } from "@/components/pwa/UpdateBanner";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";
import { RealtimeSyncProvider } from "@/components/pwa/RealtimeSyncProvider";

// Sincronizza React Query online manager con lo stato del browser
onlineManager.setEventListener((setOnline) => {
  const onlineHandler = () => setOnline(true);
  const offlineHandler = () => setOnline(false);
  window.addEventListener("online", onlineHandler);
  window.addEventListener("offline", offlineHandler);
  return () => {
    window.removeEventListener("online", onlineHandler);
    window.removeEventListener("offline", offlineHandler);
  };
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      gcTime: 1000 * 60 * 60 * 24, // 24h — allineato a maxAge del persister
    },
    mutations: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Ri-attacca le mutationFn dopo un reload (le funzioni non sono serializzabili)
registerMutationDefaults(queryClient);

const persister = createIDBPersister();
const PERSIST_MAX_AGE = 1000 * 60 * 60 * 24; // 24h

export function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: PERSIST_MAX_AGE }}
    >
      <BrowserRouter>
        <AuthProvider>
          <RealtimeSyncProvider />
          <UpdateBanner />
          <OfflineBanner />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/scan" element={<Scan />} />
              <Route path="/add" element={<AddMedicine />} />
              <Route path="/cabinets" element={<Cabinets />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <InstallPrompt />
      <Toaster />
    </PersistQueryClientProvider>
  );
}
