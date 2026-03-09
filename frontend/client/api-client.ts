/**
 * API Client for Quiz Challenge Arena
 * Handles all HTTP requests to the backend with proper environment configuration
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

export const api = {
  /**
   * Base fetch wrapper with common headers and error handling
   */
  async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP Error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  },

  /**
   * Auth endpoints
   */
  auth: {
    register(data: { name: string; email: string; password: string }) {
      return api.fetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    login(data: { email: string; password: string }) {
      return api.fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    verifyEmail(token: string) {
      return api.fetch(`/api/auth/verify-email?token=${token}`, {
        method: 'GET',
      });
    },

    forgotPassword(email: string) {
      return api.fetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },

    resetPassword(data: { token: string; newPassword: string }) {
      return api.fetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  /**
   * Profile endpoints
   */
  profile: {
    getProfile(userId: string) {
      return api.fetch(`/api/profile/${userId}`, {
        method: 'GET',
      });
    },

    updateProfile(userId: string, data: any) {
      return api.fetch(`/api/profile/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
  },

  /**
   * Quiz endpoints
   */
  quiz: {
    getQuiz(id: string) {
      return api.fetch(`/api/quiz/${id}`, {
        method: 'GET',
      });
    },

    submitQuiz(data: any) {
      return api.fetch('/api/quiz/submit', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  /**
   * Battle endpoints
   */
  battle: {
    startBattle(opponentId: string) {
      return api.fetch('/api/battle/start', {
        method: 'POST',
        body: JSON.stringify({ opponentId }),
      });
    },

    submitAnswer(battleId: string, answer: any) {
      return api.fetch(`/api/battle/${battleId}/answer`, {
        method: 'POST',
        body: JSON.stringify(answer),
      });
    },
  },

  /**
   * Leaderboard endpoints
   */
  leaderboard: {
    getLeaderboard(type: 'global' | 'weekly' = 'global', limit: number = 100) {
      return api.fetch(`/api/leaderboard?type=${type}&limit=${limit}`, {
        method: 'GET',
      });
    },

    getUserRank(userId: string) {
      return api.fetch(`/api/leaderboard/rank/${userId}`, {
        method: 'GET',
      });
    },
  },
};

export const getApiUrl = () => API_URL;
