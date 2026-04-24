import type { Session, Exercise, ExerciseModel, User } from '@/types';

const API_BASE = '';

export function setAuthToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

async function authFetch(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...options, headers });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

// Auth API - 自己的 JWT 认证
export const authApi = {
  login: async (email: string, password: string) => {
    try {
      const data = await authFetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (data.success) {
        setAuthToken(data.data.token);
        return { success: true, data: data.data };
      }
      return { success: false, error: data.error || 'Login failed' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  register: async (email: string, password: string, name: string) => {
    try {
      return await authFetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      });
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  logout: async () => {
    setAuthToken(null);
  },
};

// Session API
export const sessionApi = {
  start: async (userId: number) => {
    try {
      const data = await authFetch(`${API_BASE}/api/session/start`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      });
      return data;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  stop: async (userId: number) => {
    try {
      const data = await authFetch(`${API_BASE}/api/session/stop`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      });
      return data;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  getLastRunning: async () => {
    try {
      return await authFetch(`${API_BASE}/api/session/last-running`);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  getHistoryByDate: async (date: string) => {
    try {
      return await authFetch(`${API_BASE}/api/session/history?date=${date}`);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  getAll: async (userId: number, limit = 30) => {
    try {
      return await authFetch(`${API_BASE}/api/session/all?user_id=${userId}&limit=${limit}`);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

// Exercise Library API
export const exerciseApi = {
  query: async (equipmentId: number, bodyPartId: number) => {
    try {
      const params = new URLSearchParams();
      if (equipmentId > 0) params.set('equipment_id', String(equipmentId));
      if (bodyPartId > 0) params.set('body_part_id', String(bodyPartId));
      return await authFetch(`${API_BASE}/api/exercise/query?${params}`);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  handle: async (data: {
    user_id: number;
    session_id: number;
    exercise_id: number;
    weight: number;
    reps: number;
    weight_unit: string;
    type: string;
  }) => {
    try {
      return await authFetch(`${API_BASE}/api/exercise/handle`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  getHistoryExercises: async (userId: number) => {
    try {
      return await authFetch(`${API_BASE}/api/exercise/history?user_id=${userId}`);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  getExerciseWeightRecord: async (userId: number, exerciseId: number) => {
    try {
      return await authFetch(`${API_BASE}/api/exercise/weight-record?user_id=${userId}&exercise_id=${exerciseId}`);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  getMaxWeightRecord: async (userId: number, exerciseId: number) => {
    try {
      return await authFetch(`${API_BASE}/api/exercise/max-weight?user_id=${userId}&exercise_id=${exerciseId}`);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};
