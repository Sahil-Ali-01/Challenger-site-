import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  User as UserIcon, 
  Star, 
  Target, 
  Flame, 
  Medal,
  Calendar,
  Settings,
  Share2,
  ExternalLink,
  Code2,
  Brain,
  Cpu,
  Terminal,
  Layers,
  Sparkles,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  elo_rating: number;
  weekly_points: number;
  wins: number;
  losses: number;
  accuracy: number;
  total_points: number;
  created_at: string;
}

// Achievement definitions based on user progress
const ACHIEVEMENTS = [
  { id: 'first-solved', name: 'First Step', condition: (p: UserProfile) => p.wins >= 1, points: 50, level: 'Bronze', icon: Medal, color: 'bg-orange-400' },
  { id: 'ten-solved', name: 'Hot Start', condition: (p: UserProfile) => p.wins >= 10, points: 200, level: 'Bronze', icon: Medal, color: 'bg-orange-400' },
  { id: 'fifty-solved', name: 'Quiz Enthusiast', condition: (p: UserProfile) => p.wins >= 50, points: 500, level: 'Silver', icon: Medal, color: 'bg-slate-400' },
  { id: 'hundred-solved', name: 'Century Club', condition: (p: UserProfile) => p.wins >= 100, points: 1000, level: 'Gold', icon: Medal, color: 'bg-yellow-400' },
  { id: 'accuracy-80', name: 'Precision Master', condition: (p: UserProfile) => p.accuracy >= 80, points: 300, level: 'Silver', icon: Medal, color: 'bg-slate-400' },
  { id: 'accuracy-95', name: 'Perfect Aim', condition: (p: UserProfile) => p.accuracy >= 95, points: 750, level: 'Gold', icon: Medal, color: 'bg-yellow-400' },
  { id: 'elo-1400', name: 'Rising Star', condition: (p: UserProfile) => p.elo_rating >= 1400, points: 400, level: 'Silver', icon: Medal, color: 'bg-slate-400' },
  { id: 'elo-1600', name: 'Elite Competitor', condition: (p: UserProfile) => p.elo_rating >= 1600, points: 1200, level: 'Platinum', icon: Medal, color: 'bg-cyan-400' },
  { id: 'win-ratio', name: 'Victory Streak', condition: (p: UserProfile) => p.wins > p.losses && p.wins - p.losses >= 10, points: 600, level: 'Gold', icon: Medal, color: 'bg-yellow-400' },
];

export default function Profile() {
  const { username } = useParams();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [globalRank, setGlobalRank] = useState<number | null>(null);
  const [earnedAchievements, setEarnedAchievements] = useState<typeof ACHIEVEMENTS>([]);
  const [error, setError] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, [username]);

  const fetchGlobalRank = async (userId: string) => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiBase}/api/profile/${userId}/rank`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error fetching global rank:', errorText);
        return;
      }

      const payload = await response.json();
      if (payload?.success && typeof payload?.globalRank === 'number') {
        console.log(`✅ Global Rank fetched from API: ${payload.globalRank} for user ${userId}`);
        setGlobalRank(payload.globalRank);
      }
    } catch (err) {
      console.error('Error calculating rank:', err);
    }
  };

  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!supabase) {
        setError('Supabase not configured');
        setLoading(false);
        return;
      }

      let profileUsername = username;

      // If no username provided or "me", get current user's profile
      if (!username || username === 'me') {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Please log in to view your profile');
          setLoading(false);
          return;
        }
        
        // Get username from user metadata or email
        profileUsername = user.user_metadata?.username || user.email?.split('@')[0] || 'profile';
        setIsOwnProfile(true);
      }

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, name, username, email, created_at')
        .eq('username', profileUsername)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116' || fetchError.code === 'ZERO_RES') {
          setError(`User "${profileUsername}" not found. Make sure the profile has been created.`);
        } else {
          setError(fetchError.message || 'Failed to fetch profile');
        }
        setLoading(false);
        return;
      }

      if (!data) {
        setError('Profile data is empty');
        setLoading(false);
        return;
      }

      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from('leaderboard')
        .select('user_id, elo_rating, total_wins, total_losses, accuracy_percentage, total_points, weekly_points')
        .eq('user_id', data.id)
        .single();

      if (leaderboardError && leaderboardError.code !== 'PGRST116') {
        throw leaderboardError;
      }

      const mergedProfile: UserProfile = {
        id: data.id,
        username: data.username || data.email?.split('@')[0] || 'player',
        full_name: data.name || data.username || data.email?.split('@')[0] || 'Player',
        elo_rating: leaderboardData?.elo_rating ?? 1200,
        weekly_points: leaderboardData?.weekly_points ?? 0,
        wins: leaderboardData?.total_wins ?? 0,
        losses: leaderboardData?.total_losses ?? 0,
        accuracy: leaderboardData?.accuracy_percentage ?? 0,
        total_points: leaderboardData?.total_points ?? 0,
        created_at: data.created_at,
      };

      setUserProfile(mergedProfile);
      
      // Fetch global rank
      await fetchGlobalRank(data.id);
      
      // Calculate earned achievements
      const earned = ACHIEVEMENTS.filter(ach => ach.condition(mergedProfile));
      setEarnedAchievements(earned);
    } catch (err: any) {
      console.error('Profile fetch error:', err);
      setError(err.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error || !userProfile) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto py-8">
          <div className="glass-card p-12 rounded-3xl border-white/5 flex flex-col items-center gap-6 text-center">
            <AlertCircle className="w-16 h-16 text-destructive" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Profile Not Found</h2>
              <p className="text-muted-foreground max-w-md">{error || 'The user profile you are looking for does not exist.'}</p>
              <p className="text-sm text-muted-foreground">
                💡 Make sure you're logged in and have completed registration.
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild variant="outline">
                <Link to="/">Back to Home</Link>
              </Button>
              <Button asChild>
                <Link to="/user/me">View My Profile</Link>
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const user = userProfile;
  const joinDate = new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  
  const stats = [
    { label: 'Global Rank', value: globalRank ? `#${globalRank}` : 'Calculating...', icon: Trophy, color: 'text-yellow-400' },
    { label: 'Points', value: `${user.total_points || 0}`, icon: Star, color: 'text-primary' },
    { label: 'Wins', value: `${user.wins}`, icon: Flame, color: 'text-orange-500' },
    { label: 'Accuracy', value: `${user.accuracy.toFixed(1)}%`, icon: Target, color: 'text-blue-400' },
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 space-y-12">
        {/* Profile Header */}
        <div className="glass-card rounded-[3rem] p-10 md:p-12 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
            <UserIcon className="w-64 h-64 text-primary" />
          </div>
          
          <div className="flex flex-col md:flex-row gap-10 items-start md:items-center relative">
            <div className="relative group">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-primary/20 flex items-center justify-center text-4xl font-bold text-primary relative z-10">
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="absolute -inset-4 bg-primary/20 rounded-[3rem] blur-2xl -z-0 opacity-50" />
            </div>

            <div className="space-y-4 flex-1">
              <div className="flex flex-wrap items-center gap-4">
                <h1 className="text-4xl font-bold tracking-tight">{user.username}</h1>
                {user.wins > 0 && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-none px-3 py-1 font-bold">
                    {user.elo_rating >= 1600 ? 'ELITE' : user.elo_rating >= 1400 ? 'PRO' : 'MEMBER'}
                  </Badge>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="glass-button rounded-xl w-10 h-10">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="glass-button rounded-xl w-10 h-10" asChild>
                    <Link to="/settings"><Settings className="w-4 h-4" /></Link>
                  </Button>
                </div>
              </div>

              {user.wins === 0 ? (
                <p className="text-muted-foreground max-w-xl text-lg leading-relaxed">
                  Welcome! Start solving quiz questions to unlock achievements and build your profile.
                </p>
              ) : (
                <p className="text-muted-foreground max-w-xl text-lg leading-relaxed">
                  {user.wins} questions solved • ELO Rating: {user.elo_rating}
                </p>
              )}

              <div className="flex flex-wrap gap-6 text-sm font-medium text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Joined {joinDate}
                </span>
                <span className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" /> biharicoder.com/u/{user.username}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card p-8 rounded-3xl border-white/5 hover:border-primary/20 transition-all text-center space-y-3 group">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
              <p className="text-4xl font-bold tracking-tight">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Achievements */}
          <div className="lg:col-span-2 space-y-10">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                Achievements Unlocked <Sparkles className="w-5 h-5 text-yellow-400" />
              </h3>
              
              {earnedAchievements.length === 0 ? (
                <div className="glass-card p-12 rounded-3xl border-white/5 text-center space-y-4">
                  <Medal className="w-16 h-16 text-muted-foreground mx-auto opacity-50" />
                  <p className="text-muted-foreground">
                    {user.wins === 0 
                      ? 'Start solving questions to unlock your first achievement!' 
                      : 'Keep improving! More achievements await...'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {earnedAchievements.map((achievement) => (
                    <div key={achievement.id} className="glass-card p-6 rounded-2xl border-white/5 group hover:border-primary/20 transition-all">
                      <div className="flex items-start gap-4">
                        <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-lg group-hover:rotate-12 transition-transform", achievement.color)}>
                          <Medal className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <h4 className="font-bold">{achievement.name}</h4>
                          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">{achievement.level}</p>
                          <p className="text-sm text-primary font-bold mt-2">+{achievement.points} Points</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Locked Achievements */}
            {earnedAchievements.length < ACHIEVEMENTS.length && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold">Locked Achievements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ACHIEVEMENTS.filter(a => !earnedAchievements.find(e => e.id === a.id)).map((achievement) => (
                    <div key={achievement.id} className="glass-card p-6 rounded-2xl border-dashed border-white/20 opacity-50 grayscale">
                      <div className="flex items-start gap-4">
                        <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-lg", achievement.color)}>
                          <Medal className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <h4 className="font-bold">{achievement.name}</h4>
                          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">{achievement.level}</p>
                          <p className="text-sm font-bold mt-2">+{achievement.points} Points</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Stats Summary */}
          <div className="space-y-8">
            <div className="glass-card p-8 rounded-3xl border-white/5 space-y-8">
              <h3 className="text-xl font-bold">Overall Stats</h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span>Win Rate</span>
                    <span className="text-primary">{user.wins + user.losses > 0 ? ((user.wins / (user.wins + user.losses)) * 100).toFixed(1) : 0}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary/50 to-primary" 
                      style={{ width: `${user.wins + user.losses > 0 ? (user.wins / (user.wins + user.losses)) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span>Accuracy</span>
                    <span className="text-primary">{user.accuracy.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-500/50 to-yellow-500" 
                      style={{ width: `${user.accuracy}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span>ELO Progress</span>
                    <span className="text-primary">{user.elo_rating}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500/50 to-cyan-500" 
                      style={{ width: `${Math.min(user.elo_rating / 2000 * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Wins</span>
                  <span className="font-bold">{user.wins}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Losses</span>
                  <span className="font-bold">{user.losses}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Achievements</span>
                  <span className="font-bold">{earnedAchievements.length}/{ACHIEVEMENTS.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
