import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  Receipt,
  FileText,
  Landmark,
  Settings,
  ClipboardList,
  LayoutDashboard,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

type ActiveTab = 'dashboard' | 'gestorAi' | 'prestador' | 'tomador' | 'emissao';
type PrestadorSubTab = 'cadastro' | 'regime' | 'parametros';

const prestadorSubItems = [
  { key: 'cadastro' as PrestadorSubTab, label: 'Dados Cadastrais', icon: ClipboardList },
  { key: 'regime' as PrestadorSubTab, label: 'Regime Tributário', icon: Landmark },
  { key: 'parametros' as PrestadorSubTab, label: 'Parâmetros Fiscais', icon: Settings },
];

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const activeTab = useMemo<ActiveTab>(() => {
    if (location.pathname === '/') return 'dashboard';
    if (location.pathname.startsWith('/gestor-ai')) return 'gestorAi';
    if (location.pathname.startsWith('/empresas')) return 'prestador';
    if (location.pathname.startsWith('/tomadores')) return 'tomador';
    if (location.pathname.startsWith('/nfse')) return 'emissao';
    return 'dashboard';
  }, [location.pathname]);

  const prestadorSubTab = useMemo<PrestadorSubTab>(() => {
    const secao = new URLSearchParams(location.search).get('secao');
    if (secao === 'regime' || secao === 'parametros' || secao === 'cadastro') {
      return secao;
    }
    return 'cadastro';
  }, [location.search]);

  const closeMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  const goDashboard = () => {
    navigate('/');
    closeMobile();
  };

  const goPrestador = () => {
    navigate('/empresas');
    closeMobile();
  };

  const goGestorAi = () => {
    navigate('/gestor-ai');
    closeMobile();
  };

  const goPrestadorSub = (sub: PrestadorSubTab) => {
    const isFormPath = /^\/empresas\/([^/]+)$/.test(location.pathname);
    const basePath = isFormPath ? location.pathname : '/empresas/nova';
    navigate(`${basePath}?secao=${sub}`);
    closeMobile();
  };

  const goTomador = () => {
    navigate('/tomadores');
    closeMobile();
  };

  const goEmissao = () => {
    navigate('/nfse');
    closeMobile();
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center">
          <span className="text-sm font-bold text-sidebar-foreground leading-tight">
            Skale IA
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
                  isActive={activeTab === 'dashboard'}
                  onClick={goDashboard}
                  tooltip="Dashboard"
                  className={
                    activeTab === 'dashboard'
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
                  isActive={activeTab === 'gestorAi'}
                  onClick={goGestorAi}
                  tooltip="Gestor AI"
                  className={
                    activeTab === 'gestorAi'
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground'
                      : ''
                  }
                >
                  <FileText className="w-4 h-4" />
                  <span>Gestor AI</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeTab === 'prestador'}
                  onClick={goPrestador}
                  tooltip="O Prestador"
                  className={
                    activeTab === 'prestador'
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground'
                      : ''
                  }
                >
                  <Building2 className="w-4 h-4" />
                  <span>O Prestador</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {activeTab === 'prestador' && !isCollapsed && (
                <div className="ml-4 border-l border-sidebar-border pl-2 space-y-0.5">
                  {prestadorSubItems.map((sub) => (
                    <SidebarMenuItem key={sub.key}>
                      <SidebarMenuButton
                        isActive={prestadorSubTab === sub.key}
                        onClick={() => goPrestadorSub(sub.key)}
                        tooltip={sub.label}
                        className={`text-xs ${
                          prestadorSubTab === sub.key
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
                  isActive={activeTab === 'tomador'}
                  onClick={goTomador}
                  tooltip="Tomadores"
                  className={
                    activeTab === 'tomador'
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
                  isActive={activeTab === 'emissao'}
                  onClick={goEmissao}
                  tooltip="DANFSE"
                  className={
                    activeTab === 'emissao'
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground'
                      : ''
                  }
                >
                  <Receipt className="w-4 h-4" />
                  <span>DANFSE</span>
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
};

export default AppSidebar;
