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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check localStorage for custom auth
    const loggedInStatus = localStorage.getItem('isLoggedIn') === 'true';
    const userData = localStorage.getItem('user');
    
    setIsLoggedIn(loggedInStatus);
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }

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
    // Clear localStorage custom auth
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('email');
    
    setIsLoggedIn(false);
    setUser(null);
    
    // Also sign out from Supabase if available
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message);
      }
    }
    
    toast.success('Logged out successfully');
    navigate('/');
  };

  const username = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'User';

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Quiz', icon: Brain, path: '/quiz' },
    { label: '1v1 Battle', icon: Swords, path: '/battle' },
    { label: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-primary rounded-lg group-hover:rotate-12 transition-transform">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">
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
            ) : session || isLoggedIn ? (
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild className="text-lg font-bold text-primary hover:text-primary/80 flex items-center gap-2">
                  <Link to="/profile" className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {user?.name || 'User'}
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </Button>
              </div>
            ) : (
              <Button size="sm" asChild className="glass-button">
                <Link to="/auth">Sign Up</Link>
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
            
            {session || isLoggedIn ? (
              <>
                <Button variant="ghost" className="w-full justify-start text-base font-bold text-primary flex items-center gap-3" asChild>
                  <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3">
                    <User className="w-5 h-5" />
                    {user?.name || 'User'}
                  </Link>
                </Button>
                <Button variant="destructive" className="w-full" onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}>
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </Button>
              </>
            ) : (
              <Button className="w-full" asChild>
                <Link to="/auth" onClick={() => setIsMenuOpen(false)}>Sign Up</Link>
              </Button>
            )}
          </div>
        )}
      </nav>

      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-6 md:py-8 relative">
        {/* Background blobs for aesthetics */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/14 rounded-full blur-[128px] -z-10 pointer-events-none" />
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-cyan-500/8 rounded-full blur-[128px] -z-10 pointer-events-none" />
        
        {children}
      </main>

      {/* Compact Pro Service popup (bottom-right) */}
      <div className="fixed bottom-3 right-3 z-40 w-[210px] sm:w-[230px]">
        <div className="glass-card rounded-lg border-border/70 p-2.5 sm:p-3 flex items-center gap-2.5 group">
          <div className="h-8 w-8 sm:h-9 sm:w-9 bg-indigo-600 rounded-md flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <ExternalLink className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-bold tracking-wider text-cyan-300">PRO SERVICE</p>
            <p className="text-[11px] text-muted-foreground leading-tight line-clamp-2 mb-1.5">Need website or AI solution?</p>
            <Button size="sm" className="h-7 px-2.5 text-[11px] bg-cyan-600 hover:bg-cyan-500 text-white border-none" asChild>
              <a href="https://biharicoder.com" target="_blank" rel="noopener noreferrer">Hire now</a>
            </Button>
          </div>
        </div>
      </div>

      <footer className="border-t border-border/60 py-10 mt-16">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
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
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 mt-10 pt-8 border-t border-border/60 flex flex-col md:flex-row justify-between items-center gap-4">
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
