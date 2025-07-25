import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

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
    // No specific data is needed from the body as SERIAL handles ID and UUID is auto-generated.
    const { data, error } = await supabaseAdmin
        .from('tables')
        .insert({})
        .select()
        .single();

    if (error) throw error;
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Failed to create table in Supabase:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE the last table
export async function DELETE(request: NextRequest) {
    try {
        // First, find the highest table ID
        const { data: maxIdData, error: maxIdError } = await supabaseAdmin
            .from('tables')
            .select('id')
            .order('id', { ascending: false })
            .limit(1)
            .single();

        if (maxIdError) throw maxIdError;
        if (!maxIdData) {
            return NextResponse.json({ message: 'No tables to delete' }, { status: 404 });
        }

        // Then, delete the table with the highest ID
        const { error: deleteError } = await supabaseAdmin
            .from('tables')
            .delete()
            .eq('id', maxIdData.id);

        if (deleteError) throw deleteError;
        
        return new NextResponse(null, { status: 204 });

    } catch (error) {
        console.error('Failed to delete last table from Supabase:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
