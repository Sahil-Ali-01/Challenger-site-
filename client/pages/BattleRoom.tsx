import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Swords, 
  Zap, 
  ArrowRight, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Timer,
  Shield,
  Star,
  Sparkles,
  Share2,
  ChevronLeft,
  Loader2,
  X
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { cn } from '@/lib/utils';
import { Question } from '@shared/api';
import { supabase } from '@/lib/supabase';

let socket: Socket | null = null;

interface Opponent {
  id: string;
  username: string;
  score: number;
  currentQuestion: number;
}

export default function BattleRoom() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const opponentInitial = location.state?.opponent;

  const [gameState, setGameState] = useState<'waiting' | 'starting' | 'playing' | 'finished'>('waiting');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  
  const [myScore, setMyScore] = useState(0);
  const [opponentProgress, setOpponentProgress] = useState({ score: 0, currentQuestion: 0 });
  const [opponentInfo, setOpponentInfo] = useState(opponentInitial || { username: 'Searching...' });
  const [eloChange, setEloChange] = useState<number | null>(null);
  const [matchResult, setMatchResult] = useState<'won' | 'lost' | 'draw' | null>(null);
  const [playerStats, setPlayerStats] = useState<{ wins: number; losses: number } | null>(null);
  
  const [timer, setTimer] = useState(15);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    // Use passed socket or create new one
    const storedSocket = (window as any).battleSocket;
    console.log("🔹 BattleRoom mounting...");
    console.log("🔹 Stored battleSocket exists:", !!storedSocket);
    if (storedSocket) {
      console.log("🔹 Using stored battleSocket with socket.id:", storedSocket.id);
    }
    
    socket = storedSocket || io(window.location.origin, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });
    
    console.log("🔹 BattleRoom using socket.id:", socket.id, "roomId:", roomId);

    // Set up connection listeners
    socket.on("connect", () => {
      console.log("🟢 Socket CONNECT event fired, socket.id:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔴 Socket DISCONNECT event fired, reason:", reason);
    });

    // Join room and emit ready
    let timeoutId: any = null;
    if (socket && roomId) {
      console.log("🔹 Socket connecting to room:", roomId);
      
      // Wait for socket connection if needed
      if (socket.connected) {
        console.log("🔹 Socket already connected, emitting player_ready with socket.id:", socket.id);
        handleSocketReady();
      } else {
        console.log("🔹 Socket not connected yet, waiting for connect event...");
        socket.on("connect", () => {
          console.log("🔹 Socket connected event fired, socket.id:", socket.id, "emitting player_ready");
          handleSocketReady();
        });
        
        // Safety timeout: if socket doesn't connect in 5 seconds, emit anyway
        timeoutId = setTimeout(() => {
          console.warn("⚠️ Socket didn't connect within 5 seconds, will emit player_ready anyway");
          if (socket && roomId) {
            console.log("⚠️ Emitting player_ready after timeout");
            handleSocketReady();
          }
        }, 5000);
      }
    }

    console.log("🔹 Setting up socket listeners for game updates");
    
    if (!roomId) {
      console.warn("⚠️ roomId is undefined, listeners might not work properly");
    }

    socket.on("game_start", ({ questions: q, players }) => {
      console.log("🟢 GAME_START received!");
      console.log("Questions:", q);
      console.log("Players:", players);
      setQuestions(q);
      setGameState('playing');
      startTimer();
      // Identify opponent
      const opponentId = Object.keys(players).find(id => id !== socket?.id);
      if (opponentId) {
        setOpponentInfo(players[opponentId]);
      }
    });

    socket.on("player_progress", ({ playerId, score, currentQuestion }) => {
      if (playerId !== socket?.id) {
        setOpponentProgress({ score, currentQuestion });
      }
    });

    socket.on("game_over", ({ finalScores, eloChanges }) => {
      console.log("🎯 GAME OVER event received!", { finalScores, eloChanges });
      console.log("Final scores:", finalScores);
      
      // Update all state at once to avoid multiple renders
      setGameState('finished');
      clearInterval(timerRef.current);
      
      if (eloChanges && socket?.id && eloChanges[socket.id]) {
        setEloChange(eloChanges[socket.id]);
      }
      
      // Determine match result - use socket.id to get our final score
      const myFinalScore = finalScores[socket?.id]?.score || 0;
      const mySocketId = socket?.id;
      const opponentData = Object.values(finalScores).find((p: any) => p.id !== mySocketId) as any;
      const opponentFinalScore = opponentData?.score || 0;
      
      console.log("Score comparison:", { myFinalScore, opponentFinalScore, socketId: mySocketId });
      
      // Update my score
      setMyScore(myFinalScore);
      
      // Update opponent progress with final score
      setOpponentProgress({ score: opponentFinalScore, currentQuestion: opponentData?.currentQuestion || 0 });
      
      if (myFinalScore > opponentFinalScore) {
        setMatchResult('won');
      } else if (myFinalScore < opponentFinalScore) {
        setMatchResult('lost');
      } else {
        setMatchResult('draw');
      }
    });

    socket.on("player_disconnected", ({ playerId }) => {
      console.log("Player disconnected:", playerId);
      alert("Opponent disconnected!");
      navigate('/battle');
    });

    socket.on("opponent_cancelled", ({ reason }) => {
      alert(reason || "Opponent cancelled the battle!");
      navigate('/battle');
    });

    return () => {
      clearInterval(timerRef.current);
      if (timeoutId) clearTimeout(timeoutId);
      // Don't disconnect here to keep socket alive for future matches
    };
  }, [roomId]); // Only depend on roomId, NOT gameState

  const handleSocketReady = () => {
    if (socket && roomId) {
      console.log("🔹 handleSocketReady called");
      console.log("🔹 Socket ID:", socket.id);
      console.log("🔹 Socket connected:", socket.connected);
      console.log("🔹 Room ID:", roomId);
      console.log("🔹 About to emit player_ready with:", { roomId, socketId: socket.id });
      socket.emit("player_ready", { roomId });
      console.log("✅ player_ready emitted successfully");
    } else {
      console.error("🔴 handleSocketReady: socket or roomId missing", { socket: !!socket, roomId });
    }
  };

  const startTimer = () => {
    setTimer(15);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        const newTimer = prev - 1;
        // Stop timer at 0, don't go negative
        if (newTimer <= 0) {
          clearInterval(timerRef.current);
          return 0;
        }
        return newTimer;
      });
    }, 1000);
  };

  const handleAnswerSubmit = useCallback((index: number) => {
    if (isAnswered) return;
    if (!socket) {
      console.error("Socket not connected!");
      return;
    }
    
    setSelectedOption(index);
    setIsAnswered(true);
    
    const timeTaken = 15 - timer;
    socket.emit("submit_answer", {
      roomId,
      questionIndex: currentQuestionIndex,
      answerIndex: index,
      timeTaken
    });

    const isCorrect = index === questions[currentQuestionIndex]?.correctAnswer;
    if (isCorrect) {
      const speedBonus = Math.max(0, Math.floor((15 - timeTaken) / 3));
      setMyScore(s => s + 10 + speedBonus);
    }
  }, [isAnswered, socket, roomId, currentQuestionIndex, timer, questions]);

  useEffect(() => {
    if (timer <= 0 && gameState === 'playing' && !isAnswered) {
      console.log("Time's up! Auto-submitting...");
      handleAnswerSubmit(-1); // Auto-submit wrong if time's up
    }
  }, [timer, gameState, isAnswered, handleAnswerSubmit]);

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      clearInterval(timerRef.current); // Clear current timer
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      startTimer(); // Start fresh timer
    }
  };

  // Fetch updated player stats when game finishes
  useEffect(() => {
    if (gameState === 'finished' && !playerStats) {
      console.log("Game finished, fetching updated player stats...");
      // Add a small delay to ensure database is updated
      const timer = setTimeout(() => {
        fetchPlayerStats();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  const fetchPlayerStats = async () => {
    try {
      console.log("🔍 Fetching player stats from database...");
      const { data: { user } } = await (window as any).supabase?.auth?.getUser() || {};
      if (!user) {
        console.error("No user logged in");
        return;
      }

      const { data: profile, error } = await (window as any).supabase
        ?.from('profiles')
        ?.select('wins, losses')
        ?.eq('id', user.id)
        ?.single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      console.log("✅ Profile data fetched:", profile);
      if (profile) {
        console.log(`Setting player stats: ${profile.wins} wins, ${profile.losses} losses`);
        setPlayerStats({ wins: profile.wins || 0, losses: profile.losses || 0 });
      }
    } catch (error) {
      console.error('Error fetching player stats:', error);
    }
  };

  const handleCancelBattle = () => {
    console.log("Canceling battle...");
    
    // Emit cancel event to server
    if (socket && roomId) {
      socket.emit("cancel_battle", { roomId });
    }
    
    // Navigate back to battle page
    navigate('/battle');
  };

  if (gameState === 'waiting') {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-10 animate-in fade-in zoom-in duration-500">
           <div className="relative flex justify-center items-center gap-12">
              <div className="w-24 h-24 rounded-3xl bg-primary/20 flex items-center justify-center text-2xl font-bold animate-pulse">SA</div>
              <Swords className="w-12 h-12 text-primary animate-bounce" />
              <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center text-2xl font-bold border-white/5">{opponentInfo.username.slice(0, 2).toUpperCase()}</div>
           </div>
           <div className="space-y-4">
              <h2 className="text-3xl font-bold">Waiting for opponent to be ready...</h2>
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <p className="text-muted-foreground uppercase tracking-[0.3em] font-black text-xs">Syncing Arena</p>
              </div>
           </div>
           <Button 
             variant="outline" 
             onClick={handleCancelBattle}
             className="gap-2 mt-4"
           >
             <X className="w-4 h-4" />
             Cancel Battle
           </Button>
        </div>
      </Layout>
    );
  }

  if (gameState === 'finished') {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto py-12 space-y-12">
           <div className="glass-card rounded-[3rem] p-12 text-center space-y-10 relative overflow-hidden border-primary/20">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-indigo-500 to-primary" />
              
              <div className="space-y-6">
                <div className="relative inline-flex mb-4">
                   <div className={cn(
                     "w-28 h-28 rounded-[2rem] flex items-center justify-center shadow-2xl relative z-10",
                     matchResult === 'won' ? "bg-yellow-400 text-yellow-900" : matchResult === 'draw' ? "bg-slate-400 text-slate-900" : "bg-destructive text-white"
                   )}>
                     <Trophy className="w-14 h-14" />
                   </div>
                   <div className="absolute -inset-8 bg-primary/20 rounded-full blur-[40px] opacity-50 pointer-events-none" />
                </div>
                
                <h1 className="text-5xl font-black tracking-tighter">
                  {matchResult === 'won' ? 'VICTORY! 🎉' : matchResult === 'draw' ? 'DRAW GAME ⚖️' : matchResult === 'lost' ? 'DEFEAT 😢' : 'MATCH OVER'}
                </h1>
                <p className="text-muted-foreground text-lg font-medium">
                  {matchResult === 'won' ? 'You dominated the arena! 🏆' : matchResult === 'draw' ? 'A legendary battle between equals.' : matchResult === 'lost' ? 'Better luck next time! 💪' : 'Match completed!'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8">
                 <div className="p-8 rounded-[2rem] bg-white/5 border border-white/5 space-y-4">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Your Score</p>
                    <p className="text-5xl font-black text-primary tabular-nums">{myScore}</p>
                    
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-muted-foreground">Daily Points</span>
                        <span className="text-lg font-black text-blue-400">+{myScore}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-muted-foreground">Weekly Points</span>
                        <span className="text-lg font-black text-purple-400">+{myScore}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-muted-foreground">Total Points</span>
                        <span className="text-lg font-black text-yellow-400">+{myScore}</span>
                      </div>
                    </div>

                    <div className="w-full text-center pt-2">
                      <Badge variant="outline" className="bg-blue-500/10 border-blue-500/20 text-blue-500 px-4 py-2 text-sm inline-block">
                        ⭐ +{myScore} Points Earned
                      </Badge>
                    </div>
                    {eloChange !== null && (
                      <div className="w-full text-center">
                        <Badge variant="outline" className={cn(
                          "border-primary/20 bg-primary/5 text-primary px-4 py-2 text-sm inline-block",
                          eloChange > 0 ? "text-green-500 border-green-500/20 bg-green-500/5" : "text-destructive border-destructive/20 bg-destructive/5"
                        )}>
                          {eloChange > 0 ? `+${eloChange}` : eloChange} ELO
                        </Badge>
                      </div>
                    )}
                    {playerStats && (
                      <div className="w-full flex gap-2 justify-center pt-2">
                        <Badge variant="outline" className="bg-green-500/10 border-green-500/20 text-green-500 px-3 py-1 text-xs">
                          🏆 {playerStats.wins} Wins
                        </Badge>
                        <Badge variant="outline" className="bg-destructive/10 border-destructive/20 text-destructive px-3 py-1 text-xs">
                          ❌ {playerStats.losses} Losses
                        </Badge>
                      </div>
                    )}
                 </div>
                 <div className="p-8 rounded-[2rem] bg-white/5 border border-white/5 space-y-4">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{opponentInfo.username}'s Score</p>
                    <p className="text-5xl font-black tabular-nums">{opponentProgress.score}</p>
                    
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-muted-foreground">Daily Points</span>
                        <span className="text-lg font-black text-blue-400">+{opponentProgress.score}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-muted-foreground">Weekly Points</span>
                        <span className="text-lg font-black text-purple-400">+{opponentProgress.score}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-muted-foreground">Total Points</span>
                        <span className="text-lg font-black text-yellow-400">+{opponentProgress.score}</span>
                      </div>
                    </div>

                    <div className="w-full text-center pt-2">
                      <Badge variant="outline" className="bg-orange-500/10 border-orange-500/20 text-orange-500 px-4 py-2 text-sm inline-block">
                        ⭐ +{opponentProgress.score} Points Earned
                      </Badge>
                    </div>
                 </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-8">
                 <Button size="lg" className="flex-1 h-14 rounded-2xl text-lg font-bold" onClick={() => navigate('/battle')}>
                   <RotateCcw className="mr-2 w-5 h-5" /> Play Again
                 </Button>
                 <Button size="lg" variant="outline" className="flex-1 h-14 rounded-2xl text-lg font-bold glass-button">
                   <Share2 className="mr-2 w-5 h-5" /> Share Result
                 </Button>
              </div>

              <div className="pt-8 border-t border-white/5">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Match Status</p>
                    <p className={cn(
                      "text-2xl font-black",
                      matchResult === 'won' ? "text-green-500" : matchResult === 'lost' ? "text-destructive" : "text-yellow-500"
                    )}>
                      {matchResult === 'won' ? '✓ WON' : matchResult === 'lost' ? '✗ LOST' : '= DRAW'}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Score Diff</p>
                    <p className="text-2xl font-black text-primary">+{Math.abs(myScore - opponentProgress.score)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Win Rate</p>
                    <p className="text-2xl font-black text-primary">
                      {playerStats ? Math.round((playerStats.wins / (playerStats.wins + playerStats.losses)) * 100) : '-'}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-10 border-t border-white/5">
                 <Link to="/leaderboard" className="text-xs font-black text-primary uppercase tracking-widest hover:underline">
                   View Updated Weekly Rankings <ArrowRight className="inline ml-1 w-3 h-3" />
                 </Link>
              </div>
           </div>
        </div>
      </Layout>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 space-y-12">
        {/* Battle Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center bg-white/5 p-6 rounded-[2rem] border border-white/5 relative overflow-hidden">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-px bg-white/10 hidden md:block" />
           
           {/* Player 1 Info */}
           <div className="flex items-center gap-6 justify-center md:justify-start">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center font-bold text-primary text-xl">SA</div>
              <div className="space-y-1">
                 <p className="font-bold text-lg">Sahil Ali (You)</p>
                 <p className="text-3xl font-black text-primary tabular-nums">{myScore}</p>
              </div>
           </div>

           {/* Match Info */}
           <div className="text-center space-y-3 relative z-10">
              <div className="flex items-center justify-center gap-4">
                 <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest">Question {currentQuestionIndex + 1}/{questions.length}</div>
                 <div className={cn(
                   "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-black tabular-nums shadow-lg",
                   timer < 5 ? "bg-destructive/20 text-destructive animate-pulse" : "bg-white/5 text-muted-foreground"
                 )}>
                   <Timer className="w-4 h-4" /> {timer}s
                 </div>
              </div>
              <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="h-1.5 max-w-[120px] mx-auto" />
           </div>

           {/* Player 2 Info */}
           <div className="flex items-center gap-6 justify-center md:justify-end text-right">
              <div className="space-y-1">
                 <p className="font-bold text-lg">{opponentInfo.username}</p>
                 <p className="text-3xl font-black tabular-nums">{opponentProgress.score}</p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center font-bold border border-white/5 text-xl">
                 {opponentInfo.username.slice(0, 2).toUpperCase()}
              </div>
           </div>
        </div>

        {/* Live Arena Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
           {/* Your Arena */}
           <div className="lg:col-span-3 space-y-8">
              <div className="glass-card rounded-[3rem] p-10 md:p-14 border-white/10 min-h-[500px] flex flex-col justify-center relative group">
                 <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform">
                   <Zap className="w-48 h-48 text-primary" />
                 </div>
                 
                 <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-12 relative z-10">
                   {currentQuestion.question}
                 </h2>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                   {currentQuestion.options.map((option, index) => {
                     const isSelected = selectedOption === index;
                     const isCorrect = currentQuestion.correctAnswer === index;
                     
                     return (
                       <button
                         key={index}
                         disabled={isAnswered}
                         onClick={() => handleAnswerSubmit(index)}
                         className={cn(
                           "w-full p-6 rounded-2xl text-left font-bold transition-all duration-300 border flex items-center justify-between group h-24",
                           !isAnswered && "hover:border-primary hover:bg-primary/5 active:scale-[0.98] border-white/5",
                           !isAnswered && isSelected && "border-primary bg-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.1)]",
                           isAnswered && isCorrect && "bg-green-500/10 border-green-500 text-green-500",
                           isAnswered && isSelected && !isCorrect && "bg-destructive/10 border-destructive text-destructive"
                         )}
                       >
                         <span className="flex items-center gap-4">
                           <span className={cn(
                             "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black transition-colors shrink-0",
                             !isAnswered && "bg-white/5 group-hover:bg-primary group-hover:text-primary-foreground",
                             !isAnswered && isSelected && "bg-primary text-primary-foreground",
                             isAnswered && isCorrect && "bg-green-500 text-white",
                             isAnswered && isSelected && !isCorrect && "bg-destructive text-white"
                           )}>
                             {String.fromCharCode(65 + index)}
                           </span>
                           <span className="leading-snug">{option}</span>
                         </span>
                         
                         {isAnswered && isCorrect && <CheckCircle2 className="w-6 h-6 shrink-0" />}
                         {isAnswered && isSelected && !isCorrect && <XCircle className="w-6 h-6 shrink-0" />}
                       </button>
                     );
                   })}
                 </div>

                 {isAnswered && currentQuestionIndex < questions.length - 1 && (
                    <div className="mt-12 flex justify-center animate-in slide-in-from-bottom duration-500">
                       <Button size="lg" className="px-12 h-14 rounded-2xl text-lg font-black" onClick={nextQuestion}>
                          Next Question <ArrowRight className="ml-2 w-5 h-5" />
                       </Button>
                    </div>
                 )}
              </div>
           </div>

           {/* Opponent Live Stream/Status */}
           <div className="space-y-8">
              <div className="glass-card rounded-[2rem] p-8 border-white/5 space-y-6">
                 <h3 className="font-bold text-sm uppercase tracking-[0.2em] text-muted-foreground flex items-center justify-between">
                    Live Status <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                 </h3>
                 
                 <div className="space-y-8 pt-4">
                    <div className="space-y-4">
                       <div className="flex justify-between items-end">
                          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Progress</p>
                          <p className="text-sm font-black">{opponentProgress.currentQuestion} / {questions.length}</p>
                       </div>
                       <Progress value={(opponentProgress.currentQuestion / questions.length) * 100} className="h-3 bg-white/5" />
                    </div>

                    <div className="space-y-2">
                       <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Action Log</p>
                       <div className="space-y-2">
                          {Array.from({ length: questions.length }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                               <div className={cn(
                                 "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black",
                                 i < opponentProgress.currentQuestion ? "bg-green-500/20 text-green-500" : "bg-white/5 text-muted-foreground"
                               )}>
                                 {i + 1}
                               </div>
                               <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                                 {i < opponentProgress.currentQuestion ? "Submitted" : "Thinking..."}
                               </span>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>

              <div className="glass-card rounded-[2rem] p-6 border-white/5 bg-indigo-500/10 text-center space-y-3">
                 <Shield className="w-8 h-8 text-indigo-400 mx-auto" />
                 <p className="text-xs font-bold leading-relaxed">Answers are locked once submitted. Speed counts for bonus ELO!</p>
              </div>
           </div>
        </div>
      </div>
    </Layout>
  );
}
