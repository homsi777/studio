import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const updatedData = await request.json();
        
        const { data, error } = await supabaseAdmin
            .from('menu_items')
            .update({
                ...updatedData,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error(`Supabase update error for menu item ${id}:`, error);
            return NextResponse.json({ message: 'Menu item not found or error updating.' }, { status: 404 });
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        const id = await context.params.id;
        console.error(`Failed to update menu item with ID ${id}:`, error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const { error } = await supabaseAdmin
            .from('menu_items')
            .delete()
            .eq('id', id);

        if (error) {
            console.error(`Supabase delete error for menu item ${id}:`, error);
            return NextResponse.json({ message: 'Menu item not found or error deleting.' }, { status: 404 });
        }

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        const id = await context.params.id;
        console.error(`Failed to delete menu item with ID ${id}:`, error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
