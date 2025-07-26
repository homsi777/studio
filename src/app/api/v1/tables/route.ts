import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { v4 as uuidv4 } from 'uuid';


// GET all tables
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
        .from('tables')
        .select('*')
        .order('id', { ascending: true });

    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch tables from Supabase:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}


// POST to add a new table
export async function POST(request: NextRequest) {
  try {
    const newTableData = {
      uuid: uuidv4()
    };

    const { data, error } = await supabaseAdmin
        .from('tables')
        .insert([newTableData]) 
        .select()
        .single();

    if (error) {
        console.error('Supabase create table error:', error);
        throw error;
    };
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Failed to create table in Supabase:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}