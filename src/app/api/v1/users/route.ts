// src/app/api/v1/user/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { UserProfile } from '../../../../types'; // تأكد من المسار الصحيح

// تهيئة Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// POST: إضافة ملف تعريف مستخدم جديد
export async function POST(request: Request) {
  try {
    const userData: Partial<UserProfile> = await request.json();

    // التحقق الأساسي من البيانات
    if (!userData.full_name || !userData.role) {
      return NextResponse.json({ message: 'Missing required user data (full_name, role).' }, { status: 400 });
    }

    // توليد user_id إذا لم يتم توفيره (للحالات التي لا ترتبط بـ Supabase Auth signUp مباشرة)
    // يفضل أن يأتي user_id من auth.users.id بعد عملية تسجيل الدخول/الاشتراك
    const userId = userData.user_id || crypto.randomUUID();

    const { data, error } = await supabaseAdmin
      .from('user_profiles') // اسم الجدول في قاعدة البيانات يبقى user_profiles
      .insert({
        user_id: userId,
        full_name: userData.full_name,
        role: userData.role,
        phone_number: userData.phone_number || null,
        is_active: userData.is_active ?? true,
        hire_date: userData.hire_date || new Date().toISOString(),
        profile_image_url: userData.profile_image_url || null,
        salary: userData.salary || null,
        department: userData.department || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      console.error('Supabase insert error (user_profiles):', error);
      if (error.code === '23505') { // Postgres unique violation (مثلاً user_id مكرر)
        return NextResponse.json({ message: 'User with this ID already exists or a unique constraint was violated.' }, { status: 409 });
      }
      return NextResponse.json({ message: 'Failed to save user profile.', error: error.message }, { status: 500 });
    }

    console.log('User profile added successfully:', data[0]);
    return NextResponse.json({ message: 'User profile added successfully.', userProfile: data[0] }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/v1/user:', error); // تم تحديث رسالة الخطأ
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
  }
}

// GET: جلب جميع ملفات تعريف المستخدمين
export async function GET(request: Request) {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_profiles') // اسم الجدول في قاعدة البيانات يبقى user_profiles
      .select('*');

    if (error) {
      console.error('Supabase select error (user_profiles):', error);
      return NextResponse.json({ message: 'Failed to fetch user profiles.', error: error.message }, { status: 500 });
    }

    return NextResponse.json({ userProfiles: data }, { status: 200 });

  } catch (error) {
    console.error('Error in GET /api/v1/user:', error); // تم تحديث رسالة الخطأ
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
  }
}
