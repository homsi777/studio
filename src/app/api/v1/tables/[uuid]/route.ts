import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { Table } from '@/types';

// DELETE a specific table by UUID
export async function DELETE(request: NextRequest, { params }: { params: { uuid: string } }) {
    try {
        const { uuid } = params;

        if (!uuid) {
            return NextResponse.json({ message: 'Table UUID is required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('tables')
            .delete()
            .eq('uuid', uuid);

        if (error) {
            console.error('Supabase delete error:', error);
            // Handle case where UUID doesn't exist gracefully
            if (error.code === '22P02') { // Invalid text representation for uuid
                 return NextResponse.json({ message: 'Invalid UUID format.' }, { status: 400 });
            }
            return NextResponse.json({ message: 'Table not found or error deleting.' }, { status: 404 });
        }
        
        return new NextResponse(null, { status: 204 });

    } catch (error) {
        console.error(`Failed to delete table with UUID ${params.uuid}:`, error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT to update a table by UUID
export async function PUT(request: NextRequest, { params }: { params: { uuid: string } }) {
    try {
        const { uuid } = params;
        const updatedData = await request.json() as Partial<Table>;

        if (!uuid) {
            return NextResponse.json({ message: 'Table UUID is required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('tables')
            .update({
                ...updatedData,
                updated_at: new Date().toISOString()
            })
            .eq('uuid', uuid)
            .select()
            .single();
        
        if (error) {
            console.error('Supabase update error:', error);
            return NextResponse.json({ message: 'Table not found or error updating.' }, { status: 404 });
        }

        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error(`Failed to update table with UUID ${params.uuid}:`, error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
