'use server';

import {type NextRequest, NextResponse} from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type {User} from '@/types';

export async function PUT(
  request: NextRequest,
  context: {params: Promise<{id: string}>}
) {
  try {
    const {id} = await context.params;
    const updatedData = (await request.json()) as Partial<Omit<User, 'id'>>;

    const dataToUpdate: { email?: string; password?: string, user_metadata?: object } = {};

    if (updatedData.email) {
        dataToUpdate.email = updatedData.email;
    }
    if (updatedData.password) {
        dataToUpdate.password = updatedData.password;
    }
    if (updatedData.role) {
        dataToUpdate.user_metadata = { role: updatedData.role }
    }
    
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, dataToUpdate);

    if (error) throw error;
    
    const responseData = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.user_metadata.role,
        username: data.user.email
    };


    return NextResponse.json(responseData, {status: 200});
  } catch (error) {
    const {id} = await context.params;
    console.error(`Failed to update user with ID ${id}:`, error);
    return NextResponse.json({message: 'Internal Server Error'}, {status: 500});
  }
}

export async function DELETE(
  request: NextRequest,
  context: {params: Promise<{id: string}>}
) {
  try {
    const {id} = await context.params;

    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (error) throw error;

    return new NextResponse(null, {status: 204});
  } catch (error) {
    const {id} = await context.params;
    console.error(`Failed to delete user with ID ${id}:`, error);
    return NextResponse.json({message: 'Internal Server Error'}, {status: 500});
  }
}
