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
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      toast.error('Supabase is not configured. Please connect it manually.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Logged in successfully!');
        navigate('/dashboard');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;
        toast.success('Check your email for the confirmation link!');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during authentication');
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

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-12 lg:py-20 flex flex-col lg:flex-row items-center gap-16 lg:gap-24 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] -z-10" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[150px] -z-10" />

        {/* Info Column */}
        <div className="flex-1 space-y-10 animate-in fade-in slide-in-from-left duration-700">
          <div className="space-y-6">
            <h1 className="text-5xl lg:text-7xl font-black tracking-tight leading-tight">
              Join the <span className="text-gradient">Biharicoder</span> Elite
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
              Compete with the world's best developers, master cutting-edge tech, and prove your coding IQ.
            </p>
          </div>

          <div className="space-y-6">
            {[
              { icon: Brain, title: 'Gamified Learning', desc: 'Master new topics while earning points and badges.' },
              { icon: ShieldCheck, title: 'Verified Profiles', desc: 'Showcase your skills with a production-ready developer profile.' },
              { icon: Sparkles, title: 'Daily Challenges', desc: 'Stay sharp with 10 new curated questions every day.' },
            ].map((f) => (
              <div key={f.title} className="flex gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:rotate-12 transition-transform">
                  <f.icon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-lg">{f.title}</h4>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Auth Form Column */}
        <div className="w-full max-w-md animate-in fade-in slide-in-from-right duration-700">
          <div className="glass-card rounded-[3rem] p-10 lg:p-12 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.3)] relative group">
             {/* Gradient glow behind form */}
             <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-indigo-500/20 rounded-[3rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 -z-10" />

             <div className="text-center space-y-2 mb-10">
               <h2 className="text-3xl font-bold">{isLogin ? 'Welcome Back' : 'Get Started'}</h2>
               <p className="text-sm text-muted-foreground">
                 {isLogin ? "Don't have an account?" : "Already have an account?"} 
                 <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-bold hover:underline ml-1">
                   {isLogin ? 'Sign up free' : 'Log in here'}
                 </button>
               </p>
             </div>

             <form className="space-y-6" onSubmit={handleAuth}>
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
                        className="w-full bg-white/5 border border-white/5 rounded-2xl h-14 pl-12 pr-4 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/30 font-medium"
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
                      className="w-full bg-white/5 border border-white/5 rounded-2xl h-14 pl-12 pr-4 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/30 font-medium"
                    />
                  </div>
               </div>

               <div className="space-y-2 group/input">
                  <div className="flex justify-between items-center pl-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Password</label>
                    {isLogin && <button type="button" className="text-[10px] font-bold text-primary hover:underline">Forgot?</button>}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within/input:text-primary" />
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl h-14 pl-12 pr-4 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/30 font-medium"
                    />
                  </div>
               </div>

               <Button className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20" type="submit" disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {isLogin ? 'Log In' : 'Create Account'} <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
               </Button>
             </form>

             <div className="relative my-10 text-center">
               <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
               <span className="relative bg-background px-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Or continue with</span>
             </div>

             <div className="grid grid-cols-2 gap-4">
               <Button variant="outline" className="h-12 rounded-2xl glass-button font-bold text-sm" onClick={() => handleOAuth('github')} disabled={loading}>
                 <Github className="mr-2 w-4 h-4" /> GitHub
               </Button>
               <Button variant="outline" className="h-12 rounded-2xl glass-button font-bold text-sm" onClick={() => handleOAuth('google')} disabled={loading}>
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
