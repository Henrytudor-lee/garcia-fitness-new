'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Dumbbell, BarChart3, Flame, Trophy, Plus, X, ChevronRight, PlayCircle, Timer, LogIn
} from 'lucide-react';
import { sessionApi, exerciseApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import AddExerciseModal from '@/app/components/AddExerciseModal';
import EditExerciseModal from '@/app/components/EditExerciseModal';
import SessionDetailModal from '@/app/components/SessionDetailModal';
import WorkoutSummaryModal from '@/app/components/WorkoutSummaryModal';
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
  const { t, locale } = useI18n();
  const [runningSession, setRunningSession] = useState<Session | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restSeconds, setRestSeconds] = useState(0);
  const [todaySessions, setTodaySessions] = useState<Session[]>([]);
  const [sessionExerciseGroups, setSessionExerciseGroups] = useState<SessionExerciseGroup[]>([]);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryStats, setSummaryStats] = useState<{
    exerciseCount: number;
    totalVolume: number;
    elapsedSeconds: number;
    date: string;
    groups: SessionExerciseGroup[];
  }>({ exerciseCount: 0, totalVolume: 0, elapsedSeconds: 0, date: '', groups: [] });
  const [showAddModal, setShowAddModal] = useState(false);
  const [preselectedExercise, setPreselectedExercise] = useState<any>(null);
  const [editingGroup, setEditingGroup] = useState<SessionExerciseGroup | null>(null);
  const [quickStartLoading, setQuickStartLoading] = useState(false);
  const [historyDate, setHistoryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [detailSessionId, setDetailSessionId] = useState<number | null>(null);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);
  const restStartMsRef = useRef<number>(0);
  const pendingPreselectedRef = useRef(false);
  // Store absolute start timestamps so tab-switching doesn't cause drift
  const sessionStartMsRef = useRef<number>(0);
  // Track known exercise groups so new ones can be prepended to the top
  const knownGroupKeysRef = useRef<Set<string>>(new Set());

  const userId = typeof window !== 'undefined' ? Number(localStorage.getItem('user_id')) : 0;

  useEffect(() => {
    loadRunningSession();
    loadTodaySessions();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const saved = localStorage.getItem('preselectedExercise');
    if (!saved) return;
    localStorage.removeItem('preselectedExercise');
    const exercise = JSON.parse(saved);
    setPreselectedExercise(exercise);

    if (!runningSession) {
      // No session — start one, then open modal when it arrives
      pendingPreselectedRef.current = true;
      setQuickStartLoading(true);
      import('@/lib/api').then(({ sessionApi }) => {
        const uid = Number(localStorage.getItem('user_id'));
        sessionApi.start(uid).then((res: any) => {
          if (res.success) {
            loadRunningSession();
          }
          setQuickStartLoading(false);
        });
      });
    } else {
      // Session already running — open modal immediately
      setShowAddModal(true);
    }
  }, [userId]);

  // When session starts and we have a pending preselected exercise, open modal
  useEffect(() => {
    if (pendingPreselectedRef.current && runningSession) {
      pendingPreselectedRef.current = false;
      setShowAddModal(true);
    }
  }, [runningSession]);

  // Main session elapsed timer — uses Date.now() so tab switch doesn't cause drift
  useEffect(() => {
    if (runningSession) {
      // Record absolute start time when a session first begins
      if (sessionStartMsRef.current === 0) {
        sessionStartMsRef.current = new Date(runningSession.start_time).getTime();
      }
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - sessionStartMsRef.current) / 1000));
      }, 500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedSeconds(0);
      sessionStartMsRef.current = 0;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [runningSession]);

  // Rest Timer — also uses Date.now() to avoid drift
  useEffect(() => {
    if (runningSession) {
      // Reset rest start to "now" whenever session is active and rest is reset
      restStartMsRef.current = Date.now();
      restTimerRef.current = setInterval(() => {
        setRestSeconds(Math.floor((Date.now() - restStartMsRef.current) / 1000));
      }, 500);
    } else {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
      setRestSeconds(0);
      restStartMsRef.current = 0;
    }
    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, [runningSession]);

  const loadRunningSession = useCallback(async () => {
    // Clear existing state first to prevent stale display
    setRunningSession(null);
    setSessionExerciseGroups([]);
    // NOTE: do NOT clear knownGroupKeysRef here — it prevents duplicate
    // groups from being re-added when the user navigates back to home
    // after adding exercises in the library.
    try {
      const res = await sessionApi.getLastRunning();
      if (res.success && res.data && res.data.is_done === 0) {
        setRunningSession(res.data);
        const start = new Date(res.data.start_time).getTime();
        const elapsed = Math.floor((Date.now() - start) / 1000);
        setElapsedSeconds(elapsed);
        sessionStartMsRef.current = start;
        restStartMsRef.current = Date.now(); // reset rest timer too
        loadSessionExerciseGroups(res.data.id);
      } else {
        setRunningSession(null);
        setSessionExerciseGroups([]);
        // Only clear knownGroupKeysRef when there is truly no running session
        knownGroupKeysRef.current.clear();
        sessionStartMsRef.current = 0;
      }
    } catch (err) {
      console.error('Failed to load running session:', err);
    }
  }, []);

  const loadSessionExerciseGroups = async (sessionId: number) => {
    try {
      const res = await sessionApi.getSessionExercises(sessionId);
      if (res.success) {
        const incoming = res.data || [];
        setSessionExerciseGroups(prev => {
          const existingKeys = new Set(prev.map((g: SessionExerciseGroup) => String(g.exercise_id)));
          const newGroups = incoming.filter(
            (g: SessionExerciseGroup) => !existingKeys.has(String(g.exercise_id)) &&
                                       !knownGroupKeysRef.current.has(String(g.exercise_id))
          );
          if (newGroups.length === 0) return prev;
          newGroups.forEach((g: SessionExerciseGroup) => knownGroupKeysRef.current.add(String(g.exercise_id)));
          return [...newGroups, ...prev];
        });
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
    if (!userId) {
      setShowGuestPrompt(true);
      return;
    }
    setQuickStartLoading(true);
    try {
      const res = await sessionApi.start(userId);
      if (res.success && res.data) {
        setRunningSession(res.data);
        setElapsedSeconds(0);
        setSessionExerciseGroups([]);
        knownGroupKeysRef.current.clear();
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
    // Capture stats before clearing — use ref for live elapsed time (avoids stale closure)
    const elapsed = sessionStartMsRef.current
      ? Math.floor((Date.now() - sessionStartMsRef.current) / 1000)
      : elapsedSeconds;
    const stats = {
      exerciseCount: sessionExerciseGroups.length,
      totalVolume: sessionExerciseGroups.reduce((sum, g) =>
        sum + g.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0),
      elapsedSeconds: elapsed,
      date: new Date().toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }),
      groups: sessionExerciseGroups,
    };
    try {
      const res = await sessionApi.stop(userId);
      if (res.success) {
        // Clear local state immediately
        setRunningSession(null);
        setElapsedSeconds(0);
        setSessionExerciseGroups([]);
        knownGroupKeysRef.current.clear();
        sessionStartMsRef.current = 0;
        // Show summary modal
        setSummaryStats(stats);
        setShowSummaryModal(true);
        // Re-load from DB to confirm
        loadRunningSession();
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
      // Reset rest timer — track from NOW (last exercise added)
      restStartMsRef.current = Date.now();
      setRestSeconds(0);
    }
  };

  const handleEditSaved = () => {
    if (runningSession) {
      knownGroupKeysRef.current.clear();
      setSessionExerciseGroups([]);
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

  // --- Custom locale-aware date picker helpers ---
  const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONTHS_ZH = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const DAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const DAYS_ZH = ['日', '一', '二', '三', '四', '五', '六'];

  const getMonthName = (m: number) => (locale === 'zh' ? MONTHS_ZH[m] : MONTHS_EN[m]);
  const getDayName = (d: number) => (locale === 'zh' ? DAYS_ZH[d] : DAYS_EN[d]);

  const formatDisplayDate = (iso: string) => {
    const d = new Date(iso + 'T00:00:00');
    if (locale === 'zh') {
      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    }
    return `${MONTHS_EN[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  const getCalendarDays = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const handleDateSelect = (day: number) => {
    const d = new Date(pickerYear, pickerMonth, day);
    setHistoryDate(d.toISOString().split('T')[0]);
    setShowDatePicker(false);
  };

  const prevMonth = () => {
    if (pickerMonth === 0) { setPickerMonth(11); setPickerYear(y => y - 1); }
    else setPickerMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (pickerMonth === 11) { setPickerMonth(0); setPickerYear(y => y + 1); }
    else setPickerMonth(m => m + 1);
  };
  // ----------------------------------------------------------------

  const totalVolume = sessionExerciseGroups.reduce((sum, group) =>
    sum + group.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0);

  return (
    <div className="space-y-6">
      {/* Hero Timer Card */}
      <section className="relative overflow-hidden rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center glass-card">
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
            className="text-4xl xs:text-5xl sm:text-6xl font-black text-primary-fixed font-lexend drop-shadow-[0_0_12px_rgba(204,242,0,0.4)] tabular-nums"
            style={{ minWidth: '8ch', letterSpacing: '0.05em' }}
          >
            {runningSession ? formatTime(elapsedSeconds) : '00:00:00'}
          </h2>
          <div className="flex gap-4 sm:gap-8 mt-3 sm:mt-4 items-start justify-center">
            <div className="flex flex-col items-center min-w-[60px]">
              <span className="text-base sm:text-lg font-bold">{runningSession ? totalVolume : 0}</span>
              <span className="text-[9px] sm:text-[10px] text-neutral-500 uppercase font-bold tracking-wider">{t('timer.volume')} (kg)</span>
            </div>
            <div className="w-px h-7 sm:h-8 bg-white/10 self-center"></div>
            <div className="flex flex-col items-center min-w-[60px]">
              <span className="text-base sm:text-lg font-bold">{runningSession ? sessionExerciseGroups.length : '--'}</span>
              <span className="text-[9px] sm:text-[10px] text-neutral-500 uppercase font-bold tracking-wider">{t('timer.exercises')}</span>
            </div>
            <div className="w-px h-7 sm:h-8 bg-white/10 self-center"></div>
            <div className="flex flex-col items-center min-w-[70px]">
              <div className="flex items-center gap-1">
                <Timer size={12} className="text-primary-fixed" />
                <span className="text-base sm:text-lg font-bold tabular-nums" style={{ minWidth: '4ch' }}>
                  {runningSession ? formatTime(restSeconds) : '--:--'}
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] text-neutral-500 uppercase font-bold tracking-wider">{t('timer.rest')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start / End Training */}
      <button
        onClick={runningSession ? handleStopSession : handleStartSession}
        disabled={!runningSession && quickStartLoading}
        className={`w-full py-4 font-lexend font-black text-lg rounded-full shadow-[0_0_25px_rgba(204,242,0,0.3)] active:scale-95 transition-all uppercase tracking-widest ${
          runningSession
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-primary-fixed text-black hover:opacity-90'
        }`}
      >
        {!runningSession && quickStartLoading ? t('timer.starting') : runningSession ? t('timer.end_training') : t('timer.quick_start')}
      </button>

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
          <button
            onClick={() => {
              const d = new Date(historyDate + 'T00:00:00');
              setPickerYear(d.getFullYear());
              setPickerMonth(d.getMonth());
              setShowDatePicker(true);
            }}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs hover:bg-white/10 transition-colors"
          >
            {formatDisplayDate(historyDate)}
          </button>
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

      {/* Custom Date Picker Overlay */}
      <AnimatePresence>
        {showDatePicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDatePicker(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
            />
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.15 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[91] w-72 glass-card rounded-2xl p-4 shadow-2xl"
            >
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-3">
                <button onClick={prevMonth} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white">
                  <ChevronRight className="rotate-180" size={16} />
                </button>
                <span className="text-sm font-bold text-white">
                  {locale === 'zh' ? `${pickerYear}年${pickerMonth + 1}月` : `${MONTHS_EN[pickerMonth]} ${pickerYear}`}
                </span>
                <button onClick={nextMonth} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white">
                  <ChevronRight size={16} />
                </button>
              </div>
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAYS_EN.map((_, i) => (
                  <div key={i} className="text-center text-[10px] text-neutral-500 font-bold py-1">
                    {getDayName(i)}
                  </div>
                ))}
              </div>
              {/* Days grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {getCalendarDays(pickerYear, pickerMonth).map((day, i) => {
                  if (day === null) return <div key={`empty-${i}`} />;
                  const dateStr = new Date(pickerYear, pickerMonth, day).toISOString().split('T')[0];
                  const isSelected = dateStr === historyDate;
                  const isToday = dateStr === new Date().toISOString().split('T')[0];
                  return (
                    <button
                      key={day}
                      onClick={() => handleDateSelect(day)}
                      className={cn(
                        'h-8 rounded-lg text-xs font-medium transition-colors',
                        isSelected ? 'bg-primary-fixed text-black font-bold' :
                        isToday ? 'bg-white/10 text-white' :
                        'text-neutral-300 hover:bg-white/5'
                      )}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              {/* Today shortcut */}
              <button
                onClick={() => {
                  const today = new Date();
                  setPickerYear(today.getFullYear());
                  setPickerMonth(today.getMonth());
                  setHistoryDate(today.toISOString().split('T')[0]);
                  setShowDatePicker(false);
                }}
                className="mt-3 w-full py-2 text-xs text-primary-fixed font-bold rounded-lg bg-primary-fixed/10 hover:bg-primary-fixed/20 transition-colors"
              >
                {locale === 'zh' ? '今天' : 'Today'}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Exercise Modal */}
      <AddExerciseModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setPreselectedExercise(null); }}
        sessionId={runningSession?.id || null}
        onExerciseAdded={handleExerciseAdded}
        preselectedExercise={preselectedExercise}
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

      {/* Workout Summary Modal (share poster) */}
      <WorkoutSummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        stats={summaryStats}
      />

      {/* Guest Login Prompt Modal */}
      <AnimatePresence>
        {showGuestPrompt && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGuestPrompt(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-sm glass-card rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary-fixed/10 flex items-center justify-center">
                    <LogIn size={24} className="text-primary-fixed" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{t('guest.start_training_title')}</h3>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider">{t('guest.prompt_subtitle')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGuestPrompt(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="text-neutral-400 text-sm mb-5">
                {t('guest.start_training_hint')}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => { setShowGuestPrompt(false); window.location.href = '/login'; }}
                  className="w-full py-3.5 bg-primary-fixed text-black font-lexend font-black text-base rounded-xl shadow-[0_0_20px_rgba(204,242,0,0.3)] active:scale-95 transition-all uppercase tracking-wider"
                >
                  {t('guest.login_btn')}
                </button>
                <button
                  onClick={() => { setShowGuestPrompt(false); window.location.href = '/register'; }}
                  className="w-full py-3.5 border border-white/20 text-white font-lexend font-bold text-sm rounded-xl hover:bg-white/5 active:scale-95 transition-all"
                >
                  {t('guest.register_btn')}
                </button>
              </div>
              <button
                onClick={() => setShowGuestPrompt(false)}
                className="w-full mt-3 py-2 text-center text-xs font-bold text-neutral-500 hover:text-white transition-colors"
              >
                {t('guest.later')}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
