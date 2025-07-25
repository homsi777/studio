'use server';

import {type NextRequest, NextResponse} from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type {User} from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) throw error;

    const responseData = users.map(user => ({
      id: user.id,
      email: user.email,
      role: user.user_metadata.role || 'employee',
      username: user.email,
    }));

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({message: 'Internal Server Error'}, {status: 500});
  }
}

export async function POST(request: NextRequest) {
  try {
    const newUser = (await request.json()) as Omit<User, 'id'>;

    if (!newUser.email || !newUser.password || !newUser.role) {
      return NextResponse.json(
        {message: 'Bad Request: Missing required fields.'},
        {status: 400}
      );
    }
    
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true, // Auto-confirm email for simplicity
        user_metadata: { role: newUser.role }
    });

    if (error) {
        if (error.message.includes('already registered')) {
             return NextResponse.json({ message: 'Email already exists.' }, { status: 409 });
        }
        throw error;
    }

    const responseData = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.user_metadata.role,
        username: data.user.email
    }

    return NextResponse.json(responseData, {status: 201});
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json({message: 'Internal Server Error'}, {status: 500});
  }
}
