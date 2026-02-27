import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  ChevronDown,
  Landmark,
  LayoutDashboard,
  LogOut,
  Receipt,
  Settings,
  User,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ThemeToggle from '@/components/ThemeToggle';
import ResumoTributario from '@/components/ResumoTributario';
import { calcularSimplesAnexoIII } from '@/utils/simples-nacional';

type ActiveModule = 'dashboard' | 'prestador' | 'tomador' | 'emissao' | 'usuarios';
type PrestadorSubItem = 'cadastro' | 'regime' | 'parametros';

const prestadorSubItems: Array<{ key: PrestadorSubItem; label: string; icon: typeof Building2; to: string }> = [
  { key: 'cadastro', label: 'Dados Cadastrais', icon: Building2, to: '/empresas/nova?secao=cadastro' },
  { key: 'regime', label: 'Regime Tributário', icon: Landmark, to: '/empresas/nova?secao=regime' },
  { key: 'parametros', label: 'Parâmetros Fiscais', icon: Settings, to: '/empresas/nova?secao=parametros' },
];

function getActiveModule(pathname: string): ActiveModule {
  if (pathname === '/') return 'dashboard';
  if (pathname.startsWith('/empresas')) return 'prestador';
  if (pathname.startsWith('/tomadores')) return 'tomador';
  if (pathname.startsWith('/users') || pathname.startsWith('/account')) return 'usuarios';
  return 'emissao';
}

function getActivePrestadorSubItem(pathname: string, search: string): PrestadorSubItem {
  if (pathname.startsWith('/empresas')) {
    const section = new URLSearchParams(search).get('secao');
    if (section === 'regime') return 'regime';
    if (section === 'parametros') return 'parametros';
    return 'cadastro';
  }
  return 'cadastro';
}

function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile, setOpenMobile, state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const activeModule = getActiveModule(location.pathname);
  const activePrestadorSubItem = getActivePrestadorSubItem(location.pathname, location.search);

  const navigateTo = (to: string) => {
    navigate(to);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center">
          <span className="text-sm font-bold text-sidebar-foreground leading-tight">
            Skalë Software
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase text-[10px] tracking-widest">
            Módulos
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeModule === 'dashboard'}
                  onClick={() => navigateTo('/')}
                  tooltip="Dashboard"
                  className={
                    activeModule === 'dashboard'
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground'
                      : ''
                  }
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeModule === 'prestador'}
                  onClick={() => navigateTo('/empresas/nova')}
                  tooltip="O Prestador"
                  className={
                    activeModule === 'prestador'
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground'
                      : ''
                  }
                >
                  <Building2 className="w-4 h-4" />
                  <span>O Prestador</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {activeModule === 'prestador' && !isCollapsed && (
                <div className="ml-4 border-l border-sidebar-border pl-2 space-y-0.5">
                  {prestadorSubItems.map((sub) => (
                    <SidebarMenuItem key={sub.key}>
                      <SidebarMenuButton
                        isActive={activePrestadorSubItem === sub.key}
                        onClick={() => navigateTo(sub.to)}
                        tooltip={sub.label}
                        className={`text-xs ${
                          activePrestadorSubItem === sub.key
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                            : 'text-sidebar-foreground/70'
                        }`}
                      >
                        <sub.icon className="w-3.5 h-3.5" />
                        <span>{sub.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </div>
              )}

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeModule === 'tomador'}
                  onClick={() => navigateTo('/tomadores')}
                  tooltip="Tomadores"
                  className={
                    activeModule === 'tomador'
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground'
                      : ''
                  }
                >
                  <Users className="w-4 h-4" />
                  <span>Tomadores</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeModule === 'emissao'}
                  onClick={() => navigateTo('/nfse/nova')}
                  tooltip="DANFSE"
                  className={
                    activeModule === 'emissao'
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground'
                      : ''
                  }
                >
                  <Receipt className="w-4 h-4" />
                  <span>DANFSE</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeModule === 'usuarios'}
                  onClick={() => navigateTo('/users')}
                  tooltip="Usuários"
                  className={
                    activeModule === 'usuarios'
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground'
                      : ''
                  }
                >
                  <Users className="w-4 h-4" />
                  <span>Usuários</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!isCollapsed && (
          <p className="text-[9px] text-sidebar-foreground/40 text-center">
            Portal Nacional NFS-e
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isEmpresaRoute = location.pathname.startsWith('/empresas');
  const tickerRbt12 = 120000;
  const tickerCalculo = calcularSimplesAnexoIII(tickerRbt12, 'III');

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          {!isEmpresaRoute && (
            <header className="flex h-14 items-center border-b px-4 lg:px-6">
              <SidebarTrigger />
              <div className="ml-auto flex items-center gap-2">
                <ThemeToggle />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-accent transition-colors">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <span className="hidden sm:block max-w-36 truncate">
                        {user?.name || user?.email || 'Usuário'}
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate('/account')}>
                      <User className="mr-2 h-4 w-4" /> Minha Conta
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" /> Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>
          )}
          {!isEmpresaRoute && (
            <div className="px-4 lg:px-6 py-2">
              <ResumoTributario
                rbt12={tickerRbt12}
                cnaeAnexo="III"
                calculo={tickerCalculo}
                visible
              />
            </div>
          )}
          <main className={`flex-1 overflow-y-auto scrollbar-thin ${isEmpresaRoute ? '' : 'p-4 lg:p-6'}`}>
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
