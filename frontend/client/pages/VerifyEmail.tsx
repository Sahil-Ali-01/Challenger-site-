import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle2, AlertCircle, Loader2, Home } from 'lucide-react';
import { toast } from 'sonner';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setError('No verification token found');
        setLoading(false);
        return;
      }

      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Verification failed');
          setLoading(false);
          toast.error('Email verification failed: ' + (data.error || 'Unknown error'));
          return;
        }

        // Store user data in localStorage
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('isLoggedIn', 'true');
        }

        setVerified(true);
        setLoading(false);
        toast.success('✅ Email verified successfully! You can now access all features.');
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } catch (err: any) {
        setError(err.message || 'An error occurred during verification');
        setLoading(false);
        toast.error('Verification error: ' + (err.message || 'Unknown error'));
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="glass-card rounded-[3rem] p-12 border-white/10 text-center space-y-8">
            {loading ? (
              <>
                <div className="w-20 h-20 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold">Verifying Email</h2>
                  <p className="text-muted-foreground">Please wait while we verify your email address...</p>
                </div>
              </>
            ) : verified ? (
              <>
                <div className="w-20 h-20 mx-auto bg-green-500/10 rounded-2xl flex items-center justify-center animate-in zoom-in">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold">Email Verified!</h2>
                  <p className="text-muted-foreground">
                    Your email has been successfully verified. You can now access all features.
                  </p>
                </div>
                <div className="space-y-3 pt-4">
                  <p className="text-sm text-muted-foreground">Redirecting to dashboard in 3 seconds...</p>
                  <Button 
                    className="w-full h-12 rounded-xl text-lg font-bold"
                    onClick={() => navigate('/dashboard')}
                  >
                    <Home className="mr-2 w-5 h-5" />
                    Go to Dashboard Now
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-2xl flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold">Verification Failed</h2>
                  <p className="text-muted-foreground break-words">
                    {error || 'An error occurred. Please try again.'}
                  </p>
                </div>
                <div className="space-y-3 pt-4">
                  <Button 
                    className="w-full h-12 rounded-xl text-lg font-bold"
                    onClick={() => navigate('/auth')}
                  >
                    <Mail className="mr-2 w-5 h-5" />
                    Try Again
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full h-12 rounded-xl text-lg font-bold"
                    onClick={() => navigate('/')}
                  >
                    <Home className="mr-2 w-5 h-5" />
                    Go Home
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
