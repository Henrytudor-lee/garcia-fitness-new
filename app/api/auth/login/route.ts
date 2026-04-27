import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

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

interface UserRow {
  id: number;
  email: string;
  name: string;
  password?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Missing credentials' }, { status: 400 });
    }

    const sb = getSupabase();

    // 兼容 legacy 账户：email="2", password="2"
    if (email === '2' && password === '2') {
      const { data: legacyUser } = await sb
        .from('users')
        .select('*')
        .eq('email', '2')
        .eq('status', 1)
        .limit(1) as { data: UserRow[] | null };

      if (!legacyUser || legacyUser.length === 0) {
        return NextResponse.json({ success: false, error: 'Legacy user not found' }, { status: 401 });
      }
      const user = legacyUser[0];
      const token = jwt.sign(
        { user_id: user.id, email: user.email, name: user.name },
        jwtSecret,
        { expiresIn: '30d' }
      );
      return NextResponse.json({
        success: true,
        data: {
          user_id: user.id,
          user_name: user.name || '2',
          token,
        },
      });
    }

    // 查询用户
    const { data: user, error } = await sb
      .from('users')
      .select('id, email, name, password')
      .eq('email', email)
      .eq('status', 1)
      .limit(1)
      .single() as { data: UserRow | null; error: any };

    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    // 验证密码
    const passwordValid = await bcrypt.compare(password, user.password || '');

    if (!passwordValid) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    // 签发 JWT
    const token = jwt.sign(
      { user_id: user.id, email: user.email, name: user.name },
      jwtSecret,
      { expiresIn: '30d' }
    );

    return NextResponse.json({
      success: true,
      data: {
        user_id: user.id,
        user_name: user.name || email,
        token,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
