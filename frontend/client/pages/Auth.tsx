import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Github, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  CheckCircle2,
  Brain,
  Sparkles,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // Check if user is already logged in
  React.useEffect(() => {
    const loggedInStatus = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedInStatus);
    if (loggedInStatus) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const apiUrl = (import.meta.env.VITE_API_URL || '').trim();

  const parseJsonSafely = async (response: Response) => {
    const rawText = await response.text();

    if (!rawText || !rawText.trim()) {
      throw new Error('Empty response from server. Please verify backend URL and deployment status.');
    }

    try {
      return JSON.parse(rawText);
    } catch {
      throw new Error('Server returned an invalid response format. Check backend URL/CORS configuration.');
    }
  };

  // Try relative URL first (uses Vite proxy in dev), then explicit backend URLs as fallback.
  const fetchAuthWithFallback = async (path: string, init: RequestInit) => {
    if (import.meta.env.PROD && !apiUrl) {
      throw new Error('VITE_API_URL is not configured in production. Set it to your Render backend URL.');
    }

    const targets = [
      apiUrl,                        // Explicit backend URL from env
      '',                            // relative URL → Vite proxy in dev
      'http://localhost:8082',
      'http://localhost:8083',
    ]
      .filter((v, i, a) => v !== undefined && a.indexOf(v) === i)
      .filter((v) => !(import.meta.env.PROD && (v === '' || v.startsWith('http://localhost'))));

    let lastError: unknown = null;

    for (const base of targets) {
      try {
        const url = `${base}${path}`;
        const res = await fetch(url, init);
        return res;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('Failed to fetch');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        // LOGIN FLOW
        const response = await fetchAuthWithFallback('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
          }),
        });

        if (!response.ok) {
          const errorData = await parseJsonSafely(response);
          throw new Error(errorData.error || 'Login failed');
        }

        const data = await parseJsonSafely(response);
        
        // Store login data in localStorage
        if (data.token) {
          localStorage.setItem('jwtToken', data.token);
        }
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('email', data.user.email);
        }
        localStorage.setItem('isLoggedIn', 'true');

        toast.success(`✅ Welcome back, ${data.user.name}!`);
        
        // Clear form
        setEmail('');
        setPassword('');
        
        // Redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      } else {
        // SIGNUP FLOW
        const response = await fetchAuthWithFallback('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: fullName,
            email,
            password,
          }),
        });

        if (!response.ok) {
          const errorData = await parseJsonSafely(response);
          throw new Error(errorData.error || 'Registration failed');
        }

        const data = await parseJsonSafely(response);
        
        // Store user data in localStorage (not logged in yet until email verified)
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        localStorage.setItem('email', email);

        toast.success(
          data.message || '✅ Check your email for the verification link to confirm your account.'
        );
        
        // Clear form
        setFullName('');
        setEmail('');
        setPassword('');
        
        // Redirect after a delay
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      }
    } catch (error: any) {
      const errorMsg = error.message || 'An error occurred';
      toast.error(errorMsg);
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'github' | 'google') => {
    if (!supabase) {
      toast.error('Supabase is not configured.');
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin + '/dashboard',
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      toast.error('Enter your email first, then click Forgot.');
      return;
    }

    setForgotLoading(true);
    try {
      const response = await fetchAuthWithFallback('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      if (!response.ok) {
        const errorData = await parseJsonSafely(response);
        throw new Error(errorData.error || 'Failed to process forgot password request');
      }

      const data = await parseJsonSafely(response);
      toast.success(data.message || 'If your account exists, reset instructions have been sent to your email.');
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to process forgot password request';
      toast.error(errorMsg);
      console.error('Forgot password error:', error);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-10 lg:py-16 flex flex-col lg:flex-row items-center gap-10 lg:gap-14 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[420px] h-[420px] bg-primary/10 rounded-full blur-[140px] -z-10" />
        <div className="absolute top-0 right-0 w-[320px] h-[320px] bg-cyan-500/10 rounded-full blur-[140px] -z-10" />

        {/* Info Column */}
        <div className="flex-1 space-y-10 animate-in fade-in slide-in-from-left duration-700">
          <div className="space-y-6">
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Join the <span className="text-gradient">Biharicoder</span> Elite
            </h1>
            <p className="text-base lg:text-lg text-muted-foreground leading-relaxed max-w-lg">
              Compete with the world's best developers, master cutting-edge tech, and prove your coding IQ.
            </p>
          </div>

          <div className="space-y-6">
            {[
              { icon: Brain, title: 'Gamified Learning', desc: 'Master new topics while earning points and badges.' },
              { icon: ShieldCheck, title: 'Verified Profiles', desc: 'Showcase your skills with a production-ready developer profile.' },
              { icon: Sparkles, title: 'Daily Challenges', desc: 'Stay sharp with 10 new curated questions every day.' },
            ].map((f) => (
              <div key={f.title} className="flex gap-4 p-3.5 rounded-xl hover:bg-accent/50 transition-all">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:rotate-12 transition-transform">
                  <f.icon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-base">{f.title}</h4>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Auth Form Column */}
        <div className="w-full max-w-md animate-in fade-in slide-in-from-right duration-700">
          <div className="glass-card rounded-2xl p-7 lg:p-8 border-border/70 shadow-[0_24px_50px_-34px_rgba(0,0,0,0.8)] relative group">
             {/* Gradient glow behind form */}
             <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-cyan-500/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 -z-10" />

             <div className="text-center space-y-2 mb-7">
               <h2 className="text-2xl font-bold">{isLogin ? 'Welcome Back' : 'Get Started'}</h2>
               <p className="text-sm text-muted-foreground">
                 {isLogin ? "Don't have an account?" : "Already have an account?"} 
                 <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-bold hover:underline ml-1">
                   {isLogin ? 'Sign up free' : 'Log in here'}
                 </button>
               </p>
             </div>

             <form className="space-y-5" onSubmit={handleAuth}>
               {!isLogin && (
                 <div className="space-y-2 group/input">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within/input:text-primary" />
                      <input 
                        type="text" 
                        placeholder="Sahil Ali" 
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-background/60 border border-border/70 rounded-xl h-11 pl-11 pr-4 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50 font-medium"
                      />
                    </div>
                 </div>
               )}

               <div className="space-y-2 group/input">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within/input:text-primary" />
                    <input 
                      type="email" 
                      placeholder="sahil@biharicoder.com" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-background/60 border border-border/70 rounded-xl h-11 pl-11 pr-4 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50 font-medium"
                    />
                  </div>
               </div>

               <div className="space-y-2 group/input">
                  <div className="flex justify-between items-center pl-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Password</label>
                    {isLogin && (
                      <button
                        type="button"
                        className="text-[10px] font-bold text-primary hover:underline disabled:opacity-60"
                        onClick={handleForgotPassword}
                        disabled={forgotLoading || loading}
                      >
                        {forgotLoading ? 'Sending...' : 'Forgot?'}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within/input:text-primary" />
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-background/60 border border-border/70 rounded-xl h-11 pl-11 pr-4 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50 font-medium"
                    />
                  </div>
               </div>

               <Button className="w-full h-11 rounded-xl text-base font-bold shadow-lg shadow-primary/20" type="submit" disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {isLogin ? 'Log In' : 'Create Account'} <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
               </Button>
             </form>

             <div className="relative my-8 text-center">
               <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/70"></div></div>
               <span className="relative bg-background px-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Or continue with</span>
             </div>

             <div className="grid grid-cols-2 gap-4">
               <Button variant="outline" className="h-10 rounded-xl glass-button font-bold text-sm" onClick={() => handleOAuth('github')} disabled={loading}>
                 <Github className="mr-2 w-4 h-4" /> GitHub
               </Button>
               <Button variant="outline" className="h-10 rounded-xl glass-button font-bold text-sm" onClick={() => handleOAuth('google')} disabled={loading}>
                 <svg className="mr-2 w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                 Google
               </Button>
             </div>

             <div className="mt-10 text-center">
               <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-relaxed">
                 By continuing, you agree to our <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
               </p>
             </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
