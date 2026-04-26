import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Upload, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/** App-wide footer — copyright + admin/imports/guide links. */
const Footer: React.FC = () => {
  const { hasRole } = useAuth();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground text-center sm:text-left">
            © {year} APT Coach · Applied Practical Thinking
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs">
            <Link
              to="/admin?tab=imports"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Upload className="h-3.5 w-3.5" /> Imports
            </Link>
            <Link
              to="/user-guide"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5" /> User Guide
            </Link>
            {hasRole('admin') && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Shield className="h-3.5 w-3.5" /> Admin
              </Link>
            )}
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
