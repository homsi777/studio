// src/app/api/v1/menu-items/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import type { MenuItem } from '@/types';

// Mock data, simulating a database
const menuItems: MenuItem[] = [
    { id: 'item-1', name: 'مشويات مشكلة', name_en: 'Mixed Grill', price: 85000, description: 'كباب، شيش طاووق، لحم بعجين.', category: 'main', quantity: 0, offer: 'خصم 15%', offer_en: '15% Off', image: "https://placehold.co/600x400.png", image_hint: "mixed grill" },
    { id: 'item-4', name: 'كبة مقلية', name_en: 'Fried Kibbeh', price: 25000, description: '4 قطع محشوة باللحم والجوز.', category: 'appetizer', quantity: 0, image: "https://placehold.co/600x400.png", image_hint: "fried kibbeh" },
    { id: 'item-5', name: 'فتوش', name_en: 'Fattoush', price: 20000, description: 'خضروات طازجة وخبز محمص.', category: 'appetizer', quantity: 0, image: "https://placehold.co/600x400.png", image_hint: "fattoush salad" },
    { id: 'item-6', name: 'شيش طاووق', name_en: 'Shish Tawook', price: 60000, description: 'أسياخ دجاج متبلة ومشوية.', category: 'main', quantity: 0, image: "https://placehold.co/600x400.png", image_hint: "shish tawook" },
    { id: 'item-7', name: 'بيبسي', name_en: 'Pepsi', price: 8000, description: 'مشروب غازي منعش.', category: 'drink', quantity: 0, image: "https://placehold.co/600x400.png", image_hint: "pepsi can" },
    { id: 'item-8', name: 'عصير برتقال', name_en: 'Orange Juice', price: 18000, description: 'طبيعي معصور عند الطلب.', category: 'drink', quantity: 0, offer: 'عرض خاص', offer_en: 'Special Offer', image: "https://placehold.co/600x400.png", image_hint: "orange juice" },
    { id: 'item-9', name: 'كنافة بالجبن', name_en: 'Cheese Kunafa', price: 35000, description: 'طبقة كنافة ناعمة مع جبنة.', category: 'dessert', quantity: 0, image: "https://placehold.co/600x400.png", image_hint: "cheese kunafa" },
    { id: 'item-10', name: 'سلطة سيزر', name_en: 'Caesar Salad', price: 30000, description: 'خس، دجاج مشوي، وصلصة السيزر.', category: 'appetizer', quantity: 0, image: "https://placehold.co/600x400.png", image_hint: "caesar salad" },
    { id: 'item-11', name: 'بطاطا مقلية', name_en: 'French Fries', price: 15000, description: 'بطاطا مقرمشة وذهبية.', category: 'appetizer', quantity: 0, image: "https://placehold.co/600x400.png", image_hint: "french fries" },
    { id: 'item-12', name: 'ماء', name_en: 'Water', price: 5000, description: 'ماء معدني.', category: 'drink', quantity: 0, image: "https://placehold.co/600x400.png", image_hint: "water bottle" },
    { id: 'item-13', name: 'كريم كراميل', name_en: 'Creme Caramel', price: 22000, description: 'حلوى الكريم كراميل الكلاسيكية.', category: 'dessert', quantity: 0, image: "https://placehold.co/600x400.png", image_hint: "creme caramel" },
];


/**
 * @swagger
 * /api/v1/menu-items:
 *   get:
 *     summary: Retrieve a list of menu items
 *     description: Fetches all available menu items from the restaurant's menu.
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
 */
export async function GET(request: NextRequest) {
  try {
    // In a real application, you would fetch this data from a database.
    // For now, we return the mock data.
    return NextResponse.json(menuItems);
  } catch (error) {
    console.error('Failed to fetch menu items:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
