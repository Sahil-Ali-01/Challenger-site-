import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  Swords, 
  Users, 
  Trophy, 
  Search, 
  Zap, 
  Timer,
  Shield,
  Star,
  ChevronRight,
  Flame
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

let globalSocket: Socket | null = null;

export default function Battle() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [onlinePlayers, setOnlinePlayers] = useState(124);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get current user
    if (supabase) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        setCurrentUser(user);
      });
    }
  }, []);

  useEffect(() => {
    let interval: any;
    if (isSearching) {
      interval = setInterval(() => {
        setSearchTime(prev => prev + 1);
      }, 1000);
    } else {
      setSearchTime(0);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  const startMatchmaking = async () => {
    // Prevent double-clicking
    if (isSearching) {
      console.log("⚠️ Already searching, ignoring duplicate click");
      return;
    }

    console.log("\n========== STARTING MATCHMAKING ==========");

    // Fetch current user if not already loaded
    let user = currentUser;
    if (!user && supabase) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      user = authUser;
      if (authUser) setCurrentUser(authUser);
    }

    if (!user || !user.id) {
      console.error("❌ User not authenticated");
      alert("Please log in first");
      return;
    }

    console.log("✅ User authenticated:", user.id);

    setIsSearching(true);
    
    // Initialize socket if not already connected
    if (!globalSocket) {
      console.log("📡 Creating NEW socket connection...");
      const serverUrl = window.location.origin; // Use current origin
      console.log("   Connecting to:", serverUrl);
      
      // Explicitly connect to the server URL
      globalSocket = io(serverUrl, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });
      console.log("📡 New socket instance created with explicit URL");
      
      globalSocket.on("connect", () => {
        console.log("🟢 Socket CONNECTED EVENT FIRED");
        console.log("   socket.id:", globalSocket?.id);
        console.log("   socket.connected:", globalSocket?.connected);
      });
      globalSocket.on("disconnect", (reason) => {
        console.log("🔴 Socket DISCONNECTED, reason:", reason);
      });
      globalSocket.on("connect_error", (error) => {
        console.error("🔴 Socket CONNECTION ERROR:", error);
      });
    } else if (!globalSocket.connected) {
      console.log("📡 Socket exists but NOT connected, reusing. id:", globalSocket.id);
    } else {
      console.log("📡 Socket ALREADY connected and reusable, socket.id:", globalSocket.id);
    }
    
    const username = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Player';
    const userId = user.id;
    
    console.log("\n🔹 Socket Status Before Matchmaking:");
    console.log("   Connected:", globalSocket?.connected);
    console.log("   Socket ID:", globalSocket?.id);
    console.log("   Username:", username);
    console.log("   UserId:", userId);
    
    // SET UP LISTENERS FIRST before emitting
    console.log("\n🔧 Setting up match_found listener");
    globalSocket.off("match_found");
    
    globalSocket.on("match_found", ({ roomId, opponent }) => {
      console.log("\n🎮 ===== MATCH FOUND EVENT RECEIVED! =====");
      console.log("   roomId:", roomId);
      console.log("   opponent:", opponent);
      console.log("   globalSocket?.id:", globalSocket?.id);
      setIsSearching(false);
      // Store socket for BattleRoom to use
      (window as any).battleSocket = globalSocket;
      console.log("✅ Socket stored in window.battleSocket");
      console.log("🔀 NAVIGATING to /battle/" + roomId);
      navigate(`/battle/${roomId}`, { state: { opponent } });
      console.log("✅ Navigate called (should transition to BattleRoom)");
    });
    
    console.log("✅ match_found listener REGISTERED\n");
    
    // NOW emit join_matchmaking
    if (globalSocket.connected) {
      console.log("✅ Socket CONNECTED, emitting join_matchmaking NOW");
      globalSocket.emit("join_matchmaking", { username, userId });
      console.log("✅ join_matchmaking EMITTED to server");
    } else {
      console.log("⏳ Socket NOT connected yet, waiting for connect event before emitting...");
      globalSocket.once("connect", () => {
        console.log("✅ Socket connected after waiting, NOW emitting join_matchmaking");
        globalSocket!.emit("join_matchmaking", { username, userId });
        console.log("✅ join_matchmaking EMITTED to server");
      });
    }
    
    console.log("========== MATCHMAKING STARTED ==========\n");
  };

  const cancelMatchmaking = () => {
    setIsSearching(false);
    if (globalSocket) {
      globalSocket.off("match_found");
      globalSocket.emit("leave_matchmaking");
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 lg:py-16 space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <Badge variant="outline" className="px-4 py-1 border-primary/20 bg-primary/5 text-primary">
            ⚔️ LIVE MULTIPLAYER
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight">
            1v1 Real-time <span className="text-gradient">Battle</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Test your speed and accuracy against developers worldwide. Win matches, earn ELO, and climb the weekly leaderboard.
          </p>
        </div>

        {/* Authentication Check */}
        {!currentUser ? (
          <div className="max-w-xl mx-auto">
            <div className="glass-card p-10 md:p-12 rounded-[3rem] border-yellow-500/30 bg-yellow-500/5 relative text-center space-y-6">
              <Shield className="w-12 h-12 mx-auto text-yellow-500" />
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Authentication Required</h3>
                <p className="text-muted-foreground">Please log in to join 1v1 battles and compete with other developers.</p>
              </div>
              <Button 
                size="lg" 
                className="w-full h-14 rounded-[1.5rem] font-bold"
                onClick={() => navigate('/auth')}
              >
                Sign In <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <>
        {/* Matchmaking Card */}
        <div className="max-w-xl mx-auto">
          {!isSearching ? (
            <div className="glass-card p-10 md:p-12 rounded-[3rem] border-white/10 relative group overflow-hidden text-center space-y-10">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-indigo-500/20 rounded-[3rem] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity -z-10" />
              
              <div className="relative inline-flex">
                <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center text-primary group-hover:rotate-12 transition-transform">
                  <Swords className="w-12 h-12" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-background animate-pulse" />
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl font-bold">Ready for a challenge?</h2>
                <div className="flex justify-center gap-6 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                  <span className="flex items-center gap-2 text-green-500"><Users className="w-4 h-4" /> {onlinePlayers} Online</span>
                  <span className="flex items-center gap-2"><Trophy className="w-4 h-4" /> 1,200 ELO</span>
                </div>
              </div>

              <Button 
                size="lg" 
                className="w-full h-16 rounded-[1.5rem] text-xl font-bold shadow-2xl shadow-primary/30 group"
                onClick={startMatchmaking}
              >
                Start Matchmaking <Zap className="ml-2 w-6 h-6 fill-current group-hover:scale-125 transition-transform" />
              </Button>

              <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">
                Average wait time: &lt; 15 seconds
              </p>
            </div>
          ) : (
            <div className="glass-card p-12 md:p-16 rounded-[3rem] border-primary/30 relative text-center space-y-10 animate-in fade-in zoom-in duration-500">
               <div className="relative flex justify-center">
                  <div className="w-32 h-32 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Search className="w-10 h-10 text-primary animate-pulse" />
                  </div>
               </div>

               <div className="space-y-4">
                  <h2 className="text-3xl font-bold">Finding Opponent...</h2>
                  <p className="text-5xl font-mono font-black text-primary tabular-nums">
                    {searchTime}s
                  </p>
               </div>

               <div className="flex items-center justify-center gap-3 p-4 bg-white/5 rounded-2xl">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">SA</div>
                  <span className="text-sm font-bold">Searching for a suitable rival...</span>
               </div>

               <Button 
                variant="ghost" 
                className="text-muted-foreground hover:text-destructive font-bold"
                onClick={cancelMatchmaking}
               >
                 Cancel Search
               </Button>
            </div>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
          {[
            { title: 'ELO Rating', icon: Shield, desc: 'Win against strong players to boost your ELO. Match with equally skilled rivals.', color: 'text-blue-400' },
            { title: 'Speed Bonus', icon: Zap, desc: 'Answer faster than your opponent to earn extra points and psychological advantage.', color: 'text-yellow-400' },
            { title: 'Weekly Rewards', icon: Star, desc: 'Top 3 players every week earn exclusive badges and featured profile status.', color: 'text-primary' },
          ].map((item) => (
            <div key={item.title} className="glass-card p-8 rounded-3xl border-white/5 space-y-4 hover:bg-white/5 transition-colors">
              <div className={cn("p-3 bg-white/5 w-fit rounded-xl", item.color)}>
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Rewards Section */}
        <div className="glass-card p-10 md:p-12 rounded-[3rem] border-white/5 bg-gradient-to-br from-indigo-500/5 to-primary/5">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="space-y-6 flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold">Weekly <span className="text-primary">Champion</span> Rewards</h2>
              <p className="text-muted-foreground leading-relaxed">
                The battle arena resets every Sunday at 00:00 UTC. Be in the top 3 of the 1v1 Battle Leaderboard to claim your elite rewards.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                 <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    <span className="text-xs font-bold uppercase tracking-widest">Rank 1: Elite Badge</span>
                 </div>
                 <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                    <Shield className="w-5 h-5 text-slate-400" />
                    <span className="text-xs font-bold uppercase tracking-widest">Rank 2: Pro Badge</span>
                 </div>
                 <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                    <Star className="w-5 h-5 text-amber-600" />
                    <span className="text-xs font-bold uppercase tracking-widest">Rank 3: Veteran Badge</span>
                 </div>
              </div>
            </div>
            <div className="relative group">
               <div className="absolute -inset-4 bg-primary/20 rounded-full blur-3xl opacity-50 group-hover:scale-110 transition-transform duration-1000" />
               <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-background border-8 border-primary/20 flex items-center justify-center relative z-10">
                  <Trophy className="w-24 h-24 md:w-32 md:h-32 text-primary animate-pulse" />
               </div>
            </div>
          </div>
        </div>

        {/* Global Activity */}
        <div className="glass-card p-8 rounded-[2.5rem] border-white/5 space-y-8">
           <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                Recent Battles <Flame className="w-5 h-5 text-orange-500 fill-current" />
              </h3>
              <Link to="/leaderboard" className="text-xs font-bold text-primary hover:underline uppercase tracking-widest">Global Rankings</Link>
           </div>
           
           <div className="space-y-4">
              {[
                { p1: 'Alex R.', p2: 'Sarah C.', result: 'p1 won', elo: '+24', time: '2m ago' },
                { p1: 'Michael K.', p2: 'Jessica L.', result: 'p2 won', elo: '+18', time: '5m ago' },
                { p1: 'David S.', p2: 'Marco R.', result: 'Draw', elo: '+2', time: '12m ago' },
              ].map((match, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    <span className="font-bold text-sm w-20 truncate">{match.p1}</span>
                    <Swords className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="font-bold text-sm w-20 truncate text-right">{match.p2}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <Badge className={cn(
                      "text-[10px] font-bold uppercase",
                      match.result === 'Draw' ? "bg-white/10" : "bg-green-500/10 text-green-500"
                    )}>
                      {match.result}
                    </Badge>
                    <span className="font-mono text-xs font-bold text-primary">{match.elo} ELO</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase w-16 text-right">{match.time}</span>
                  </div>
                </div>
              ))}
           </div>
        </div>
          </>
        )}
      </div>
    </Layout>
  );
}

// Helper Link for consistency
import { Link } from 'react-router-dom';
