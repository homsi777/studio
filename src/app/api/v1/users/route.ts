// src/app/api/v1/users/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, addDoc, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/types';

// WARNING: In a real-world scenario, you would use a proper authentication
// system like Firebase Authentication. Exposing a user list like this is
// not secure. This is simplified for the project's scope.


const ensureDefaultAdminExists = async () => {
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);

    if (snapshot.empty) {
        console.log("No users found. Creating default admin user.");
        // IMPORTANT: Storing plaintext passwords is a major security risk.
        // This is for demonstration purposes only. In a real application,
        // passwords must be hashed on the server (e.g., using bcrypt).
        const defaultAdmin: Omit<User, 'id'> = {
            username: 'admin',
            password: '123456', // Default password
            role: 'manager'
        };
        try {
            await addDoc(usersCol, defaultAdmin);
            console.log("Default admin user created successfully.");
        } catch (error) {
            console.error("Failed to create default admin user:", error);
        }
    }
}

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
    // Ensure the default admin exists if the database is empty.
    await ensureDefaultAdminExists();

    const usersCol = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCol);
    const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    
    // Note: It's generally not a good practice to send passwords to the client,
    // even if they are hashed. This is simplified for the demo.
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
 *       400:
 *         description: Bad Request - Missing required fields
 *       409:
 *         description: Conflict - Username already exists
 *       500:
 *         description: Internal Server Error
 */
export async function POST(request: NextRequest) {
  try {
    const newUserData = await request.json() as Omit<User, 'id'>;

    if (!newUserData.username || !newUserData.role || !newUserData.password) {
      return NextResponse.json({ message: 'Bad Request: Missing required fields (username, password, role).' }, { status: 400 });
    }

    const usersCol = collection(db, 'users');

    // Check if username already exists
    const q = query(usersCol, where("username", "==", newUserData.username));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        return NextResponse.json({ message: 'Conflict: Username already exists.'}, { status: 409 });
    }
    
    // In a real app, you would HASH the password here before saving.
    // e.g., using bcrypt: const hashedPassword = await bcrypt.hash(newUserData.password, 10);
    // For this project, we're storing it in plain text for simplicity. THIS IS NOT SECURE.
    const docRef = await addDoc(usersCol, newUserData);

    const createdUser: User = {
      id: docRef.id,
      ...newUserData
    };
    
    // Don't send the password back in the response
    const { password, ...userResponse } = createdUser;
    
    return NextResponse.json(userResponse, { status: 201 });
  } catch (error) {
    console.error('Failed to create user in Firestore:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
