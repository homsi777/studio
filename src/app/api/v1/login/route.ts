'use server';

import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, ensureDefaultUsersExist } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';


export async function POST(request: NextRequest) {
  try {
    // Ensure default users exist before attempting to log in
    await ensureDefaultUsersExist();

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 401 });
    }
    
    if (data.user) {
        const userResponseData = {
            id: data.user.id,
            email: data.user.email,
            role: data.user.user_metadata.role || 'employee',
        };

        return NextResponse.json(
            {
                success: true,
                user: userResponseData,
                session: data.session
            },
            { status: 200 }
        );
    }

    return NextResponse.json(
        { success: false, message: 'An unknown error occurred.' },
        { status: 500 }
    );

  } catch (error) {
    console.error('Login API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { success: false, message: `Internal Server Error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
