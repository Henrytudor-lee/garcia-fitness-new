import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://garcia-fitness-backend.vercel.app';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/api/auth', { type: 'login', email, password }),
  register: (email: string, password: string, name: string) =>
    api.post('/api/auth', { type: 'register', email, password, name }),
};

// Session API
export const sessionApi = {
  start: (userId: number) =>
    api.post('/api/session', { user_id: userId, type: 'start' }),
  stop: (userId: number) =>
    api.post('/api/session', { user_id: userId, type: 'stop' }),
  getLastRunning: () =>
    api.get('/api/session/getLastRunningSession'),
  getHistoryByDate: (date: string) =>
    api.get('/api/session/getHistoryByDate', { params: { date } }),
};

// Exercise API
export const exerciseApi = {
  query: (equipmentId: number, bodyPartId: number) =>
    api.get('/api/exercise/query', { params: { equipment_id: equipmentId, body_part_id: bodyPartId } }),
  handle: (data: { user_id: number; session_id: number; exercise_id: number; weight: number; reps: number; weight_unit: string; type: string }) =>
    api.post('/api/exercise/handle', data),
  getHistoryExercises: (userId: number) =>
    api.get('/api/exercise/getHistoryExercises', { params: { user_id: userId } }),
  getExerciseWeightRecord: (userId: number, exerciseId: number) =>
    api.get('/api/exercise/getExerciseWeightRecord', { params: { user_id: userId, exercise_id: exerciseId } }),
  getMaxWeightRecord: (userId: number, exerciseId: number) =>
    api.get('/api/exercise/getMaxWeightRecord', { params: { user_id: userId, exercise_id: exerciseId } }),
};
