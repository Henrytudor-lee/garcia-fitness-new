import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'pulse-fit-secret-key';

const supabase = createClient(supabaseUrl, supabaseKey);

function verifyToken(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
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

  if (type === 'query') {
    const equipmentId = searchParams.get('equipment_id');
    const bodyPartId = searchParams.get('body_part_id');
    let query = supabase
      .from('exercises_library')
      .select('id, name, image_name, video_name, video_file, equipment_id, body_part_id, exercise_type, is_favorite');
    if (equipmentId && equipmentId !== '0') {
      query = query.eq('equipment_id', equipmentId);
    }
    if (bodyPartId && bodyPartId !== '0') {
      query = query.like('body_part_id', `%${bodyPartId}%`);
    }
    const { data, error } = await query.limit(100);
    if (error) return NextResponse.json({ success: false, error: error.message });
    const exercises = (data || []).map((ex: any) => ({
      id: ex.id,
      name: ex.name,
      image_name: ex.image_name,
      video_file: ex.video_file,
      equipment_id: parseInt(ex.equipment_id) || 0,
      body_part_id: parseInt(ex.body_part_id.split(',')[0]) || 0,
      exercise_type: ex.exercise_type || 'Strength',
      is_favorite: ex.is_favorite === '1',
    }));
    return NextResponse.json({ success: true, data: exercises });
  }

  if (type === 'history') {
    const { data, error } = await supabase
      .from('exercises')
      .select('exercise_id, name, weight, reps, create_time')
      .eq('user_id', user.user_id)
      .order('create_time', { ascending: false })
      .limit(500);
    if (error) return NextResponse.json({ success: false, error: error.message });
    const grouped: Record<number, any[]> = {};
    for (const ex of data || []) {
      if (!grouped[ex.exercise_id]) grouped[ex.exercise_id] = [];
      grouped[ex.exercise_id].push({ weight: ex.weight, reps: ex.reps, create_time: ex.create_time });
    }
    const stats = Object.entries(grouped).map(([exercise_id, records]) => ({
      exercise_id: parseInt(exercise_id),
      name: records[0]?.name || 'Unknown',
      records,
    }));
    return NextResponse.json({ success: true, data: stats });
  }

  if (type === 'weight-record') {
    const exerciseId = searchParams.get('exercise_id');
    if (!exerciseId) return NextResponse.json({ success: false, error: 'Missing exercise_id' });
    const { data, error } = await supabase
      .from('exercises')
      .select('weight, reps, create_time')
      .eq('user_id', user.user_id)
      .eq('exercise_id', parseInt(exerciseId))
      .order('create_time', { ascending: true });
    if (error) return NextResponse.json({ success: false, error: error.message });
    return NextResponse.json({ success: true, data: (data || []).map(r => ({ weight: r.weight, reps: r.reps, create_time: r.create_time })) });
  }

  if (type === 'max-weight') {
    const exerciseId = searchParams.get('exercise_id');
    if (!exerciseId) return NextResponse.json({ success: false, error: 'Missing exercise_id' });
    const { data, error } = await supabase
      .from('exercises')
      .select('weight, reps, create_time')
      .eq('user_id', user.user_id)
      .eq('exercise_id', parseInt(exerciseId))
      .order('weight', { ascending: false })
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') return NextResponse.json({ success: false, error: error.message });
    return NextResponse.json({ success: true, data: data ? { weight: data.weight, reps: data.reps, create_time: data.create_time } : null });
  }

  return NextResponse.json({ success: false, error: 'Unknown type' });
}

export async function POST(request: NextRequest) {
  const user = verifyToken(request);
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { type, session_id, exercise_id, weight, reps, weight_unit } = body;

    if (type === 'add') {
      // Get current max sequence in session
      const { data: lastEx } = await supabase
        .from('exercises')
        .select('sequence')
        .eq('session_id', session_id)
        .order('sequence', { ascending: false })
        .limit(1)
        .single();
      const nextSequence = lastEx ? lastEx.sequence + 1 : 0;

      // Get exercise name
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
