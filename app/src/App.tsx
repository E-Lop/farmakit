import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Dashboard } from "@/pages/Dashboard";
import { Login } from "@/pages/Login";
import { Scan } from "@/pages/Scan";
import { AddMedicine } from "@/pages/AddMedicine";
import { Cabinets } from "@/pages/Cabinets";
import { Settings } from "@/pages/Settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/add" element={<AddMedicine />} />
          <Route path="/cabinets" element={<Cabinets />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
