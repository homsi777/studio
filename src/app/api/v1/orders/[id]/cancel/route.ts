
import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'cancelled',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error cancelling order for id ${id}:`, error);
      return NextResponse.json({ message: 'Order not found or error updating.' }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Server error during order cancellation:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
