// src/app/api/v1/menu-items/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
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
