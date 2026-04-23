'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { sessionApi, exerciseApi } from '@/lib/api';
import { Session, ExerciseModel } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const [runningSession, setRunningSession] = useState<Session | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [todaySessions, setTodaySessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [sessionExercises, setSessionExercises] = useState<any[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseModel | null>(null);
  const [exerciseSets, setExerciseSets] = useState<{ weight: string; reps: string; unit: string }[]>([
    { weight: '', reps: '', unit: 'kg' }
  ]);
  const [quickStartLoading, setQuickStartLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const userId = typeof window !== 'undefined' ? Number(localStorage.getItem('user_id')) : 0;
  const userName = typeof window !== 'undefined' ? localStorage.getItem('user_name') : '';

  // Load running session on mount
  useEffect(() => {
    loadRunningSession();
    loadTodaySessions();
  }, []);

  // Timer effect
  useEffect(() => {
    if (runningSession) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [runningSession]);

  const loadRunningSession = async () => {
    try {
      const res = await sessionApi.getLastRunning();
      if (res.data.success && res.data.data) {
        setRunningSession(res.data.data);
        const start = new Date(res.data.data.start_time).getTime();
        const now = Date.now();
        setElapsedSeconds(Math.floor((now - start) / 1000));
      }
    } catch (err) {
      console.error('Failed to load running session:', err);
    }
  };

  const loadTodaySessions = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await sessionApi.getHistoryByDate(today);
      if (res.data.success) {
        setTodaySessions(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load today sessions:', err);
    }
  };

  const handleStartSession = async () => {
    if (!userId) return;
    setQuickStartLoading(true);
    try {
      const res = await sessionApi.start(userId);
      if (res.data.success) {
        setRunningSession(res.data.data);
        setElapsedSeconds(0);
        loadTodaySessions();
      }
    } catch (err) {
      console.error('Failed to start session:', err);
    } finally {
      setQuickStartLoading(false);
    }
  };

  const handleStopSession = async () => {
    if (!userId) return;
    try {
      const res = await sessionApi.stop(userId);
      if (res.data.success) {
        setRunningSession(null);
        setElapsedSeconds(0);
        loadTodaySessions();
      }
    } catch (err) {
      console.error('Failed to stop session:', err);
    }
  };

  const handleSelectSession = async (sessionId: number) => {
    setSelectedSession(sessionId);
    // Load exercises for this session
    try {
      // This would need a specific API endpoint
      setSessionExercises([]);
    } catch (err) {
      console.error('Failed to load session exercises:', err);
    }
  };

  const handleAddSet = () => {
    setExerciseSets([...exerciseSets, { weight: '', reps: '', unit: 'kg' }]);
  };

  const handleSetChange = (index: number, field: string, value: string) => {
    const newSets = [...exerciseSets];
    newSets[index] = { ...newSets[index], [field]: value };
    setExerciseSets(newSets);
  };

  const handleRecordExercise = async () => {
    if (!runningSession || !selectedExercise) return;
    try {
      for (const set of exerciseSets) {
        if (set.weight && set.reps) {
          await exerciseApi.handle({
            user_id: userId,
            session_id: runningSession.id,
            exercise_id: selectedExercise.id,
            weight: Number(set.weight),
            reps: Number(set.reps),
            weight_unit: set.unit,
            type: 'add'
          });
        }
      }
      // Reset
      setSelectedExercise(null);
      setExerciseSets([{ weight: '', reps: '', unit: 'kg' }]);
    } catch (err) {
      console.error('Failed to record exercise:', err);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getTodayFormatted = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    return now.toLocaleDateString('en-US', options);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-neutral-400 text-sm">Welcome back,</p>
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Lexend, sans-serif' }}>
            {userName || 'Athlete'}
          </h2>
        </div>
        <div className="text-right">
          <p className="text-neutral-400 text-xs uppercase tracking-wide">Today</p>
          <p className="text-sm text-white font-medium">{getTodayFormatted()}</p>
        </div>
      </div>

      {/* Training Timer Card */}
      <div className="glass-card rounded-3xl p-6">
        {runningSession ? (
          /* Running Session */
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <p className="text-secondary text-sm font-bold uppercase tracking-widest">Training in Progress</p>
              <div className="text-7xl font-black text-primary-fixed tracking-widest" style={{ fontFamily: 'Lexend, sans-serif' }}>
                {formatTime(elapsedSeconds)}
              </div>
            </div>
            <button
              onClick={handleStopSession}
              className="px-12 py-4 bg-error text-black font-bold rounded-full hover:opacity-90 transition-opacity"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              END SESSION
            </button>
          </div>
        ) : (
          /* Start Session */
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary-fixed/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary-fixed text-4xl">play_arrow</span>
            </div>
            <div className="space-y-2">
              <p className="text-white text-lg font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>Ready to Train?</p>
              <p className="text-neutral-400 text-sm">Start a session to track your workout</p>
            </div>
            <button
              onClick={handleStartSession}
              disabled={quickStartLoading}
              className="px-12 py-4 bg-primary-fixed text-black font-bold rounded-full hover:bg-primary-fixed-dim transition-colors disabled:opacity-50"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              {quickStartLoading ? 'Starting...' : 'QUICK START'}
            </button>
          </div>
        )}
      </div>

      {/* Today's Sessions */}
      {todaySessions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Lexend, sans-serif' }}>
            Today's Sessions
          </h3>
          <div className="space-y-2">
            {todaySessions.map((session) => (
              <button
                key={session.id}
                onClick={() => handleSelectSession(session.id)}
                className={`w-full glass-card rounded-2xl p-4 flex items-center justify-between transition-all ${
                  selectedSession === session.id ? 'border-primary-fixed' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center">
                    <span className="material-symbols-outlined text-secondary">fitness_center</span>
                  </div>
                  <div className="text-left">
                    <p className="text-white font-bold">Session #{session.id}</p>
                    <p className="text-neutral-400 text-sm">
                      {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <span className={`material-symbols-outlined ${session.is_done ? 'text-error' : 'text-secondary'}`}>
                  {session.is_done ? 'check_circle' : 'radio_button_checked'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Exercise Input (when session is running) */}
      {runningSession && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Lexend, sans-serif' }}>
            Add Exercise
          </h3>
          <div className="glass-card rounded-2xl p-4 space-y-4">
            <button
              onClick={() => router.push('/library?select=true')}
              className="w-full py-3 border border-dashed border-neutral-500 rounded-xl text-neutral-400 hover:border-primary-fixed hover:text-primary-fixed transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">add</span>
              Select Exercise from Library
            </button>

            {selectedExercise && (
              <>
                <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                  <div className="w-12 h-12 rounded-lg bg-primary-fixed/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary-fixed">fitness_center</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold">{selectedExercise.name}</p>
                    <p className="text-neutral-400 text-sm">{selectedExercise.exercise_type}</p>
                  </div>
                  <button onClick={() => setSelectedExercise(null)} className="text-neutral-400">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {/* Sets */}
                <div className="space-y-2">
                  <p className="text-sm font-bold text-neutral-400 uppercase">Sets</p>
                  {exerciseSets.map((set, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <span className="text-neutral-500 text-sm w-6">{index + 1}</span>
                      <input
                        type="number"
                        placeholder="Weight"
                        value={set.weight}
                        onChange={(e) => handleSetChange(index, 'weight', e.target.value)}
                        className="flex-1 bg-surface-container-low rounded-lg px-3 py-2 text-white placeholder-neutral-500 border border-white/5 focus:border-primary-fixed focus:outline-none"
                      />
                      <select
                        value={set.unit}
                        onChange={(e) => handleSetChange(index, 'unit', e.target.value)}
                        className="bg-surface-container-low rounded-lg px-2 py-2 text-white border border-white/5 focus:border-primary-fixed focus:outline-none"
                      >
                        <option value="kg">kg</option>
                        <option value="lb">lb</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Reps"
                        value={set.reps}
                        onChange={(e) => handleSetChange(index, 'reps', e.target.value)}
                        className="w-20 bg-surface-container-low rounded-lg px-3 py-2 text-white placeholder-neutral-500 border border-white/5 focus:border-primary-fixed focus:outline-none"
                      />
                    </div>
                  ))}
                  <button
                    onClick={handleAddSet}
                    className="text-primary-fixed text-sm font-bold flex items-center gap-1 hover:underline"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Add Set
                  </button>
                </div>

                <button
                  onClick={handleRecordExercise}
                  className="w-full py-3 bg-primary-fixed text-black font-bold rounded-full hover:bg-primary-fixed-dim transition-colors"
                  style={{ fontFamily: 'Lexend, sans-serif' }}
                >
                  Record Exercise
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Calendar Preview */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Lexend, sans-serif' }}>
          Recent Activity
        </h3>
        <div className="glass-card rounded-2xl p-4">
          <div className="grid grid-cols-7 gap-1 text-center">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-neutral-500 text-xs font-bold">{day}</div>
            ))}
            {Array.from({ length: 35 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - 34 + i);
              const hasSession = todaySessions.some(s => 
                new Date(s.start_time).toDateString() === date.toDateString()
              );
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <div
                  key={i}
                  className={`aspect-square rounded-full flex items-center justify-center text-xs ${
                    hasSession ? 'bg-primary-fixed text-black font-bold' :
                    isToday ? 'border border-primary-fixed text-white' :
                    'text-neutral-500'
                  }`}
                >
                  {date.getDate()}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
