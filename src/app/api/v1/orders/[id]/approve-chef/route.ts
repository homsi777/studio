
import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'pending_cashier_approval',
        chef_approved_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error approving order by chef for id ${id}:`, error);
      return NextResponse.json({ message: 'Order not found or error updating.' }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Server error during chef approval:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
