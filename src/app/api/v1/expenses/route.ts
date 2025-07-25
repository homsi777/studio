import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = supabaseAdmin.from('expenses').select('*');

    if (startDate) {
        query = query.gte('date', startDate.split('T')[0]);
    }
    if (endDate) {
        query = query.lte('date', endDate.split('T')[0]);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch expenses from Supabase:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newExpenseData = await request.json();

    if (!newExpenseData.description || !newExpenseData.amount || !newExpenseData.date || !newExpenseData.category) {
      return NextResponse.json({ message: 'Bad Request: Missing required fields.' }, { status: 400 });
    }
    
    const { data, error } = await supabaseAdmin
      .from('expenses')
      .insert(newExpenseData)
      .select()
      .single();

    if (error) throw error;
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Failed to create expense in Supabase:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
