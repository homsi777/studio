import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { Expense } from '@/types';

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const updatedData = await request.json() as Partial<Omit<Expense, 'id'>>;

        if (!updatedData.description || !updatedData.amount || !updatedData.date || !updatedData.category) {
            return NextResponse.json({ message: 'Bad Request: Missing required fields.' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('expenses')
            .update({ 
                ...updatedData, 
                amount: Number(updatedData.amount),
                last_updated: new Date().toISOString() 
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Supabase update error:', error);
            return NextResponse.json({ message: 'Expense not found or error updating.' }, { status: 404 });
        }
        
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        const id = await context.params.id;
        console.error(`Failed to update expense with ID ${id}:`, error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const { error } = await supabaseAdmin
            .from('expenses')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Supabase delete error:', error);
            return NextResponse.json({ message: 'Expense not found or error deleting.' }, { status: 404 });
        }

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        const id = await context.params.id;
        console.error(`Failed to delete expense with ID ${id}:`, error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
