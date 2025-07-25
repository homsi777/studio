'use server';

import {type NextRequest, NextResponse} from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type {User} from '@/types';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, username, role');
    
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({message: 'Internal Server Error'}, {status: 500});
  }
}

export async function POST(request: NextRequest) {
  try {
    const newUser = (await request.json()) as Omit<User, 'id'>;

    if (!newUser.username || !newUser.password || !newUser.role) {
      return NextResponse.json(
        {message: 'Bad Request: Missing required fields.'},
        {status: 400}
      );
    }
    
    const { data: existingUser, error: existingUserError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('username', newUser.username)
        .single();
    
    if (existingUser) {
        return NextResponse.json({ message: 'Username already exists.' }, { status: 409 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newUser.password, salt);

    const userData = {
      username: newUser.username,
      password: hashedPassword,
      role: newUser.role,
    };
    
    const { data, error } = await supabaseAdmin
        .from('users')
        .insert(userData)
        .select('id, username, role')
        .single();

    if (error) throw error;

    return NextResponse.json(data, {status: 201});
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json({message: 'Internal Server Error'}, {status: 500});
  }
}
