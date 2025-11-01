import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { useUIStore } from '../store/ui.store';
import { Button } from '../components/ui/button';
import { Menu, Bell, LogOut, Calendar, LayoutDashboard, List, Focus, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);
  const viewMode = useUIStore((state) => state.viewMode);
  const setViewMode = useUIStore((state) => state.setViewMode);

  const { data: reminders } = useQuery({
    queryKey: ['reminders'],
    queryFn: () => api.getReminders(),
    refetchInterval: 30000, // Poll every 30s
    retry: false,
  });

  const handleLogout = async () => {
    await api.logout();
    clearAuth();
    navigate('/login');
  };

  const navItems = [
    { id: 'tasks', label: 'Tasks', icon: List, path: '/app/tasks' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, path: '/app/calendar' },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/app/dashboard' },
    { id: 'focus', label: 'Focus Mode', icon: Focus, path: '/app/focus' },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    setViewMode(item.id as any);
    navigate(item.path);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } transition-all duration-300 border-r bg-card overflow-hidden flex flex-col`}
      >
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">To-Do App</h1>
          <p className="text-sm text-muted-foreground truncate">{user?.name}</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-2 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 border-b bg-card flex items-center justify-between px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative group">
              <Bell className="h-5 w-5" />
              {reminders && reminders.reminders.length > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
              )}
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

