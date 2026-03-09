import React, { useState, useEffect, useCallback } from 'react';
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
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export default function Leaderboard() {
  const MAX_VISIBLE_RANKERS = 50;
  const apiUrl = (import.meta.env.VITE_API_URL || '').trim();
  const [activeTab, setActiveTab] = useState('all-time');
  const [searchQuery, setSearchQuery] = useState('');
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const sortAndRankRows = (rows: any[]) => {
    const sorted = [...rows].sort((a, b) => {
      if (activeTab === 'multiplayer') {
        const eloDiff = (b.elo || 1200) - (a.elo || 1200);
        if (eloDiff !== 0) return eloDiff;

        return String(a.id || '').localeCompare(String(b.id || ''));
      }

      const pointsDiff = (b.points || 0) - (a.points || 0);
      if (pointsDiff !== 0) return pointsDiff;

      const eloDiff = (b.elo || 1200) - (a.elo || 1200);
      if (eloDiff !== 0) return eloDiff;

      return String(a.id || '').localeCompare(String(b.id || ''));
    });

    return sorted.map((row, index) => ({
      ...row,
      rank: index + 1,
    }));
  };

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);

      const fetchWithFallback = async (path: string, init?: RequestInit) => {
        if (import.meta.env.PROD && !apiUrl) {
          throw new Error('VITE_API_URL is not configured in production. Set it to your Render backend URL.');
        }

        const targets = [
          apiUrl,
          '',
          'http://localhost:8082',
          'http://localhost:8083',
        ]
          .filter((v, i, a) => v !== undefined && a.indexOf(v) === i)
          .filter((v) => !(import.meta.env.PROD && (v === '' || v.startsWith('http://localhost'))));

        let lastError: unknown = null;

        for (const base of targets) {
          try {
            return await fetch(`${base}${path}`, init);
          } catch (error) {
            lastError = error;
          }
        }

        throw lastError || new Error('Failed to fetch');
      };

      const parseJsonSafely = async (response: Response) => {
        const raw = await response.text();

        if (!raw || !raw.trim()) {
          return null;
        }

        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      };
      
      // Determine sort column based on active tab
      let sortColumn = 'elo_rating';
      if (activeTab === 'weekly') sortColumn = 'weekly_points';
      if (activeTab === 'daily') sortColumn = 'daily_points';
      if (activeTab === 'multiplayer') sortColumn = 'elo_rating';
      if (activeTab === 'all-time') sortColumn = 'total_points';

      console.log(`🔵 Fetching leaderboard for tab: ${activeTab}, sorting by: ${sortColumn}`);

      // First try API endpoint
      console.log("📡 Calling /api/leaderboard endpoint...");
      const apiResponse = await fetchWithFallback(`/api/leaderboard?type=${encodeURIComponent(activeTab)}`);
      const apiData = await parseJsonSafely(apiResponse);

      console.log("✅ API Response:", {
        success: apiData?.success,
        count: apiData?.data?.length,
        total: apiData?.total,
        firstItem: apiData?.data?.[0],
        error: apiData?.error
      });

      if (apiData?.success && apiData?.data && apiData.data.length > 0) {
        console.log(`✅ Got ${apiData.data.length} profiles from API`);
        
        const rows = apiData.data.map((profile: any, index: number) => ({
          id: profile.id,
          name: profile.name || profile.username || 'Anonymous',
          username: profile.username || '',
          points: activeTab === 'weekly' ? (profile.weekly_points ?? profile.total_points ?? 0) : 
            activeTab === 'daily' ? (profile.daily_points ?? profile.weekly_points ?? profile.total_points ?? 0) :
                  activeTab === 'multiplayer' ? (profile.elo || 1200) :
                  (profile.total_points || 0),
          rank: profile.rank ?? (index + 1),
          avatar: ((profile.name || profile.username || 'A').slice(0, 2)).toUpperCase(),
          streak: profile.streak || 0,
          badges: Math.floor((profile.wins || 0) / 5),
          location: 'Global',
          wins: profile.wins || 0,
          elo: profile.elo || 1200,
        }));

        const rankedData = sortAndRankRows(rows);
        
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
          const rows = (data || []).map((profile, index) => ({
            id: profile.id,
            name: profile.full_name || profile.username || 'Anonymous',
            username: profile.username || '',
              points: activeTab === 'weekly' ? (profile.weekly_points ?? profile.total_points ?? 0) : 
                activeTab === 'daily' ? (profile.daily_points ?? profile.weekly_points ?? profile.total_points ?? 0) :
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
          const rankedData = sortAndRankRows(rows);
          setLeaderboardData(rankedData);
        }
      }
    } catch (err) {
      console.error('❌ Leaderboard fetch error:', err);
      setLeaderboardData([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, apiUrl]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    let timer: any = null;

    const onStatsUpdated = () => {
      if (timer) {
        clearTimeout(timer);
      }

      // Small debounce to coalesce back-to-back updates from battle end.
      timer = setTimeout(() => {
        fetchLeaderboard();
      }, 250);
    };

    window.addEventListener('profile:stats-updated', onStatsUpdated as EventListener);

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      window.removeEventListener('profile:stats-updated', onStatsUpdated as EventListener);
    };
  }, [fetchLeaderboard]);

  const filteredUsers = leaderboardData.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const visibleUsers = filteredUsers.slice(0, MAX_VISIBLE_RANKERS);

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
      <div className="max-w-6xl mx-auto py-6 lg:py-10 space-y-10">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-end gap-6 mb-8">
          <div className="space-y-3 max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">World <span className="text-gradient">Rankings</span></h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              Compete with developers globally. Earn points by solving challenges, maintaining streaks, and mastering new technologies.
            </p>
          </div>
          
          <div className="w-full lg:w-80 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search developers..."
              className="w-full pl-10 pr-4 h-10 rounded-xl bg-background/60 border border-border/70 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs and Filters */}
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex p-1 bg-background/50 rounded-xl border border-border/70">
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
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                  activeTab === tab.id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-yellow-400" /> Top 0.1% Global</span>
            <span className="h-4 w-px bg-white/10" />
            <span>Updated 2m ago</span>
          </div>
        </div>

        {/* Top 3 Winners Area */}
        {searchQuery === '' && filteredUsers.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
             {/* Rank 2 */}
             <div className="order-2 md:order-1 pt-6 md:pt-8">
               <div className="glass-card w-52 h-52 mx-auto rounded-full text-center relative border-slate-500/30 scale-[0.97] origin-bottom opacity-95 overflow-hidden shadow-[0_12px_34px_-20px_rgba(148,163,184,0.85)] p-4 flex flex-col items-center justify-center gap-2">
                 <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_26%,rgba(255,255,255,0.18)_42%,transparent_58%)] animate-[pulse_3.4s_ease-in-out_infinite]" />
                 <div className="absolute -inset-x-10 -top-14 h-20 bg-gradient-to-r from-slate-400/10 via-slate-300/20 to-slate-400/10 blur-2xl" />
                 <div className="w-14 h-14 rounded-full bg-slate-400/15 flex items-center justify-center mx-auto relative z-10">
                   <div className="w-full h-full rounded-full border-[3px] border-slate-300/60 flex items-center justify-center text-sm font-bold">{filteredUsers[1]?.avatar}</div>
                   <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center text-[10px] font-black text-slate-900 border-2 border-background">2</div>
                 </div>
                 <h3 className="text-sm font-black leading-tight bg-gradient-to-r from-zinc-100 via-slate-200 to-zinc-400 bg-clip-text text-transparent">{filteredUsers[1]?.name}</h3>
                 <p className="text-xs font-black text-slate-300">{filteredUsers[1]?.points.toLocaleString()} pts</p>
                 <Badge variant="outline" className="border-slate-400/30 text-slate-300 bg-slate-500/10 px-2 py-0 text-[10px] font-bold">{filteredUsers[1]?.streak} Day Streak</Badge>
               </div>
             </div>

             {/* Rank 1 */}
             <div className="order-1 md:order-2">
               <div className="glass-card w-56 h-56 mx-auto rounded-full text-center relative border-primary/35 shadow-[0_18px_42px_-22px_rgba(34,211,238,0.9)] group overflow-hidden p-4 flex flex-col items-center justify-center gap-2">
                 <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_24%,rgba(255,255,255,0.24)_40%,transparent_56%)] animate-[pulse_3s_ease-in-out_infinite]" />
                 <div className="absolute -inset-x-10 -top-16 h-24 bg-gradient-to-r from-cyan-300/15 via-primary/20 to-emerald-300/15 blur-2xl opacity-90 pointer-events-none group-hover:scale-105 transition-transform duration-700" />
                 <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto relative z-10">
                    <div className="w-full h-full rounded-full border-[3px] border-primary flex items-center justify-center text-base font-black text-primary shadow-[0_0_14px_rgba(34,211,238,0.5)]">{filteredUsers[0]?.avatar}</div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center text-[11px] font-black text-primary-foreground border-2 border-background shadow-xl">1</div>
                    <Trophy className="absolute -top-8 left-1/2 -translate-x-1/2 w-6 h-6 text-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.6)] animate-bounce" />
                 </div>
                 <div className="space-y-1 relative z-10">
                   <h3 className="text-base font-black tracking-tight bg-gradient-to-r from-amber-200 via-zinc-100 to-amber-300 bg-clip-text text-transparent">{filteredUsers[0]?.name}</h3>
                   <p className="text-xs font-black text-primary">{filteredUsers[0]?.points.toLocaleString()} pts</p>
                 </div>
                 <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 px-3 py-0 text-[10px] font-black relative z-10 tracking-wide">WORLD LEADER</Badge>
               </div>
             </div>

             {/* Rank 3 */}
             <div className="order-3 md:order-3 pt-6 md:pt-8">
                <div className="glass-card w-52 h-52 mx-auto rounded-full text-center relative border-amber-500/30 scale-[0.97] origin-bottom opacity-95 overflow-hidden shadow-[0_12px_34px_-20px_rgba(251,191,36,0.8)] p-4 flex flex-col items-center justify-center gap-2">
                 <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_26%,rgba(255,255,255,0.18)_42%,transparent_58%)] animate-[pulse_3.6s_ease-in-out_infinite]" />
                 <div className="absolute -inset-x-10 -top-14 h-20 bg-gradient-to-r from-amber-300/10 via-amber-400/20 to-amber-300/10 blur-2xl" />
                 <div className="w-14 h-14 rounded-full bg-amber-500/15 flex items-center justify-center mx-auto relative z-10">
                   <div className="w-full h-full rounded-full border-[3px] border-amber-400/60 flex items-center justify-center text-sm font-bold">{filteredUsers[2]?.avatar}</div>
                   <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-[10px] font-black text-white border-2 border-background">3</div>
                 </div>
                 <h3 className="text-sm font-black leading-tight bg-gradient-to-r from-amber-100 via-zinc-100 to-amber-300 bg-clip-text text-transparent">{filteredUsers[2]?.name}</h3>
                 <p className="text-xs font-black text-amber-400">{filteredUsers[2]?.points.toLocaleString()} pts</p>
                 <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 px-2 py-0 text-[10px] font-bold">Top Contributor</Badge>
               </div>
             </div>
          </div>
        )}

        {/* Global List Table */}
          <div className="glass-card rounded-2xl overflow-hidden border-border/70 p-2 lg:p-3">
            <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2 border-b border-border/70 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
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

          <div className="space-y-1.5">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
                <p>No users found for this ranking type</p>
              </div>
            ) : (
              visibleUsers.map((user) => (
                <div
                  key={user.id}
                  className={cn(
                    "grid grid-cols-1 md:grid-cols-12 gap-2 items-center px-3 py-2 md:py-2.5 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/5 transition-all group",
                    user.rank === 1 && "bg-primary/5 border-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.05)]"
                  )}
                >
                  <div className="col-span-1 flex items-center gap-3 md:block md:min-w-[72px]">
                    <span className={cn(
                      "inline-flex h-8 min-w-[3rem] items-center justify-center whitespace-nowrap leading-none tabular-nums font-black text-lg",
                      user.rank === 1 ? "text-primary" : user.rank === 2 ? "text-slate-400" : user.rank === 3 ? "text-amber-600" : "text-muted-foreground"
                    )}>
                      #{user.rank}
                    </span>
                    <div className="md:hidden flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold text-[10px]">{user.avatar}</div>
                      <div>
                        <h4 className="font-bold text-sm">{user.name}</h4>
                        <p className="text-[10px] text-muted-foreground">{user.location}</p>
                      </div>
                    </div>
                  </div>

                  <div className="hidden md:col-span-5 md:flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold text-[11px] group-hover:rotate-6 transition-transform">
                      {user.avatar}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm leading-tight">{user.name}</h4>
                      <p className="text-[10px] text-muted-foreground leading-tight">{user.location}</p>
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
                       <span className="text-base font-black text-primary tabular-nums">{user.points.toLocaleString()}</span>
                     </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {filteredUsers.length > MAX_VISIBLE_RANKERS && (
            <div className="mt-4 text-center text-xs text-muted-foreground">
              Showing top {MAX_VISIBLE_RANKERS} of {filteredUsers.length} rankers
            </div>
          )}

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
