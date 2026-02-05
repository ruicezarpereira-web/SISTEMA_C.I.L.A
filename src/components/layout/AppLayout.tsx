 import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
 import { useAuth } from "@/contexts/AuthContext";

export function AppLayout() {
   const { profile, role, signOut, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-background">
       <Sidebar isAdmin={isAdmin} onLogout={signOut} />
      
      <div className="pl-64">
        <Header
           userName={profile?.nome || 'Usuário'}
           userRole={role || 'rh'}
           onLogout={signOut}
        />
        
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
