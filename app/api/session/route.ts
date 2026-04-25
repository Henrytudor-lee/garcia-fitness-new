import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'pulse-fit-secret-key';

const supabase = createClient(supabaseUrl, supabaseKey);

function verifyToken(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const jwt = require('jsonwebtoken') as any;
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
    if (type === 'last-running') {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.user_id)
        .eq('is_done', 0)
        .order('start_time', { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') return NextResponse.json({ success: false, error: error.message });
      return NextResponse.json({ success: true, data: data || null });

    }

    if (type === 'history') {
      const date = searchParams.get('date');
      if (!date) return NextResponse.json({ success: false, error: 'Missing date' });
      const startOfDay = `${date}T00:00:00`;
      const endOfDay = `${date}T23:59:59`;
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.user_id)
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay)
        .order('start_time', { ascending: false });
      if (error) return NextResponse.json({ success: false, error: error.message });
      return NextResponse.json({ success: true, data: data || [] });

    }

    if (type === 'all') {
      const limit = parseInt(searchParams.get('limit') || '30');
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.user_id)
        .eq('is_done', 1)
        .order('start_time', { ascending: false })
        .limit(limit);
      if (error) return NextResponse.json({ success: false, error: error.message });
      return NextResponse.json({ success: true, data: data || [] });
    }

    // Default: last-running
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.user_id)
      .eq('is_done', 0)
      .order('start_time', { ascending: false })
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') return NextResponse.json({ success: false, error: error.message });
    return NextResponse.json({ success: true, data: data || null });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = verifyToken(request);
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  try {
    const { type } = await request.json();

    if (type === 'stop') {
      const { data: runningSessions, error: findErr } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.user_id)
        .eq('is_done', 0)
        .order('start_time', { ascending: false })
        .limit(1);
      if (findErr) return NextResponse.json({ success: false, error: findErr.message });
      if (!runningSessions || runningSessions.length === 0) {
        return NextResponse.json({ success: false, error: 'No running session found' });
      }
      const { data, error } = await supabase
        .from('sessions')
        .update({
          end_time: new Date().toISOString(),
          is_done: 1,
          status: 'finished',
        })
        .eq('id', runningSessions[0].id)
        .select()
        .single();
      if (error) return NextResponse.json({ success: false, error: error.message });
      return NextResponse.json({ success: true, data });
    }

    // Default: start session
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: user.user_id,
        start_time: new Date().toISOString(),
        is_done: 0,
        status: 'running',
      })
      .select()
      .single();
    if (error) return NextResponse.json({ success: false, error: error.message });
    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
