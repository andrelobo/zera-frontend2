import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import AppSidebar from '@/components/AppSidebar';
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
  const { user, logout } = useAuth();
  const displayName = user?.name || user?.email || 'Usuário';
  const initials = getInitials(user?.name, user?.email);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-14 items-center border-b px-4 lg:px-6">
            <SidebarTrigger />
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-md border px-2 py-1 hover:bg-accent"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[11px] font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline max-w-[180px] truncate text-sm">
                      {displayName}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
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
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-thin">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
