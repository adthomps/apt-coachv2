import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { User, LogOut, Dumbbell, Menu, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps { children: React.ReactNode; }

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/training', label: 'Training' },
    { path: '/schedule', label: 'Schedule' },
    { path: '/health', label: 'Health Data' },
    ...(hasRole('admin') ? [{ path: '/admin', label: 'Admin' }] : []),
  ];

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Dumbbell className="h-4 w-4 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">APT Coach</h1>
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium transition-colors ${
                    isActive(item.path) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm"><Menu className="h-5 w-5" /></Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center space-x-2 pb-4 border-b border-border">
                      <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                        <Dumbbell className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <h2 className="text-lg font-bold text-foreground">APT Coach</h2>
                    </div>
                    <nav className="flex-1 py-6 space-y-2">
                      {navItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                            isActive(item.path)
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </nav>
                    <div className="border-t border-border pt-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{user?.name}</p>
                          <p className="text-xs text-muted-foreground">{user?.email}</p>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full" onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />Sign Out
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium text-foreground hidden lg:block">{user?.name}</span>
              </div>
              <Link to="/settings"><Button variant="ghost" size="sm"><Settings className="h-4 w-4" /></Button></Link>
              <Button variant="ghost" size="sm" onClick={logout}><LogOut className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">{children}</main>
    </div>
  );
};

export default Layout;
