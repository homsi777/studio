
// src/app/api/v1/expenses/route.ts
// هذا الملف سيتعامل مع POST (إضافة مصروف) و GET (جلب المصاريف)

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { Expense } from '@/types';

// POST: إضافة مصروف جديد
export async function POST(request: Request) {
  try {
    const expenseData: Partial<Omit<Expense, 'id' | 'created_at' | 'last_updated'>> & { id?: string } = await request.json();

    // التحقق الأساسي من البيانات المطلوبة
    if (!expenseData.description || expenseData.amount === undefined || expenseData.amount === null || !expenseData.date || !expenseData.category) {
      console.error('Missing required expense data:', expenseData); // تسجيل البيانات المفقودة
      return NextResponse.json({ message: 'Missing required expense data (description, amount, date, category).' }, { status: 400 });
    }

    // توليد UUID إذا لم يتم توفيره من الواجهة الأمامية (مهم للمزامنة)
    const uuid = expenseData.id || crypto.randomUUID();

    // تحويل التاريخ إلى تنسيق YYYY-MM-DD ليتناسب مع عمود 'date' في Postgres
    const formattedDate = new Date(expenseData.date).toISOString().split('T')[0];
    
    // إزالة ID المؤقت قبل الإرسال إلى سوبا بيس إذا كان موجودًا
    const { id, ...dataToInsert } = expenseData;

    const { data, error } = await supabaseAdmin
      .from('expenses')
      .insert({
        id: uuid, // استخدام الـ UUID المولد
        ...dataToInsert,
        amount: Number(expenseData.amount),
        date: formattedDate,
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error (expenses):', error);
      // يمكن هنا فحص error.code لتحديد نوع الخطأ بدقة أكبر (مثلاً 23505 لـ unique violation)
      if (error.code === '23505') {
        return NextResponse.json({ message: 'Expense with this ID already exists.' }, { status: 409 });
      }
      return NextResponse.json({ message: 'Failed to save expense.', error: error.message, code: error.code }, { status: 500 });
    }

    console.log('Expense added successfully:', data);
    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/v1/expenses:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
  }
}

// GET: جلب جميع المصاريف مع إمكانية الفلترة
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = supabaseAdmin
      .from('expenses')
      .select('*');
    
    if (startDate) {
        query = query.gte('date', startDate);
    }
    if (endDate) {
        query = query.lte('date', endDate);
    }
      
    const { data, error } = await query.order('date', { ascending: false }); 

    if (error) {
      console.error('Supabase select error (expenses):', error);
      return NextResponse.json({ message: 'Failed to fetch expenses.', error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Error in GET /api/v1/expenses:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
  }
}
