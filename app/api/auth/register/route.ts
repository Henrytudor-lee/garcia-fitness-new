import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'pulse-fit-secret-key';

// Cache Supabase client at module level (singleton) — avoids creating new connection per request
let supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

interface UserRow { id: number; email: string; name: string; }
interface MaxIdRow { id: number; }

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, avatar } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
    }

    const sb = getSupabase();

    // Check if user already exists (quick exists check first)
    const { data: existing } = await sb
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1)
      .single() as { data: UserRow | null; error: any };

    if (existing) {
      return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 400 });
    }

    // Hash password (CPU-intensive, done before DB call)
    const hashed = await bcrypt.hash(password, 10);

    // Get next available id
    let nextId = 1;
    const { data: maxRow } = await sb
      .from('users')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .single() as { data: MaxIdRow | null; error: any };
    if (maxRow) {
      nextId = maxRow.id + 1;
    }

    // Create user
    const insertData: any = {
      id: nextId,
      email,
      password: hashed,
      name: name || email.split('@')[0],
      role: 'user',
      status: 1,
    };

    // Store avatar as base64 if provided
    if (avatar) {
      insertData.avatar = avatar;
    }

    const { data: user, error } = await sb
      .from('users')
      .insert(insertData)
      .select('id, email, name')
      .single() as { data: UserRow | null; error: any };

    if (error) {
      // Handle potential race condition where another request created the user between our check and insert
      if (error.code === '23505' || error.message.includes('duplicate')) {
        return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 400 });
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Issue JWT
    const token = jwt.sign(
      { user_id: user!.id, email: user!.email, name: user!.name },
      jwtSecret,
      { expiresIn: '30d' }
    );

    return NextResponse.json({
      success: true,
      data: {
        user_id: user!.id,
        user_name: user!.name,
        token,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
