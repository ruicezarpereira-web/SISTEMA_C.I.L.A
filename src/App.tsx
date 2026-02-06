import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import TrocarSenha from "@/pages/TrocarSenha";
import Dashboard from "@/pages/Dashboard";
import Servidores from "@/pages/Servidores";
import ServidorDetalhes from "@/pages/ServidorDetalhes";
import Processos from "@/pages/Processos";
import ImportarDados from "@/pages/ImportarDados";
import Configuracoes from "@/pages/Configuracoes";
import Usuarios from "@/pages/Usuarios";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Password change route (protected but allows password change) */}
            <Route path="/trocar-senha" element={
              <ProtectedRoute allowPasswordChange>
                <TrocarSenha />
              </ProtectedRoute>
            } />
            
            {/* Protected routes with layout */}
            <Route element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/servidores" element={<Servidores />} />
              <Route path="/servidores/:matricula" element={<ServidorDetalhes />} />
              <Route path="/processos" element={<Processos />} />
              <Route path="/importar" element={
                <ProtectedRoute requireAdmin>
                  <ImportarDados />
                </ProtectedRoute>
              } />
              <Route path="/configuracoes" element={
                <ProtectedRoute requireAdmin>
                  <Configuracoes />
                </ProtectedRoute>
              } />
              <Route path="/usuarios" element={
                <ProtectedRoute requireAdmin>
                  <Usuarios />
                </ProtectedRoute>
              } />
            </Route>
            
            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
