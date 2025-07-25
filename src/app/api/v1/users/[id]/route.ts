'use server';
// src/app/api/v1/users/[id]/route.ts
import {type NextRequest, NextResponse} from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type {User} from '@/types';
import bcrypt from 'bcryptjs';

/**
 * @swagger
 * /api/v1/users/{id}:
 *   put:
 *     summary: Update an existing user
 *     description: Modifies the details of a specific user.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: The updated user.
 *       404:
 *         description: Not Found - User with the given ID does not exist.
 *       500:
 *         description: Internal Server Error
 */
export async function PUT(
  request: NextRequest,
  {params}: {params: {id: string}}
) {
  try {
    const {id} = params;
    const updatedData = (await request.json()) as Partial<Omit<User, 'id'>>;
    const userRef = adminDb.collection('users').doc(id);

    const dataToUpdate: Partial<Omit<User, 'id' | 'password'>> & { password?: string } = {
      username: updatedData.username,
      role: updatedData.role,
    };

    // Hash password only if a new one is provided
    if (updatedData.password) {
      const salt = await bcrypt.genSalt(10);
      dataToUpdate.password = await bcrypt.hash(updatedData.password, salt);
    }

    await userRef.update(dataToUpdate);
    const updatedDoc = await userRef.get();
    const finalUserData = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    };
    delete (finalUserData as any).password;

    return NextResponse.json(finalUserData, {status: 200});
  } catch (error) {
    console.error(`Failed to update user with ID ${params.id}:`, error);
    return NextResponse.json({message: 'Internal Server Error'}, {status: 500});
  }
}

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: Removes a specific user from the 'users' collection.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to delete.
 *     responses:
 *       204:
 *         description: No Content - User deleted successfully.
 *       404:
 *         description: Not Found - User with the given ID does not exist.
 *       500:
 *         description: Internal Server Error
 */
export async function DELETE(
  request: NextRequest,
  {params}: {params: {id: string}}
) {
  try {
    const {id} = params;
    const userRef = adminDb.collection('users').doc(id);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({message: 'User not found.'}, {status: 404});
    }

    // Prevent deleting the default admin user
    if (userSnap.data()?.username === 'admin' || userSnap.data()?.username === 'superadmin') {
      return NextResponse.json(
        {message: 'Cannot delete the default admin or superadmin user.'},
        {status: 403}
      );
    }

    await userRef.delete();

    return new NextResponse(null, {status: 204});
  } catch (error) {
    console.error(`Failed to delete user with ID ${params.id}:`, error);
    return NextResponse.json({message: 'Internal Server Error'}, {status: 500});
  }
}
