
import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { count } = await request.json();
    const desiredCount = Number(count);

    if (isNaN(desiredCount) || desiredCount < 0 || desiredCount > 200) { // Safety limit
      return NextResponse.json({ message: 'Invalid count specified. Must be between 0 and 200.' }, { status: 400 });
    }

    // 1. Get current tables
    const { data: currentTables, error: fetchError } = await supabaseAdmin
      .from('tables')
      .select('id, uuid')
      .order('id', { ascending: true });

    if (fetchError) throw fetchError;

    const currentCount = currentTables.length;

    // 2. Compare and decide action
    if (desiredCount > currentCount) {
      // Add new tables
      const newTablesCount = desiredCount - currentCount;
      const newTables = Array.from({ length: newTablesCount }, (_, i) => ({
        uuid: uuidv4(),
        table_number: currentCount + i + 1, // Assign table numbers sequentially
        status: 'available',
      }));
      
      const { error: insertError } = await supabaseAdmin.from('tables').insert(newTables);
      if (insertError) throw insertError;

    } else if (desiredCount < currentCount) {
      // Remove tables
      const tablesToRemoveCount = currentCount - desiredCount;
      const tablesToRemove = currentTables.slice(-tablesToRemoveCount); // Get the last N tables
      const uuidsToRemove = tablesToRemove.map(t => t.uuid);

      const { error: deleteError } = await supabaseAdmin
        .from('tables')
        .delete()
        .in('uuid', uuidsToRemove);
      
      if (deleteError) throw deleteError;
    }

    // If desiredCount === currentCount, do nothing.

    return NextResponse.json({ message: `Table count set to ${desiredCount}` }, { status: 200 });

  } catch (error: any) {
    console.error('Failed to set table count in Supabase:', error);
    return NextResponse.json({ message: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
