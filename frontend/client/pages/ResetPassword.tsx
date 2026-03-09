import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Lock, Loader2, CheckCircle2, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const token = searchParams.get('token') || '';
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

  const fetchAuthWithFallback = async (path: string, init: RequestInit) => {
    if (import.meta.env.PROD && !apiUrl) {
      throw new Error('VITE_API_URL is not configured in production. Set it to your Render backend URL.');
    }

    const targets = [apiUrl, '', 'http://localhost:8082', 'http://localhost:8083']
      .filter((v, i, a) => v !== undefined && a.indexOf(v) === i)
      .filter((v) => !(import.meta.env.PROD && (v === '' || v.startsWith('http://localhost'))));

    let lastError: unknown = null;

    for (const base of targets) {
      try {
        const res = await fetch(`${base}${path}`, init);
        return res;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('Failed to fetch');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('Missing reset token. Open the reset link from your email again.');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetchAuthWithFallback('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      if (!response.ok) {
        const errorData = await parseJsonSafely(response);
        throw new Error(errorData.error || 'Failed to reset password');
      }

      const data = await parseJsonSafely(response);
      setCompleted(true);
      toast.success(data.message || 'Password reset successful. You can now log in.');

      setTimeout(() => {
        navigate('/auth');
      }, 1800);
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password');
      console.error('Reset password error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="glass-card rounded-[2rem] p-8 border-white/10 space-y-6">
            {!token ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-2xl flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold">Invalid Reset Link</h1>
                <p className="text-sm text-muted-foreground">
                  This password reset link is missing a token or is malformed.
                </p>
                <Button className="w-full" onClick={() => navigate('/auth')}>
                  Back to Login
                </Button>
              </div>
            ) : completed ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h1 className="text-2xl font-bold">Password Updated</h1>
                <p className="text-sm text-muted-foreground">
                  Your password has been reset. Redirecting to login...
                </p>
                <Button className="w-full" onClick={() => navigate('/auth')}>
                  Go to Login
                </Button>
              </div>
            ) : (
              <>
                <div className="text-center space-y-2">
                  <h1 className="text-2xl font-bold">Reset Password</h1>
                  <p className="text-sm text-muted-foreground">
                    Enter a new password for your account.
                  </p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="w-full bg-background/60 border border-border/70 rounded-xl h-11 pl-11 pr-11 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50 font-medium"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat your new password"
                        className="w-full bg-background/60 border border-border/70 rounded-xl h-11 pl-11 pr-11 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50 font-medium"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button className="w-full h-11 rounded-xl text-base font-bold" type="submit" disabled={loading}>
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Update Password <ArrowRight className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
