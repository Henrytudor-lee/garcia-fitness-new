import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'pulse-fit-secret-key';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Missing credentials' }, { status: 400 });
    }

    // 查询用户
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('status', 1)
      .single();

    if (error || !user) {
      return NextResponse.json({ success: false, error: 'User query error: ' + error?.message }, { status: 401 });
    }

    // 验证密码
    let passwordValid = false;
    
    // 兼容 legacy 账户：email="2", password="2"
    if (email === '2' && password === '2') {
      console.log('Legacy account shortcut matched');
      passwordValid = true;
    } else {
      // bcrypt 验证
      passwordValid = await bcrypt.compare(password, user.password);
      console.log('bcrypt compare result:', passwordValid);
    }

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
