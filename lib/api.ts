import { createClient } from '@supabase/supabase-js';
import type { Session } from '../types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── helpers ───────────────────────────────────────────────────────────────

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function setAuthToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

function getUserId(): number {
  return Number(localStorage.getItem('user_id') || 0);
}

// ─── Auth API (still goes through our own route for JWT) ───────────────────

export const authApi = {
  login: async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setAuthToken(data.data.token);
        localStorage.setItem('user_id', String(data.data.user_id));
        return { success: true, data: data.data };
      }
      return { success: false, error: data.error || 'Login failed' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  register: async (email: string, password: string, name: string, avatarBase64?: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, avatar: avatarBase64 }),
      });
      const data = await res.json();
      return data;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  logout: async () => {
    setAuthToken(null);
    localStorage.removeItem('user_id');
  },
};

// ─── Session API — Supabase direct ────────────────────────────────────────

export const sessionApi = {
  start: async (userId?: number) => {
    const uid = userId || getUserId();
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: uid,
        start_time: new Date().toISOString(),
        is_done: 0,
        status: 'running',
      })
      .select()
      .single();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  },

  stop: async (userId?: number) => {
    const uid = userId || getUserId();
    // find running session
    const { data: running, error: findErr } = await supabase
      .from('sessions')
      .select('id')
      .eq('user_id', uid)
      .eq('is_done', 0)
      .order('start_time', { ascending: false })
      .limit(1);
    if (findErr || !running?.length) return { success: false, error: 'No running session' };

    const { data, error } = await supabase
      .from('sessions')
      .update({
        end_time: new Date().toISOString(),
        is_done: 1,
        status: 'finished',
      })
      .eq('id', running[0].id)
      .select()
      .single();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  },

  getLastRunning: async () => {
    const uid = getUserId();
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', uid)
      .eq('is_done', 0)
      .order('start_time', { ascending: false })
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') return { success: false, error: error.message };
    return { success: true, data: data || null };
  },

  getHistoryByDate: async (date: string) => {
    const uid = getUserId();
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', uid)
      .eq('is_done', 1)
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay)
      .order('start_time', { ascending: false });
    if (error) return { success: false, error: error.message };
    return { success: true, data: data || [] };
  },

  getAll: async (userId?: number, limit = 30) => {
    const uid = userId || getUserId();
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', uid)
      .eq('is_done', 1)
      .order('start_time', { ascending: false })
      .limit(limit);
    if (error) return { success: false, error: error.message };
    return { success: true, data: data || [] };
  },

  getSession: async (sessionId: number) => {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  },

  getSessionExercises: async (sessionId: number) => {
    const uid = getUserId();
    const sid = sessionId;

    // Parallel: fetch exercises + library ids
    const [{ data, error }, { data: libData }] = await Promise.all([
      supabase
        .from('exercises')
        .select('*')
        .eq('session_id', sid)
        .eq('user_id', uid)
        .order('sequence', { ascending: true }),
      (async () => {
        const { data: exs } = await supabase
          .from('exercises')
          .select('exercise_id')
          .eq('session_id', sid)
          .eq('user_id', uid);
        const ids = Array.from(new Set((exs || []).map((e: any) => e.exercise_id)));
        if (!ids.length) return { data: [] };
        return supabase.from('exercises_library').select('id, name, image_name').in('id', ids);
      })(),
    ]);
    if (error) return { success: false, error: error.message };

    // Group
    const grouped: Record<number, any> = {};
    for (const ex of data || []) {
      if (!grouped[ex.exercise_id]) {
        grouped[ex.exercise_id] = { exercise_id: ex.exercise_id, name: ex.name, image_name: null, sets: [] };
      }
      grouped[ex.exercise_id].sets.push({
        id: ex.id, weight: ex.weight, reps: ex.reps,
        weight_unit: ex.weight_unit, sequence: ex.sequence, create_time: ex.create_time,
      });
    }
    // Merge library
    if (libData) {
      for (const lib of libData) {
        if (grouped[lib.id]) {
          grouped[lib.id].image_name = lib.image_name;
          grouped[lib.id].name = lib.name;
        }
      }
    }
    return { success: true, data: Object.values(grouped) };
  },
};

// ─── Exercise Library API — Supabase direct ────────────────────────────────

export const exerciseApi = {
  // Alias for backward compat
  handle: async (params: {
    user_id: number;
    session_id: number;
    exercise_id: number;
    weight: number;
    reps: number;
    weight_unit: string;
    type: string;
  }) => {
    if (params.type === 'add') {
      return exerciseApi.addSet(params.session_id, params.exercise_id, params.weight, params.reps, params.weight_unit);
    }
    return { success: false, error: 'Unknown type' };
  },

  query: async (equipmentId = 0, bodyPartId = 0, search = '', offset = 0, limit = 30) => {
    let query = supabase
      .from('exercises_library')
      .select('id, name, image_name, video_file, equipment_id, body_part_id, exercise_type, is_favorite', { count: 'exact' });

    if (equipmentId > 0) query = query.eq('equipment_id', equipmentId);
    if (bodyPartId > 0) query = query.like('body_part_id', `%${bodyPartId}%`);
    if (search) query = query.ilike('name', `%${search}%`);

    const { data, error, count } = await query.range(offset, offset + limit - 1);
    if (error) return { success: false, error: error.message };

    const exercises = (data || []).map((ex: any) => ({
      id: ex.id,
      name: ex.name,
      image_name: ex.image_name,
      video_file: ex.video_file,
      equipment_id: parseInt(ex.equipment_id) || 0,
      body_part_id: parseInt(String(ex.body_part_id).split(',')[0]) || 0,
      exercise_type: ex.exercise_type || 'Strength',
      is_favorite: ex.is_favorite === '1' || ex.is_favorite === true,
    }));
    return { success: true, data: exercises, total: count || 0 };
  },

  addSet: async (sessionId: number, exerciseId: number, weight: number, reps: number, weightUnit = 'kg') => {
    const uid = getUserId();
    // get next sequence
    const { data: lastEx } = await supabase
      .from('exercises')
      .select('sequence')
      .eq('session_id', sessionId)
      .order('sequence', { ascending: false })
      .limit(1)
      .single();
    const nextSeq = lastEx?.sequence != null ? lastEx.sequence + 1 : 0;
    // get exercise name
    const { data: libEx } = await supabase
      .from('exercises_library')
      .select('name')
      .eq('id', exerciseId)
      .single();

    const { data, error } = await supabase
      .from('exercises')
      .insert({
        session_id: sessionId,
        user_id: uid,
        exercise_id: exerciseId,
        name: libEx?.name || 'Unknown',
        sequence: nextSeq,
        reps,
        weight,
        weight_unit: weightUnit,
        create_time: new Date().toISOString(),
        update_time: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  },

  updateSet: async (setId: number, weight: number, reps: number, weightUnit: string) => {
    const { data, error } = await supabase
      .from('exercises')
      .update({ weight, reps, weight_unit: weightUnit, update_time: new Date().toISOString() })
      .eq('id', setId)
      .select()
      .single();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  },

  deleteSet: async (setId: number) => {
    const { error } = await supabase.from('exercises').delete().eq('id', setId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  getStatsSummary: async (userId?: number) => {
    const uid = userId || getUserId();
    const { data, error } = await supabase
      .from('exercises')
      .select('exercise_id, name, weight, reps, weight_unit, create_time')
      .eq('user_id', uid)
      .order('create_time', { ascending: false })
      .limit(200);
    if (error) return { success: false, error: error.message };

    const grouped: Record<number, any> = {};
    for (const ex of data || []) {
      const key = ex.exercise_id;
      if (!grouped[key]) grouped[key] = { exercise_id: key, name: ex.name, records: [] };
      grouped[key].records.push({ weight: ex.weight, reps: ex.reps, weight_unit: ex.weight_unit, create_time: ex.create_time });
    }
    return { success: true, data: Object.values(grouped) };
  },

  getHistoryExercises: async (userId?: number) => {
    const uid = userId || getUserId();
    const { data, error } = await supabase
      .from('exercises')
      .select('session_id, exercise_id, name, weight, reps, weight_unit, create_time')
      .eq('user_id', uid)
      .order('create_time', { ascending: false })
      .limit(500);
    if (error) return { success: false, error: error.message };

    const grouped: Record<number, any> = {};
    for (const ex of data || []) {
      const key = ex.exercise_id;
      if (!grouped[key]) grouped[key] = { exercise_id: key, name: ex.name, records: [] };
      grouped[key].records.push({ weight: ex.weight, reps: ex.reps, weight_unit: ex.weight_unit, create_time: ex.create_time });
    }
    return { success: true, data: Object.values(grouped) };
  },

  getExerciseWeightRecord: async (exerciseId: number, userId?: number) => {
    const uid = userId || getUserId();
    const { data, error } = await supabase
      .from('exercises')
      .select('weight, reps, weight_unit, create_time')
      .eq('user_id', uid)
      .eq('exercise_id', exerciseId)
      .order('create_time', { ascending: true });
    if (error) return { success: false, error: error.message };
    return { success: true, data: data || [] };
  },

  getMaxWeightRecord: async (exerciseId: number, userId?: number) => {
    const uid = userId || getUserId();
    const { data, error } = await supabase
      .from('exercises')
      .select('weight, reps, weight_unit, create_time')
      .eq('user_id', uid)
      .eq('exercise_id', exerciseId)
      .order('weight', { ascending: false })
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') return { success: false, error: error.message };
    return { success: true, data: data || null };
  },
};

// ─── Profile Stats API ────────────────────────────────────────────────────

export const profileApi = {
  // Returns consecutive training days ending yesterday
  // Streak = count of consecutive days with at least 1 completed session, ending at yesterday
  // If today has a session, it counts too (streak counts today as last day)
  getStreak: async (userId?: number) => {
    const uid = userId || getUserId();
    // Fetch all completed sessions (is_done=1), only date part of start_time
    const { data, error } = await supabase
      .from('sessions')
      .select('start_time')
      .eq('user_id', uid)
      .eq('is_done', 1)
      .order('start_time', { ascending: false });

    if (error) return { success: false, error: error.message };

    // Extract unique calendar dates (YYYY-MM-DD)
    const dateSet = new Set<string>();
    for (const s of data || []) {
      const d = new Date(s.start_time);
      dateSet.add(d.toISOString().split('T')[0]);
    }
    const sortedDates = Array.from(dateSet).sort().reverse(); // newest first

    if (sortedDates.length === 0) return { success: true, data: { streak: 0, totalDays: 0 } };

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let streak = 0;
    let expected = today;

    // If today has no session, start counting from yesterday
    if (!dateSet.has(today)) {
      expected = yesterday;
    }

    for (const date of sortedDates) {
      if (date === expected) {
        streak++;
        const prev = new Date(new Date(expected).getTime() - 86400000).toISOString().split('T')[0];
        expected = prev;
      } else if (date < expected) {
        break;
      }
    }

    return { success: true, data: { streak, totalDays: sortedDates.length } };
  },

  // Level = ROOKIE(0-4), BEGINNER(5-14), INTERMEDIATE(15-29), ADVANCED(30-59), EXPERT(60-119), ELITE(120+)
  // Score = sessions * 2 + totalMinutes / 60 (rounded)
  getLevel: async (userId?: number) => {
    const uid = userId || getUserId();

    const [{ data: sessions, error: sErr }, { data: exercises, error: eErr }] = await Promise.all([
      supabase.from('sessions').select('start_time, end_time').eq('user_id', uid).eq('is_done', 1),
      supabase.from('exercises').select('create_time').eq('user_id', uid),
    ]);

    if (sErr || eErr) return { success: false, error: (sErr || eErr)?.message };

    const sessionCount = sessions?.length || 0;

    let totalMs = 0;
    for (const s of sessions || []) {
      if (s.start_time && s.end_time) {
        totalMs += new Date(s.end_time).getTime() - new Date(s.start_time).getTime();
      }
    }
    const totalHours = Math.round(totalMs / 3600000);
    const score = sessionCount * 2 + totalHours;

    const tiers = [
      { label: 'ROOKIE', lv: 1, min: 0 },
      { label: 'BEGINNER', lv: 2, min: 5 },
      { label: 'INTERMEDIATE', lv: 3, min: 15 },
      { label: 'ADVANCED', lv: 4, min: 30 },
      { label: 'EXPERT', lv: 5, min: 60 },
      { label: 'ELITE', lv: 6, min: 120 },
    ];

    let level = tiers[0];
    for (const t of tiers) {
      if (score >= t.min) level = t;
    }

    return {
      success: true,
      data: {
        label: level.label,
        lv: level.lv,
        score,
        sessions: sessionCount,
        totalHours,
      },
    };
  },

  // Update user avatar in DB
  updateAvatar: async (userId: number, avatarBase64: string) => {
    const { data, error } = await supabase
      .from('users')
      .update({ avatar: avatarBase64 })
      .eq('id', userId)
      .select()
      .single();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  },
};
