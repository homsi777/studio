// src/app/api/v1/expenses/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Expense } from '@/types';

/**
 * @swagger
 * /api/v1/expenses:
 *   get:
 *     summary: Retrieve a list of expenses from Firestore
 *     description: Fetches all available expenses from the Firestore 'expenses' collection.
 *     tags:
 *       - Expenses
 *     responses:
 *       200:
 *         description: A list of expenses.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Expense'
 *       500:
 *         description: Internal Server Error
 */
export async function GET(request: NextRequest) {
  try {
    const expensesCol = collection(db, 'expenses');
    const expensesSnapshot = await getDocs(expensesCol);
    const expensesList = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
    
    // Sort by date descending by default
    expensesList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(expensesList);
  } catch (error) {
    console.error('Failed to fetch expenses from Firestore:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/v1/expenses:
 *   post:
 *     summary: Create a new expense
 *     description: Adds a new expense to the Firestore 'expenses' collection.
 *     tags:
 *       - Expenses
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Expense'
 *     responses:
 *       201:
 *         description: The created expense.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Expense'
 *       400:
 *         description: Bad Request - Missing required fields
 *       500:
 *         description: Internal Server Error
 */
export async function POST(request: NextRequest) {
  try {
    const newExpenseData = await request.json() as Omit<Expense, 'id'>;

    // Basic validation
    if (!newExpenseData.description || !newExpenseData.amount || !newExpenseData.date || !newExpenseData.category) {
      return NextResponse.json({ message: 'Bad Request: Missing required fields.' }, { status: 400 });
    }

    const expensesCol = collection(db, 'expenses');
    const docRef = await addDoc(expensesCol, newExpenseData);

    const createdExpense: Expense = {
      id: docRef.id,
      ...newExpenseData
    };
    
    return NextResponse.json(createdExpense, { status: 201 });
  } catch (error) {
    console.error('Failed to create expense in Firestore:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
