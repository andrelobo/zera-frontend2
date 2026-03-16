import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import AppSidebar from '@/components/AppSidebar';
import GlobalTicker from '@/components/GlobalTicker';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, LogOut, User } from 'lucide-react';

const getInitials = (name?: string | null, email?: string | null) => {
  const source = (name || email || '').trim();
  if (!source) return 'SK';
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
};

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const displayName = user?.name || user?.email || 'Usuário';
  const initials = getInitials(user?.name, user?.email);
  const showGlobalTicker = location.pathname !== '/';

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-14 items-center border-b border-white/10 bg-[hsl(216,60%,16%)] px-4 text-white lg:px-6">
            <SidebarTrigger className="text-white hover:bg-white/10 hover:text-white/80" />
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-md border border-white/20 px-2 py-1 text-white hover:bg-white/10"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-white/15 text-[11px] font-semibold text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden max-w-[180px] truncate text-sm text-white sm:inline">
                      {displayName}
                    </span>
                    <ChevronDown className="h-4 w-4 text-white/70" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => navigate('/account')}>
                    <User className="mr-2 h-4 w-4" />
                    Minha Conta
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          {showGlobalTicker ? <GlobalTicker /> : null}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-thin">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
