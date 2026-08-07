import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bank,
  Buildings,
  ClipboardText,
  House,
  Receipt,
  SlidersHorizontal,
  UsersThree,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
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
import { useAuth } from '@/contexts/AuthContext';
import { isReadOnlyRole } from '@/lib/roles';
import BrandLogo from '@/components/BrandLogo';

type ActiveTab = 'dashboard' | 'prestador' | 'tomador' | 'emissao';
type PrestadorSubTab = 'cadastro' | 'regime' | 'parametros';

const prestadorSubItems: Array<{
  key: PrestadorSubTab;
  label: string;
  icon: PhosphorIcon;
}> = [
  { key: 'cadastro', label: 'Dados cadastrais', icon: ClipboardText },
  { key: 'regime', label: 'Regime tributário', icon: Bank },
  { key: 'parametros', label: 'Parâmetros fiscais', icon: SlidersHorizontal },
];

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { user } = useAuth();
  const isCollapsed = state === 'collapsed';
  const isReadOnly = isReadOnlyRole(user?.role || 'user');

  const activeTab = useMemo<ActiveTab>(() => {
    if (location.pathname === '/') return 'dashboard';
    if (location.pathname.startsWith('/dash2')) return 'dashboard';
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
        <BrandLogo
          size="sm"
          inverse
          markOnly={isCollapsed}
          className={isCollapsed ? 'justify-center' : undefined}
        />
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
                  tooltip="Visão geral"
                  className={
                    activeTab === 'dashboard'
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground'
                      : ''
                  }
                >
                  <House className="h-4 w-4" weight="duotone" />
                  <span>Visão geral</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeTab === 'prestador'}
                  onClick={goPrestador}
                  tooltip="Empresas"
                  className={
                    activeTab === 'prestador'
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground'
                      : ''
                  }
                >
                  <Buildings className="h-4 w-4" weight="duotone" />
                  <span>Empresas</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {activeTab === 'prestador' && !isCollapsed && !isReadOnly && (
                <div className="ml-4 border-l border-sidebar-border pl-2 space-y-0.5">
                  {prestadorSubItems.map((sub) => {
                    const SubIcon = sub.icon;
                    return (
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
                        <SubIcon className="h-3.5 w-3.5" weight="regular" />
                        <span>{sub.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    );
                  })}
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
                  <UsersThree className="h-4 w-4" weight="duotone" />
                  <span>Tomadores</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeTab === 'emissao'}
                  onClick={goEmissao}
                  tooltip="Operação fiscal"
                  className={
                    activeTab === 'emissao'
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground'
                      : ''
                  }
                >
                  <Receipt className="h-4 w-4" weight="duotone" />
                  <span>Operação fiscal</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!isCollapsed && (
          <p className="text-[9px] text-sidebar-foreground/40 text-center">
            Uma solução<br />Muirakitan Tecnologia
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
