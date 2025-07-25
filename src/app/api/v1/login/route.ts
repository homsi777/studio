'use server';
// src/app/api/v1/login/route.ts

import {type NextRequest, NextResponse} from 'next/server';
import { adminDb, ensureDefaultUsersExist } from '@/lib/firebase-admin';
import type {User} from '@/types';
import bcrypt from 'bcryptjs';

/**
 * @swagger
 * /api/v1/login:
 *   post:
 *     summary: Authenticate a user
 *     description: Takes a username and password and returns a success status if credentials are valid. This now uses the Firebase Admin SDK for robust server-side authentication.
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
 *       401:
 *         description: Unauthorized - Invalid credentials.
 *       500:
 *         description: Internal Server Error
 */
export async function POST(request: NextRequest) {
  try {
    // IMPORTANT: Call this function here. It will check and create users if needed.
    // This is the most reliable place to ensure the DB is ready before a login attempt.
    await ensureDefaultUsersExist();

    const {username, password} = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        {success: false, message: 'Username and password are required.'},
        {status: 400}
      );
    }

    const usersCol = adminDb.collection('users');
    const q = usersCol.where('username', '==', username);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      console.log(`Login failed: No user found with username '${username}'`);
      return NextResponse.json(
        {success: false, message: 'Invalid credentials.'},
        {status: 401}
      );
    }

    const userDoc = querySnapshot.docs[0];
    // The data includes the password hash now because we are using the Admin SDK.
    const userData = userDoc.data() as User;

    const passwordMatch = await bcrypt.compare(
      password,
      userData.password || ''
    );

    if (passwordMatch) {
      // Create a user object to send back, EXCLUDING the password hash.
      const userResponseData: User = {
        id: userDoc.id,
        username: userData.username,
        role: userData.role,
      };

      return NextResponse.json(
        {
          success: true,
          user: userResponseData,
        },
        {status: 200}
      );
    } else {
      console.log(`Login failed: Password mismatch for username '${username}'`);
      return NextResponse.json(
        {success: false, message: 'Invalid credentials.'},
        {status: 401}
      );
    }
  } catch (error) {
    console.error('Login API error:', error);
    // Provide a more specific error message for easier debugging.
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      {success: false, message: `Internal Server Error: ${errorMessage}`},
      {status: 500}
    );
  }
}
