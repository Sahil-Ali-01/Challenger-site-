import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Zap, 
  Target, 
  Flame, 
  Medal,
  Calendar,
  ChevronRight,
  TrendingUp,
  Brain,
  Loader2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface LeaderboardStats {
  global_rank: number | null;
  elo_rating: number;
  total_wins: number;
  total_losses: number;
  total_quizzes: number;
  correct_answers: number;
  accuracy_percentage: number;
  total_points: number;
  weekly_points: number;
  streak: number;
  best_streak: number;
}

interface Achievement {
  id: string;
  name: string;
  level: string;
  points: number;
}

const levelColorMap: Record<string, string> = {
  Bronze: 'bg-orange-400',
  Silver: 'bg-slate-400',
  Gold: 'bg-yellow-400',
  Platinum: 'bg-cyan-400',
  Diamond: 'bg-purple-400',
};

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
  best_streak: 0,
};

/** Try relative URL first (Vite proxy in dev), then explicit backend URLs as fallback. */
async function fetchWithFallback(path: string, init?: RequestInit): Promise<Response | null> {
  const apiBase = (import.meta.env.VITE_API_URL || '').trim();
  const targets = ['', apiBase, 'http://localhost:8082', 'http://localhost:8083']
    .filter((v, i, a) => v !== undefined && a.indexOf(v) === i);

  for (const base of targets) {
    try {
      const res = await fetch(`${base}${path}`, init);
      if (res.ok) return res;
    } catch { /* try next */ }
  }
  return null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string; name?: string; username?: string; email?: string } | null>(null);
  const [lbStats, setLbStats] = useState<LeaderboardStats>(defaultStats);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [topPlayers, setTopPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const storedUser = localStorage.getItem('user');

    if (!isLoggedIn || !storedUser) {
      navigate('/auth');
      return;
    }

    let userData: any;
    try {
      userData = JSON.parse(storedUser);
      setUser(userData);
    } catch {
      navigate('/auth');
      return;
    }

    const loadData = async () => {
      // 1. Fetch profile + leaderboard stats via /api/auth/me
      const token = localStorage.getItem('jwtToken');
      let loaded = false;

      if (token) {
        const meRes = await fetchWithFallback('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });

        if (meRes) {
          const payload = await meRes.json();
          if (payload?.user) setUser(payload.user);

          const lb = payload?.leaderboard;
          if (lb) {
            setLbStats({
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
              best_streak: lb.best_streak ?? 0,
            });
            loaded = true;
          }
        }
      }

      // Fallback: fetch from public leaderboard
      if (!loaded && userData?.id) {
        const lbRes = await fetchWithFallback('/api/leaderboard');
        if (lbRes) {
          const payload = await lbRes.json();
          const rows = payload?.data || [];
          const mine = rows.find((r: any) => r?.id === userData.id);
          if (mine) {
            setLbStats({
              global_rank: mine.rank ?? null,
              elo_rating: mine.elo ?? 1200,
              total_wins: mine.wins ?? 0,
              total_losses: mine.losses ?? 0,
              total_quizzes: (mine.wins ?? 0) + (mine.losses ?? 0),
              correct_answers: mine.correct_answers ?? 0,
              accuracy_percentage: mine.accuracy ?? 0,
              total_points: mine.total_points ?? 0,
              weekly_points: mine.weekly_points ?? 0,
              streak: mine.streak ?? 0,
              best_streak: mine.best_streak ?? 0,
            });
          }
        }
      }

      // 2. Fetch achievements from DB
      if (userData?.id) {
        const achRes = await fetchWithFallback(`/api/profile/${userData.id}/achievements`);
        if (achRes) {
          const payload = await achRes.json();
          if (Array.isArray(payload?.achievements)) {
            setAchievements(payload.achievements);
          }
        }
      }

      // 3. Fetch top players for sidebar
      const topRes = await fetchWithFallback('/api/leaderboard?limit=5');
      if (topRes) {
        const payload = await topRes.json();
        if (Array.isArray(payload?.data)) {
          setTopPlayers(payload.data.slice(0, 5));
        }
      }

      setLoading(false);
    };

    loadData();
  }, [navigate]);

  const username = user?.name || user?.username || user?.email?.split('@')[0] || 'Developer';

  // Calculate display values from real leaderboard data
  const totalPoints = lbStats.total_points;
  const rank = lbStats.global_rank ?? 'Unranked';
  const solvedQuestions = lbStats.total_quizzes || (lbStats.total_wins + lbStats.total_losses);
  const dailyStreak = lbStats.streak;
  const accuracy = lbStats.accuracy_percentage;

  // Day 1 starts from today, then continues through the next 6 days.
  const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const todayWeekdayIndex = new Date().getDay();
  const streakDays = Array.from({ length: 7 }, (_, offset) => {
    const dayIndex = (todayWeekdayIndex + offset) % 7;
    return {
      label: weekdayLabels[dayIndex],
      dayNumber: offset + 1,
      isInStreak: offset < Math.min(dailyStreak, 7),
      isToday: offset === 0,
    };
  });

  const statCards = [
    { label: 'Total Points', value: totalPoints.toString(), icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'Global Rank', value: rank.toString(), icon: Trophy, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Solved Qs', value: solvedQuestions.toString(), icon: Target, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Daily Streak', value: `${dailyStreak} days`, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  // Use achievements from API
  const displayBadges = achievements.slice(0, 6);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 space-y-10">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, <span className="text-primary">{username}</span>!
            </h1>
            <p className="text-muted-foreground">
              {dailyStreak > 0 ? `${dailyStreak}-day streak! Keep the momentum going.` : 'Start a quiz to build your streak!'}
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Button className="h-12 px-6 font-bold shadow-lg shadow-primary/20 flex-1 md:flex-none" asChild>
              <Link to="/profile">
                <Trophy className="mr-2 w-4 h-4" /> View Profile
              </Link>
            </Button>
            <Button className="h-12 px-6 font-bold shadow-lg shadow-primary/20 flex-1 md:flex-none" asChild>
              <Link to="/quiz?type=daily">
                <Calendar className="mr-2 w-4 h-4" /> Today's Challenge
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <div key={stat.label} className="glass-card p-6 rounded-2xl border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className={cn("p-2 rounded-lg", stat.bg)}>
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className="text-3xl font-bold tabular-nums tracking-tight">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Activity */}
          <div className="lg:col-span-2 space-y-8">
            {/* Daily Streak Section */}
            <div className="glass-card p-8 rounded-3xl border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                <Flame className="w-32 h-32 text-orange-500" />
              </div>
              <div className="space-y-6 relative">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    Daily Streak <Flame className="w-6 h-6 text-orange-500 fill-current" />
                  </h2>
                  <p className="text-muted-foreground">Answer 10 questions today to keep your streak alive and earn +20 bonus points.</p>
                </div>
                
                <div className="flex justify-between items-end">
                  <div className="space-y-2 flex-1 max-w-sm">
                    <div className="flex justify-between text-sm font-bold">
                      <span>Daily Progress</span>
                      <span>{solvedQuestions > 0 ? Math.min(solvedQuestions, 10) : 0} / 10</span>
                    </div>
                    <Progress value={Math.min((solvedQuestions / 10) * 100, 100)} className="h-3" />
                  </div>
                  <Button variant="ghost" className="hover:text-primary h-10" asChild>
                    <Link to="/quiz">Continue <ChevronRight className="ml-1 w-4 h-4" /></Link>
                  </Button>
                </div>

                <div className="flex gap-2">
                  {streakDays.map((day) => {
                    return (
                      <div key={day.dayNumber} className="flex-1 text-center space-y-2">
                        <div className={cn(
                          "h-10 rounded-xl flex items-center justify-center font-bold transition-all",
                          day.isInStreak ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "bg-white/5 text-muted-foreground",
                          day.isToday && "ring-1 ring-primary/30"
                        )}>
                          {day.label}
                        </div>
                        <span className={cn("text-[10px] font-bold text-muted-foreground", day.isToday && "text-primary")}>Day {day.dayNumber}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Performance Overview */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold">Performance Overview</h3>
              {solvedQuestions > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { name: 'Accuracy', progress: accuracy, icon: TrendingUp },
                    { name: 'Win Rate', progress: solvedQuestions > 0 ? Math.round((lbStats.total_wins / solvedQuestions) * 100) : 0, icon: Brain },
                  ].map((cat) => (
                    <div key={cat.name} className="glass-card p-5 rounded-2xl border-white/5 hover:border-primary/20 transition-colors group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg group-hover:rotate-12 transition-transform">
                            <cat.icon className="w-5 h-5 text-primary" />
                          </div>
                          <span className="font-bold">{cat.name}</span>
                        </div>
                        <span className="text-xs font-bold text-primary">{Math.max(0, cat.progress)}%</span>
                      </div>
                      <Progress value={Math.max(0, cat.progress)} className="h-1.5" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-card p-8 rounded-2xl border-white/5 text-center">
                  <p className="text-muted-foreground mb-4">Start taking quizzes to build your category mastery</p>
                  <Button asChild>
                    <Link to="/quiz">Take a Quiz</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
             {/* Badges Section */}
             <div className="glass-card p-6 rounded-3xl border-white/5 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">Recent Badges</h3>
                <Link to={`/user/${username.toLowerCase().replace(/\s+/g, '-')}`} className="text-xs font-bold text-primary hover:underline">View All</Link>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {displayBadges.length > 0 ? (
                  displayBadges.map((badge) => (
                    <div key={badge.id} className={cn(
                      "aspect-square rounded-2xl flex flex-col items-center justify-center p-2 text-center gap-1 transition-all group",
                      "bg-white/5 hover:bg-white/10"
                    )}>
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform", levelColorMap[badge.level] || 'bg-primary')}>
                        <Medal className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-[9px] font-bold leading-tight">{badge.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-6 text-muted-foreground text-sm">
                    <p>Complete questions to unlock badges</p>
                  </div>
                )}
              </div>
            </div>

            {/* Top Players */}
            <div className="glass-card p-6 rounded-3xl border-white/5 space-y-6">
              <h3 className="font-bold">Top Players</h3>
              {topPlayers.length > 0 ? (
                <div className="space-y-5">
                  {topPlayers.map((player, i) => (
                    <div key={player.id || i} className="flex gap-3 items-center">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold">
                        #{i + 1}
                      </div>
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{player.name || player.username || 'Player'}</p>
                        <p className="text-[10px] text-muted-foreground">{player.total_points ?? 0} pts &middot; {player.wins ?? 0}W</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">No leaderboard data yet</p>
              )}
              <Button variant="outline" className="w-full glass-button text-xs font-bold h-9" asChild>
                <Link to="/leaderboard">View Leaderboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
