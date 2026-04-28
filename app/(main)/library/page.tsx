'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, PlayCircle, Info, Dumbbell, LayoutGrid, ChevronLeft
} from 'lucide-react';
import { exerciseApi } from '@/lib/api';
import { EQUIPMENT_MAP, MUSCLE_MAP, MUSCLES, EQUIPMENT } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface LibraryExercise {
  id: number;
  name: string;
  image_name: string | null;
  video_file: string | null;
  equipment_id: number;
  body_part_id: number;
  exercise_type: string;
  is_favorite: boolean;
}

function LibraryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSelectMode = searchParams.get('select') === 'true';

  const [exercises, setExercises] = useState<LibraryExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<number | null>(null);
  const [selectedMuscle, setSelectedMuscle] = useState<number | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<LibraryExercise | null>(null);

  const loadExercises = useCallback(async () => {
    setLoading(true);
    try {
      const res = await exerciseApi.query(
        selectedEquipment || 0,
        selectedMuscle || 0,
        searchQuery,
        0,
        50
      );
      if (res.success) {
        setExercises(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load exercises:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedEquipment, selectedMuscle, searchQuery]);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  const getEquipmentName = (id: number) => EQUIPMENT_MAP[String(id)] || 'Unknown';
  const getMuscleName = (ids: number) => {
    const parts = String(ids).split(',');
    return parts.map(p => MUSCLE_MAP[p] || p).join(', ');
  };

  const handleSelectExercise = (exercise: LibraryExercise) => {
    if (isSelectMode) {
      localStorage.setItem('selectedExercise', JSON.stringify(exercise));
      router.back();
    } else {
      localStorage.setItem('preselectedExercise', JSON.stringify(exercise));
      router.push('/');
    }
  };

  const renderExerciseCard = (ex: LibraryExercise) => (
    <div
      key={ex.id}
      onClick={() => handleSelectExercise(ex)}
      className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/5 hover:border-primary-fixed/50 transition-all cursor-pointer"
    >
      <div className="aspect-[16/10] relative overflow-hidden">
        {ex.image_name ? (
          <img
            src={ex.image_name}
            alt={ex.name}
            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full bg-white/5 flex items-center justify-center">
            <Dumbbell size={32} className="text-neutral-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        {ex.is_favorite && (
          <div className="absolute top-4 right-4 bg-primary-fixed text-black px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter shadow-lg">FAV</div>
        )}
        {ex.video_file && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <PlayCircle className="text-primary-fixed fill-primary-fixed/20" size={36} />
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-lexend font-bold text-sm leading-tight uppercase tracking-tight">{ex.name}</h3>
          <button onClick={(e) => { e.stopPropagation(); setSelectedExercise(ex); }}>
            <Info className="text-neutral-500" size={16} />
          </button>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <span className="bg-white/10 text-neutral-400 text-[7px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest">
            {getEquipmentName(ex.equipment_id)}
          </span>
          {String(ex.body_part_id).split(',').map(pid => (
            <span key={pid} className="bg-primary-fixed/10 text-primary-fixed text-[7px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest">
              {MUSCLE_MAP[pid.trim()] || pid}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black font-lexend tracking-tighter uppercase">Exercise Library</h1>
        <p className="text-xs text-neutral-500 mt-2 max-w-xs leading-relaxed uppercase font-semibold">
          Access over 7000+ professional movements with form guidance and performance data.
        </p>
        <div className="mt-6 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-primary-fixed transition-colors" size={20} />
          <input
            type="text"
            placeholder="SEARCH EXERCISES..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border-none rounded-xl py-4 pl-12 pr-4 text-sm font-bold placeholder:text-neutral-600 focus:ring-2 focus:ring-primary-fixed transition-all"
          />
        </div>
      </header>

      <section className="space-y-6">
        {/* Equipment filters */}
        <div className="space-y-3">
          <span className="text-[10px] text-neutral-600 font-bold uppercase tracking-[0.2em] px-1">Equipment</span>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
            <button
              onClick={() => setSelectedEquipment(null)}
              className={cn(
                "flex-none px-6 py-2.5 rounded-full font-bold text-xs transition-all active:scale-95",
                selectedEquipment === null ? "bg-primary-fixed text-black" : "bg-white/5 text-neutral-500 border border-white/5"
              )}
            >
              ALL
            </button>
            {EQUIPMENT.map(eq => (
              <button
                key={eq.id}
                onClick={() => setSelectedEquipment(eq.id)}
                className={cn(
                  "flex-none px-6 py-2.5 rounded-full font-bold text-xs transition-all active:scale-95",
                  selectedEquipment === eq.id ? "bg-primary-fixed text-black" : "bg-white/5 text-neutral-500 border border-white/5"
                )}
              >
                {eq.name.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Muscle filters */}
        <div className="space-y-3">
          <span className="text-[10px] text-neutral-600 font-bold uppercase tracking-[0.2em] px-1">Muscle Focus</span>
          <div className="flex flex-wrap gap-2">
            {MUSCLES.map(muscle => (
              <button
                key={muscle.id}
                onClick={() => setSelectedMuscle(selectedMuscle === muscle.id ? null : muscle.id)}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold border transition-all active:scale-95",
                  selectedMuscle === muscle.id
                    ? "bg-blue-600/20 text-blue-400 border-blue-500/50"
                    : "bg-white/5 text-neutral-400 border-white/5 hover:border-primary-fixed/50"
                )}
              >
                {muscle.name.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="aspect-[16/10] bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : exercises.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          <Dumbbell size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm">No exercises found. Try adjusting filters.</p>
        </div>
      ) : (
        <section className="grid grid-cols-2 gap-3">
          {exercises.map(renderExerciseCard)}
        </section>
      )}

      {/* Exercise Detail Modal */}
      <AnimatePresence>
        {selectedExercise && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedExercise(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg bg-[#1a1a1a] rounded-t-3xl flex flex-col"
              style={{ maxHeight: '90vh' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 pb-0 flex-shrink-0">
                <div className="w-12 h-1 bg-neutral-500 rounded-full mx-auto mb-6" />
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-6 space-y-4">
                {/* Exercise image / video */}
                <div className="aspect-video rounded-2xl overflow-hidden bg-white/5 flex-shrink-0 relative">
                  {selectedExercise.video_file ? (
                    <video
                      src={selectedExercise.video_file}
                      poster={selectedExercise.image_name || undefined}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover"
                    />
                  ) : selectedExercise.image_name ? (
                    <img
                      src={selectedExercise.image_name}
                      alt={selectedExercise.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Dumbbell size={64} className="text-neutral-600" />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-fixed/10 flex items-center justify-center flex-shrink-0">
                    <Dumbbell className="text-primary-fixed text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-lexend uppercase leading-tight">{selectedExercise.name}</h3>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      <span className="bg-white/10 text-neutral-400 text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest">
                        {getEquipmentName(selectedExercise.equipment_id)}
                      </span>
                      {String(selectedExercise.body_part_id).split(',').map(pid => (
                        <span key={pid} className="bg-primary-fixed/10 text-primary-fixed text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest">
                          {MUSCLE_MAP[pid.trim()] || pid}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest">Type</p>
                    <p className="text-white font-bold mt-1 text-sm capitalize">{selectedExercise.exercise_type.replace('_', ' ')}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest">ID</p>
                    <p className="text-white font-bold mt-1">#{selectedExercise.id}</p>
                  </div>
                </div>
              </div>

              {/* Action button — always visible at bottom, outside scroll */}
              <div className="p-6 pt-3 flex-shrink-0">
                <button
                  onClick={() => handleSelectExercise(selectedExercise)}
                  className="w-full py-4 bg-primary-fixed text-black font-bold rounded-full hover:opacity-90 transition-opacity font-lexend"
                >
                  {isSelectMode ? 'Select Exercise' : 'Add to Workout'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LibraryLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-8 bg-white/5 rounded w-1/3" />
      <div className="h-4 bg-white/5 rounded w-2/3" />
      <div className="h-12 bg-white/5 rounded-2xl" />
      <div className="flex gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-8 bg-white/5 rounded-full w-16" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="aspect-[16/10] bg-white/5 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<LibraryLoading />}>
      <LibraryContent />
    </Suspense>
  );
}
