import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
        .from('menu_items')
        .select('*')
        .order('name', { ascending: true });

    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch menu items from Supabase:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newItemData = await request.json();

    if (!newItemData.name || !newItemData.price) {
      return NextResponse.json({ message: 'Bad Request: Missing required fields (name, price).' }, { status: 400 });
    }

    const dataToSave = {
        ...newItemData,
        is_available: newItemData.is_available ?? true
    };

    const { data, error } = await supabaseAdmin
        .from('menu_items')
        .insert(dataToSave)
        .select()
        .single();

    if (error) throw error;
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Failed to create menu item in Supabase:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
