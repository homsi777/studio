// src/app/api/v1/users/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/types';

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
    const usersCol = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCol);
    const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    
    return NextResponse.json(usersList);
  } catch (error) {
    console.error('Failed to fetch users from Firestore:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad Request - Missing required fields
 *       500:
 *         description: Internal Server Error
 */
export async function POST(request: NextRequest) {
  try {
    // Note: In a real app, you would handle password hashing here.
    // For this project, we'll store it as is, but this is NOT secure for production.
    const newUserData = await request.json() as Omit<User, 'id'>;

    if (!newUserData.username || !newUserData.role) {
      return NextResponse.json({ message: 'Bad Request: Missing required fields (username, role).' }, { status: 400 });
    }

    const usersCol = collection(db, 'users');
    const docRef = await addDoc(usersCol, newUserData);

    const createdUser: User = {
      id: docRef.id,
      ...newUserData
    };
    
    return NextResponse.json(createdUser, { status: 201 });
  } catch (error) {
    console.error('Failed to create user in Firestore:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
