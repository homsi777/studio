// src/app/api/v1/user/[userId]/route.ts
// هذا الملف سيتعامل مع PUT (تعديل ملف تعريف مستخدم) و DELETE (تعطيل مستخدم)

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { UserProfile } from '../../../../types'; // تأكد من المسار الصحيح

// تهيئة Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// PUT: تعديل ملف تعريف مستخدم موجود
export async function PUT(request: Request, { params }: { params: { userId: string } }) {
  try {
    const userId = params.userId;
    const updatedData: Partial<UserProfile> = await request.json();

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('user_profiles') // اسم الجدول في قاعدة البيانات يبقى user_profiles
      .update({ ...updatedData, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select();

    if (error) {
      console.error('Supabase update error (user_profiles):', error);
      return NextResponse.json({ message: 'Failed to update user profile.', error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ message: 'User profile not found.' }, { status: 404 });
    }

    console.log('User profile updated successfully:', data[0]);
    return NextResponse.json({ message: 'User profile updated successfully.', userProfile: data[0] }, { status: 200 });

  } catch (error) {
    console.error('Error in PUT /api/v1/user/[userId]:', error); // تم تحديث رسالة الخطأ
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
  }
}

// DELETE: تعطيل ملف تعريف مستخدم (حذف ناعم)
// هذا المسار سيقوم بتغيير is_active إلى false بدلاً من الحذف الفعلي
export async function DELETE(request: Request, { params }: { params: { userId: string } }) {
  try {
    const userId = params.userId;

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required.' }, { status: 400 });
    }

    // هنا نستخدم PUT لتغيير is_active إلى false بدلاً من الحذف الفعلي
    const { data, error } = await supabaseAdmin
      .from('user_profiles') // اسم الجدول في قاعدة البيانات يبقى user_profiles
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select();

    if (error) {ش
      console.error('Supabase deactivate error (user_profiles):', error);
      return NextResponse.json({ message: 'Failed to deactivate user profile.', error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ message: 'User profile not found.' }, { status: 404 });
    }

    console.log('User profile deactivated successfully:', data[0]);
    return NextResponse.json({ message: 'User profile deactivated successfully.' }, { status: 200 });

  } catch (error) {
    console.error('Error in DELETE /api/v1/user/[userId]:', error); // تم تحديث رسالة الخطأ
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
  }
}
