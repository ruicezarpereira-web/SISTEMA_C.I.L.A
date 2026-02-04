import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  FolderOpen,
  Settings,
  ClipboardList,
  UserCog,
  LogOut,
  Award,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

interface SidebarProps {
  isAdmin?: boolean;
  onLogout: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  children?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Servidores", href: "/servidores", icon: Users },
  { label: "Processos", href: "/processos", icon: FolderOpen },
  {
    label: "Documentos",
    href: "/documentos",
    icon: FileText,
    children: [
      { label: "Certidões", href: "/documentos/certidoes" },
      { label: "Portarias", href: "/documentos/portarias" },
      { label: "Mapas de Cálculo", href: "/documentos/mapas" },
    ],
  },
  { label: "Configurações", href: "/configuracoes", icon: Settings, adminOnly: true },
  { label: "Logs", href: "/logs", icon: ClipboardList, adminOnly: true },
  { label: "Usuários", href: "/usuarios", icon: UserCog, adminOnly: true },
];

export function Sidebar({ isAdmin = false, onLogout }: SidebarProps) {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const filteredItems = navItems.filter(item => !item.adminOnly || isAdmin);

  const toggleMenu = (label: string) => {
    setOpenMenus(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/');

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
          <Award className="h-6 w-6 text-sidebar-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-sidebar-foreground">TRANSALVADOR</span>
          <span className="text-xs text-sidebar-foreground/60">Licenças Prêmio</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto h-[calc(100vh-8rem)]">
        {filteredItems.map((item) => {
          const Icon = item.icon;

          if (item.children) {
            return (
              <Collapsible
                key={item.label}
                open={openMenus.includes(item.label)}
                onOpenChange={() => toggleMenu(item.label)}
              >
                <CollapsibleTrigger asChild>
                  <button
                    className={cn(
                      "sidebar-item w-full justify-between",
                      isActive(item.href) && "sidebar-item-active"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        openMenus.includes(item.label) && "rotate-180"
                      )}
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-8 space-y-1 mt-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      to={child.href}
                      className={cn(
                        "sidebar-item text-sm",
                        isActive(child.href) && "sidebar-item-active"
                      )}
                    >
                      {child.label}
                    </Link>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          }

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "sidebar-item",
                isActive(item.href) && "sidebar-item-active"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-sidebar-border">
        <button
          onClick={onLogout}
          className="sidebar-item w-full text-destructive/80 hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-5 w-5" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
