import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User as UserIcon, 
  Mail, 
  CheckCircle2, 
  LogOut,
  Settings,
  Shield,
  Trophy,
  Target,
  Flame,
  Star,
  TrendingUp,
  Calendar,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  LayoutDashboard,
  Brain,
  AtSign,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface UserData {
  id: string;
  name: string;
  username?: string;
  email: string;
  email_verified: boolean;
}

interface LeaderboardStats {
  global_rank?: number;
  elo_rating: number;
  total_wins: number;
  total_losses: number;
  total_quizzes: number;
  correct_answers: number;
  accuracy_percentage: number;
  total_points: number;
  weekly_points: number;
  streak: number;
}

export default function UserProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);

  const defaultStats: LeaderboardStats = {
    global_rank: null,
    elo_rating: 1200,
    total_wins: 0,
    total_losses: 0,
    total_quizzes: 0,
    correct_answers: 0,
    accuracy_percentage: 0,
    total_points: 0,
    weekly_points: 0,
    streak: 0,
  };

  useEffect(() => {
    // Get user data from localStorage
    const storedUser = localStorage.getItem('user');
    const isLoggedIn = localStorage.getItem('isLoggedIn');

    if (!isLoggedIn || !storedUser) {
      navigate('/auth');
      return;
    }

    try {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      // Fetch stats from database
      fetchUserStats(userData.id);
    } catch (err) {
      console.error('Error parsing user data:', err);
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const cached = localStorage.getItem('latestLeaderboardStats');
    if (cached) {
      try {
        const s = JSON.parse(cached);
        setStats((prev) => ({
          ...(prev || defaultStats),
          global_rank: s.global_rank ?? (prev?.global_rank ?? null),
          elo_rating: s.elo_rating ?? (prev?.elo_rating ?? 1200),
          total_wins: s.wins ?? (prev?.total_wins ?? 0),
          total_losses: s.losses ?? (prev?.total_losses ?? 0),
          total_quizzes: s.total_quizzes ?? ((s.wins ?? 0) + (s.losses ?? 0)),
          correct_answers: s.correct_answers ?? (prev?.correct_answers ?? 0),
          accuracy_percentage: s.accuracy_percentage ?? (prev?.accuracy_percentage ?? 0),
          total_points: s.total_points ?? (prev?.total_points ?? 0),
          weekly_points: s.weekly_points ?? (prev?.weekly_points ?? 0),
          streak: s.streak ?? (prev?.streak ?? 0),
        }));
      } catch (error) {
        console.error('Failed to parse latestLeaderboardStats cache:', error);
      }
    }
  }, []);

  useEffect(() => {
    const onStatsUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      const s = customEvent.detail || {};

      setStats((prev) => ({
        ...(prev || defaultStats),
        global_rank: s.global_rank ?? (prev?.global_rank ?? null),
        elo_rating: s.elo_rating ?? (prev?.elo_rating ?? 1200),
        total_wins: s.wins ?? (prev?.total_wins ?? 0),
        total_losses: s.losses ?? (prev?.total_losses ?? 0),
        total_quizzes: s.total_quizzes ?? ((s.wins ?? 0) + (s.losses ?? 0)),
        correct_answers: s.correct_answers ?? (prev?.correct_answers ?? 0),
        accuracy_percentage: s.accuracy_percentage ?? (prev?.accuracy_percentage ?? 0),
        total_points: s.total_points ?? (prev?.total_points ?? 0),
        weekly_points: s.weekly_points ?? (prev?.weekly_points ?? 0),
        streak: s.streak ?? (prev?.streak ?? 0),
      }));

      if (user?.id) {
        fetchUserStats(user.id);
      }
    };

    window.addEventListener('profile:stats-updated', onStatsUpdated as EventListener);
    return () => {
      window.removeEventListener('profile:stats-updated', onStatsUpdated as EventListener);
    };
  }, [user?.id]);

  const fetchUserStats = async (userId: string) => {
    try {
      setStatsLoading(true);
      const token = localStorage.getItem('jwtToken');
      const apiBase = import.meta.env.VITE_API_URL || '';

      let loaded = false;

      if (token) {
        const response = await fetch(`${apiBase}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const payload = await response.json();
          if (payload?.user) {
            setUser(payload.user);
          }

          const lb = payload?.leaderboard;
          if (lb) {
            setStats({
              global_rank: lb.global_rank ?? null,
              elo_rating: lb.elo_rating ?? 1200,
              total_wins: lb.total_wins ?? 0,
              total_losses: lb.total_losses ?? 0,
              total_quizzes: lb.total_quizzes ?? ((lb.total_wins ?? 0) + (lb.total_losses ?? 0)),
              correct_answers: lb.correct_answers ?? 0,
              accuracy_percentage: lb.accuracy_percentage ?? 0,
              total_points: lb.total_points ?? 0,
              weekly_points: lb.weekly_points ?? 0,
              streak: lb.streak ?? 0,
            });
            loaded = true;
          }
        }
      }

      // Fallback for missing/expired token or temporary auth endpoint issues.
      if (!loaded) {
        const leaderboardResponse = await fetch(`${apiBase}/api/leaderboard`);

        if (leaderboardResponse.ok) {
          const payload = await leaderboardResponse.json();
          const rows = payload?.data || [];
          const mine = rows.find((row: any) => row?.id === userId);

          if (mine) {
            setStats({
              global_rank: mine.rank ?? null,
              elo_rating: mine.elo ?? 1200,
              total_wins: mine.wins ?? 0,
              total_losses: mine.losses ?? 0,
              total_quizzes: (mine.wins ?? 0) + (mine.losses ?? 0),
              correct_answers: mine.wins ?? 0,
              accuracy_percentage: mine.accuracy ?? 0,
              total_points: mine.total_points ?? 0,
              weekly_points: mine.weekly_points ?? 0,
              streak: mine.streak ?? 0,
            });
            loaded = true;
          }
        }
      }

      if (!loaded) {
        setStats(defaultStats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setStats(defaultStats);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('email');
    localStorage.removeItem('jwtToken');
    toast.success('Logged out successfully');
    navigate('/auth');
  };

  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      toast.success('User ID copied to clipboard');
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const winRate = stats && stats.total_wins + stats.total_losses > 0 
    ? ((stats.total_wins / (stats.total_wins + stats.total_losses)) * 100).toFixed(1)
    : '0';

  if (loading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto py-12 px-4 flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto py-12 px-4">
          <div className="text-center text-muted-foreground">User not found</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
        {/* Header Section */}
        <div className="glass-card rounded-2xl p-6 lg:p-8 border-border/70 relative overflow-hidden group">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-indigo-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-700" />
          
          <div className="relative space-y-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-6 flex-1">
                {/* Avatar with initials */}
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-2xl lg:text-3xl font-black text-white shadow-lg shadow-primary/25">
                    {(user.name || '?').slice(0, 2).toUpperCase()}
                  </div>
                  {user.email_verified && (
                    <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center border-2 border-background shadow-md">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Name, username & badges */}
                <div className="flex-1 space-y-3 min-w-0">
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-black tracking-tight truncate">{user.name}</h1>
                    {user.username && (
                      <p className="text-base text-primary font-semibold flex items-center gap-1.5 mt-1">
                        <AtSign className="w-4 h-4" />
                        {user.username}
                      </p>
                    )}
                  </div>

                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge 
                      variant={user.email_verified ? "default" : "outline"}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg",
                        user.email_verified 
                          ? "bg-green-500/15 text-green-400 border-green-500/30" 
                          : "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
                      )}
                    >
                      {user.email_verified ? (
                        <><CheckCircle2 className="w-3.5 h-3.5" /> Verified</>
                      ) : (
                        <><AlertCircle className="w-3.5 h-3.5" /> Pending</>
                      )}
                    </Badge>
                    {stats && stats.elo_rating >= 1400 && (
                      <Badge className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-primary/15 text-primary border-primary/30">
                        <Zap className="w-3.5 h-3.5" />
                        {stats.elo_rating >= 1600 ? 'Elite' : 'Pro'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Info row */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-4 border-t border-border/70 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4 text-primary/70" />
                <span className="font-medium">{user.email}</span>
              </div>
              {user.username && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UserIcon className="w-4 h-4 text-primary/70" />
                  <span className="font-medium">@{user.username}</span>
                </div>
              )}
              {stats && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Trophy className="w-4 h-4 text-yellow-400/70" />
                  <span className="font-medium">{stats.total_points.toLocaleString()} pts</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {statsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Global Rank */}
            <div className="glass-card rounded-xl p-5 border-border/70 group hover:border-yellow-500/50 transition-all duration-300">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">Global Rank</p>
                  <Trophy className="w-4 h-4 text-yellow-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-3xl font-black text-yellow-400">{stats.global_rank ? `#${stats.global_rank}` : 'N/A'}</p>
                <p className="text-xs text-muted-foreground">All-time leaderboard</p>
              </div>
            </div>

            {/* ELO Rating */}
            <div className="glass-card rounded-xl p-5 border-border/70 group hover:border-primary/50 transition-all duration-300">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">ELO Rating</p>
                  <TrendingUp className="w-4 h-4 text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-3xl font-black text-primary">{stats.elo_rating}</p>
                <p className="text-xs text-muted-foreground">Competitive ranking</p>
              </div>
            </div>

            {/* Total Points */}
            <div className="glass-card rounded-xl p-5 border-border/70 group hover:border-indigo-500/50 transition-all duration-300">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">Total Points</p>
                  <Star className="w-4 h-4 text-indigo-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-3xl font-black text-indigo-400">{stats.total_points.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">All-time score</p>
              </div>
            </div>

            {/* Accuracy */}
            <div className="glass-card rounded-xl p-5 border-border/70 group hover:border-cyan-500/50 transition-all duration-300">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">Accuracy</p>
                  <Target className="w-4 h-4 text-cyan-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-3xl font-black text-cyan-400">{stats.accuracy_percentage.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Question accuracy</p>
              </div>
            </div>

            {/* Win Rate */}
            <div className="glass-card rounded-xl p-5 border-border/70 group hover:border-green-500/50 transition-all duration-300">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">Win Rate</p>
                  <Trophy className="w-4 h-4 text-green-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-3xl font-black text-green-400">{winRate}%</p>
                <p className="text-xs text-muted-foreground">Battle victories</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Detailed Stats */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Quiz Performance */}
            <div className="glass-card rounded-xl p-6 border-border/70 space-y-5">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <Brain className="w-6 h-6 text-primary" />
                Quiz Performance
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-accent/40 hover:bg-accent/60 transition-all border border-border/60">
                  <span className="text-muted-foreground">Total Quizzes</span>
                  <span className="text-xl font-bold text-primary">{stats.total_quizzes}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-accent/40 hover:bg-accent/60 transition-all border border-border/60">
                  <span className="text-muted-foreground">Correct Answers</span>
                  <span className="text-xl font-bold text-green-400">{stats.correct_answers}</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground">Progress Bar</span>
                    <span className="text-sm font-bold text-primary">({stats.accuracy_percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full h-3 bg-accent/40 rounded-full overflow-hidden border border-border/60">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-indigo-500 transition-all duration-500"
                      style={{ width: `${Math.min(stats.accuracy_percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Battle Stats */}
            <div className="glass-card rounded-xl p-6 border-border/70 space-y-5">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <Flame className="w-6 h-6 text-orange-400" />
                Battle Stats
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-accent/40 hover:bg-accent/60 transition-all border border-border/60">
                  <span className="text-muted-foreground">Wins</span>
                  <span className="text-xl font-bold text-green-400">{stats.total_wins}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-accent/40 hover:bg-accent/60 transition-all border border-border/60">
                  <span className="text-muted-foreground">Losses</span>
                  <span className="text-xl font-bold text-red-400">{stats.total_losses}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-accent/40 hover:bg-accent/60 transition-all border border-border/60">
                  <span className="text-muted-foreground">Current Streak</span>
                  <span className="text-xl font-bold text-orange-400 flex items-center gap-2">
                    <Flame className="w-5 h-5" />
                    {stats.streak}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-accent/40 hover:bg-accent/60 transition-all border border-border/60">
                  <span className="text-muted-foreground">Weekly Points</span>
                  <span className="text-xl font-bold text-indigo-400">{stats.weekly_points}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User ID & Account Info */}
        <div className="glass-card rounded-xl p-6 border-border/70 space-y-5">
          <h2 className="text-xl font-bold flex items-center gap-3">
            <Shield className="w-5 h-5 text-cyan-400" />
            Account Information
          </h2>
          
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-accent/40 hover:bg-accent/60 transition-all border border-border/60">
              <p className="text-sm text-muted-foreground mb-2">User ID</p>
              <div className="flex items-center gap-3 justify-between">
                <p className="font-mono text-sm text-primary break-all flex-1">{user.id}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyId}
                  className="text-muted-foreground hover:text-primary"
                >
                  {copiedId ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {user.email_verified && (
              <div className="p-5 rounded-xl bg-green-500/10 border border-green-500/20 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <p className="font-bold text-green-400">Email Verified</p>
                </div>
                <p className="text-sm text-green-400/80">
                  Your account has full access to all Quiz Challenge Arena features.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 flex-wrap">
          <Button 
            className="flex-1 min-w-max h-10 rounded-lg text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all"
            onClick={() => navigate('/dashboard')}
          >
            <LayoutDashboard className="mr-3 w-5 h-5" />
            Go to Dashboard
          </Button>
          <Button 
            variant="outline"
            className="flex-1 min-w-max h-10 rounded-lg text-sm font-bold hover:border-primary/50"
            onClick={() => navigate('/leaderboard')}
          >
            <Trophy className="mr-3 w-5 h-5" />
            View Leaderboard
          </Button>
          <Button 
            className="flex-1 min-w-max h-10 rounded-lg text-sm font-bold bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 hover:text-red-300"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 w-5 h-5" />
            Logout
          </Button>
        </div>
      </div>
    </Layout>
  );
}



