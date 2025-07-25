'use server';
// src/app/api/v1/users/route.ts
import {type NextRequest, NextResponse} from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type {User} from '@/types';
import bcrypt from 'bcryptjs';

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Retrieve a list of users
 *     description: Fetches all available users from the 'users' collection.
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: A list of users.
 *       500:
 *         description: Internal Server Error
 */
export async function GET(request: NextRequest) {
  try {
    const usersCol = adminDb.collection('users');
    const usersSnapshot = await usersCol.get();
    const usersList = usersSnapshot.docs.map(doc => {
      const data = doc.data() as User;
      // IMPORTANT: Never send the password hash to the client.
      return {
        id: doc.id,
        username: data.username,
        role: data.role,
      } as User;
    });

    return NextResponse.json(usersList);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({message: 'Internal Server Error'}, {status: 500});
  }
}

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Create a new user
 *     description: Adds a new user to the 'users' collection.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: The created user.
 *       400:
 *         description: Bad Request - Missing required fields
 *       409:
 *         description: Conflict - Username already exists
 *       500:
 *         description: Internal Server Error
 */
export async function POST(request: NextRequest) {
  try {
    const newUser = (await request.json()) as Omit<User, 'id'>;

    if (!newUser.username || !newUser.password || !newUser.role) {
      return NextResponse.json(
        {message: 'Bad Request: Missing required fields.'},
        {status: 400}
      );
    }
    
    // Check if username already exists
    const usersCol = adminDb.collection('users');
    const existingUser = await usersCol.where('username', '==', newUser.username).get();
    if (!existingUser.empty) {
        return NextResponse.json({ message: 'Username already exists.' }, { status: 409 });
    }

    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newUser.password, salt);

    const userData = {
      username: newUser.username,
      password: hashedPassword,
      role: newUser.role,
    };

    const docRef = await usersCol.add(userData);

    const createdUser: User = {
      id: docRef.id,
      username: newUser.username,
      role: newUser.role,
    };

    return NextResponse.json(createdUser, {status: 201});
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json({message: 'Internal Server Error'}, {status: 500});
  }
}
