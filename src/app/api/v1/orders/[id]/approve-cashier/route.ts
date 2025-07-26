import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { serviceCharge, tax, finalTotal } = await request.json();

    if (serviceCharge === undefined || tax === undefined || finalTotal === undefined) {
      return NextResponse.json({ message: 'Bad Request: Missing financial details.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'pending_final_confirmation',
        cashier_approved_at: new Date().toISOString(),
        service_charge: serviceCharge,
        tax: tax,
        final_total: finalTotal,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error approving order by cashier for id ${id}:`, error);
      return NextResponse.json({ message: 'Order not found or error updating.' }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Server error during cashier approval:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
