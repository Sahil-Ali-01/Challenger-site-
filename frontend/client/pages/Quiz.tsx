import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RotateCcw, 
  Trophy,
  Info,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { Question } from '@shared/api';
import { cn } from '@/lib/utils';

export default function Quiz() {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category')?.trim() || '';
  const apiUrl = (import.meta.env.VITE_API_URL || '').trim();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [resultsSynced, setResultsSynced] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?.id) {
          setCurrentUserId(parsed.id);
        }
      } catch {}
    }

    fetchQuestions();
  }, [categoryParam]);

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

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      query.set('count', '5');
      if (categoryParam) {
        query.set('category', categoryParam);
      }

      const response = await fetchWithFallback(`/api/questions?${query.toString()}`);
      const payload = await parseJsonSafely(response);

      if (payload?.success && Array.isArray(payload?.data) && payload.data.length > 0) {
        setQuestions(payload.data);
        console.log(`🎯 Loaded ${payload.data.length} AI questions`);
      } else {
        console.error('No questions available');
        setQuestions([]);
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }

  const publishProfileStatsUpdate = (payload: {
    wins: number;
    losses: number;
    elo_rating?: number;
    total_points?: number;
    weekly_points?: number;
    total_quizzes?: number;
    accuracy_percentage?: number;
    correct_answers?: number;
  }) => {
    try {
      localStorage.setItem('latestLeaderboardStats', JSON.stringify({
        ...payload,
        updatedAt: Date.now(),
      }));
      window.dispatchEvent(new CustomEvent('profile:stats-updated', { detail: payload }));
    } catch (error) {
      console.error('Failed to publish profile stats update event:', error);
    }
  };

  const syncQuizResults = async () => {
    if (!currentUserId || resultsSynced || questions.length === 0) {
      return;
    }

    try {
      const correctAnswers = Math.floor(score / 10);
      const response = await fetchWithFallback('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          isCorrect: correctAnswers > 0,
          correctAnswers,
          attempts: questions.length,
          points: score,
        }),
      });

      if (!response.ok) {
        const errorPayload = await parseJsonSafely(response);
        throw new Error(errorPayload?.error || `Profile sync failed with status ${response.status}`);
      }

      const payload = await parseJsonSafely(response);
      if (payload?.success && payload?.newStats) {
        publishProfileStatsUpdate({
          wins: payload.newStats.wins ?? 0,
          losses: payload.newStats.losses ?? 0,
          elo_rating: payload.newStats.elo_rating ?? 1200,
          total_points: payload.newStats.total_points ?? 0,
          weekly_points: payload.newStats.weekly_points ?? 0,
          total_quizzes: payload.newStats.total_quizzes ?? 0,
          accuracy_percentage: payload.newStats.accuracy ?? 0,
          correct_answers: payload.newStats.correct_answers ?? 0,
        });
      }

      setResultsSynced(true);
    } catch (error) {
      console.warn('Failed to sync quiz results to profile:', error);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
  };

  const handleAnswerSubmit = () => {
    if (selectedOption === null || isAnswered) return;
    
    setIsAnswered(true);
    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    if (isCorrect) {
      setScore(s => s + 10);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
    }
  };

  useEffect(() => {
    if (showResults) {
      void syncQuizResults();
    }
  }, [showResults]);

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setShowResults(false);
    setResultsSynced(false);
    void fetchQuestions();
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

  if (questions.length === 0) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 glass-card rounded-2xl max-w-2xl mx-auto">
          <Trophy className="w-16 h-16 text-muted-foreground mb-4 opacity-20" />
          <h2 className="text-2xl font-bold mb-2">No questions found</h2>
          <p className="text-muted-foreground mb-6">We don't have questions for "{categoryParam || 'all categories'}" yet.</p>
          <Button asChild>
            <Link to="/quiz">Browse all categories</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  if (showResults) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-8">
          <div className="glass-card rounded-2xl p-8 text-center space-y-6 relative overflow-hidden border-border/70">
            <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
            <div className="space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce">
                <Trophy className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">Challenge Complete!</h1>
              <p className="text-muted-foreground text-base italic">Great work, developer!</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-accent/40 border border-border/70">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Final Score</p>
                <p className="text-3xl font-bold text-primary">{score}</p>
              </div>
              <div className="p-5 rounded-xl bg-accent/40 border border-border/70">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Correct</p>
                <p className="text-3xl font-bold">{score / 10} / {questions.length}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button size="lg" className="w-full h-10 text-sm font-bold" onClick={resetQuiz}>
                <RotateCcw className="mr-2 w-4 h-4" /> Try Again
              </Button>
              <Button size="lg" variant="outline" className="w-full h-10 text-sm font-bold glass-button" asChild>
                <Link to="/leaderboard">See Ranking</Link>
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-6 lg:py-8 space-y-6">
        {/* Progress Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Link to="/quiz" className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              <ChevronLeft className="w-4 h-4 mr-1" /> All Quizzes
            </Link>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 uppercase tracking-wider text-[10px] font-bold py-0.5">
              {currentQuestion.category}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="h-2" />
            </div>
            <span className="text-sm font-bold whitespace-nowrap tabular-nums">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
          </div>
        </div>

        {/* Question Card */}
        <div className="glass-card rounded-2xl p-6 md:p-8 relative overflow-hidden transition-all duration-500 border-border/70">
          <h2 className="text-xl md:text-2xl font-bold leading-tight mb-7">
            {currentQuestion.question}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedOption === index;
              const isCorrect = currentQuestion.correctAnswer === index;
              
              return (
                <button
                  key={index}
                  disabled={isAnswered}
                  onClick={() => handleOptionSelect(index)}
                  className={cn(
                    "w-full p-4 rounded-xl text-left font-medium transition-all duration-300 border flex items-start justify-between group min-h-16",
                    !isAnswered && "hover:border-primary hover:bg-primary/5 active:scale-[0.99] border-border/70",
                    !isAnswered && isSelected && "border-primary bg-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.1)]",
                    isAnswered && isCorrect && "bg-green-500/10 border-green-500 text-green-500",
                    isAnswered && isSelected && !isCorrect && "bg-destructive/10 border-destructive text-destructive"
                  )}
                >
                  <span className="flex items-start gap-3 pr-3 min-w-0">
                    <span className={cn(
                      "w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold transition-colors",
                      !isAnswered && "bg-accent/60 group-hover:bg-primary group-hover:text-primary-foreground",
                      !isAnswered && isSelected && "bg-primary text-primary-foreground",
                      isAnswered && isCorrect && "bg-green-500 text-white",
                      isAnswered && isSelected && !isCorrect && "bg-destructive text-white"
                    )}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="leading-snug break-words whitespace-normal">{option}</span>
                  </span>
                  
                  {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5" />}
                  {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5" />}
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex justify-end">
            {!isAnswered ? (
              <Button 
                size="lg" 
                className="px-6 h-10 text-sm font-bold transition-all"
                disabled={selectedOption === null}
                onClick={handleAnswerSubmit}
              >
                Submit Answer
              </Button>
            ) : (
              <Button 
                size="lg" 
                className="px-6 h-10 text-sm font-bold animate-in slide-in-from-right duration-300"
                onClick={handleNext}
              >
                {currentQuestionIndex === questions.length - 1 ? 'See Results' : 'Next Question'} 
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Explanation Card */}
        {isAnswered && (
          <div className="glass-card rounded-xl p-5 border-l-2 border-l-primary animate-in fade-in slide-in-from-bottom duration-500 border-border/70">
            <div className="flex gap-3">
              <div className="mt-1 shrink-0">
                <Info className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-primary uppercase tracking-widest">Explanation</h4>
                <p className="text-muted-foreground leading-relaxed">
                  {currentQuestion.explanation}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
