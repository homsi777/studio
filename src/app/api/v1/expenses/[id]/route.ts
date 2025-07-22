
// src/app/api/v1/expenses/[id]/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Expense } from '@/types';

/**
 * @swagger
 * /api/v1/expenses/{id}:
 *   put:
 *     summary: Update an existing expense
 *     description: Modifies the details of a specific expense in Firestore.
 *     tags:
 *       - Expenses
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the expense to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Expense'
 *     responses:
 *       200:
 *         description: The updated expense.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Expense'
 *       400:
 *         description: Bad Request - Missing required fields.
 *       404:
 *         description: Not Found - Expense with the given ID does not exist.
 *       500:
 *         description: Internal Server Error
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const updatedData = await request.json() as Partial<Omit<Expense, 'id'>>;

        if (!updatedData.description || !updatedData.amount || !updatedData.date || !updatedData.category) {
            return NextResponse.json({ message: 'Bad Request: Missing required fields.' }, { status: 400 });
        }

        const expenseRef = doc(db, 'expenses', id);
        const expenseSnap = await getDoc(expenseRef);

        if (!expenseSnap.exists()) {
            return NextResponse.json({ message: 'Expense not found.' }, { status: 404 });
        }

        await updateDoc(expenseRef, { ...updatedData, last_updated: serverTimestamp() });
        
        const updatedDoc = await getDoc(expenseRef);
        const finalExpenseData = {
            id: updatedDoc.id,
            ...updatedDoc.data()
        } as Expense;

        return NextResponse.json(finalExpenseData, { status: 200 });
    } catch (error) {
        console.error(`Failed to update expense with ID ${params.id}:`, error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * @swagger
 * /api/v1/expenses/{id}:
 *   delete:
 *     summary: Delete an expense
 *     description: Removes a specific expense from the Firestore 'expenses' collection.
 *     tags:
 *       - Expenses
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the expense to delete.
 *     responses:
 *       204:
 *         description: No Content - Expense deleted successfully.
 *       404:
 *         description: Not Found - Expense with the given ID does not exist.
 *       500:
 *         description: Internal Server Error
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const expenseRef = doc(db, 'expenses', id);
        const expenseSnap = await getDoc(expenseRef);

        if (!expenseSnap.exists()) {
            return NextResponse.json({ message: 'Expense not found.' }, { status: 404 });
        }

        await deleteDoc(expenseRef);

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error(`Failed to delete expense with ID ${params.id}:`, error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

    