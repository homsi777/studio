import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function DELETE(request: NextRequest, context: { params: Promise<{ uuid: string }> }) {
    try {
        const { uuid } = await context.params;

        if (!uuid) {
            return NextResponse.json({ message: 'Table UUID is required' }, { status: 400 });
        }

        // Optional: Check if the table has active orders before deleting
        // This logic might be better placed in a service layer if complexity grows.
        const { data: activeOrders, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('id')
            .eq('table_uuid', uuid)
            .in('status', ['pending_chef_approval', 'pending_cashier_approval', 'awaiting_final_confirmation', 'confirmed', 'ready', 'paying', 'needs_attention']);

        if (orderError) {
            console.error('Error checking for active orders:', orderError);
            return NextResponse.json({ message: 'Error checking for active orders.' }, { status: 500 });
        }

        if (activeOrders && activeOrders.length > 0) {
            return NextResponse.json({ message: 'Cannot delete a table with active orders.' }, { status: 409 }); // 409 Conflict
        }

        // Proceed with deletion if no active orders are found
        const { error: deleteError } = await supabaseAdmin
            .from('tables')
            .delete()
            .eq('uuid', uuid);

        if (deleteError) {
            console.error('Supabase delete error:', deleteError);
            if (deleteError.code === '22P02') { // Invalid UUID format
                 return NextResponse.json({ message: 'Invalid UUID format.' }, { status: 400 });
            }
            return NextResponse.json({ message: 'Table not found or error deleting.' }, { status: 404 });
        }
        
        return new NextResponse(null, { status: 204 }); // No Content

    } catch (error) {
        const { uuid } = await context.params;
        console.error(`Failed to delete table with UUID ${uuid}:`, error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
