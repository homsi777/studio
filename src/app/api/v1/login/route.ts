'use server';
// src/app/api/v1/login/route.ts

import {type NextRequest, NextResponse} from 'next/server';
import {collection, query, where, getDocs} from 'firebase/firestore';
import {db} from '@/lib/firebase';
import type {User} from '@/types';
import bcrypt from 'bcryptjs';

/**
 * @swagger
 * /api/v1/login:
 *   post:
 *     summary: Authenticate a user
 *     description: Takes a username and password and returns a success status if credentials are valid.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid credentials.
 *       500:
 *         description: Internal Server Error
 */
export async function POST(request: NextRequest) {
  try {
    const {username, password} = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        {success: false, message: 'Username and password are required.'},
        {status: 400}
      );
    }

    const usersCol = collection(db, 'users');
    const q = query(usersCol, where('username', '==', username));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json(
        {success: false, message: 'Invalid credentials.'},
        {status: 401}
      );
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data() as User;

    // Compare hashed password
    const passwordMatch = await bcrypt.compare(
      password,
      userData.password || ''
    );

    if (passwordMatch) {
      // IMPORTANT FIX: Include the document ID in the user object
      const userResponseData: User = {
        id: userDoc.id,
        username: userData.username,
        role: userData.role,
        // Do NOT send the password hash back to the client
      };

      return NextResponse.json(
        {
          success: true,
          user: userResponseData,
        },
        {status: 200}
      );
    } else {
      return NextResponse.json(
        {success: false, message: 'Invalid credentials.'},
        {status: 401}
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {success: false, message: 'Internal Server Error'},
      {status: 500}
    );
  }
}
