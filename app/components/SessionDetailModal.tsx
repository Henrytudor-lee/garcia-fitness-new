'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Dumbbell, Clock, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react';
import { sessionApi } from '@/lib/api';
import { useI18n } from '@/contexts/I18nContext';

interface SessionDetailGroup {
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

interface SessionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: number | null;
}

export default function SessionDetailModal({ isOpen, onClose, sessionId }: SessionDetailModalProps) {
  const { t } = useI18n();
  const [groups, setGroups] = useState<SessionDetailGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    if (isOpen && sessionId) {
      loadDetail();
    }
  }, [isOpen, sessionId]);

  const loadDetail = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const [sessionRes, exercisesRes] = await Promise.all([
        sessionApi.getSession(sessionId),
        sessionApi.getSessionExercises(sessionId),
      ]);
      if (sessionRes.success) setSession(sessionRes.data);
      if (exercisesRes.success) setGroups(exercisesRes.data || []);
    } catch (err) {
      console.error('Failed to load session detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalVolume = groups.reduce((sum, g) =>
    sum + g.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0);

  const totalSets = groups.reduce((sum, g) => sum + g.sets.length, 0);

  const formatDuration = (start: string, end?: string) => {
    if (!end) return '--';
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (h > 0) return `${h}h ${m}m`;
    return `${m} min`;
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-[101] max-h-[90vh] flex flex-col rounded-t-3xl bg-[#0f0f0f] border-t border-white/10 overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 border-b border-white/5">
              <div>
                <h2 className="text-lg font-bold font-lexend">{t('history.session_detail') || 'Session Detail'}</h2>
                {session && (
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {formatDate(session.start_time)} · {formatTime(session.start_time)}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
                  <div className="w-6 h-6 border-2 border-primary-fixed border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm mt-3">Loading...</p>
                </div>
              ) : (
                <>
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="glass-card rounded-xl p-3 flex flex-col items-center">
                      <Clock size={14} className="text-primary-fixed mb-1" />
                      <span className="text-sm font-bold">
                        {session ? formatDuration(session.start_time, session.end_time) : '--'}
                      </span>
                      <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider">{t('history.duration') || 'Duration'}</span>
                    </div>
                    <div className="glass-card rounded-xl p-3 flex flex-col items-center">
                      <TrendingUp size={14} className="text-primary-fixed mb-1" />
                      <span className="text-sm font-bold">{totalVolume.toLocaleString()}</span>
                      <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider">{t('history.volume') || 'Volume'}(kg)</span>
                    </div>
                    <div className="glass-card rounded-xl p-3 flex flex-col items-center">
                      <CheckCircle2 size={14} className="text-primary-fixed mb-1" />
                      <span className="text-sm font-bold">{totalSets}</span>
                      <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider">{t('history.sets') || 'Sets'}</span>
                    </div>
                  </div>

                  {/* Exercises */}
                  {groups.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500">
                      <Dumbbell size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">{t('history.no_exercises') || 'No exercises recorded'}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {groups.map((group, gi) => (
                        <div key={group.exercise_id} className="glass-card rounded-xl overflow-hidden">
                          {/* Exercise header */}
                          <div className="flex items-center gap-3 p-4 border-b border-white/5">
                            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-white/5 flex items-center justify-center">
                              {group.image_name ? (
                                <img src={group.image_name} alt={group.name} className="w-full h-full object-cover" />
                              ) : (
                                <Dumbbell size={20} className="text-neutral-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm truncate">{group.name}</p>
                              <p className="text-xs text-neutral-500">
                                {group.sets.length} {group.sets.length === 1 ? 'set' : 'sets'} · {group.sets.reduce((s, set) => s + set.weight * set.reps, 0)} kg
                              </p>
                            </div>
                          </div>
                          {/* Sets */}
                          <div className="p-3 space-y-2">
                            {group.sets.map((set, idx) => (
                              <div key={set.id} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2.5">
                                <span className="w-6 h-6 rounded-full bg-primary-fixed/20 text-primary-fixed text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                  {idx + 1}
                                </span>
                                <div className="flex-1 flex items-center gap-2">
                                  <span className="text-sm font-medium">
                                    {set.weight} <span className="text-neutral-500 text-xs">{set.weight_unit}</span>
                                  </span>
                                  <span className="text-neutral-600">×</span>
                                  <span className="text-sm font-medium">
                                    {set.reps} <span className="text-neutral-500 text-xs">reps</span>
                                  </span>
                                </div>
                                <span className="text-[10px] text-neutral-600 font-medium">
                                  {new Date(set.create_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
