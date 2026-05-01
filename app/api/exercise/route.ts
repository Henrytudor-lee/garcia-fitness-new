import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

function verifyToken(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const jwt = require('jsonwebtoken') as any;
    const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'pulse-fit-secret-key';
    return jwt.verify(auth.slice(7), jwtSecret) as { user_id: number };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const user = verifyToken(request);
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  try {
    // Exercise library query with optional filtering and pagination
    if (type === 'list' || type === 'query') {
      const equipmentId = searchParams.get('equipment_id');
      const bodyPartId = searchParams.get('body_part_id');
      const search = searchParams.get('search');
      const offset = parseInt(searchParams.get('offset') || '0');
      const limit = parseInt(searchParams.get('limit') || '30');

      let query = supabase
        .from('exercises_library')
        .select('id, name, image_name, video_name, video_file, equipment_id, body_part_id, exercise_type, is_favorite', { count: 'exact' });

      if (equipmentId && equipmentId !== '0' && equipmentId !== '') {
        query = query.eq('equipment_id', parseInt(equipmentId));
      }
      if (bodyPartId && bodyPartId !== '0' && bodyPartId !== '') {
        // body_part_id is a comma-separated string like "2,4" — match exact id anywhere in the list
        const bid = parseInt(bodyPartId);
        if (bid > 0) {
          query = query.or(`body_part_id.eq."${bid}",body_part_id.like."${bid},%",body_part_id.like."%,${bid},%",body_part_id.like."%,${bid}"`);
        }
      }
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      const { data, error, count } = await query.range(offset, offset + limit - 1);
      if (error) return NextResponse.json({ success: false, error: error.message });

      const exercises = (data || []).map((ex: any) => ({
        id: ex.id,
        name: ex.name,
        image_name: ex.image_name,
        video_file: ex.video_file,
        equipment_id: parseInt(ex.equipment_id) || 0,
        body_part_id: parseInt(ex.body_part_id.split(',')[0]) || 0,
        exercise_type: ex.exercise_type || 'Strength',
        is_favorite: ex.is_favorite === '1' || ex.is_favorite === true,
      }));

      return NextResponse.json(
        { success: true, data: exercises, total: count || 0 },
        { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
      );
    }

    // Get exercises for a specific session (grouped by exercise, with image_name from library)
    if (type === 'session_exercises') {
      const sid = parseInt(searchParams.get('session_id') || '0');
      if (!sid) return NextResponse.json({ success: false, error: 'session_id required' });

      const [{ data, error }, { data: libData }] = await Promise.all([
        supabase
          .from('exercises')
          .select('*')
          .eq('session_id', sid)
          .eq('user_id', user.user_id)
          .order('sequence', { ascending: true }),
        (async () => {
          const { data: exs } = await supabase
            .from('exercises')
            .select('exercise_id')
            .eq('session_id', sid)
            .eq('user_id', user.user_id);
          const ids = Array.from(new Set((exs || []).map((e: any) => e.exercise_id)));
          if (!ids.length) return { data: [] };
          return supabase.from('exercises_library').select('id, name, image_name').in('id', ids);
        })(),
      ]);
      if (error) return NextResponse.json({ success: false, error: error.message });

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
      if (libData) {
        for (const lib of libData) {
          if (grouped[lib.id]) {
            grouped[lib.id].image_name = lib.image_name;
            grouped[lib.id].name = lib.name;
          }
        }
      }
      return NextResponse.json({ success: true, data: Object.values(grouped) });
    }

    // User's exercise history grouped by exercise
    if (type === 'history') {
      const { data, error } = await supabase
        .from('exercises')
        .select('session_id, exercise_id, name, weight, reps, weight_unit, create_time')
        .eq('user_id', user.user_id)
        .order('create_time', { ascending: false })
        .limit(500);
      if (error) return NextResponse.json({ success: false, error: error.message });

      const grouped: Record<number, any> = {};
      for (const ex of data || []) {
        const key = ex.exercise_id;
        if (!grouped[key]) {
          grouped[key] = { exercise_id: key, name: ex.name, records: [] };
        }
        grouped[key].records.push({
          weight: ex.weight,
          reps: ex.reps,
          weight_unit: ex.weight_unit,
          create_time: ex.create_time,
        });
      }
      return NextResponse.json({ success: true, data: Object.values(grouped) });
    }

    // Weight record for a specific exercise (time series)
    if (type === 'weight-record') {
      const exerciseId = searchParams.get('exercise_id');
      if (!exerciseId) return NextResponse.json({ success: false, error: 'Missing exercise_id' });
      const { data, error } = await supabase
        .from('exercises')
        .select('weight, reps, weight_unit, create_time')
        .eq('user_id', user.user_id)
        .eq('exercise_id', parseInt(exerciseId))
        .order('create_time', { ascending: true });
      if (error) return NextResponse.json({ success: false, error: error.message });
      return NextResponse.json({ success: true, data: (data || []).map(r => ({
        weight: r.weight,
        reps: r.reps,
        weight_unit: r.weight_unit,
        create_time: r.create_time,
      })) });
    }

    // Max weight record for an exercise
    if (type === 'max-weight') {
      const exerciseId = searchParams.get('exercise_id');
      if (!exerciseId) return NextResponse.json({ success: false, error: 'Missing exercise_id' });
      const { data, error } = await supabase
        .from('exercises')
        .select('weight, reps, weight_unit, create_time')
        .eq('user_id', user.user_id)
        .eq('exercise_id', parseInt(exerciseId))
        .order('weight', { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') return NextResponse.json({ success: false, error: error.message });
      return NextResponse.json({ success: true, data: data ? {
        weight: data.weight,
        reps: data.reps,
        weight_unit: data.weight_unit,
        create_time: data.create_time,
      } : null });
    }

    // Lightweight stats: group by exercise_id server-side (no 500-row transfer)
    if (type === 'stats-summary') {
      const { data, error } = await supabase
        .from('exercises')
        .select('exercise_id, name, weight, reps, weight_unit, create_time')
        .eq('user_id', user.user_id)
        .order('create_time', { ascending: false })
        .limit(200); // reduced from 500 — enough for stats
      if (error) return NextResponse.json({ success: false, error: error.message });

      const grouped: Record<number, any> = {};
      for (const ex of data || []) {
        const key = ex.exercise_id;
        if (!grouped[key]) grouped[key] = { exercise_id: key, name: ex.name, records: [] };
        grouped[key].records.push({ weight: ex.weight, reps: ex.reps, weight_unit: ex.weight_unit, create_time: ex.create_time });
      }
      return NextResponse.json({ success: true, data: Object.values(grouped) });
    }

    // Exercises within a specific session — grouped by exercise_id with image
    if (type === 'session-exercises') {
      const sessionId = searchParams.get('session_id');
      if (!sessionId) return NextResponse.json({ success: false, error: 'Missing session_id' });
      const sid = parseInt(sessionId);

      // Parallel: fetch exercises and library metadata at the same time
      const [{ data, error }, { data: libData }] = await Promise.all([
        supabase
          .from('exercises')
          .select('*')
          .eq('session_id', sid)
          .eq('user_id', user.user_id)
          .order('sequence', { ascending: true }),
        (async () => {
          // First get unique exercise_ids from exercises, then fetch library data
          const { data: exs } = await supabase
            .from('exercises')
            .select('exercise_id')
            .eq('session_id', sid)
            .eq('user_id', user.user_id);
          const ids = Array.from(new Set((exs || []).map((e: any) => e.exercise_id)));
          if (ids.length === 0) return { data: [] };
          return supabase
            .from('exercises_library')
            .select('id, name, image_name')
            .in('id', ids);
        })(),
      ]);
      if (error) return NextResponse.json({ success: false, error: error.message });

      // Group by exercise_id
      const grouped: Record<number, any> = {};
      for (const ex of data || []) {
        if (!grouped[ex.exercise_id]) {
          grouped[ex.exercise_id] = {
            exercise_id: ex.exercise_id,
            name: ex.name,
            image_name: null,
            sets: [],
          };
        }
        grouped[ex.exercise_id].sets.push({
          id: ex.id,
          weight: ex.weight,
          reps: ex.reps,
          weight_unit: ex.weight_unit,
          sequence: ex.sequence,
          create_time: ex.create_time,
        });
      }

      // Merge library image_name
      if (libData) {
        for (const lib of libData) {
          if (grouped[lib.id]) {
            grouped[lib.id].image_name = lib.image_name;
            grouped[lib.id].name = lib.name; // prefer library name
          }
        }
      }

      return NextResponse.json({ success: true, data: Object.values(grouped) });
    }

    return NextResponse.json({ success: false, error: 'Unknown type' });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = verifyToken(request);
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { type, session_id, exercise_id, weight, reps, weight_unit } = body;

    if (type === 'add') {
      const { data: lastEx } = await supabase
        .from('exercises')
        .select('sequence')
        .eq('session_id', session_id)
        .order('sequence', { ascending: false })
        .limit(1)
        .single();
      const nextSequence = lastEx?.sequence != null ? lastEx.sequence + 1 : 0;

      const { data: libEx } = await supabase
        .from('exercises_library')
        .select('name')
        .eq('id', exercise_id)
        .single();

      const { data: inserted, error } = await supabase
        .from('exercises')
        .insert({
          session_id,
          user_id: user.user_id,
          exercise_id,
          name: libEx?.name || 'Unknown',
          sequence: nextSequence,
          reps,
          weight,
          weight_unit: weight_unit || 'kg',
          create_time: new Date().toISOString(),
          update_time: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) return NextResponse.json({ success: false, error: error.message });
      return NextResponse.json({ success: true, data: inserted });
    }

    return NextResponse.json({ success: false, error: 'Unknown operation' });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
