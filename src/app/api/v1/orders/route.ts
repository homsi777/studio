import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { Order } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json();

    // The client now sends tableId and tableUuid correctly.
    if (!orderData.table_uuid || !orderData.items || !orderData.items.length || !orderData.session_id) {
      return NextResponse.json({ message: 'Bad Request: Missing required fields.' }, { status: 400 });
    }
    
    const subtotal = orderData.items.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0);

    const newOrder = {
      table_id: orderData.table_id,
      table_uuid: orderData.table_uuid,
      session_id: orderData.session_id,
      items: orderData.items,
      status: 'pending_chef_approval',
      subtotal: subtotal,
      service_charge: 0,
      tax: 0,
      final_total: subtotal, // Initial final_total is the same as subtotal
    };
    
    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert(newOrder)
      .select()
      .single();

    if (error) {
        console.error("Supabase order insert error:", error);
        throw error;
    };

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Failed to create order in Supabase:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        let query = supabaseAdmin.from('orders').select('*');
        
        if (status) {
            query = query.eq('status', status);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error('Failed to fetch orders:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
