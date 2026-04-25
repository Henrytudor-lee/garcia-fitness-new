'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Dumbbell, BarChart3, Flame, Trophy, Plus, X, ChevronRight, PlayCircle, Timer
} from 'lucide-react';
import { sessionApi, exerciseApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import AddExerciseModal from '@/app/components/AddExerciseModal';
import EditExerciseModal from '@/app/components/EditExerciseModal';
import SessionDetailModal from '@/app/components/SessionDetailModal';
import { useI18n } from '@/contexts/I18nContext';

interface SessionExerciseGroup {
  exercise_id: number;
  name: string;
  image_name: string | null;
  sets: {
    id: number;
    weight: number;
    reps: number;
    weight_unit: string;
    sequence: number;
    create_time: string;
  }[];
}

interface Session {
  id: number;
  user_id: number;
  start_time: string;
  end_time?: string;
  is_done: number;
  status: string;
}

export default function HomePage() {
  const router = useRouter();
  const { t } = useI18n();
  const [runningSession, setRunningSession] = useState<Session | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restSeconds, setRestSeconds] = useState(0);
  const [todaySessions, setTodaySessions] = useState<Session[]>([]);
  const [sessionExerciseGroups, setSessionExerciseGroups] = useState<SessionExerciseGroup[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SessionExerciseGroup | null>(null);
  const [quickStartLoading, setQuickStartLoading] = useState(false);
  const [historyDate, setHistoryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [detailSessionId, setDetailSessionId] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastExerciseTimeRef = useRef<number>(0);
  const hasShownEndAlert = useRef(false);

  const userId = typeof window !== 'undefined' ? Number(localStorage.getItem('user_id')) : 0;

  useEffect(() => {
    if (!userId) {
      router.push('/login');
      return;
    }
    loadRunningSession();
    loadTodaySessions();
  }, [userId]);

  // Main session elapsed timer
  useEffect(() => {
    if (runningSession) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [runningSession]);

  // Rest Timer
  useEffect(() => {
    if (runningSession) {
      restTimerRef.current = setInterval(() => {
        setRestSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
      setRestSeconds(0);
    }
    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, [runningSession]);

  const loadRunningSession = useCallback(async () => {
    try {
      const res = await sessionApi.getLastRunning();
      if (res.success && res.data) {
        setRunningSession(res.data);
        const start = new Date(res.data.start_time).getTime();
        setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
        loadSessionExerciseGroups(res.data.id);
      } else {
        setRunningSession(null);
        setSessionExerciseGroups([]);
      }
    } catch (err) {
      console.error('Failed to load running session:', err);
    }
  }, []);

  const loadSessionExerciseGroups = async (sessionId: number) => {
    try {
      const res = await sessionApi.getSessionExercises(sessionId);
      if (res.success) {
        setSessionExerciseGroups(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load exercises:', err);
    }
  };

  const loadTodaySessions = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await sessionApi.getHistoryByDate(today);
      if (res.success) {
        setTodaySessions(res.data || []);
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
      if (res.success && res.data) {
        setRunningSession(res.data);
        setElapsedSeconds(0);
        setSessionExerciseGroups([]);
        loadTodaySessions();
      } else {
        console.error('Start session failed:', res.error);
      }
    } catch (err) {
      console.error('Failed to start session:', err);
    } finally {
      setQuickStartLoading(false);
    }
  };

  const handleStopSession = async () => {
    if (!runningSession || !userId) return;
    try {
      const res = await sessionApi.stop(userId);
      if (res.success) {
        setRunningSession(null);
        setElapsedSeconds(0);
        setSessionExerciseGroups([]);
        loadTodaySessions();
      } else {
        console.error('Stop session failed:', res.error);
      }
    } catch (err) {
      console.error('Failed to stop session:', err);
    }
  };

  const handleExerciseAdded = () => {
    if (runningSession) {
      loadSessionExerciseGroups(runningSession.id);
      // Reset rest timer when a new exercise is added
      lastExerciseTimeRef.current = Date.now();
      setRestSeconds(0);
    }
  };

  const handleEditSaved = () => {
    if (runningSession) {
      loadSessionExerciseGroups(runningSession.id);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatDuration = (start: string, end?: string) => {
    if (!end) return '--';
    const ms = new Date(end).getTime() - new Date(start).getTime();
    return `${Math.round(ms / 60000)} min`;
  };

  const totalVolume = sessionExerciseGroups.reduce((sum, group) =>
    sum + group.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0);

  return (
    <div className="space-y-6">
      {/* Hero Timer Card */}
      <section className="relative overflow-hidden rounded-2xl p-6 flex flex-col items-center justify-center glass-card">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80"
            alt="Gym"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 text-center">
          <p className="text-xs font-bold text-primary-fixed-dim tracking-[0.2em] uppercase mb-1">{t('timer.duration')}</p>
          <h2
            className="text-5xl font-black text-primary-fixed font-lexend drop-shadow-[0_0_12px_rgba(204,242,0,0.4)] tabular-nums"
            style={{ minWidth: '6ch', letterSpacing: '0.05em' }}
          >
            {runningSession ? formatTime(elapsedSeconds) : '00:00:00'}
          </h2>
          <div className="flex gap-8 mt-6 items-start">
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold">{runningSession ? totalVolume : 0}</span>
              <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">{t('timer.volume')} (kg)</span>
            </div>
            <div className="w-px h-8 bg-white/10"></div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold">{runningSession ? sessionExerciseGroups.length : '--'}</span>
              <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">{t('timer.exercises')}</span>
            </div>
            <div className="w-px h-8 bg-white/10"></div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1">
                <Timer size={14} className="text-primary-fixed" />
                <span className="text-lg font-bold tabular-nums" style={{ minWidth: '4ch' }}>
                  {runningSession ? formatTime(restSeconds) : '--:--'}
                </span>
              </div>
              <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">{t('timer.rest')}</span>
            </div>
          </div>
        </div>

        {/* Session action button */}
        {runningSession ? (
          <button
            onClick={handleStopSession}
            className="mt-4 px-8 py-2 bg-red-500 text-white font-bold rounded-full text-sm hover:bg-red-600 transition-colors uppercase tracking-wider"
          >
            {t('timer.end')}
          </button>
        ) : (
          <button
            onClick={handleStartSession}
            disabled={quickStartLoading}
            className="mt-4 px-8 py-2 bg-primary-fixed text-black font-bold rounded-full text-sm hover:opacity-90 transition-opacity uppercase tracking-wider"
          >
            {quickStartLoading ? t('timer.starting') : t('timer.start')}
          </button>
        )}
      </section>

      {/* Quick Start (when no session) */}
      {!runningSession && (
        <button
          onClick={handleStartSession}
          disabled={quickStartLoading}
          className="w-full py-4 bg-primary-fixed text-black font-lexend font-black text-lg rounded-full shadow-[0_0_25px_rgba(204,242,0,0.3)] active:scale-95 transition-all uppercase tracking-widest"
        >
          {quickStartLoading ? t('timer.starting') : t('timer.quick_start')}
        </button>
      )}

      {/* FAB - Add Exercise (only when session running) */}
      <AnimatePresence>
        {runningSession && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={() => setShowAddModal(true)}
            className="fixed bottom-28 right-5 w-14 h-14 bg-primary-fixed rounded-full shadow-[0_0_20px_rgba(204,242,0,0.5)] flex items-center justify-center text-black active:scale-90 transition-transform z-40"
            style={{ boxShadow: '0 0 20px rgba(204,242,0,0.5)' }}
          >
            <Plus size={32} strokeWidth={3} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Current Workout */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <h3 className="text-xl font-bold font-lexend">{t('workout.current')}</h3>
          <span className="text-[10px] font-bold text-primary-fixed-dim uppercase tracking-wider">
            {runningSession ? t('workout.in_progress') : t('workout.ready')}
          </span>
        </div>

        {runningSession ? (
          <div className="space-y-3">
            {sessionExerciseGroups.length === 0 ? (
              <div className="glass-card rounded-xl flex flex-col items-center justify-center py-10 text-neutral-500">
                <Dumbbell size={32} className="mb-2 opacity-30" />
                <p className="text-sm">{t('workout.tap_plus')}</p>
              </div>
            ) : (
              sessionExerciseGroups.map((group) => (
                <div
                  key={group.exercise_id}
                  onClick={() => setEditingGroup(group)}
                  className="glass-card rounded-xl overflow-hidden cursor-pointer hover:border-primary-fixed/40 active:scale-[0.99] transition-all"
                >
                  {/* Exercise header with image */}
                  <div className="flex items-center gap-3 p-4 border-b border-white/5">
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
                      {group.image_name ? (
                        <img
                          src={group.image_name}
                          alt={group.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Dumbbell size={24} className="text-neutral-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{group.name}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {group.sets.length} {group.sets.length === 1 ? t('workout.set') : t('workout.sets')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold text-primary-fixed">
                        {group.sets.reduce((s, set) => s + set.weight * set.reps, 0)} kg
                      </span>
                      <span className="text-[10px] text-neutral-500">{t('workout.total_vol')}</span>
                    </div>
                  </div>
                  {/* Sets preview — 2 per row */}
                  <div className="p-3 grid grid-cols-2 gap-2">
                    {group.sets.map((set, idx) => (
                      <div key={set.id} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                        <span className="w-5 h-5 rounded-full bg-primary-fixed/20 text-primary-fixed text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium flex-1">
                          {set.weight} <span className="text-neutral-500">{set.weight_unit}</span>
                        </span>
                        <span className="text-sm text-neutral-400">×</span>
                        <span className="text-sm font-medium flex-shrink-0">
                          {set.reps}<span className="text-neutral-500 text-xs ml-0.5">{t('workout.reps')}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="glass-card rounded-xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center opacity-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                  <Dumbbell className="text-neutral-500" size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm">No active workout</h4>
                  <p className="text-[10px] text-neutral-500 uppercase font-semibold">Start training to see exercises</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* History Bento */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold font-lexend">{t('history.title')}</h3>
          <input
            type="date"
            value={historyDate}
            onChange={(e) => setHistoryDate(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs"
          />
        </div>

        {todaySessions.length > 0 ? (
          <div className="space-y-3">
            {todaySessions.map((session) => (
              <div
                key={session.id}
                onClick={() => setDetailSessionId(session.id)}
                className="glass-card rounded-xl p-4 cursor-pointer hover:border-primary-fixed/40 active:scale-[0.99] transition-all"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-primary-fixed">
                    {new Date(session.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {formatDuration(session.start_time, session.end_time)}
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  {session.is_done ? t('history.completed') : t('history.in_progress')}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pb-4">
            <div className="glass-card rounded-2xl p-4 flex flex-col justify-between aspect-square">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase">{t('history.today')}</span>
              <div className="flex flex-col">
                <span className="text-4xl font-lexend font-bold">{new Date().getDate()}</span>
                <span className="text-xs font-bold text-primary-fixed-dim uppercase tracking-widest">
                  {new Date().toLocaleDateString('en-US', { month: 'short' })}
                </span>
              </div>
              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary-fixed w-[0%]" />
              </div>
            </div>
            <div className="glass-card rounded-2xl p-4 flex flex-col justify-between aspect-square">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase">{t('history.yesterday')}</span>
              <div className="flex flex-col">
                <span className="text-4xl font-lexend font-bold">{new Date(Date.now() - 86400000).getDate()}</span>
                <span className="text-xs font-bold text-primary-fixed-dim uppercase tracking-widest">
                  {new Date(Date.now() - 86400000).toLocaleDateString('en-US', { month: 'short' })}
                </span>
              </div>
              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-white/20 w-[0%]" />
              </div>
            </div>
            <div className="col-span-2 glass-card rounded-2xl p-5 flex flex-col gap-4 overflow-hidden relative min-h-[160px]">
              <BarChart3 className="absolute right-[-20px] bottom-[-20px] text-white/5" size={140} />
              <div className="relative z-10">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{t('history.monthly_vol')}</h4>
                <p className="text-4xl font-black text-primary-fixed font-lexend mt-1">0 KG</p>
                <p className="text-[10px] text-lime-400/70 font-bold mt-1 uppercase">{t('history.start_tracking')}</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Add Exercise Modal */}
      <AddExerciseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        sessionId={runningSession?.id || null}
        onExerciseAdded={handleExerciseAdded}
      />

      {/* Edit Exercise Modal */}
      <EditExerciseModal
        isOpen={!!editingGroup}
        onClose={() => setEditingGroup(null)}
        group={editingGroup}
        sessionId={runningSession?.id || null}
        onSaved={handleEditSaved}
      />

      {/* Session Detail Modal */}
      <SessionDetailModal
        isOpen={detailSessionId !== null}
        onClose={() => setDetailSessionId(null)}
        sessionId={detailSessionId}
      />
    </div>
  );
}
