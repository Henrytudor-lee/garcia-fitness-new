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

export async function PUT(request: NextRequest) {
  const user = verifyToken(request);
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, session_id, weight, reps, weight_unit } = await request.json();

    const { data, error } = await supabase
      .from('exercises')
      .update({
        weight,
        reps,
        weight_unit: weight_unit || 'kg',
        update_time: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.user_id)
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: error.message });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = verifyToken(request);
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '0');

    if (!id) return NextResponse.json({ success: false, error: 'Missing id' });

    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', id)
      .eq('user_id', user.user_id);

    if (error) return NextResponse.json({ success: false, error: error.message });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
