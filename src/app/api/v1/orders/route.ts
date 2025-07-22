
// src/app/api/v1/orders/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, serverTimestamp, getDocs, query as firestoreQuery, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order } from '@/types';

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: Create a new order
 *     description: Creates a new order with a 'pending_chef_approval' status.
 *     tags:
 *       - Orders
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               table_uuid:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/OrderItem'
 *               session_id:
 *                  type: string
 *     responses:
 *       201:
 *         description: The created order.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Bad Request - Missing required fields
 *       500:
 *         description: Internal Server Error
 */
export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json();

    // Basic validation
    if (!orderData.tableUuid || !orderData.items || !orderData.items.length || !orderData.sessionId) {
      return NextResponse.json({ message: 'Bad Request: Missing required fields.' }, { status: 400 });
    }

    const newOrder = {
      ...orderData,
      status: 'pending_chef_approval',
      created_at: serverTimestamp(), // Use server-side timestamp for accuracy
    };

    const ordersCol = collection(db, 'orders');
    const docRef = await addDoc(ordersCol, newOrder);

    const createdOrder: Order = {
      id: docRef.id,
      ...newOrder,
      timestamp: Date.now(), // Approximate client-side timestamp for immediate use
    };
    
    // Note: serverTimestamp() returns a sentinel. The actual date will be on the server.
    // For the response, we might send back an approximation or fetch the doc again.
    // For now, this is sufficient.

    return NextResponse.json(createdOrder, { status: 201 });
  } catch (error) {
    console.error('Failed to create order in Firestore:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: Retrieve a list of orders
 *     description: Fetches all orders from the Firestore 'orders' collection. Can be filtered by status.
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter orders by status
 *     responses:
 *       200:
 *         description: A list of orders.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       500:
 *         description: Internal Server Error
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const ordersCol = collection(db, 'orders');
        const q = status ? firestoreQuery(ordersCol, where("status", "==", status)) : ordersCol;
        
        const querySnapshot = await getDocs(q);
        const ordersList = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Make sure to handle Firestore Timestamps
                created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : new Date().toISOString(),
            } as Order
        });

        return NextResponse.json(ordersList);
    } catch (error) {
        console.error('Failed to fetch orders:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
