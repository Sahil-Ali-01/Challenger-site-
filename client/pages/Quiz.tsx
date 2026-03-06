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
  const categoryParam = searchParams.get('category');
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions();
  }, [categoryParam]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      
      let allQuestions: Question[] = [];
      
      // Fetch database questions first (2 questions)
      try {
        console.log("📚 Fetching database questions...");
        const categoryQuery = categoryParam ? `?category=${categoryParam}` : '';
        const dbResponse = await fetch(`/api/questions${categoryQuery}`);
        const dbData = await dbResponse.json();
        
        if (dbData.success && dbData.data) {
          console.log(`✅ Got ${dbData.data.length} database questions, taking first 2`);
          // Add only 2 database questions
          allQuestions = [...dbData.data.slice(0, 2)];
        }
      } catch (dbErr) {
        console.warn("⚠️  Database questions failed:", dbErr);
      }
      
      // Then fetch AI questions (3 questions)
      try {
        console.log("🤖 Fetching AI questions...");
        const aiResponse = await fetch('/api/questions/generate-multiple', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            category: categoryParam || 'programming',
            difficulty: 'medium',
            count: 3
          })
        });
        
        const aiData = await aiResponse.json();
        if (aiData.success && aiData.data) {
          console.log(`✅ Got ${aiData.data.length} AI questions`);
          allQuestions = [...allQuestions, ...aiData.data];
        }
      } catch (aiErr) {
        console.warn("⚠️  AI questions failed, using database only:", aiErr);
      }
      
      if (allQuestions.length > 0) {
        // Shuffle questions
        setQuestions(allQuestions.sort(() => Math.random() - 0.5));
        console.log(`🎯 Total questions: ${allQuestions.length} (2 DB + 3 AI)`);
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

  const currentQuestion = questions[currentQuestionIndex];

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
  };

  const handleAnswerSubmit = () => {
    if (selectedOption === null || isAnswered) return;
    
    setIsAnswered(true);
    if (selectedOption === currentQuestion.correctAnswer) {
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

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setShowResults(false);
    setQuestions(q => [...q].sort(() => Math.random() - 0.5));
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
          <p className="text-muted-foreground mb-6">We don't have questions for "{categoryParam}" yet.</p>
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
        <div className="max-w-2xl mx-auto py-12">
          <div className="glass-card rounded-3xl p-10 text-center space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
            <div className="space-y-4">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Trophy className="w-12 h-12 text-primary" />
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight">Challenge Complete!</h1>
              <p className="text-muted-foreground text-lg italic">Great work, developer!</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Final Score</p>
                <p className="text-4xl font-bold text-primary">{score}</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Correct</p>
                <p className="text-4xl font-bold">{score / 10} / {questions.length}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button size="lg" className="w-full h-12 text-base font-bold" onClick={resetQuiz}>
                <RotateCcw className="mr-2 w-4 h-4" /> Try Again
              </Button>
              <Button size="lg" variant="outline" className="w-full h-12 text-base font-bold glass-button" asChild>
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
      <div className="max-w-3xl mx-auto py-8 lg:py-12 space-y-8">
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
        <div className="glass-card rounded-3xl p-8 md:p-12 relative overflow-hidden transition-all duration-500">
          <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-10">
            {currentQuestion.question}
          </h2>

          <div className="space-y-4">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedOption === index;
              const isCorrect = currentQuestion.correctAnswer === index;
              
              return (
                <button
                  key={index}
                  disabled={isAnswered}
                  onClick={() => handleOptionSelect(index)}
                  className={cn(
                    "w-full p-5 rounded-2xl text-left font-medium transition-all duration-300 border flex items-center justify-between group",
                    !isAnswered && "hover:border-primary hover:bg-primary/5 active:scale-[0.99] border-white/5",
                    !isAnswered && isSelected && "border-primary bg-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.1)]",
                    isAnswered && isCorrect && "bg-green-500/10 border-green-500 text-green-500",
                    isAnswered && isSelected && !isCorrect && "bg-destructive/10 border-destructive text-destructive"
                  )}
                >
                  <span className="flex items-center gap-4">
                    <span className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors",
                      !isAnswered && "bg-white/5 group-hover:bg-primary group-hover:text-primary-foreground",
                      !isAnswered && isSelected && "bg-primary text-primary-foreground",
                      isAnswered && isCorrect && "bg-green-500 text-white",
                      isAnswered && isSelected && !isCorrect && "bg-destructive text-white"
                    )}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                  </span>
                  
                  {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5" />}
                  {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5" />}
                </button>
              );
            })}
          </div>

          <div className="mt-10 flex justify-end">
            {!isAnswered ? (
              <Button 
                size="lg" 
                className="px-8 h-12 text-base font-bold transition-all"
                disabled={selectedOption === null}
                onClick={handleAnswerSubmit}
              >
                Submit Answer
              </Button>
            ) : (
              <Button 
                size="lg" 
                className="px-8 h-12 text-base font-bold animate-in slide-in-from-right duration-300"
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
          <div className="glass-card rounded-2xl p-6 border-l-4 border-l-primary animate-in fade-in slide-in-from-bottom duration-500">
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
