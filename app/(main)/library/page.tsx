'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { exerciseApi } from '@/lib/api';
import { ExerciseModel, Equipment, Muscle } from '@/types';

const EQUIPMENTS: Equipment[] = [
  { id: 0, name: 'All' },
  { id: 1, name: 'Barbell' },
  { id: 2, name: 'Dumbbell' },
  { id: 3, name: 'Machine' },
  { id: 4, name: 'Cable' },
  { id: 5, name: 'Bodyweight' },
];

const MUSCLES: Muscle[] = [
  { id: 0, name: 'All', icon: 'accessibility_new' },
  { id: 1, name: 'Chest', icon: 'fitness_center' },
  { id: 2, name: 'Back', icon: 'fitness_center' },
  { id: 3, name: 'Shoulder', icon: 'fitness_center' },
  { id: 4, name: 'Arm', icon: 'fitness_center' },
  { id: 5, name: 'Core', icon: 'fitness_center' },
  { id: 6, name: 'Leg', icon: 'directions_run' },
];

function LibraryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSelectMode = searchParams.get('select') === 'true';

  const [exercises, setExercises] = useState<ExerciseModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState(0);
  const [selectedMuscle, setSelectedMuscle] = useState(0);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseModel | null>(null);

  useEffect(() => {
    loadExercises();
  }, [selectedEquipment, selectedMuscle]);

  const loadExercises = async () => {
    setLoading(true);
    try {
      const res = await exerciseApi.query(selectedEquipment, selectedMuscle);
      if (res.data.success) {
        setExercises(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load exercises:', err);
      setExercises([
        { id: 1, name: 'Bench Press', image_name: '', equipment_id: 1, body_part_id: 1, exercise_type: 'Strength' },
        { id: 2, name: 'Squat', image_name: '', equipment_id: 1, body_part_id: 6, exercise_type: 'Strength' },
        { id: 3, name: 'Deadlift', image_name: '', equipment_id: 1, body_part_id: 2, exercise_type: 'Strength' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectExercise = (exercise: ExerciseModel) => {
    if (isSelectMode) {
      localStorage.setItem('selectedExercise', JSON.stringify(exercise));
      router.back();
    } else {
      setSelectedExercise(exercise);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'Lexend, sans-serif' }}>
          {isSelectMode ? 'Select Exercise' : 'Exercise Library'}
        </h1>
        <p className="text-neutral-400 text-sm">
          {isSelectMode ? 'Choose an exercise for your workout' : 'Browse exercises by equipment and muscle group'}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-neutral-400">search</span>
        <input
          type="text"
          placeholder="Search exercises..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-surface-container-low rounded-2xl pl-12 pr-4 py-3 text-white placeholder-neutral-500 border border-white/5 focus:border-primary-fixed focus:outline-none transition-colors"
        />
      </div>

      {/* Equipment Tabs */}
      <div className="overflow-x-auto no-scrollbar -mx-5 px-5">
        <div className="flex gap-2 min-w-max">
          {EQUIPMENTS.map((eq) => (
            <button
              key={eq.id}
              onClick={() => setSelectedEquipment(eq.id)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                selectedEquipment === eq.id
                  ? 'bg-primary-fixed text-black'
                  : 'bg-surface-container-low text-neutral-400 hover:text-white'
              }`}
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              {eq.name}
            </button>
          ))}
        </div>
      </div>

      {/* Muscle Group Sidebar */}
      <div className="flex gap-4">
        <div className="w-16 shrink-0 space-y-2">
          {MUSCLES.map((muscle) => (
            <button
              key={muscle.id}
              onClick={() => setSelectedMuscle(muscle.id)}
              className={`w-full aspect-square rounded-xl flex flex-col items-center justify-center transition-all ${
                selectedMuscle === muscle.id
                  ? 'bg-primary-fixed text-black'
                  : 'bg-surface-container-low text-neutral-400 hover:text-white'
              }`}
              title={muscle.name}
            >
              <span className="material-symbols-outlined text-lg">{muscle.icon}</span>
            </button>
          ))}
        </div>

        {/* Exercise Grid */}
        <div className="flex-1 grid grid-cols-2 gap-3">
          {loading ? (
            Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="aspect-square bg-surface-container-low rounded-2xl animate-pulse" />
            ))
          ) : filteredExercises.length > 0 ? (
            filteredExercises.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => handleSelectExercise(exercise)}
                className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:border-primary-fixed transition-all aspect-square"
              >
                <div className="w-14 h-14 rounded-xl bg-primary-fixed/10 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-primary-fixed text-2xl">fitness_center</span>
                </div>
                <p className="text-white text-sm font-bold line-clamp-2">{exercise.name}</p>
                <p className="text-neutral-500 text-xs mt-1">{exercise.exercise_type}</p>
              </button>
            ))
          ) : (
            <div className="col-span-2 text-center py-10 text-neutral-400">
              <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
              <p>No exercises found</p>
            </div>
          )}
        </div>
      </div>

      {/* Exercise Detail Modal */}
      {selectedExercise && !isSelectMode && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={() => setSelectedExercise(null)}>
          <div
            className="w-full max-w-lg bg-surface-container rounded-t-3xl p-6 pb-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-neutral-500 rounded-full mx-auto mb-6" />
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary-fixed/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary-fixed text-3xl">fitness_center</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  {selectedExercise.name}
                </h3>
                <p className="text-neutral-400 text-sm">{selectedExercise.exercise_type}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-surface-container-low rounded-xl p-3">
                <p className="text-neutral-500 text-xs uppercase">Equipment</p>
                <p className="text-white font-bold">{EQUIPMENTS.find(e => e.id === selectedExercise.equipment_id)?.name}</p>
              </div>
              <div className="bg-surface-container-low rounded-xl p-3">
                <p className="text-neutral-500 text-xs uppercase">Muscle</p>
                <p className="text-white font-bold">{MUSCLES.find(m => m.id === selectedExercise.body_part_id)?.name}</p>
              </div>
            </div>

            <button
              onClick={() => {
                localStorage.setItem('selectedExercise', JSON.stringify(selectedExercise));
                router.push('/');
              }}
              className="w-full py-4 bg-primary-fixed text-black font-bold rounded-full hover:bg-primary-fixed-dim transition-colors"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              Add to Workout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LibraryLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-8 bg-surface-container-low rounded w-1/3" />
      <div className="h-4 bg-surface-container-low rounded w-2/3" />
      <div className="h-12 bg-surface-container-low rounded-2xl" />
      <div className="flex gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-8 bg-surface-container-low rounded-full w-16" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="aspect-square bg-surface-container-low rounded-2xl" />
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
