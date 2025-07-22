// src/app/api/v1/menu-items/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { MenuItem } from '@/types';

/**
 * @swagger
 * /api/v1/menu-items:
 *   get:
 *     summary: Retrieve a list of menu items from Firestore
 *     description: Fetches all available menu items from the Firestore 'menu-items' collection.
 *     tags:
 *       - Menu
 *     responses:
 *       200:
 *         description: A list of menu items.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MenuItem'
 *       500:
 *         description: Internal Server Error
 */
export async function GET(request: NextRequest) {
  try {
    const menuItemsCol = collection(db, 'menu-items');
    const menuItemsSnapshot = await getDocs(menuItemsCol);
    const menuItemsList = menuItemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
    
    return NextResponse.json(menuItemsList);
  } catch (error) {
    console.error('Failed to fetch menu items from Firestore:', error);
    // It's good practice to hide specific error details in production
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/v1/menu-items:
 *   post:
 *     summary: Create a new menu item
 *     description: Adds a new menu item to the Firestore 'menu-items' collection.
 *     tags:
 *       - Menu
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MenuItem'
 *     responses:
 *       201:
 *         description: The created menu item.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MenuItem'
 *       400:
 *         description: Bad Request - Missing required fields
 *       500:
 *         description: Internal Server Error
 */
export async function POST(request: NextRequest) {
  try {
    const newItemData = await request.json() as Omit<MenuItem, 'id'>;

    // Basic validation
    if (!newItemData.name || !newItemData.price || !newItemData.category) {
      return NextResponse.json({ message: 'Bad Request: Missing required fields (name, price, category).' }, { status: 400 });
    }

    // Ensure new items are available by default
    const dataToSave = {
        ...newItemData,
        is_available: newItemData.is_available ?? true
    }

    const menuItemsCol = collection(db, 'menu-items');
    const docRef = await addDoc(menuItemsCol, dataToSave);

    const createdItem: MenuItem = {
      id: docRef.id,
      ...dataToSave
    } as MenuItem;
    
    return NextResponse.json(createdItem, { status: 201 });
  } catch (error) {
    console.error('Failed to create menu item in Firestore:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

    