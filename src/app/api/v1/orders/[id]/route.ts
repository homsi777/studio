import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// This dynamic route handler can manage multiple status updates.
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // The body should contain the updates, e.g., { status: 'completed' }
    // or { status: 'in_progress', updated_at: '...' }
    // It's important that the client sends the correct update payload.

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating order for id ${id}:`, error);
      return NextResponse.json({ message: 'Order not found or error updating.', details: error.message }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });

  } catch (error: any) {
    const { id } = await params;
    console.error(`Server error during order update for id ${id}:`, error.message);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ message: 'Order ID is required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('orders')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Supabase delete error:', error);
            if (error.code === '22P02') { 
                 return NextResponse.json({ message: 'Invalid UUID format.' }, { status: 400 });
            }
            return NextResponse.json({ message: 'Order not found or error deleting.' }, { status: 404 });
        }
        
        return new NextResponse(null, { status: 204 });

    } catch (error) {
        const { id } = await params;
        console.error(`Failed to delete order with ID ${id}:`, error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
