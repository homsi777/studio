'use server';

import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { User } from '@/types';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password are required.' },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      console.log(`Login failed: No user found with username '${username}'`);
      return NextResponse.json(
        { success: false, message: 'Invalid credentials.' },
        { status: 401 }
      );
    }
    
    const userData = user as User;
    
    const passwordMatch = await bcrypt.compare(
      password,
      userData.password || ''
    );

    if (passwordMatch) {
      const userResponseData: Omit<User, 'password'> = {
        id: userData.id,
        username: userData.username,
        role: userData.role,
      };

      return NextResponse.json(
        {
          success: true,
          user: userResponseData,
        },
        { status: 200 }
      );
    } else {
      console.log(`Login failed: Password mismatch for username '${username}'`);
      return NextResponse.json(
        { success: false, message: 'Invalid credentials.' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { success: false, message: `Internal Server Error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
