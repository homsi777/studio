'use server';
// src/app/api/v1/users/route.ts
import {type NextRequest, NextResponse} from 'next/server';
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
} from 'firebase/firestore';
import {db} from '@/lib/firebase';
import type {User} from '@/types';
import bcrypt from 'bcryptjs';
import { ensureDefaultUsersExist } from '@/lib/firebase-admin';

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Retrieve a list of users
 *     description: Fetches all users from the Firestore 'users' collection.
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: A list of users.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Internal Server Error
 */
export async function GET(request: NextRequest) {
  try {
    // Ensure users exist if the collection is ever empty when this route is called.
    await ensureDefaultUsersExist();

    const usersCol = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCol);
    const usersList = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      // IMPORTANT: Never send the password hash to the client.
      delete data.password;
      return {id: doc.id, ...data} as User;
    });

    return NextResponse.json(usersList);
  } catch (error) {
    console.error('Failed to fetch users from Firestore:', error);
    return NextResponse.json({message: 'Internal Server Error'}, {status: 500});
  }
}

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Create a new user
 *     description: Adds a new user to the Firestore 'users' collection.
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
    const newUserData = (await request.json()) as Omit<User, 'id'>;

    if (!newUserData.username || !newUserData.role || !newUserData.password) {
      return NextResponse.json(
        {message: 'Bad Request: Missing required fields (username, password, role).'},
        {status: 400}
      );
    }

    const usersCol = collection(db, 'users');

    // Check if username already exists
    const q = query(usersCol, where('username', '==', newUserData.username));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return NextResponse.json(
        {message: 'Conflict: Username already exists.'},
        {status: 409}
      );
    }

    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newUserData.password, salt);

    const docRef = await addDoc(usersCol, {
      username: newUserData.username,
      role: newUserData.role,
      password: hashedPassword,
    });

    const createdUser: User = {
      id: docRef.id,
      username: newUserData.username,
      role: newUserData.role,
    };

    return NextResponse.json(createdUser, {status: 201});
  } catch (error) {
    console.error('Failed to create user in Firestore:', error);
    return NextResponse.json({message: 'Internal Server Error'}, {status: 500});
  }
}
