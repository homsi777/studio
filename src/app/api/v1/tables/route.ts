// src/app/api/v1/tables/route.ts
// هذا الملف سيتعامل مع POST (إضافة طاولة) و GET (جلب الطاولات)

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Table as TableType, TableStatus } from '../../../../types'; // تأكد من المسار الصحيح واستيراد TableStatus

// تهيئة Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// POST: إضافة طاولة جديدة
export async function POST(request: Request) {
  try {
    const tableData: Partial<TableType> = await request.json();

    // التحقق الأساسي من البيانات: يجب أن تكون display_number و capacity موجودة
    if (!tableData.display_number || tableData.capacity === undefined || tableData.capacity === null) {
      return NextResponse.json({ message: 'Missing required table data (display_number, capacity).' }, { status: 400 });
    }

    // توليد UUID إذا لم يتم توفيره من الواجهة الأمامية
    const uuid = tableData.uuid || crypto.randomUUID(); // يفضل استخدام crypto.randomUUID() بدلاً من uuidv4() لعدم الحاجة لمكتبة خارجية

    const { data, error } = await supabaseAdmin
      .from('tables')
      .insert({
        uuid: uuid,
        display_number: tableData.display_number, // <--- تم التأكد من تضمينها
        capacity: tableData.capacity,             // <--- تم التأكد من تضمينها
        is_active: tableData.is_active ?? true, // افتراضي true
        status: tableData.status ?? TableStatus.AVAILABLE, // افتراضي 'available' (استخدام Enum هنا)
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(); // استخدم select() لإرجاع البيانات المضافة

    if (error) {
      console.error('Supabase insert error (tables):', error);
      // التعامل مع خطأ التكرار إذا كان display_number فريداً
      if (error.code === '23505') { // Postgres unique violation error code
        return NextResponse.json({ message: 'Table with this display number already exists.' }, { status: 409 });
      }
      return NextResponse.json({ message: 'Failed to save table.', error: error.message }, { status: 500 });
    }

    // توليد رابط QR للطاولة الجديدة
    const qrUrl = `${process.env.NEXT_PUBLIC_APP_BASE_URL}/menu/${uuid}`; // تأكد من تعريف NEXT_PUBLIC_APP_BASE_URL

    console.log('Table added successfully:', data[0]);
    return NextResponse.json({ message: 'Table added successfully.', table: data[0], qrUrl: qrUrl }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/v1/tables:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
  }
}

// GET: جلب جميع الطاولات
export async function GET(request: Request) {
  try {
    const { data, error } = await supabaseAdmin
      .from('tables')
      .select('*')
      .order('display_number', { ascending: true }); // <--- تم التعديل هنا للترتيب حسب display_number

    if (error) {
      console.error('Supabase select error (tables):', error);
      return NextResponse.json({ message: 'Failed to fetch tables.', error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tables: data }, { status: 200 }); // إرجاع كائن JSON مع مفتاح 'tables'

  } catch (error) {
    console.error('Error in GET /api/v1/tables:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
  }
}
