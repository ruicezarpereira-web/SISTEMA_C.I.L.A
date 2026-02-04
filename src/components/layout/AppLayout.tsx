import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AppLayout() {
  const navigate = useNavigate();
  
  // Mock user data - will be replaced with real auth
  const user = {
    nome: "Admin TRANSALVADOR",
    role: 'admin' as const,
  };

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isAdmin={user.role === 'admin'} onLogout={handleLogout} />
      
      <div className="pl-64">
        <Header
          userName={user.nome}
          userRole={user.role}
          onLogout={handleLogout}
        />
        
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
