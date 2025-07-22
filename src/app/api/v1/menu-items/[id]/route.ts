// src/app/api/v1/menu-items/[id]/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { MenuItem } from '@/types';

/**
 * @swagger
 * /api/v1/menu-items/{id}:
 *   put:
 *     summary: Update an existing menu item
 *     description: Modifies the details of a specific menu item.
 *     tags:
 *       - Menu
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the menu item to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MenuItem'
 *     responses:
 *       200:
 *         description: The updated menu item.
 *       404:
 *         description: Not Found - Item with the given ID does not exist.
 *       500:
 *         description: Internal Server Error
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const updatedData = await request.json() as Partial<Omit<MenuItem, 'id'>>;
        const itemRef = doc(db, 'menu-items', id);
        await updateDoc(itemRef, updatedData);
        return NextResponse.json({ id, ...updatedData }, { status: 200 });
    } catch (error) {
        console.error(`Failed to update menu item with ID ${params.id}:`, error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}


/**
 * @swagger
 * /api/v1/menu-items/{id}:
 *   delete:
 *     summary: Delete a menu item
 *     description: Removes a specific menu item from the Firestore 'menu-items' collection.
 *     tags:
 *       - Menu
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the menu item to delete.
 *     responses:
 *       204:
 *         description: No Content - Item deleted successfully.
 *       404:
 *         description: Not Found - Item with the given ID does not exist.
 *       500:
 *         description: Internal Server Error
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const itemRef = doc(db, 'menu-items', id);
        const itemSnap = await getDoc(itemRef);

        if (!itemSnap.exists()) {
            return NextResponse.json({ message: 'Menu item not found.' }, { status: 404 });
        }

        await deleteDoc(itemRef);

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error(`Failed to delete menu item with ID ${params.id}:`, error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
