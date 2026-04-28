'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Target, Dumbbell, Calendar, Flame, Activity } from 'lucide-react';
import { exerciseApi, sessionApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useI18n } from '@/contexts/I18nContext';

interface ExerciseOption {
  exercise_id: number;
  name: string;
}

interface WeightRecord {
  weight: number;
  reps: number;
  create_time: string;
  weight_unit?: string;
}

interface HistoryExercise {
  exercise_id: number;
  name: string;
  records: { weight: number; reps: number; weight_unit?: string; create_time: string }[];
}

interface SessionSummary {
  id: number;
  user_id: number;
  start_time: string;
  end_time: string | null;
  is_done: number;
  status: string;
}

const CHART_COLORS = ['#ccf200', '#a8e600', '#88cc00', '#68b300', '#4d9900', '#2f7f00', '#116600', '#004d00'];

export default function StatsPage() {
  const { t } = useI18n();
  const [exerciseList, setExerciseList] = useState<ExerciseOption[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<number | null>(null);
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);
  const [maxRecord, setMaxRecord] = useState<{ weight: number; reps: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [historyExercises, setHistoryExercises] = useState<HistoryExercise[]>([]);
  const [recentSessions, setRecentSessions] = useState<SessionSummary[]>([]);

  const userId = typeof window !== 'undefined' ? Number(localStorage.getItem('user_id')) : 0;

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    if (!userId) return;
    try {
      // Lightweight: just get exercise name + count + total volume per exercise_id
      const histRes = await exerciseApi.getStatsSummary(userId);
      if (histRes.success && histRes.data) {
        const list: ExerciseOption[] = histRes.data.map((item: any) => ({
          exercise_id: item.exercise_id,
          name: item.name,
        }));
        setExerciseList(list);
        setHistoryExercises(histRes.data);
        if (list.length > 0) {
          setSelectedExercise(list[0].exercise_id);
        }
      }
    } catch (err) {
      console.error('Failed to load exercise history:', err);
    }
    try {
      const sessRes = await sessionApi.getAll(userId, 30);
      if (sessRes.success) {
        setRecentSessions(sessRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

  useEffect(() => {
    if (selectedExercise) {
      loadWeightRecords();
    }
  }, [selectedExercise]);

  const loadWeightRecords = async () => {
    if (!selectedExercise || !userId) return;
    setLoading(true);
    try {
      const res = await exerciseApi.getExerciseWeightRecord(selectedExercise, userId);
      if (res.success && res.data) {
        setWeightRecords(res.data || []);
        if (res.data.length > 0) {
          const max = (res.data as any[]).reduce((prev: any, curr: any) =>
            curr.weight > prev.weight ? curr : prev
          );
          setMaxRecord({ weight: max.weight, reps: max.reps });
        } else {
          setMaxRecord(null);
        }
      }
    } catch (err) {
      console.error('Failed to load weight records:', err);
    } finally {
      setLoading(false);
    }
  };

  // Compute summary stats
  const totalSessions = recentSessions.length;
  const totalVolume = historyExercises.reduce((sum, ex) =>
    sum + ex.records.reduce((s, r) => s + r.weight * r.reps, 0), 0);
  const totalSets = historyExercises.reduce((sum, ex) => sum + ex.records.length, 0);
  const avgSetsPerSession = totalSessions > 0 ? Math.round(totalSets / totalSessions) : 0;

  // Weekly volume — last 8 weeks (actual week labels)
  const getWeeklyVolume = () => {
    const weeks: { label: string; volume: number }[] = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      const day = d.getDate();
      weeks.push({ label: `${month} ${day}`, volume: 0 });
    }
    historyExercises.forEach(ex => {
      ex.records.forEach(r => {
        const d = new Date(r.create_time);
        // Find matching week bucket
        const weekIdx = weeks.findIndex((w, idx) => {
          const wDate = new Date(now);
          wDate.setDate(wDate.getDate() - (7 - idx) * 7);
          const wStart = new Date(wDate);
          wStart.setDate(wStart.getDate() - 6);
          return d >= wStart && d <= wDate;
        });
        if (weekIdx >= 0) weeks[weekIdx].volume += r.weight * r.reps;
      });
    });
    return weeks;
  };

  // Muscle group distribution (top 6)
  const getMuscleDistribution = () => {
    const map: Record<string, number> = {};
    historyExercises.forEach(ex => {
      const total = ex.records.reduce((s, r) => s + r.weight * r.reps, 0);
      const name = ex.name.toLowerCase();
      let muscle = 'Other';
      if (name.includes('chest') || name.includes('bench') || name.includes('fly')) muscle = 'Chest';
      else if (name.includes('back') || name.includes('row') || name.includes('lat')) muscle = 'Back';
      else if (name.includes('squat') || name.includes('leg') || name.includes('quad') || name.includes('hamstring') || name.includes('calf')) muscle = 'Legs';
      else if (name.includes('shoulder') || name.includes('press') || name.includes('lateral')) muscle = 'Shoulders';
      else if (name.includes('bicep') || name.includes('curl') || name.includes('tricep')) muscle = 'Arms';
      else if (name.includes('core') || name.includes('plank') || name.includes('ab')) muscle = 'Core';
      map[muscle] = (map[muscle] || 0) + total;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  };

  // Exercise frequency
  const getExerciseFrequency = () => {
    return historyExercises
      .map(ex => ({ name: ex.name, count: ex.records.length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  };

  const chartData = weightRecords.map((r, i) => ({
    index: i + 1,
    weight: r.weight,
    reps: r.reps,
  }));

  const weeklyData = getWeeklyVolume();
  const muscleData = getMuscleDistribution();
  const frequencyData = getExerciseFrequency();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-black font-lexend text-primary-fixed uppercase tracking-wider">{t('stats.title')}</h2>
        <p className="text-neutral-500 text-xs font-semibold uppercase tracking-widest">{t('stats.subtitle')}</p>
      </div>

      {/* Summary Stats Row */}
      {totalSessions > 0 && (
        <div className="grid grid-cols-2 xs:grid-cols-3 gap-2 xs:gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-3 xs:p-4 flex flex-col gap-1"
          >
            <div className="flex items-center gap-1.5">
              <Calendar className="text-primary-fixed" size={10} />
              <span className="text-[8px] xs:text-[9px] text-neutral-500 font-bold uppercase">{t('stats.sessions')}</span>
            </div>
            <p className="text-xl xs:text-2xl font-black font-lexend text-primary-fixed">{totalSessions}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card rounded-2xl p-3 xs:p-4 flex flex-col gap-1"
          >
            <div className="flex items-center gap-1.5">
              <Flame className="text-orange-400" size={10} />
              <span className="text-[8px] xs:text-[9px] text-neutral-500 font-bold uppercase">{t('stats.volume')}</span>
            </div>
            <p className="text-xl xs:text-2xl font-black font-lexend">{(totalVolume / 1000).toFixed(1)}k</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="col-span-2 xs:col-span-1 glass-card rounded-2xl p-3 xs:p-4 flex flex-col gap-1"
          >
            <div className="flex items-center gap-1.5">
              <Activity className="text-green-400" size={10} />
              <span className="text-[8px] xs:text-[9px] text-neutral-500 font-bold uppercase">{t('stats.avg_sets')}</span>
            </div>
            <p className="text-xl xs:text-2xl font-black font-lexend">{avgSetsPerSession}</p>
          </motion.div>
        </div>
      )}

      {/* Weekly Volume Bar Chart */}
      {weeklyData.some(w => w.volume > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-lexend uppercase tracking-wider">{t('stats.weekly_volume')}</h3>
            <span className="text-[10px] text-neutral-500 font-medium">{t('stats.last_8_weeks')}</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="label" stroke="rgba(255,255,255,0.3)" fontSize={9} tickLine={false} axisLine={false} interval={1} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(204,242,0,0.3)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                formatter={(value: any) => [`${Number(value).toLocaleString()} kg`, 'Volume']}
              />
              <Bar dataKey="volume" fill="#ccf200" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Muscle Distribution */}
      {muscleData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-5 space-y-4"
        >
          <h3 className="text-sm font-bold font-lexend uppercase tracking-wider">{t('stats.muscle_distribution')}</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={110} height={110}>
              <PieChart>
                <Pie
                  data={muscleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={50}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {muscleData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {muscleData.slice(0, 5).map((m, i) => (
                <div key={m.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i] }} />
                  <span className="text-xs text-neutral-300 flex-1 truncate" title={m.name}>{m.name}</span>
                  <span className="text-[10px] text-neutral-500 flex-shrink-0">{(m.value / 1000).toFixed(1)}k</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Exercise Frequency */}
      {frequencyData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-5 space-y-4"
        >
          <h3 className="text-sm font-bold font-lexend uppercase tracking-wider">{t('stats.most_trained')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={frequencyData} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" stroke="rgba(255,255,255,0.3)" fontSize={9} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                stroke="rgba(255,255,255,0.3)"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                width={55}
                textAnchor="end"
                tickFormatter={(v) => v.length > 13 ? v.slice(0, 12) + '…' : v}
              />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(204,242,0,0.3)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                formatter={(value: any) => [`${value} sets`, 'Count']}
              />
              <Bar dataKey="count" fill="#ccf200" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Exercise Selector */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Dumbbell className="text-primary-fixed" size={16} />
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{t('stats.select_exercise')}</span>
        </div>

        <select
          value={selectedExercise || ''}
          onChange={(e) => setSelectedExercise(Number(e.target.value))}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium focus:border-primary-fixed focus:outline-none"
        >
          <option value="">-- {t('stats.select_exercise')} --</option>
          {exerciseList.map((ex) => (
            <option key={ex.exercise_id} value={ex.exercise_id}>
              {ex.name}
            </option>
          ))}
        </select>

        {exerciseList.length === 0 && (
          <p className="text-center text-neutral-500 text-xs py-4">{t('stats.no_history')}</p>
        )}
      </div>

      {/* Stats Cards */}
      {maxRecord && (
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-4 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <Target className="text-primary-fixed" size={14} />
              <span className="text-[10px] text-neutral-500 font-bold uppercase">{t('stats.max_weight')}</span>
            </div>
            <p className="text-3xl font-black font-lexend text-primary-fixed">{maxRecord.weight}</p>
            <p className="text-xs text-neutral-500">{maxRecord.reps} reps</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-4 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="text-green-400" size={14} />
              <span className="text-[10px] text-neutral-500 font-bold uppercase">{t('stats.total_sets')}</span>
            </div>
            <p className="text-3xl font-black font-lexend">{weightRecords.length}</p>
            <p className="text-xs text-neutral-500">{t('stats.recorded')}</p>
          </motion.div>
        </div>
      )}

      {/* Weight Chart */}
      {selectedExercise && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-lexend uppercase tracking-wider">{t('stats.weight_progress')}</h3>
            <span className="text-[10px] text-neutral-500 font-medium">{chartData.length} {t('stats.records')}</span>
          </div>

          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <p className="text-neutral-500 text-sm">{t('timer.starting')}</p>
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ccf200" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ccf200" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="index"
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `#${v}`}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}kg`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    border: '1px solid rgba(204,242,0,0.3)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(value: any, name: any) => [
                    name === 'weight' ? `${value} kg` : `${value} reps`,
                    name === 'weight' ? 'Weight' : 'Reps',
                  ]}
                  labelFormatter={(label) => `Session #${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke="#ccf200"
                  strokeWidth={2}
                  fill="url(#weightGradient)"
                  dot={{ fill: '#ccf200', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: '#ccf200' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-neutral-500 text-sm">No data for this exercise</p>
            </div>
          )}
        </motion.div>
      )}

      {!selectedExercise && exerciseList.length === 0 && (
        <div className="glass-card rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-3">
          <Dumbbell className="text-neutral-600" size={48} />
          <p className="text-neutral-400 text-sm font-medium">Select an exercise above to view your progress</p>
        </div>
      )}
    </div>
  );
}
