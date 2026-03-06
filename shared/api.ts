export interface Question {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface UserStats {
  points: number;
  rank: number;
  solved: number;
  streak: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  stats: UserStats;
  badges: string[];
  joinedAt: string;
}

export interface QuizAttempt {
  userId: string;
  questionId: string;
  selectedOption: number;
  isCorrect: boolean;
  timestamp: string;
}

export interface DemoResponse {
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
