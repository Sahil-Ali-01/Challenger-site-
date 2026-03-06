import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Search, 
  TrendingUp, 
  Flame, 
  Star,
  Zap,
  ChevronRight,
  Medal,
  Calendar,
  Clock,
  Sparkles,
  Sword,
  Shield,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState('all-time');
  const [searchQuery, setSearchQuery] = useState('');
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      
      // Determine sort column based on active tab
      let sortColumn = 'elo_rating';
      if (activeTab === 'weekly') sortColumn = 'weekly_points';
      if (activeTab === 'daily') sortColumn = 'daily_points';
      if (activeTab === 'multiplayer') sortColumn = 'elo_rating';
      if (activeTab === 'all-time') sortColumn = 'total_points';

      console.log(`🔵 Fetching leaderboard for tab: ${activeTab}, sorting by: ${sortColumn}`);

      // First try API endpoint
      console.log("📡 Calling /api/leaderboard endpoint...");
      const apiResponse = await fetch('/api/leaderboard');
      const apiData = await apiResponse.json();

      console.log("✅ API Response:", {
        success: apiData.success,
        count: apiData.data?.length,
        total: apiData.total,
        firstItem: apiData.data?.[0],
        error: apiData.error
      });

      if (apiData.success && apiData.data && apiData.data.length > 0) {
        console.log(`✅ Got ${apiData.data.length} profiles from API`);
        
        const rankedData = apiData.data.map((profile: any, index: number) => ({
          id: profile.id,
          name: profile.name || profile.username || 'Anonymous',
          username: profile.username || '',
          points: activeTab === 'weekly' ? (profile.weekly_points || 0) : 
                  activeTab === 'daily' ? (profile.daily_points || 0) :
                  activeTab === 'multiplayer' ? (profile.elo || 1200) :
                  (profile.total_points || 0),
          rank: index + 1,
          avatar: ((profile.name || profile.username || 'A').slice(0, 2)).toUpperCase(),
          streak: profile.streak || 0,
          badges: Math.floor((profile.wins || 0) / 5),
          location: 'Global',
          wins: profile.wins || 0,
          elo: profile.elo || 1200,
        }));
        
        console.log("📊 Transformed leaderboard data:", rankedData);
        setLeaderboardData(rankedData);
      } else {
        // Fallback to direct Supabase query
        console.warn("⚠️  API returned no data, attempting direct Supabase query...");
        
        if (!supabase) {
          console.error("❌ Supabase not initialized");
          setLeaderboardData([]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, wins, losses, elo_rating, weekly_points, daily_points, total_points, accuracy, streak')
          .order(sortColumn, { ascending: false })
          .limit(100);

        if (error) {
          console.error('❌ Supabase error:', error);
          setLeaderboardData([]);
        } else {
          console.log(`✅ Supabase query successful: ${data?.length || 0} profiles`);
          const rankedData = (data || []).map((profile, index) => ({
            id: profile.id,
            name: profile.full_name || profile.username || 'Anonymous',
            username: profile.username || '',
            points: activeTab === 'weekly' ? (profile.weekly_points || 0) : 
                    activeTab === 'daily' ? (profile.daily_points || 0) :
                    activeTab === 'multiplayer' ? (profile.elo_rating || 1200) :
                    (profile.total_points || 0),
            rank: index + 1,
            avatar: (profile.full_name || profile.username || 'A').slice(0, 2).toUpperCase(),
            streak: profile.streak || 0,
            badges: Math.floor((profile.wins || 0) / 5),
            location: 'Global',
            wins: profile.wins || 0,
            elo: profile.elo_rating || 1200,
          }));
          setLeaderboardData(rankedData);
        }
      }
    } catch (err) {
      console.error('❌ Leaderboard fetch error:', err);
      setLeaderboardData([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = leaderboardData.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div className="max-w-6xl mx-auto py-8 lg:py-12 space-y-12">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-end gap-8 mb-12">
          <div className="space-y-4 max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">World <span className="text-gradient">Rankings</span></h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Compete with developers globally. Earn points by solving challenges, maintaining streaks, and mastering new technologies.
            </p>
          </div>
          
          <div className="w-full lg:w-80 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search developers..."
              className="w-full pl-10 pr-4 h-12 rounded-2xl bg-white/5 border border-white/5 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs and Filters */}
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex p-1.5 bg-white/5 rounded-[1.5rem] border border-white/5">
            {[
              { id: 'daily', label: 'Daily', icon: Clock },
              { id: 'weekly', label: 'Weekly', icon: Calendar },
              { id: 'all-time', label: 'All Time', icon: Trophy },
              { id: 'multiplayer', label: '1v1 Battle', icon: Sword },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold transition-all",
                  activeTab === tab.id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-yellow-400" /> Top 0.1% Global</span>
            <span className="h-4 w-px bg-white/10" />
            <span>Updated 2m ago</span>
          </div>
        </div>

        {/* Top 3 Winners Area */}
        {searchQuery === '' && filteredUsers.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
             {/* Rank 2 */}
             <div className="order-2 md:order-1 pt-12">
               <div className="glass-card p-8 rounded-[2.5rem] text-center space-y-4 relative border-slate-500/10 scale-95 origin-bottom opacity-90">
                 <div className="w-20 h-20 rounded-full bg-slate-400/20 flex items-center justify-center mx-auto mb-6 relative">
                   <div className="w-full h-full rounded-full border-4 border-slate-400/50 flex items-center justify-center text-xl font-bold">{filteredUsers[1]?.avatar}</div>
                   <div className="absolute -bottom-2 right-0 w-8 h-8 rounded-full bg-slate-400 flex items-center justify-center text-xs font-bold text-slate-900 border-4 border-background">2</div>
                 </div>
                 <h3 className="text-xl font-bold">{filteredUsers[1]?.name}</h3>
                 <p className="text-sm font-bold text-slate-400">{filteredUsers[1]?.points.toLocaleString()} pts</p>
                 <Badge variant="outline" className="border-slate-500/20 text-slate-400 bg-slate-500/5 px-3">{filteredUsers[1]?.streak} Day Streak</Badge>
               </div>
             </div>

             {/* Rank 1 */}
             <div className="order-1 md:order-2">
               <div className="glass-card p-10 rounded-[3rem] text-center space-y-6 relative border-primary/20 shadow-[0_0_50px_rgba(var(--primary),0.1)] group overflow-hidden">
                 <div className="absolute -inset-10 bg-gradient-to-b from-primary/10 to-transparent blur-3xl opacity-50 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
                 <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-8 relative z-10 scale-110">
                    <div className="w-full h-full rounded-full border-4 border-primary flex items-center justify-center text-2xl font-bold text-primary shadow-[0_0_20px_rgba(var(--primary),0.5)]">{filteredUsers[0]?.avatar}</div>
                    <div className="absolute -bottom-3 right-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground border-4 border-background shadow-xl">1</div>
                    <Trophy className="absolute -top-12 left-1/2 -translate-x-1/2 w-10 h-10 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)] animate-bounce" />
                 </div>
                 <div className="space-y-2 relative z-10">
                   <h3 className="text-2xl font-black tracking-tight">{filteredUsers[0]?.name}</h3>
                   <p className="text-lg font-black text-primary">{filteredUsers[0]?.points.toLocaleString()} pts</p>
                 </div>
                 <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 px-4 py-1 text-sm font-black relative z-10">WORLD LEADER</Badge>
               </div>
             </div>

             {/* Rank 3 */}
             <div className="order-3 md:order-3 pt-12">
                <div className="glass-card p-8 rounded-[2.5rem] text-center space-y-4 relative border-amber-600/10 scale-95 origin-bottom opacity-80">
                 <div className="w-20 h-20 rounded-full bg-amber-600/20 flex items-center justify-center mx-auto mb-6 relative">
                   <div className="w-full h-full rounded-full border-4 border-amber-600/50 flex items-center justify-center text-xl font-bold">{filteredUsers[2]?.avatar}</div>
                   <div className="absolute -bottom-2 right-0 w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-xs font-bold text-white border-4 border-background">3</div>
                 </div>
                 <h3 className="text-xl font-bold">{filteredUsers[2]?.name}</h3>
                 <p className="text-sm font-bold text-amber-600">{filteredUsers[2]?.points.toLocaleString()} pts</p>
                 <Badge variant="outline" className="border-amber-600/20 text-amber-600 bg-amber-600/5 px-3">Top Contributor</Badge>
               </div>
             </div>
          </div>
        )}

        {/* Global List Table */}
        <div className="glass-card rounded-[2.5rem] overflow-hidden border-white/5 p-4 lg:p-8">
           <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
            <div className="col-span-1">Rank</div>
            <div className="col-span-5">Developer</div>
            <div className="col-span-2 text-center">{activeTab === 'multiplayer' ? 'Wins' : 'Streak'}</div>
            <div className="col-span-2 text-center">{activeTab === 'multiplayer' ? 'ELO' : 'Badges'}</div>
            <div className="col-span-2 text-right">
              {activeTab === 'weekly' ? 'Weekly Points' : 
               activeTab === 'daily' ? 'Daily Points' :
               activeTab === 'multiplayer' ? 'ELO Rating' :
               'All Time Points'}
            </div>
          </div>

          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
                <p>No users found for this ranking type</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <Link 
                  key={user.id} 
                  to={`/user/${user.username || user.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className={cn(
                    "grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-6 py-5 rounded-[2rem] border border-transparent hover:border-white/10 hover:bg-white/5 transition-all group",
                    user.rank === 1 && "bg-primary/5 border-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.05)]"
                  )}
                >
                  <div className="col-span-1 flex items-center gap-4 md:block">
                    <span className={cn(
                      "text-xl font-black w-8 flex items-center justify-center",
                      user.rank === 1 ? "text-primary" : user.rank === 2 ? "text-slate-400" : user.rank === 3 ? "text-amber-600" : "text-muted-foreground"
                    )}>
                      #{user.rank}
                    </span>
                    <div className="md:hidden flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-xs">{user.avatar}</div>
                      <div>
                        <h4 className="font-bold">{user.name}</h4>
                        <p className="text-[10px] text-muted-foreground">{user.location}</p>
                      </div>
                    </div>
                  </div>

                  <div className="hidden md:col-span-5 md:flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center font-bold group-hover:rotate-6 transition-transform">
                      {user.avatar}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{user.name}</h4>
                      <p className="text-xs text-muted-foreground">{user.location}</p>
                    </div>
                  </div>

                  <div className="col-span-2 flex md:justify-center items-center gap-2">
                     <div className="md:hidden text-xs font-bold text-muted-foreground mr-2">{activeTab === 'multiplayer' ? 'Wins' : 'Streak'}:</div>
                     {activeTab === 'multiplayer' ? <Trophy className="w-4 h-4 text-primary" /> : <Flame className={cn("w-4 h-4", user.streak > 7 ? "text-orange-500 fill-current" : "text-muted-foreground")} />}
                     <span className="font-bold tabular-nums">{activeTab === 'multiplayer' ? user.wins : user.streak}{activeTab === 'multiplayer' ? '' : 'd'}</span>
                  </div>

                  <div className="col-span-2 flex md:justify-center items-center gap-2">
                     <div className="md:hidden text-xs font-bold text-muted-foreground mr-2">{activeTab === 'multiplayer' ? 'ELO' : 'Badges'}:</div>
                     {activeTab === 'multiplayer' ? <Shield className="w-4 h-4 text-primary" /> : <Medal className="w-4 h-4 text-primary" />}
                     <span className="font-bold tabular-nums">{activeTab === 'multiplayer' ? user.elo : user.badges}</span>
                  </div>

                  <div className="col-span-2 text-right">
                     <div className="flex md:block justify-between items-center">
                       <div className="md:hidden text-xs font-bold text-muted-foreground">
                         {activeTab === 'weekly' ? 'Weekly' : 
                          activeTab === 'daily' ? 'Daily' :
                          activeTab === 'multiplayer' ? 'ELO' :
                          'All Time'}:
                       </div>
                       <span className="text-xl font-black text-primary tabular-nums">{user.points.toLocaleString()}</span>
                     </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          <div className="mt-8 text-center pt-8 border-t border-white/5">
            <Button variant="ghost" className="text-muted-foreground hover:text-primary font-bold">
              Load More Rankings <TrendingUp className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
