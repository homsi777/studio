'use server';

import {type NextRequest, NextResponse} from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type {User} from '@/types';
import bcrypt from 'bcryptjs';

export async function PUT(
  request: NextRequest,
  {params}: {params: {id: string}}
) {
  try {
    const {id} = params;
    const updatedData = (await request.json()) as Partial<Omit<User, 'id'>>;

    const dataToUpdate: { [key: string]: any } = {
      username: updatedData.username,
      role: updatedData.role,
    };

    if (updatedData.password) {
      const salt = await bcrypt.genSalt(10);
      dataToUpdate.password = await bcrypt.hash(updatedData.password, salt);
    }
    
    const { data, error } = await supabaseAdmin
        .from('users')
        .update(dataToUpdate)
        .eq('id', id)
        .select('id, username, role')
        .single();

    if (error) throw error;

    return NextResponse.json(data, {status: 200});
  } catch (error) {
    console.error(`Failed to update user with ID ${params.id}:`, error);
    return NextResponse.json({message: 'Internal Server Error'}, {status: 500});
  }
}

export async function DELETE(
  request: NextRequest,
  {params}: {params: {id: string}}
) {
  try {
    const {id} = params;

    const { data: userToDelete, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('username')
      .eq('id', id)
      .single();

    if (fetchError || !userToDelete) {
        return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    if (userToDelete.username === 'admin' || userToDelete.username === 'superadmin') {
      return NextResponse.json(
        {message: 'Cannot delete the default admin or superadmin user.'},
        {status: 403}
      );
    }

    const { error } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', id);

    if (error) throw error;

    return new NextResponse(null, {status: 204});
  } catch (error) {
    console.error(`Failed to delete user with ID ${params.id}:`, error);
    return NextResponse.json({message: 'Internal Server Error'}, {status: 500});
  }
}
