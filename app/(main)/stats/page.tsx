'use client';

import { useState, useEffect } from 'react';
import { exerciseApi } from '@/lib/api';
import { ExerciseStats } from '@/types';

export default function StatsPage() {
  const [exerciseStats, setExerciseStats] = useState<ExerciseStats[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1W' | '1M' | '3M' | '6M' | '1Y'>('1M');

  const userId = typeof window !== 'undefined' ? Number(localStorage.getItem('user_id')) : 0;

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await exerciseApi.getHistoryExercises(userId);
      if (res.data.success) {
        setExerciseStats(res.data.data || []);
        if (res.data.data?.length > 0) {
          setSelectedExercise(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
      // Mock data for demo
      const mockStats: ExerciseStats[] = [
        {
          exercise_id: 1,
          name: 'Bench Press',
          records: [
            { weight: 60, reps: 10, create_time: '2025-04-01' },
            { weight: 65, reps: 8, create_time: '2025-04-08' },
            { weight: 70, reps: 6, create_time: '2025-04-15' },
            { weight: 72.5, reps: 5, create_time: '2025-04-22' },
          ]
        },
        {
          exercise_id: 2,
          name: 'Squat',
          records: [
            { weight: 80, reps: 8, create_time: '2025-04-02' },
            { weight: 85, reps: 6, create_time: '2025-04-09' },
            { weight: 90, reps: 5, create_time: '2025-04-16' },
          ]
        },
        {
          exercise_id: 3,
          name: 'Deadlift',
          records: [
            { weight: 100, reps: 5, create_time: '2025-04-03' },
            { weight: 110, reps: 4, create_time: '2025-04-10' },
            { weight: 120, reps: 3, create_time: '2025-04-17' },
          ]
        },
      ];
      setExerciseStats(mockStats);
      setSelectedExercise(mockStats[0]);
    } finally {
      setLoading(false);
    }
  };

  // Generate chart data
  const getChartData = () => {
    if (!selectedExercise) return { xAxis: [], series: [] };
    
    const records = selectedExercise.records.map(r => ({
      date: new Date(r.create_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: r.weight,
      volume: r.weight * r.reps,
    }));

    return {
      xAxis: records.map(r => r.date),
      weight: records.map(r => r.weight),
      volume: records.map(r => r.volume),
    };
  };

  const chartData = getChartData();

  // Max weight for selected exercise
  const maxWeight = selectedExercise?.records?.reduce((max, r) => Math.max(max, r.weight), 0) || 0;
  const totalVolume = selectedExercise?.records?.reduce((sum, r) => sum + r.weight * r.reps, 0) || 0;
  const totalSets = selectedExercise?.records?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'Lexend, sans-serif' }}>
          Statistics
        </h1>
        <p className="text-neutral-400 text-sm">Track your strength progress</p>
      </div>

      {/* Time Range Tabs */}
      <div className="flex gap-2">
        {(['1W', '1M', '3M', '6M', '1Y'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              timeRange === range
                ? 'bg-primary-fixed text-black'
                : 'bg-surface-container-low text-neutral-400 hover:text-white'
            }`}
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Exercise Selector */}
      <div className="overflow-x-auto no-scrollbar -mx-5 px-5">
        <div className="flex gap-2 min-w-max">
          {exerciseStats.map((ex) => (
            <button
              key={ex.exercise_id}
              onClick={() => setSelectedExercise(ex)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                selectedExercise?.exercise_id === ex.exercise_id
                  ? 'bg-secondary text-black'
                  : 'bg-surface-container-low text-neutral-400 hover:text-white'
              }`}
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              {ex.name}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      {selectedExercise && (
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card rounded-2xl p-4 text-center">
            <p className="text-neutral-400 text-xs uppercase mb-1">Max Weight</p>
            <p className="text-2xl font-black text-primary-fixed" style={{ fontFamily: 'Lexend, sans-serif' }}>
              {maxWeight}
            </p>
            <p className="text-neutral-500 text-xs">kg</p>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center">
            <p className="text-neutral-400 text-xs uppercase mb-1">Total Volume</p>
            <p className="text-2xl font-black text-secondary" style={{ fontFamily: 'Lexend, sans-serif' }}>
              {totalVolume.toLocaleString()}
            </p>
            <p className="text-neutral-500 text-xs">kg</p>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center">
            <p className="text-neutral-400 text-xs uppercase mb-1">Total Sets</p>
            <p className="text-2xl font-black text-white" style={{ fontFamily: 'Lexend, sans-serif' }}>
              {totalSets}
            </p>
            <p className="text-neutral-500 text-xs">sets</p>
          </div>
        </div>
      )}

      {/* Weight Chart */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'Lexend, sans-serif' }}>
          Weight Progress
        </h3>
        <div className="h-64 flex items-end justify-around gap-2">
          {(chartData.weight || []).map((weight, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-1">
              <div
                className="w-full bg-gradient-to-t from-primary-fixed to-primary-fixed/50 rounded-t-lg transition-all hover:from-primary-fixed-dim"
                style={{ height: `${(weight / (maxWeight || 1)) * 180}px` }}
              />
              <span className="text-neutral-500 text-xs">{weight}kg</span>
              <span className="text-neutral-600 text-[10px]">{chartData.xAxis[i]}</span>
            </div>
          ))}
        </div>
        {(chartData.weight || []).length === 0 && (
          <div className="h-64 flex items-center justify-center text-neutral-400">
            <div className="text-center">
              <span className="material-symbols-outlined text-4xl mb-2">show_chart</span>
              <p>No data yet</p>
            </div>
          </div>
        )}
      </div>

      {/* Volume Chart */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'Lexend, sans-serif' }}>
          Volume (Weight × Reps)
        </h3>
        <div className="h-48 flex items-end justify-around gap-2">
          {(chartData.volume || []).map((volume, i) => {
            const maxVol = Math.max(...(chartData.volume || []));
            return (
              <div key={i} className="flex flex-col items-center gap-2 flex-1">
                <div
                  className="w-full bg-gradient-to-t from-secondary to-secondary/50 rounded-t-lg"
                  style={{ height: `${(volume / (maxVol || 1)) * 140}px` }}
                />
                <span className="text-neutral-500 text-xs">{(volume / 1000).toFixed(1)}k</span>
              </div>
            );
          })}
        </div>
        {(chartData.volume || []).length === 0 && (
          <div className="h-48 flex items-center justify-center text-neutral-400">
            <p>No data yet</p>
          </div>
        )}
      </div>

      {/* History List */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Lexend, sans-serif' }}>
          History
        </h3>
        <div className="space-y-2">
          {selectedExercise?.records?.slice().reverse().map((record, i) => (
            <div key={i} className="glass-card rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-fixed/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary-fixed text-lg">fitness_center</span>
                </div>
                <div>
                  <p className="text-white font-bold">{record.weight} kg × {record.reps} reps</p>
                  <p className="text-neutral-500 text-sm">
                    {new Date(record.create_time).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-secondary font-bold">{(record.weight * record.reps).toLocaleString()}</p>
                <p className="text-neutral-500 text-xs">volume</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
