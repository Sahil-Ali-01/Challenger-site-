import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import {
  Trophy,
  User,
  LayoutDashboard,
  Settings,
  LogOut,
  Brain,
  Menu,
  X,
  ExternalLink,
  Swords,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Logged out successfully');
      navigate('/');
    }
  };

  const username = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'User';

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Quiz', icon: Brain, path: '/quiz' },
    { label: '1v1 Battle', icon: Swords, path: '/battle' },
    { label: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
    { label: 'Profile', icon: User, path: '/user/me' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-primary rounded-lg group-hover:rotate-12 transition-transform">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Biharicoder<span className="text-primary text-2xl leading-none">.</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary flex items-center gap-2",
                  location.pathname === item.path ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
            <div className="h-6 w-px bg-white/10 mx-2" />
            
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : session ? (
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            ) : (
              <Button variant="outline" size="sm" asChild className="glass-button">
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-background p-4 flex flex-col gap-4 animate-in slide-in-from-top duration-300">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "text-base font-medium flex items-center gap-3 p-2 rounded-lg",
                  location.pathname === item.path ? "bg-primary/10 text-primary" : "text-muted-foreground"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
            
            {session ? (
              <Button variant="destructive" className="w-full" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            ) : (
              <Button className="w-full" asChild>
                <Link to="/auth" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
              </Button>
            )}
          </div>
        )}
      </nav>

      <main className="container mx-auto px-4 py-8 relative">
        {/* Background blobs for aesthetics */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/20 rounded-full blur-[128px] -z-10 pointer-events-none" />
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px] -z-10 pointer-events-none" />
        
        {children}
      </main>

      {/* Hire Banner (Sticky Bottom Right for conversion) */}
      <div className="fixed bottom-6 right-6 z-40 max-w-sm">
        <div className="glass-card p-4 rounded-xl flex items-center gap-4 group">
          <div className="p-3 bg-indigo-600 rounded-lg group-hover:scale-110 transition-transform">
            <ExternalLink className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-indigo-400 mb-1">PRO SERVICE</p>
            <p className="text-sm font-medium leading-tight mb-2">Need a website or AI solution for your business?</p>
            <Button size="sm" className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white border-none" asChild>
              <a href="https://biharicoder.com" target="_blank" rel="noopener noreferrer">Hire Biharicoder</a>
            </Button>
          </div>
        </div>
      </div>

      <footer className="border-t border-white/5 py-12 mt-20">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-2">
             <Link to="/" className="flex items-center gap-2 mb-4">
              <Brain className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold tracking-tight">Biharicoder.</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-xs">
              The ultimate gamified platform for developers to master programming, AI, and system design through daily challenges.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/quiz" className="hover:text-primary">Quizzes</Link></li>
              <li><Link to="/battle" className="hover:text-primary">1v1 Battle</Link></li>
              <li><Link to="/leaderboard" className="hover:text-primary">Leaderboard</Link></li>
              <li><Link to="/dashboard" className="hover:text-primary">Daily Challenge</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary">Twitter</a></li>
              <li><a href="#" className="hover:text-primary">GitHub</a></li>
              <li><a href="https://biharicoder.com" className="hover:text-primary">Official Website</a></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Biharicoder. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
