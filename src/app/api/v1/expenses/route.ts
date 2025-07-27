// src/app/api/v1/expenses/route.ts
// هذا الملف سيتعامل مع POST (إضافة مصروف) و GET (جلب المصاريف)

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Expense } from '../../../../types'; // تأكد من المسار الصحيح

// تهيئة Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// POST: إضافة مصروف جديد
export async function POST(request: Request) {
  try {
    const expenseData: Partial<Expense> = await request.json();

    // التحقق الأساسي من البيانات المطلوبة
    if (!expenseData.description || expenseData.amount === undefined || expenseData.amount === null || !expenseData.date || !expenseData.category) {
      console.error('Missing required expense data:', expenseData); // تسجيل البيانات المفقودة
      return NextResponse.json({ message: 'Missing required expense data (description, amount, date, category).' }, { status: 400 });
    }

    // توليد UUID إذا لم يتم توفيره من الواجهة الأمامية
    const uuid = expenseData.id || crypto.randomUUID();

    // تحويل التاريخ إلى تنسيق YYYY-MM-DD ليتناسب مع عمود 'date' في Postgres
    const formattedDate = new Date(expenseData.date).toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('expenses')
      .insert({
        id: uuid,
        description: expenseData.description,
        description_en: expenseData.description_en || null,
        amount: expenseData.amount,
        date: formattedDate,
        category: expenseData.category,
        payment_method: expenseData.payment_method || null,
        supplier: expenseData.supplier || null,
        invoice_number: expenseData.invoice_number || null,
        notes: expenseData.notes || null,
        user_id: expenseData.user_id || null,
        // created_at و last_updated سيتم تعيينهما تلقائياً بواسطة قاعدة البيانات
        // تم إزالتهما من هنا لتجنب التعارض مع القيمة الافتراضية في Supabase
      })
      .select(); // استخدم select() لإرجاع البيانات المضافة

    if (error) {
      console.error('Supabase insert error (expenses):', error);
      return NextResponse.json({ message: 'Failed to save expense.', error: error.message, code: error.code }, { status: 500 });
    }

    console.log('Expense added successfully:', data[0]);
    return NextResponse.json({ message: 'Expense added successfully.', expense: data[0] }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/v1/expenses:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
  }
}

// GET: جلب جميع المصاريف
export async function GET(request: Request) {
  try {
    const { data, error } = await supabaseAdmin
      .from('expenses')
      .select('*')
      .order('date', { ascending: false }); // ترتيب حسب التاريخ الأحدث أولاً

    if (error) {
      console.error('Supabase select error (expenses):', error);
      return NextResponse.json({ message: 'Failed to fetch expenses.', error: error.message }, { status: 500 });
    }

    return NextResponse.json({ expenses: data }, { status: 200 });

  } catch (error) {
    console.error('Error in GET /api/v1/expenses:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
  }
}
