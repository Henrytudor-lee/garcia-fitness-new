import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'pulse-fit-secret-key';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, avatar } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
    }

    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 400 });
    }

    // Get next available id (fix sequence if out of sync)
    const { data: maxRow } = await supabase
      .from('users')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .single();
    const nextId = (maxRow?.id || 0) + 1;

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

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

    const { data: user, error } = await supabase
      .from('users')
      .insert(insertData)
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    // Issue JWT
    const token = jwt.sign(
      { user_id: user.id, email: user.email, name: user.name },
      jwtSecret,
      { expiresIn: '30d' }
    );

    return NextResponse.json({
      success: true,
      data: {
        user_id: user.id,
        user_name: user.name,
        token,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
