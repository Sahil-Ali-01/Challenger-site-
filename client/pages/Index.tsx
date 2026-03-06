import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import {
  Brain,
  Trophy,
  Zap,
  Code2,
  Cpu,
  Terminal,
  Layers,
  ChevronRight,
  Star,
  Users,
  Timer,
  Swords,
  Loader2,
  Flame,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const categories = [
  { name: 'Programming', icon: Code2, count: 120, color: 'text-blue-400' },
  { name: 'JavaScript', icon: Terminal, count: 85, color: 'text-yellow-400' },
  { name: 'Python', icon: Code2, count: 64, color: 'text-green-400' },
  { name: 'AI & ML', icon: Cpu, count: 42, color: 'text-purple-400' },
  { name: 'Computer Science', icon: Brain, count: 95, color: 'text-pink-400' },
  { name: 'System Design', icon: Layers, count: 30, color: 'text-cyan-400' },
];

interface UserStats {
  id: string;
  username: string;
  full_name: string;
  wins: number;
  losses: number;
  elo_rating: number;
  weekly_points: number;
  accuracy: number;
}

export default function Index() {
  const [user, setUser] = useState<any>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isExperiencedUser, setIsExperiencedUser] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      if (authUser) {
        // Get user stats from profiles table
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profileData) {
          setUserStats(profileData);
          // Set flags explicitly
          if (profileData.wins === 0) {
            setIsNewUser(true);
            setIsExperiencedUser(false);
          } else if (profileData.wins > 0) {
            setIsExperiencedUser(true);
            setIsNewUser(false);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <Layout>
        <section className="py-20 lg:py-32 flex flex-col items-center text-center justify-center min-h-screen">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading your profile...</p>
        </section>
      </Layout>
    );
  }

  // Show dashboard for new logged-in users
  if (isNewUser && user && userStats) {
    return (
      <Layout>
        {/* New User Welcome */}
        <section className="py-20 lg:py-32 flex flex-col items-center text-center space-y-8 relative overflow-hidden">
          <div className="space-y-4 max-w-3xl">
            <Badge variant="outline" className="px-4 py-1 border-primary/20 bg-primary/5 text-primary animate-fade-in">
              👋 Welcome to Biharicoder
            </Badge>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
              Ready to <span className="text-gradient">Level Up</span>, {userStats.full_name?.split(' ')[0]}?
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              You've joined the community! Start solving daily challenges to earn points, unlock achievements, and compete on the global leaderboard.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Button size="lg" className="px-8 h-12 text-base font-semibold shadow-lg shadow-primary/25" asChild>
              <Link to="/quiz">Start Your First Challenge <Zap className="ml-2 w-4 h-4 fill-current" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="px-8 h-12 text-base font-semibold glass-button" asChild>
              <Link to="/leaderboard">View Leaderboard</Link>
            </Button>
          </div>

          {/* New User Stats Card */}
          <div className="pt-16 w-full max-w-2xl">
            <div className="glass-card p-8 rounded-3xl border-white/5 space-y-6">
              <h3 className="text-2xl font-bold text-center">Your Starting Profile</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center space-y-2">
                  <div className="flex justify-center mb-2">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Trophy className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">ELO Rating</p>
                  <p className="text-2xl font-bold">{userStats.elo_rating}</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="flex justify-center mb-2">
                    <div className="p-3 bg-yellow-500/10 rounded-lg">
                      <Zap className="w-5 h-5 text-yellow-500" />
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Weekly Points</p>
                  <p className="text-2xl font-bold">{userStats.weekly_points}</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="flex justify-center mb-2">
                    <div className="p-3 bg-green-500/10 rounded-lg">
                      <Target className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Accuracy</p>
                  <p className="text-2xl font-bold">{userStats.accuracy.toFixed(0)}%</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="flex justify-center mb-2">
                    <div className="p-3 bg-orange-500/10 rounded-lg">
                      <Flame className="w-5 h-5 text-orange-500" />
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Streak</p>
                  <p className="text-2xl font-bold">0 days</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                💡 Your stats will update as you complete challenges. Start solving to unlock achievements and climb the leaderboard!
              </p>
            </div>
          </div>
        </section>

        {/* Categories for new users */}
        <section className="py-20">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Browse Categories</h2>
              <p className="text-muted-foreground">Pick a topic to start testing your knowledge.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <Link 
                key={cat.name} 
                to={`/quiz?category=${cat.name.toLowerCase()}`}
                className="glass-card p-6 rounded-2xl hover:scale-[1.02] transition-all duration-300 group cursor-pointer border-white/5 hover:border-primary/20"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl bg-white/5 group-hover:bg-primary/10 transition-colors ${cat.color}`}>
                    <cat.icon className="w-6 h-6" />
                  </div>
                  <Badge variant="secondary" className="bg-white/5 text-xs">
                    {cat.count} Qs
                  </Badge>
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{cat.name}</h3>
                <p className="text-sm text-muted-foreground">Master the core concepts of {cat.name}.</p>
              </Link>
            ))}
          </div>
        </section>
      </Layout>
    );
  }

  // Show dashboard for experienced users
  if (isExperiencedUser && user && userStats) {
    return (
      <Layout>
        {/* Existing User Header */}
        <section className="py-16 space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Welcome back, <span className="text-primary">{userStats.full_name?.split(' ')[0]}</span>! 👋
            </h1>
            <p className="text-lg text-muted-foreground">You're on a roll! Keep solving to climb the leaderboard.</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="glass-card p-6 rounded-2xl border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Wins</p>
                <Trophy className="w-4 h-4 text-yellow-400" />
              </div>
              <p className="text-3xl font-bold">{userStats.wins}</p>
              <p className="text-xs text-muted-foreground">Questions solved</p>
            </div>

            <div className="glass-card p-6 rounded-2xl border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Accuracy</p>
                <Target className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-3xl font-bold">{userStats.accuracy.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Overall accuracy</p>
            </div>

            <div className="glass-card p-6 rounded-2xl border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">ELO Rating</p>
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <p className="text-3xl font-bold">{userStats.elo_rating}</p>
              <p className="text-xs text-muted-foreground">Your rating</p>
            </div>

            <div className="glass-card p-6 rounded-2xl border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Weekly Points</p>
                <Flame className="w-4 h-4 text-orange-400" />
              </div>
              <p className="text-3xl font-bold">{userStats.weekly_points}</p>
              <p className="text-xs text-muted-foreground">This week</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="px-8 h-12 font-bold shadow-lg shadow-primary/25" asChild>
              <Link to="/quiz">Continue Challenge <Zap className="ml-2 w-4 h-4 fill-current" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="px-8 h-12 font-bold glass-button" asChild>
              <Link to="/user/me">View Profile</Link>
            </Button>
          </div>
        </section>

        {/* Categories */}
        <section className="py-20">
          <div className="space-y-6 mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Continue Learning</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat) => (
                <Link 
                  key={cat.name} 
                  to={`/quiz?category=${cat.name.toLowerCase()}`}
                  className="glass-card p-6 rounded-2xl hover:scale-[1.02] transition-all duration-300 group cursor-pointer border-white/5 hover:border-primary/20"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl bg-white/5 group-hover:bg-primary/10 transition-colors ${cat.color}`}>
                      <cat.icon className="w-6 h-6" />
                    </div>
                    <Badge variant="secondary" className="bg-white/5 text-xs">
                      {cat.count} Qs
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{cat.name}</h3>
                  <p className="text-sm text-muted-foreground">Master the core concepts of {cat.name}.</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  // Default Landing Page (Not Logged In)
  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-20 lg:py-32 flex flex-col items-center text-center space-y-8 relative overflow-hidden">
        <div className="space-y-4 max-w-3xl">
          <Badge variant="outline" className="px-4 py-1 border-primary/20 bg-primary/5 text-primary animate-fade-in">
            🚀 New: Daily System Design Challenges
          </Badge>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
            Level Up Your <span className="text-gradient">Coding IQ</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The ultimate gamified platform for developers. Master Programming, AI, and System Design through daily challenges and earn your place on the global leaderboard.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Button size="lg" className="px-8 h-12 text-base font-semibold shadow-lg shadow-primary/25" asChild>
            <Link to="/auth">Sign Up Free <Zap className="ml-2 w-4 h-4 fill-current" /></Link>
          </Button>
          <Button size="lg" variant="outline" className="px-8 h-12 text-base font-semibold glass-button" asChild>
            <Link to="/leaderboard">View Leaderboard</Link>
          </Button>
        </div>

        {/* Stats Preview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 w-full max-w-4xl">
          {[
            { label: 'Active Users', value: '12k+', icon: Users },
            { label: 'Questions Solved', value: '1.2M+', icon: Star },
            { label: 'Battles Won', value: '450k+', icon: Swords },
            { label: 'Daily Challenges', value: '365+', icon: Timer },
          ].map((stat) => (
            <div key={stat.label} className="space-y-1">
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                <stat.icon className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Browse Categories</h2>
            <p className="text-muted-foreground">Select a topic to start testing your knowledge.</p>
          </div>
          <Button variant="ghost" className="hover:text-primary" asChild>
            <Link to="/quiz">View All Categories <ChevronRight className="ml-1 w-4 h-4" /></Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link 
              key={cat.name} 
              to={`/quiz?category=${cat.name.toLowerCase()}`}
              className="glass-card p-6 rounded-2xl hover:scale-[1.02] transition-all duration-300 group cursor-pointer border-white/5 hover:border-primary/20"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl bg-white/5 group-hover:bg-primary/10 transition-colors ${cat.color}`}>
                  <cat.icon className="w-6 h-6" />
                </div>
                <Badge variant="secondary" className="bg-white/5 text-xs">
                  {cat.count} Questions
                </Badge>
              </div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{cat.name}</h3>
              <p className="text-sm text-muted-foreground">Master the core concepts of {cat.name} with our curated MCQs.</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Gamification Features */}
      <section className="py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold tracking-tight leading-tight">
              Earn Points, Badges, and <span className="text-primary">Mastery</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We've built a system that rewards your consistency. The more you learn, the more you earn.
            </p>
          </div>

          <div className="space-y-6">
            {[
              { title: 'Point System', desc: 'Get +10 points for every correct answer and +20 bonus for daily streaks.', icon: Zap },
              { title: 'Daily Challenges', icon: Timer, desc: '10 new curated questions every day to keep your brain sharp.' },
              { title: 'Global Leaderboard', icon: Trophy, desc: 'Compete with developers worldwide on daily, weekly, and all-time rankings.' },
              { title: 'Expert Badges', icon: Star, desc: 'Unlock exclusive badges as you reach milestones in different categories.' },
            ].map((feature) => (
              <div key={feature.title} className="flex gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors">
                <div className="shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">{feature.title}</h4>
                  <p className="text-muted-foreground text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-4 bg-gradient-to-r from-primary to-indigo-600 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
          <div className="glass-card rounded-2xl p-8 border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold">Top Developers</h3>
              <Badge className="bg-green-500/10 text-green-500 border-none">Live Updates</Badge>
            </div>
            
            <div className="space-y-4">
              {[
                { name: 'Alex Rivera', points: '12,450', rank: 1, avatar: 'AR' },
                { name: 'Sarah Chen', points: '11,200', rank: 2, avatar: 'SC' },
                { name: 'Michael K.', points: '10,800', rank: 3, avatar: 'MK' },
                { name: 'Jessica Lee', points: '9,540', rank: 4, avatar: 'JL' },
                { name: 'David Smith', points: '8,900', rank: 5, avatar: 'DS' },
              ].map((user) => (
                <div key={user.name} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-default">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "w-6 text-center font-bold",
                      user.rank === 1 ? "text-yellow-400" : user.rank === 2 ? "text-gray-400" : user.rank === 3 ? "text-amber-600" : "text-muted-foreground"
                    )}>
                      #{user.rank}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                      {user.avatar}
                    </div>
                    <span className="font-medium">{user.name}</span>
                  </div>
                  <span className="font-mono text-sm font-semibold">{user.points} pts</span>
                </div>
              ))}
            </div>

            <Button className="w-full mt-8 glass-button" variant="outline" asChild>
              <Link to="/leaderboard">View Full Leaderboard</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 text-center">
        <div className="glass-card p-12 md:p-20 rounded-[3rem] border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-primary/10 rounded-full blur-[120px] -z-10" />
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to start your challenge?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Join thousands of developers and start testing your skills today. It's free, fun, and designed to help you grow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="px-10 h-14 text-lg font-bold shadow-xl shadow-primary/20" asChild>
              <Link to="/auth">Create Free Account</Link>
            </Button>
            <Button size="lg" variant="outline" className="px-10 h-14 text-lg font-bold glass-button" asChild>
              <Link to="/quiz">Try Guest Mode</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
