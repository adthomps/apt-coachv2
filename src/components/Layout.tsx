import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { User, LogOut, Dumbbell, Menu, Settings as SettingsIcon, BookOpen, IdCard } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import UserMenu from '@/components/UserMenu';
import Footer from '@/components/Footer';

interface LayoutProps { children: React.ReactNode; }

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Admin moved to the footer (role-gated). Main nav is product surfaces only.
  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/training', label: 'Training' },
    { path: '/schedule', label: 'Schedule' },
    { path: '/health', label: 'Health Data' },
  ];

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
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
                    <div className="border-t border-border pt-4 space-y-1">
                      <div className="flex items-center space-x-3 px-1 mb-3">
                        <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </div>
                      </div>
                      <Link to="/settings" onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted">
                        <IdCard className="mr-2 h-4 w-4" /> Profile
                      </Link>
                      <Link to="/settings" onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted">
                        <SettingsIcon className="mr-2 h-4 w-4" /> Settings
                      </Link>
                      <Link to="/user-guide" onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted">
                        <BookOpen className="mr-2 h-4 w-4" /> User Guide
                      </Link>
                      <Button variant="outline" className="w-full mt-2" onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" /> Sign Out
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="hidden md:flex items-center">
              <UserMenu />
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
