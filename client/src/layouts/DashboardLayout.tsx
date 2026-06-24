import React, { useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  FileUp,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FileUp, label: 'Upload Report', path: '/upload' },
    { icon: History, label: 'Report History', path: '/history' },
  ];

  if (user.role === 'admin') {
    menuItems.push(
      { icon: Settings, label: 'Admin Dashboard', path: '/admin/dashboard' },
      { icon: Settings, label: 'Rules Management', path: '/rules' }
    );
  } else {
    menuItems.push({ icon: Settings, label: 'Rules', path: '/rules' });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } bg-card border-r w-64`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold">MIS Report Extractor</h1>
            <p className="text-sm text-muted-foreground mt-1">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-muted transition-colors"
              >
                <item.icon className="h-5 w-5 mr-3" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={toggleDarkMode}
            >
              {darkMode ? (
                <>
                  <Sun className="h-5 w-5 mr-3" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="h-5 w-5 mr-3" />
                  Dark Mode
                </>
              )}
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`${sidebarOpen ? 'ml-64' : 'ml-0'} transition-all`}>
        <header className="sticky top-0 z-30 bg-card border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <div className="flex items-center gap-4">
              <span className="text-sm">
                <span className="font-medium">Role:</span>{' '}
                <span className="text-primary capitalize">{user.role}</span>
              </span>
            </div>
          </div>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
