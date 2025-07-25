import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { Order } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json();

    if (!orderData.tableUuid || !orderData.items || !orderData.items.length || !orderData.sessionId) {
      return NextResponse.json({ message: 'Bad Request: Missing required fields.' }, { status: 400 });
    }
    
    const subtotal = orderData.items.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0);

    const newOrder = {
      table_id: orderData.tableId,
      table_uuid: orderData.tableUuid,
      session_id: orderData.sessionId,
      items: orderData.items,
      status: 'pending_chef_approval',
      subtotal: subtotal,
      service_charge: 0,
      tax: 0,
      final_total: subtotal,
    };
    
    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert(newOrder)
      .select()
      .single();

    if (error) throw error;

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
