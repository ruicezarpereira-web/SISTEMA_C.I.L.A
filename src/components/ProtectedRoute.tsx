import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  allowPasswordChange?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false, allowPasswordChange = false }: ProtectedRouteProps) {
  const { user, role, isLoading, deveTrocarSenha } = useAuth();
  const location = useLocation();
 
   if (isLoading) {
     return (
       <div className="min-h-screen flex items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
   }
 
   if (!user) {
     return <Navigate to="/login" state={{ from: location }} replace />;
   }
 
   // Check if user has any role
   if (!role) {
     return (
       <div className="min-h-screen flex items-center justify-center p-4">
         <div className="text-center">
           <h1 className="text-2xl font-bold text-destructive mb-2">Acesso Negado</h1>
           <p className="text-muted-foreground">
             Sua conta não possui permissão para acessar o sistema.
             Entre em contato com o administrador.
           </p>
         </div>
       </div>
     );
   }
 
  if (requireAdmin && role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground">
            Esta funcionalidade requer permissão de administrador.
          </p>
        </div>
      </div>
    );
  }

  // Redirect to password change if required (except for the password change page itself)
  if (deveTrocarSenha && !allowPasswordChange && location.pathname !== '/trocar-senha') {
    return <Navigate to="/trocar-senha" replace />;
  }

  return <>{children}</>;
}