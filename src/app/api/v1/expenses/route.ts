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

    // Basic validation for essential fields
    if (!newExpenseData.description || !newExpenseData.amount || !newExpenseData.date || !newExpenseData.category) {
      return NextResponse.json({ message: 'Bad Request: Missing required fields (description, amount, date, category).' }, { status: 400 });
    }
    
    const { data, error } = await supabaseAdmin
      .from('expenses')
      .insert(newExpenseData)
      .select()
      .single();

    if (error) {
        console.error('Supabase insert error for expense:', error);
        // Provide a more specific error message if available
        return NextResponse.json({ message: 'Failed to create expense in Supabase.', details: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Failed to create expense:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
