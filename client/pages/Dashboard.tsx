import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Zap, 
  Star, 
  Target, 
  Flame, 
  Medal,
  Calendar,
  ChevronRight,
  TrendingUp,
  Brain,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const allBadges = [
  { id: 1, name: 'Beginner', level: 'Bronze', color: 'bg-orange-400', minWins: 0 },
  { id: 2, name: 'Code Master', level: 'Silver', color: 'bg-slate-400', minWins: 10 },
  { id: 3, name: 'AI Explorer', level: 'Gold', color: 'bg-yellow-400', minWins: 25 },
  { id: 4, name: '7 Day Streak', level: 'Bronze', color: 'bg-orange-400', minWins: 7 },
  { id: 5, name: '30 Day Streak', level: 'Gold', color: 'bg-yellow-400', minWins: 30 },
  { id: 6, name: 'System Architect', level: 'Platinum', color: 'bg-cyan-400', minWins: 50 },
];

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [globalRank, setGlobalRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGlobalRank = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, total_points');

      if (error) {
        console.error('Error fetching rankings:', error);
        return;
      }

      if (data && data.length > 0) {
        // Sort by total_points descending
        const sorted = data.sort((a: any, b: any) => (b.total_points || 0) - (a.total_points || 0));
        const rank = sorted.findIndex((p: any) => p.id === userId) + 1;
        console.log(`✅ Global Rank calculated: ${rank} for user ${userId}`);
        setGlobalRank(rank);
      }
    } catch (err) {
      console.error('Error calculating rank:', err);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      
      // Fetch user profile
      if (user?.id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        setProfile(profileData || {
          wins: 0,
          losses: 0,
          accuracy: 0,
          elo_rating: 1200,
          total_points: 0,
          streak: 0,
        });

        // Fetch global rank
        await fetchGlobalRank(user.id);
      }
      setLoading(false);
    });
  }, []);

  const username = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Developer';

  // Calculate stats from real profile data
  const totalPoints = profile?.total_points || 0;
  const rank = globalRank || 'Calculating...';
  const solvedQuestions = (profile?.wins || 0) + (profile?.losses || 0);
  const dailyStreak = profile?.streak || 0;
  const accuracy = solvedQuestions > 0 ? Math.round(((profile?.wins || 0) / solvedQuestions) * 100) : 0;

  const stats = [
    { label: 'Total Points', value: totalPoints.toString(), icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'Global Rank', value: rank.toString(), icon: Trophy, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Solved Qs', value: solvedQuestions.toString(), icon: Target, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Daily Streak', value: `${dailyStreak} days`, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  // Get unlocked badges based on wins
  const unlockedBadges = allBadges.filter(badge => (profile?.wins || 0) >= badge.minWins);
  const displayBadges = unlockedBadges.slice(0, 6);

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
            <p className="text-muted-foreground">Keep up the momentum. You're in the top 5% this week!</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Button className="h-12 px-6 font-bold shadow-lg shadow-primary/20 flex-1 md:flex-none" asChild>
              <Link to="/user/me">
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
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card p-6 rounded-2xl border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className={cn("p-2 rounded-lg", stat.bg)}>
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
                <Badge variant="secondary" className="bg-white/5 text-[10px]">Weekly +12%</Badge>
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
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                    const isInStreak = i < dailyStreak;
                    return (
                      <div key={i} className="flex-1 text-center space-y-2">
                        <div className={cn(
                          "h-10 rounded-xl flex items-center justify-center font-bold transition-all",
                          isInStreak ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "bg-white/5 text-muted-foreground"
                        )}>
                          {day}
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground">Day {i + 1}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Categories to Master */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold">Categories to Master</h3>
              {solvedQuestions > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { name: 'JavaScript', progress: accuracy, icon: TrendingUp },
                    { name: 'System Design', progress: Math.max(0, accuracy - 15), icon: Brain },
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
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform", badge.color)}>
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

            {/* Friends/Global Activity */}
            <div className="glass-card p-6 rounded-3xl border-white/5 space-y-6">
              <h3 className="font-bold">Live Activity</h3>
              <div className="space-y-5">
                {[
                  { user: 'Alex R.', action: 'completed', target: 'JavaScript Quiz', time: '2m ago' },
                  { user: 'Sarah C.', action: 'earned', target: 'Code Master Badge', time: '15m ago' },
                  { user: 'Michael K.', action: 'reached', target: 'Top 10 Leaderboard', time: '1h ago' },
                ].map((act, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold">
                      {act.user.slice(0, 2)}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs">
                        <span className="font-bold">{act.user}</span> {act.action} <span className="font-bold text-primary">{act.target}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">{act.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full glass-button text-xs font-bold h-9">
                Show Global Feed
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
