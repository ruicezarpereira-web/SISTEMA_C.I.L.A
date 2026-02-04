import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Servidores from "@/pages/Servidores";
import ServidorDetalhes from "@/pages/ServidorDetalhes";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes with layout */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/servidores" element={<Servidores />} />
            <Route path="/servidores/:matricula" element={<ServidorDetalhes />} />
            <Route path="/processos" element={<Dashboard />} />
            <Route path="/documentos" element={<Dashboard />} />
            <Route path="/documentos/certidoes" element={<Dashboard />} />
            <Route path="/documentos/portarias" element={<Dashboard />} />
            <Route path="/documentos/mapas" element={<Dashboard />} />
            <Route path="/configuracoes" element={<Dashboard />} />
            <Route path="/logs" element={<Dashboard />} />
            <Route path="/usuarios" element={<Dashboard />} />
          </Route>
          
          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
