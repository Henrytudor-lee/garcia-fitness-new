'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, Search, Plus, Minus, Check, SlidersHorizontal, PlayCircle } from 'lucide-react';
import { exerciseApi } from '@/lib/api';
import { MUSCLES, EQUIPMENT } from '@/lib/constants';
import { cn } from '@/lib/utils';

// Expose helpers for Playwright testing
declare global {
  interface Window {
    __setWeight?: (v: number) => void;
    __setReps?: (v: number) => void;
    __clickAddToWorkout?: () => void;
  }
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sessionId: number | null;
  onExerciseAdded: () => void;
  preselectedExercise?: ExerciseItem | null;
}

interface ExerciseItem {
  id: number;
  name: string;
  image_name: string;
  video_file?: string;
  equipment_id: number;
  body_part_id: number;
  exercise_type: string;
  is_favorite: boolean;
}

export default function AddExerciseModal({ isOpen, onClose, sessionId, onExerciseAdded, preselectedExercise }: Props) {
  const [selectedMuscle, setSelectedMuscle] = useState(0); // 0 = All
  const [selectedEquipment, setSelectedEquipment] = useState(0); // 0 = All
  const [search, setSearch] = useState('');
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseItem | null>(null);
  const [showMuscleMenu, setShowMuscleMenu] = useState(false);
  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(0);
  const [unit, setUnit] = useState('kg');
  const [historyMax, setHistoryMax] = useState<{ weight: number; reps: number; weight_unit?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const LIMIT = 30;
  const offsetRef = useRef(0);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Expose testing helpers (inline to always read fresh state)
  useEffect(() => {
    window.__setWeight = (v: number) => setWeight(v);
    window.__setReps = (v: number) => setReps(v);
    window.__clickAddToWorkout = async () => {
      if (!selectedExercise || !sessionId || weight <= 0 || reps <= 0) return;
      setSubmitting(true);
      try {
        const userId = Number(localStorage.getItem('user_id'));
        const res = await exerciseApi.handle({
          user_id: userId,
          session_id: sessionId,
          exercise_id: selectedExercise.id,
          weight,
          reps,
          weight_unit: unit,
          type: 'add',
        });
        if (res.success) {
          onExerciseAdded();
          handleClose();
        } else {
          console.error('Add exercise failed:', res.error);
        }
      } catch (err) {
        console.error('Failed to add exercise:', err);
      } finally {
        setSubmitting(false);
      }
    };
    return () => {
      delete window.__setWeight;
      delete window.__setReps;
      delete window.__clickAddToWorkout;
    };
  }, [selectedExercise, sessionId, weight, reps, unit]);

  // Initial load + filter changes
  useEffect(() => {
    if (!isOpen) return;
    offsetRef.current = 0;
    setExercises([]);
    setHasMore(true);
    loadExercises(true);
  }, [isOpen, selectedMuscle, selectedEquipment, search]);

  // Intersection Observer for infinite scroll
  const setupObserver = useCallback(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadExercises(false);
        }
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
  }, [hasMore, loadingMore, loading, exercises.length]);

  useEffect(() => {
    if (!isOpen) return;
    setupObserver();
    return () => observerRef.current?.disconnect();
  }, [isOpen, hasMore, loadingMore, exercises.length]);

  const loadExercises = async (reset = false) => {
    if (loading || loadingMore) return;
    if (!reset && !hasMore) return;

    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await exerciseApi.query(
        selectedEquipment,
        selectedMuscle,
        search,
        reset ? 0 : offsetRef.current,
        LIMIT
      );

      if (res.success) {
        const newExercises = res.data || [];
        if (reset) {
          setExercises(newExercises);
          offsetRef.current = newExercises.length;
        } else {
          setExercises(prev => [...prev, ...newExercises]);
          offsetRef.current += newExercises.length;
        }
        setHasMore(newExercises.length === LIMIT);
      }
    } catch (err) {
      console.error('Failed to load exercises:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      // search triggers re-load via useEffect dependency
    }, 400);
  };

  // Load history max when exercise selected
  useEffect(() => {
    if (selectedExercise) {
      loadHistoryMax();
    } else {
      setHistoryMax(null);
      setWeight(0);
      setReps(0);
    }
  }, [selectedExercise]);

  const loadHistoryMax = async () => {
    if (!selectedExercise) return;
    try {
      const userId = Number(localStorage.getItem('user_id'));
      const res = await exerciseApi.getMaxWeightRecord(selectedExercise.id, userId);
      if (res.success && res.data) {
        setHistoryMax({ weight: res.data.weight, reps: res.data.reps, weight_unit: res.data.weight_unit });
        setWeight(res.data.weight);
        setReps(res.data.reps || 0);
        setUnit(res.data.weight_unit || 'kg');
      } else {
        setHistoryMax(null);
        setWeight(0);
        setReps(0);
      }
    } catch {
      setHistoryMax(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedExercise || !sessionId || weight <= 0 || reps <= 0) return;
    setSubmitting(true);
    try {
      const userId = Number(localStorage.getItem('user_id'));
      const res = await exerciseApi.handle({
        user_id: userId,
        session_id: sessionId,
        exercise_id: selectedExercise.id,
        weight,
        reps,
        weight_unit: unit,
        type: 'add',
      });
      if (res.success) {
        onExerciseAdded();
        handleClose();
      } else {
        console.error('Add exercise failed:', res.error);
      }
    } catch (err) {
      console.error('Failed to add exercise:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // When modal opens with a preselected exercise, auto-select it and skip the grid
  useEffect(() => {
    if (isOpen && preselectedExercise) {
      setSelectedExercise(preselectedExercise);
      setWeight(0);
      setReps(0);
    }
  }, [isOpen, preselectedExercise]);

  const handleClose = () => {
    setSelectedExercise(null);
    setWeight(0);
    setReps(0);
    setHistoryMax(null);
    setSearch('');
    setShowMuscleMenu(false);
    onClose();
  };

  const selectedMuscleName = MUSCLES.find(m => m.id === selectedMuscle)?.name || 'All Muscles';

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col"
    >
      {/* Main Add Exercise Panel - slides up from bottom */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="flex flex-col h-full bg-background rounded-t-3xl overflow-hidden"
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-white/10">
          <div className="flex items-center gap-2">
            {selectedExercise ? (
              <button
                onClick={() => setSelectedExercise(null)}
                className="flex items-center gap-1 text-primary-fixed text-sm font-bold"
              >
                <ChevronLeft size={18} />
                Back
              </button>
            ) : (
              <button
                onClick={() => setShowMuscleMenu(!showMuscleMenu)}
                className="flex items-center gap-1 text-primary-fixed text-sm font-bold"
              >
                <SlidersHorizontal size={14} />
                {selectedMuscleName}
              </button>
            )}
          </div>
          <h2 className="text-lg font-bold font-lexend text-white">
            {selectedExercise ? 'Set Weight' : 'Add Exercise'}
          </h2>
          <button onClick={handleClose} className="text-neutral-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Muscle Sidebar */}
        <AnimatePresence>
          {showMuscleMenu && !selectedExercise && (
            <motion.div
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 bottom-0 w-[200px] bg-black/95 border-r border-white/10 z-20 pt-14 overflow-y-auto"
            >
              <div className="py-2">
                <button
                  onClick={() => { setSelectedMuscle(0); setShowMuscleMenu(false); }}
                  className={cn(
                    'w-full text-left px-4 py-3 text-sm font-medium transition-colors',
                    selectedMuscle === 0
                      ? 'bg-primary-fixed/20 text-primary-fixed'
                      : 'text-neutral-300 hover:bg-white/5'
                  )}
                >
                  All Muscles
                </button>
                {MUSCLES.map((muscle) => (
                  <button
                    key={muscle.id}
                    onClick={() => { setSelectedMuscle(muscle.id); setShowMuscleMenu(false); }}
                    className={cn(
                      'w-full text-left px-4 py-3 text-sm font-medium transition-colors',
                      selectedMuscle === muscle.id
                        ? 'bg-primary-fixed/20 text-primary-fixed'
                        : 'text-neutral-300 hover:bg-white/5'
                    )}
                  >
                    {muscle.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Search + Equipment Tabs (only in exercise selection step) */}
          {!selectedExercise && (
            <>
              {/* Search */}
              <div className="px-5 py-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search exercises..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-primary-fixed focus:outline-none"
                  />
                </div>
              </div>

              {/* Equipment Tabs */}
              <div className="flex overflow-x-auto px-5 pb-2 gap-1.5">
                <button
                  onClick={() => setSelectedEquipment(0)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0',
                    selectedEquipment === 0
                      ? 'bg-primary-fixed text-black'
                      : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                  )}
                >
                  ALL
                </button>
                {EQUIPMENT.map((eq) => (
                  <button
                    key={eq.id}
                    onClick={() => setSelectedEquipment(eq.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0',
                      selectedEquipment === eq.id
                        ? 'bg-primary-fixed text-black'
                        : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                    )}
                  >
                    {eq.name}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Exercise Grid */}
          {!selectedExercise && (
            <div className="flex-1 overflow-y-auto px-5 pb-36">
              {loading && exercises.length === 0 ? (
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-xl bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    {exercises.map((ex) => (
                      <motion.div
                        key={ex.id}
                        layout
                        className="relative aspect-square rounded-xl overflow-hidden cursor-pointer"
                        onClick={() => setSelectedExercise(ex)}
                        whileTap={{ scale: 0.95 }}
                      >
                        <img
                          src={ex.image_name || 'https://placehold.co/120x120/1a1a1a/444?text=Ex'}
                          alt={ex.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        {ex.is_favorite && (
                          <div className="absolute top-1 left-1 bg-green-500 text-white text-[6px] font-bold px-1 py-0.5 rounded">
                            Worked
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-1">
                          <p className="text-[7px] font-bold text-white truncate leading-tight">{ex.name}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Load more trigger */}
                  <div ref={loadMoreRef} className="py-4 flex justify-center">
                    {loadingMore && (
                      <div className="flex items-center gap-2 text-neutral-500 text-xs">
                        <div className="w-4 h-4 border-2 border-primary-fixed/30 border-t-primary-fixed rounded-full animate-spin" />
                        Loading more...
                      </div>
                    )}
                    {!hasMore && exercises.length > 0 && (
                      <p className="text-neutral-600 text-xs">No more exercises</p>
                    )}
                  </div>

                  {exercises.length === 0 && !loading && (
                    <div className="text-center text-neutral-500 py-16">
                      <p className="text-sm">No exercises found</p>
                      <p className="text-xs mt-1">Try different filters</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Weight/Reps Input Panel (exercise selected) */}
          {selectedExercise && (
            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-36">
              {/* Selected Exercise Card */}
              <div className="flex items-center gap-3 mb-6 p-3 bg-white/5 rounded-xl">
                <img
                  src={selectedExercise.image_name || 'https://placehold.co/80x80/1a1a1a/444?text=Ex'}
                  alt={selectedExercise.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div>
                  <p className="font-bold text-white text-sm">{selectedExercise.name}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{selectedExercise.exercise_type}</p>
                </div>
              </div>

              {/* Video Demo */}
              {selectedExercise.video_file && (
                <div className="mb-4">
                  <a
                    href={selectedExercise.video_file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 border border-white/10 rounded-xl text-primary-fixed text-sm font-bold hover:bg-white/10 transition-colors"
                  >
                    <PlayCircle size={18} />
                    Watch Demo Video
                  </a>
                </div>
              )}

              {/* History Max */}
              {historyMax && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs text-neutral-500 font-medium">Last time:</span>
                  <button
                    onClick={() => { setWeight(historyMax!.weight); setReps(historyMax!.reps); }}
                    className="px-3 py-1 bg-primary-fixed/20 text-primary-fixed text-xs font-bold rounded-lg hover:bg-primary-fixed/30 transition-colors"
                  >
                    {historyMax.weight}{historyMax.weight_unit || 'kg'} × {historyMax.reps}
                  </button>
                </div>
              )}

              {/* Weight Input */}
              <div className="mb-4">
                <label className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-2 block">Weight ({unit})</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setWeight(Math.max(0, weight - 2.5))}
                    className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center active:bg-white/10"
                  >
                    <Minus size={16} className="text-neutral-400" />
                  </button>
                  <input
                    type="number"
                    value={weight || ''}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    placeholder="0"
                    className="flex-1 bg-white/5 rounded-xl px-4 py-3 text-center text-white font-bold text-xl focus:outline-none focus:ring-2 focus:ring-primary-fixed/50"
                  />
                  <button
                    onClick={() => setWeight(weight + 2.5)}
                    className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center active:bg-white/10"
                  >
                    <Plus size={16} className="text-neutral-400" />
                  </button>
                </div>
              </div>

              {/* Unit Toggle */}
              <div className="flex gap-2 mb-4">
                {['kg', 'lb'].map((u) => (
                  <button
                    key={u}
                    onClick={() => setUnit(u)}
                    className={cn(
                      'flex-1 py-2 rounded-xl text-sm font-bold transition-colors',
                      unit === u
                        ? 'bg-primary-fixed text-black'
                        : 'bg-white/5 text-neutral-400'
                    )}
                  >
                    {u.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Reps Input */}
              <div className="mb-4">
                <label className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-2 block">Reps</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReps(Math.max(0, reps - 1))}
                    className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center active:bg-white/10"
                  >
                    <Minus size={16} className="text-neutral-400" />
                  </button>
                  <input
                    type="number"
                    value={reps || ''}
                    onChange={(e) => setReps(Number(e.target.value))}
                    placeholder="0"
                    className="flex-1 bg-white/5 rounded-xl px-4 py-3 text-center text-white font-bold text-xl focus:outline-none focus:ring-2 focus:ring-primary-fixed/50"
                  />
                  <button
                    onClick={() => setReps(reps + 1)}
                    className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center active:bg-white/10"
                  >
                    <Plus size={16} className="text-neutral-400" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Confirm Button */}
        {selectedExercise && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 p-5">
            <button
              onClick={handleSubmit}
              disabled={weight <= 0 || reps <= 0 || submitting}
              className="w-full py-3.5 bg-primary-fixed text-black font-lexend font-black text-lg rounded-full disabled:opacity-30 active:scale-95 transition-all uppercase tracking-wider"
            >
              {submitting ? 'Adding...' : `Add to Workout`}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
