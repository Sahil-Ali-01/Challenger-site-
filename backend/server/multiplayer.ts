import { Server, Socket } from "socket.io";
import { Question } from "@shared/api";
import { supabase } from "./lib/db";

// In-memory matchmaking queue
let matchmakingQueue: string[] = [];
// Active rooms mapping roomId -> game data
const gameRooms: Record<string, GameRoom> = {};
const API_BASE_URL = process.env.INTERNAL_API_BASE_URL || `http://localhost:${process.env.PORT || 8082}`;
let userStatsEmailColumnAvailable: boolean | null = null;

async function hasUserStatsEmailColumn() {
  if (userStatsEmailColumnAvailable !== null) {
    return userStatsEmailColumnAvailable;
  }

  const { error } = await supabase.from("user_stats").select("email").limit(1);
  if (error && String(error.message || "").includes("does not exist")) {
    userStatsEmailColumnAvailable = false;
  } else {
    userStatsEmailColumnAvailable = true;
  }

  return userStatsEmailColumnAvailable;
}

interface Player {
  id: string;
  userId: string; // Actual Supabase user ID
  username: string;
  score: number;
  currentQuestion: number;
  isReady: boolean;
  accuracy: number;
  totalAnswerTime: number;
}

interface GameRoom {
  id: string;
  players: Record<string, Player>;
  questions: Question[];
  status: 'waiting' | 'starting' | 'playing' | 'finished';
  timer: number;
}

interface QuestionsApiResponse {
  success?: boolean;
  data?: Question[];
}

function getMaxPossibleBattleScore(questionCount: number) {
  // 10 base + up to 5 speed bonus per question.
  return Math.max(0, questionCount) * 15;
}

function finalizeRoomGame(
  io: Server,
  roomId: string,
  room: GameRoom,
  options?: { forcedWinnerSocketId?: string; reason?: string }
) {
  if (room.status === "finished") {
    return;
  }

  room.status = "finished";

  const players = Object.values(room.players);
  const p1 = players[0];
  const p2 = players[1];

  if (!p1 || !p2) {
    io.to(roomId).emit("game_over", {
      finalScores: room.players,
      eloChanges: {},
      reason: options?.reason || "incomplete_room",
    });
    setTimeout(() => {
      delete gameRooms[roomId];
    }, 5000);
    return;
  }

  let p1EloChange = 0;
  let p2EloChange = 0;
  let p1Result: "win" | "loss" | "draw" = "draw";
  let p2Result: "win" | "loss" | "draw" = "draw";

  const forcedWinnerSocketId = options?.forcedWinnerSocketId;
  if (forcedWinnerSocketId && room.players[forcedWinnerSocketId]) {
    const forcedWinner = room.players[forcedWinnerSocketId];
    const forcedLoser = players.find((p) => p.id !== forcedWinnerSocketId);

    if (forcedLoser) {
      forcedWinner.score = Math.max(
        forcedWinner.score,
        getMaxPossibleBattleScore(room.questions.length)
      );
      forcedWinner.currentQuestion = room.questions.length;

      if (forcedWinner.id === p1.id) {
        p1EloChange = 25;
        p2EloChange = -15;
        p1Result = "win";
        p2Result = "loss";
      } else {
        p1EloChange = -15;
        p2EloChange = 25;
        p1Result = "loss";
        p2Result = "win";
      }
    }
  } else if (p1.score > p2.score) {
    p1EloChange = 25;
    p2EloChange = -15;
    p1Result = "win";
    p2Result = "loss";
  } else if (p2.score > p1.score) {
    p1EloChange = -15;
    p2EloChange = 25;
    p1Result = "loss";
    p2Result = "win";
  } else {
    p1EloChange = 5;
    p2EloChange = 5;
    p1Result = "draw";
    p2Result = "draw";
  }

  Promise.all([
    updatePlayerProfiles(p1, p1EloChange, p1Result, p2.score),
    updatePlayerProfiles(p2, p2EloChange, p2Result, p1.score),
  ])
    .catch((err) => {
      console.error("❌ Error updating profiles:", err);
    })
    .finally(() => {
      io.to(roomId).emit("game_over", {
        finalScores: room.players,
        eloChanges: {
          [p1.id]: p1EloChange,
          [p2.id]: p2EloChange,
        },
        reason: options?.reason,
      });
    });

  setTimeout(() => {
    delete gameRooms[roomId];
  }, 5000);
}

// Mock questions fallback
const MOCK_QUESTIONS_FALLBACK: Question[] = [
  {
    id: '1',
    category: 'javascript',
    question: 'What is the output of `console.log(typeof NaN)`?',
    options: ['"number"', '"NaN"', '"undefined"', '"object"'],
    correctAnswer: 0,
    explanation: 'In JavaScript, `NaN` (Not-a-Number) is a special value that belongs to the `number` type.'
  },
  {
    id: '2',
    category: 'python',
    question: 'Which of the following is used to define a block of code in Python?',
    options: ['Brackets', 'Parentheses', 'Indentation', 'Semicolons'],
    correctAnswer: 2,
    explanation: 'Python uses indentation to define code blocks.'
  },
  {
    id: 'm1',
    category: 'javascript',
    question: 'What is the correct way to check if an array includes an element in ES6?',
    options: ['arr.contains(el)', 'arr.exists(el)', 'arr.includes(el)', 'arr.has(el)'],
    correctAnswer: 2,
    explanation: '`Array.prototype.includes()` was introduced in ES2016 (ES7) and is the standard way to check if an array contains a value.'
  },
  {
    id: 'm2',
    category: 'python',
    question: 'Which of these is a Python data type that is immutable?',
    options: ['List', 'Dictionary', 'Set', 'Tuple'],
    correctAnswer: 3,
    explanation: 'Tuples are immutable sequences, while lists, dictionaries, and sets are mutable.'
  },
  {
    id: 'm3',
    category: 'system design',
    question: 'What does the CAP theorem state?',
    options: [
      'Consistency, Availability, and Partition tolerance: pick two.',
      'Caching, API, and Persistence are core for scale.',
      'Capacity, Availability, and Performance: pick two.',
      'Complexity, Architecture, and Patterns are related.'
    ],
    correctAnswer: 0,
    explanation: 'The CAP theorem states that a distributed data store can only provide two out of three guarantees: Consistency, Availability, and Partition tolerance.'
  }
];

// Function to fetch questions (2 from DB + 3 from AI)
async function fetchBattleQuestions(): Promise<Question[]> {
  try {
    let allQuestions: Question[] = [];

    const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 5000) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        return await fetch(url, { ...options, signal: controller.signal });
      } finally {
        clearTimeout(timeout);
      }
    };
    
    // Fetch database questions first (2 questions)
    try {
      console.log("📚 [BATTLE] Fetching database questions...");
      const dbResponse = await fetchWithTimeout(`${API_BASE_URL}/api/questions`);
      const dbData = (await dbResponse.json()) as QuestionsApiResponse;
      
      if (dbData.success && dbData.data) {
        console.log(`✅ [BATTLE] Got ${dbData.data.length} database questions, taking first 2`);
        // Add only 2 database questions
        allQuestions = [...dbData.data.slice(0, 2)];
      }
    } catch (dbErr) {
      console.warn("⚠️  [BATTLE] Database questions failed:", dbErr);
    }
    
    // Then fetch AI questions (3 questions)
    try {
      console.log("🤖 [BATTLE] Fetching AI questions...");
      const aiResponse = await fetchWithTimeout(`${API_BASE_URL}/api/questions/generate-multiple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          category: 'programming',
          difficulty: 'medium',
          count: 3
        })
      });
      
      const aiData = (await aiResponse.json()) as QuestionsApiResponse;
      if (aiData.success && aiData.data) {
        console.log(`✅ [BATTLE] Got ${aiData.data.length} AI questions`);
        allQuestions = [...allQuestions, ...aiData.data];
      }
    } catch (aiErr) {
      console.warn("⚠️  [BATTLE] AI questions failed, using database only:", aiErr);
    }
    
    if (allQuestions.length > 0) {
      // Shuffle questions
      const shuffled = allQuestions.sort(() => Math.random() - 0.5);
      console.log(`🎯 [BATTLE] Total questions: ${shuffled.length} (2 DB + 3 AI)`);
      return shuffled;
    } else {
      console.error('[BATTLE] No questions available, using fallback');
      return MOCK_QUESTIONS_FALLBACK;
    }
  } catch (err) {
    console.error('[BATTLE] Error fetching questions:', err);
    return MOCK_QUESTIONS_FALLBACK;
  }
}

async function processMatchmakingQueue(io: Server) {
  // Check if we have 2 or more players to match
  if (matchmakingQueue.length >= 2) {
    console.log(`\n✨✨✨ PROCESSING MATCHMAKING QUEUE - ${matchmakingQueue.length} players waiting ✨✨✨`);
    const player1Id = matchmakingQueue.shift()!;
    const player2Id = matchmakingQueue.shift()!;

    const roomId = `room_${player1Id}_${player2Id}`;
    
    const p1Socket = io.sockets.sockets.get(player1Id);
    const p2Socket = io.sockets.sockets.get(player2Id);

    console.log(`\n🎮🎮🎮 MATCH CREATED! 🎮🎮🎮`);
    console.log(`   Room ID: ${roomId}`);
    console.log(`   Player 1 Socket ID: ${player1Id}`);
    console.log(`   Player 1 Socket exists: ${!!p1Socket}`);
    if (p1Socket) {
      console.log(`   Player 1 Name: ${p1Socket?.data.username}`);
      console.log(`   Player 1 UserId: ${p1Socket?.data.userId}`);
    }
    
    console.log(`   Player 2 Socket ID: ${player2Id}`);
    console.log(`   Player 2 Socket exists: ${!!p2Socket}`);
    if (p2Socket) {
      console.log(`   Player 2 Name: ${p2Socket?.data.username}`);
      console.log(`   Player 2 UserId: ${p2Socket?.data.userId}`);
    }

    if (p1Socket && p2Socket) {
      // Fetch questions (2 DB + 3 AI)
      console.log(`\n📚 Fetching questions for battle...`);
      const questions = await fetchBattleQuestions();
      console.log(`✅ Got ${questions.length} questions for battle`);
      
      const room: GameRoom = {
        id: roomId,
        players: {
          [player1Id]: { id: player1Id, userId: p1Socket.data.userId, username: p1Socket.data.username, score: 0, currentQuestion: 0, isReady: false, accuracy: 0, totalAnswerTime: 0 },
          [player2Id]: { id: player2Id, userId: p2Socket.data.userId, username: p2Socket.data.username, score: 0, currentQuestion: 0, isReady: false, accuracy: 0, totalAnswerTime: 0 }
        },
        questions: questions,
        status: 'waiting',
        timer: 15
      };

      gameRooms[roomId] = room;
      console.log(`✅ Room ${roomId} created and stored in gameRooms`);
      console.log(`   Total active rooms: ${Object.keys(gameRooms).length}`);
      
      p1Socket.join(roomId);
      p2Socket.join(roomId);
      console.log(`✅ Both players joined Socket.IO room namespace`);

      console.log(`\n📡 Sending match_found event to both players...`);
      p1Socket.emit("match_found", { roomId, opponent: { id: player2Id, username: p2Socket.data.username } });
      console.log(`   ✅ match_found sent to Player 1 (${p1Socket.data.username})`);
      
      p2Socket.emit("match_found", { roomId, opponent: { id: player1Id, username: p1Socket.data.username } });
      console.log(`   ✅ match_found sent to Player 2 (${p2Socket.data.username})`);
      
      console.log(`\n⏳ Waiting for both players to emit player_ready event...`);
    } else {
      console.error(`❌ CRITICAL: Failed to find sockets for match!`);
      console.error(`   Player 1 (${player1Id}): ${!!p1Socket}`);
      console.error(`   Player 2 (${player2Id}): ${!!p2Socket}`);
    }
  }
}

export function setupMultiplayer(io: Server) {
  console.log("\n🚀 MULTIPLAYER SETUP INITIALIZED");
  console.log("   Socket.IO namespace: /");
  console.log("   Server ready to accept connections\n");
  
  // Log total connections
  let connectionCount = 0;
  
  // Periodic queue check every 1 second
  let checkCount = 0;
  setInterval(() => {
    checkCount++;
    if (matchmakingQueue.length >= 2) {
      console.log(`\n✨ [QUEUE CHECK #${checkCount}] Processing queue with ${matchmakingQueue.length} players`);
      processMatchmakingQueue(io);
    } else if (checkCount % 10 === 0) {
      // Log every 10 seconds with more detail
      const totalSockets = io.sockets.sockets.size;
      console.log(`\n📊 [QUEUE CHECK #${checkCount}] Queue: ${matchmakingQueue.length} players | Total server sockets: ${totalSockets}`);
    }
  }, 1000);

  io.on("connection", (socket: Socket) => {
    connectionCount++;
    console.log(`\n👤 [CONNECTION #${connectionCount}] NEW CONNECTION RECEIVED!`);
    console.log(`   Socket ID: ${socket.id}`);
    console.log(`   Total active sockets: ${io.sockets.sockets.size}`);
    console.log(`   All socket IDs: [${Array.from(io.sockets.sockets.keys()).join(", ")}]`);

    socket.on("join_matchmaking", ({ username, userId }) => {
      console.log(`\n🔵🔵🔵 Join matchmaking event RECEIVED on socket: ${socket.id}`);
      console.log(`   Username: ${username}`);
      console.log(`   UserId: ${userId}`);
      console.log(`   Current queue before add: ${matchmakingQueue.length} players`);
      console.log(`   Queue contents before: [${matchmakingQueue.join(", ")}]`);
      
      if (!userId) {
        console.error("⚠️  ERROR: userId is missing! User:", username);
      }
      
      // Check if user is already in queue
      if (!matchmakingQueue.includes(socket.id)) {
        matchmakingQueue.push(socket.id);
        socket.data.username = username;
        socket.data.userId = userId;
        console.log(`✅ Player ADDED to queue. New queue length: ${matchmakingQueue.length}`);
        console.log(`   Queue contents after: [${matchmakingQueue.join(", ")}]`);
        console.log(`   Socket data stored: { username: ${socket.data.username}, userId: ${socket.data.userId} }`);
        
        // Try to match immediately
        console.log(`\n🎯 Attempting to process matchmaking queue immediately...`);
        processMatchmakingQueue(io);
      } else {
        console.warn(`⚠️ Player ${socket.id} is already in matchmaking queue!`);
      }
    });

    socket.on("leave_matchmaking", () => {
      const wasInQueue = matchmakingQueue.includes(socket.id);
      matchmakingQueue = matchmakingQueue.filter(id => id !== socket.id);
      console.log(`\n🔴 ${socket.data.username} left matchmaking queue`);
      console.log(`   Was in queue: ${wasInQueue}`);
      console.log(`   Queue length now: ${matchmakingQueue.length}`);
    });

    socket.on("cancel_battle", ({ roomId }) => {
      console.log(`Player ${socket.id} cancelled battle in room ${roomId}`);
      
      const room = gameRooms[roomId];
      if (room) {
        const opponentId = Object.keys(room.players).find(id => id !== socket.id);

        // If game is in progress, treat cancel as forfeit and award opponent full-point win.
        if (room.status === "playing" && opponentId) {
          finalizeRoomGame(io, roomId, room, {
            forcedWinnerSocketId: opponentId,
            reason: "opponent_forfeit",
          });
          return;
        }

        // Before game start, just notify opponent and clean up room.
        if (opponentId) {
          const opponentSocket = io.sockets.sockets.get(opponentId);
          if (opponentSocket) {
            opponentSocket.emit("opponent_cancelled", { reason: "Opponent cancelled the battle" });
          }
        }
        
        delete gameRooms[roomId];
      }
    });

    socket.on("player_ready", ({ roomId }) => {
      console.log(`\n🔹 player_ready received:`);
      console.log(`   roomId: ${roomId}`);
      console.log(`   socket.id: ${socket.id}`);
      console.log(`   Available room keys: ${Object.keys(gameRooms).join(", ")}`);
      
      const room = gameRooms[roomId];
      console.log(`   Room found: ${!!room}`);
      if (room) {
        console.log(`   Players in room: ${Object.keys(room.players).join(", ")}`);
        console.log(`   Socket.id in room.players: ${!!room.players[socket.id]}`);
      }
      
      if (room && room.players[socket.id]) {
        room.players[socket.id].isReady = true;
        console.log(`✅ Player ${socket.id} marked as ready`);
        console.log(`Room ${roomId} readiness status:`, {
          player1: `${Object.values(room.players)[0]?.username} - Ready: ${Object.values(room.players)[0]?.isReady}`,
          player2: `${Object.values(room.players)[1]?.username} - Ready: ${Object.values(room.players)[1]?.isReady}`
        });
        
        const allReady = Object.values(room.players).every(p => p.isReady);
        if (allReady) {
          console.log(`\n✅ ✅ ✅ ALL PLAYERS READY IN ROOM ${roomId}! STARTING GAME! ✅ ✅ ✅`);
          console.log(`Broadcasting game_start to roomId: ${roomId}`);
          console.log(`Total questions: ${room.questions.length}`);
          room.status = 'playing';
          
          // Double-check before emitting
          console.log("Emitting game_start with:");
          console.log(`  - questions: ${room.questions.length} questions`);
          console.log(`  - players: ${Object.values(room.players).map(p => p.username).join(", ")}`);
          
          io.to(roomId).emit("game_start", {
            questions: room.questions,
            players: room.players
          });
          console.log(`✅ game_start emitted to room ${roomId}`);
        } else {
          console.log(`⏳ Waiting for other player... Current ready: ${Object.values(room.players).filter(p => p.isReady).length}/2`);
        }
      } else {
        console.error(`❌ ERROR: Room ${roomId} not found or player ${socket.id} not in room`);
        console.error(`   Available rooms: ${Object.keys(gameRooms).join(", ")}`);
        if (room) {
          console.error(`   Available players in room: ${Object.keys(room.players).join(", ")}`);
          console.error(`   Searching for socket ID: ${socket.id}`);
        }
      }
    });

    socket.on("submit_answer", ({ roomId, questionIndex, answerIndex, timeTaken }) => {
      const room = gameRooms[roomId];
      if (room && room.status === 'playing') {
        const player = room.players[socket.id];
        const question = room.questions[questionIndex];

        if (answerIndex === question.correctAnswer) {
          // Score = 10 base + bonus for speed (max 5 points bonus)
          const speedBonus = Math.max(0, Math.floor((15 - timeTaken) / 3));
          player.score += 10 + speedBonus;
          player.accuracy += 1;
        }
        
        player.currentQuestion = questionIndex + 1;
        player.totalAnswerTime += timeTaken;

        console.log(`Player ${socket.id} submitted answer for Q${questionIndex + 1}. Progress: ${player.currentQuestion}/${room.questions.length}`);

        // Broadcast progress update
        io.to(roomId).emit("player_progress", {
          playerId: socket.id,
          score: player.score,
          currentQuestion: player.currentQuestion
        });

        // Check if both players finished
        const bothFinished = Object.values(room.players).every(p => p.currentQuestion >= room.questions.length);
        console.log(`Room ${roomId} - Player progress check:`, {
          p1: `${Object.values(room.players)[0]?.currentQuestion}/${room.questions.length}`,
          p2: `${Object.values(room.players)[1]?.currentQuestion}/${room.questions.length}`,
          bothFinished
        });

        if (bothFinished) {
          console.log(`🏁 Both players finished in room ${roomId}! Game ending...`);
          finalizeRoomGame(io, roomId, room, { reason: "completed" });
        }
      }
    });

    socket.on("disconnect", () => {
      console.log(`\n🔴 User disconnected: ${socket.id}`);
      const wasInQueue = matchmakingQueue.includes(socket.id);
      matchmakingQueue = matchmakingQueue.filter(id => id !== socket.id);
      console.log(`   Was in queue: ${wasInQueue}`);
      console.log(`   Queue length now: ${matchmakingQueue.length}`);
      
      // Find active rooms with this player
      for (const roomId in gameRooms) {
        const room = gameRooms[roomId];
        if (room.players[socket.id]) {
          const opponentId = Object.keys(room.players).find(id => id !== socket.id);

          if (room.status === "playing" && opponentId) {
            // During active game, disconnect means forfeit; opponent gets full-point win.
            finalizeRoomGame(io, roomId, room, {
              forcedWinnerSocketId: opponentId,
              reason: "opponent_disconnected",
            });
          } else {
            io.to(roomId).emit("player_disconnected", { playerId: socket.id });
            delete gameRooms[roomId];
          }
        }
      }
    });
  });
}

/**
 * Update player profile with match results
 */
async function updatePlayerProfiles(
  player: Player,
  eloChange: number,
  result: "win" | "loss" | "draw",
  opponentScore: number
) {
  try {
    console.log("\n" + "=".repeat(80));
    console.log("🔴 UPDATE PLAYER PROFILES START");
    console.log("=".repeat(80));
    console.log("Input Player:", { 
      socketId: player.id, 
      userId: player.userId, 
      username: player.username,
      score: player.score,
      result,
      eloChange
    });

    if (!supabase) {
      console.error("❌ CRITICAL: Supabase not configured!");
      return;
    }

    if (!player.userId) {
      console.error("❌ CRITICAL: No userId provided for player:", player);
      console.error("❌ This player will NOT be updated!");
      return;
    }

    console.log(`\n📝 Step 1: Fetching current user_stats/profile for userId: ${player.userId}`);

    const { data: statsRow, error: statsFetchError } = await supabase
      .from("user_stats")
      .select("*")
      .eq("id", player.userId)
      .single();

    const { data: profileRow } = await supabase
      .from("profiles")
      .select("id, name, email")
      .eq("id", player.userId)
      .single();

    const { data: leaderboardRow, error: leaderboardFetchError } = await supabase
      .from("leaderboard")
      .select("id, user_id, elo_rating, total_wins, total_losses, total_quizzes, correct_answers, accuracy_percentage, total_points, weekly_points, streak, updated_at")
      .eq("user_id", player.userId)
      .single();

    if (leaderboardFetchError && leaderboardFetchError.code !== "PGRST116") {
      console.error("❌ leaderboard fetch error:", leaderboardFetchError);
      return;
    }

    if (!leaderboardRow) {
      const { error: createLeaderboardError } = await supabase
        .from("leaderboard")
        .insert({
          user_id: player.userId,
          elo_rating: 1200,
          total_wins: 0,
          total_losses: 0,
          total_quizzes: 0,
          correct_answers: 0,
          accuracy_percentage: 0,
          total_points: 0,
          weekly_points: 0,
          daily_points: 0,
          streak: 0,
          updated_at: new Date().toISOString(),
        });

      if (createLeaderboardError) {
        console.warn("⚠️ Failed to create leaderboard row:", createLeaderboardError.message);
      }
    }

    const { data: finalLeaderboard } = await supabase
      .from("leaderboard")
      .select("user_id, elo_rating, total_wins, total_losses, total_quizzes, correct_answers, accuracy_percentage, total_points, weekly_points, daily_points, streak, updated_at")
      .eq("user_id", player.userId)
      .single();

    if (statsFetchError && statsFetchError.code !== "PGRST116") {
      console.error("❌ user_stats fetch error:", statsFetchError);
      return;
    }

    if (!statsRow) {
      console.log("⚠️ user_stats row missing, creating default row...");

      const shouldPersistStatsEmail = await hasUserStatsEmailColumn();
      const statsInsertPayload: any = {
        id: player.userId,
        name: profileRow?.name || player.username || "Player",
        elo_rating: 1200,
        total_wins: 0,
        total_losses: 0,
        total_quizzes: 0,
        accuracy_percentage: 0,
        quizzes_completed: 0,
        avg_accuracy: 0,
      };

      if (shouldPersistStatsEmail) {
        statsInsertPayload.email = profileRow?.email || "";
      }

      const { error: statsCreateError } = await supabase
        .from("user_stats")
        .insert(statsInsertPayload);

      if (statsCreateError) {
        console.error("❌ Failed to create user_stats row:", statsCreateError);
        return;
      }
    }

    const { data: finalStats, error: finalStatsError } = await supabase
      .from("user_stats")
      .select("*")
      .eq("id", player.userId)
      .single();

    if (finalStatsError || !finalStats) {
      console.error("❌ Could not load user_stats row after upsert:", finalStatsError);
      return;
    }

    console.log(`\n📊 Step 2: Calculating new stats...`);

    // Calculate streak based on play dates
    const today = new Date().toISOString().split('T')[0];
    const lastPlayedDate = null;

    // Calculate new stats
    const oldWins = finalLeaderboard?.total_wins ?? finalStats.total_wins ?? 0;
    const oldLosses = finalLeaderboard?.total_losses ?? finalStats.total_losses ?? 0;
    const newWins = oldWins + (result === "win" ? 1 : 0);
    const newLosses = oldLosses + (result === "loss" ? 1 : 0);
    const totalAttempts = newWins + newLosses;
    const newAccuracy = totalAttempts > 0 ? (newWins / totalAttempts) * 100 : 0;
    const newEloRating = Math.max(0, (finalLeaderboard?.elo_rating ?? finalStats.elo_rating ?? 1200) + eloChange);
    const newTotalQuizzes = (finalLeaderboard?.total_quizzes ?? finalStats.total_quizzes ?? 0) + 1;
    const newCorrectAnswers = (finalLeaderboard?.correct_answers ?? 0) + (result === "win" ? 1 : 0);
    const newTotalPoints = (finalLeaderboard?.total_points ?? 0) + player.score;
    const newWeeklyPoints = (finalLeaderboard?.weekly_points ?? 0) + player.score;
    const newDailyPoints = (finalLeaderboard?.daily_points ?? 0) + player.score;
    const newStreak = result === "win" ? ((finalLeaderboard?.streak ?? 0) + 1) : 0;

    console.log(`Old stats:`, { 
      wins: oldWins,
      losses: oldLosses,
      elo: finalStats.elo_rating,
      totalQuizzes: finalStats.total_quizzes || 0,
      lastPlayedDate: lastPlayedDate
    });
    console.log(`New stats:`, { 
      wins: newWins, 
      losses: newLosses, 
      elo: newEloRating,
      totalQuizzes: newTotalQuizzes,
      totalPoints: newTotalPoints,
      weeklyPoints: newWeeklyPoints,
      dailyPoints: newDailyPoints,
      streak: newStreak,
      accuracy: newAccuracy.toFixed(2),
      lastPlayedDate: today
    });

    console.log(`\n💾 Step 3: Updating user_stats table...`);

    const { error: updateError, data: updateData } = await supabase
      .from("user_stats")
      .update({
        total_wins: newWins,
        total_losses: newLosses,
        total_quizzes: newTotalQuizzes,
        accuracy_percentage: newAccuracy,
        quizzes_completed: newTotalQuizzes,
        avg_accuracy: newAccuracy,
        elo_rating: newEloRating,
      })
      .eq("id", player.userId)
      .select();

    console.log(`Update response:`, { hasError: !!updateError, hasData: !!updateData });

    if (updateError) {
      console.error(`❌ UPDATE FAILED for userId ${player.userId}:`, {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details
      });
      console.log("❌ This is a CRITICAL error - data was NOT saved!");
    } else {
      console.log(`✅ user_stats UPDATE SUCCESSFUL!`);
      console.log(`   Rows updated:`, updateData?.length || 0);
      console.log(`   New profile values:`, updateData?.[0]);

      // Optional best-effort leaderboard sync if this table has richer columns in some deployments
      const { error: leaderboardSyncError } = await supabase
        .from("leaderboard")
        .update({
          total_wins: newWins,
          total_losses: newLosses,
          total_quizzes: newTotalQuizzes,
          correct_answers: newCorrectAnswers,
          accuracy_percentage: newAccuracy,
          elo_rating: newEloRating,
          total_points: newTotalPoints,
          weekly_points: newWeeklyPoints,
          daily_points: newDailyPoints,
          streak: newStreak,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", player.userId);

      if (leaderboardSyncError) {
        console.warn("⚠️ Leaderboard sync skipped/failed (non-blocking):", leaderboardSyncError.message);
      }
    }

    console.log("=".repeat(80));
    console.log("🟢 UPDATE PLAYER PROFILES END");
    console.log("=".repeat(80) + "\n");

  } catch (error: any) {
    console.error("❌ EXCEPTION in updatePlayerProfiles:", {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }
}
