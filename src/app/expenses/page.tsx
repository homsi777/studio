// src/app/expenses/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'; // افتراض استخدام i18next للترجمة
import { toast } from 'sonner'; // افتراض استخدام sonner لإشعارات الـ toast
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Expense } from '../../types'; // تأكد من المسار الصحيح
import { getFromCache, putToCache, addToSyncQueue, saveToCache } from '../../lib/indexeddb'; // استيراد دوال IndexedDB

// افتراض وجود مكون DatePicker إذا كنت تستخدمه
// import { DatePicker } from '@/components/ui/date-picker';

export default function ExpensesPage() {
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0], // تنسيق YYYY-MM-DD
    category: 'other', // فئة افتراضية
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // الفئات المتاحة للمصاريف (يجب أن تتطابق مع قيود Supabase)
  const expenseCategories = ['rent', 'bills', 'salaries', 'supplies', 'maintenance', 'other'];

  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      // حاول الجلب من الكاش أولاً
      const cachedExpenses = await getFromCache<Expense>('expenses');
      if (cachedExpenses.length > 0) {
        setExpenses(cachedExpenses);
      }

      // ثم حاول الجلب من API
      const response = await fetch('/api/v1/expenses');
      if (!response.ok) {
        throw new Error('Failed to fetch expenses from server.');
      }
      const data = await response.json();
      setExpenses(data.expenses);
      await saveToCache('expenses', data.expenses); // <--- تم التعديل هنا: استخدام saveToCache
    } catch (err: any) {
      console.error('Error fetching expenses:', err);
      setError(err.message || 'فشل جلب المصاريف.');
      // إذا فشل الجلب من API، استخدم البيانات من الكاش إذا كانت موجودة
      const cachedExpenses = await getFromCache<Expense>('expenses');
      setExpenses(cachedExpenses);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSave = async () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.date || !newExpense.category) {
      toast.error(t("الرجاء ملء جميع الحقول المطلوبة", "Please fill all required fields."));
      return;
    }
    if (newExpense.amount <= 0) {
      toast.error(t("المبلغ يجب أن يكون أكبر من صفر", "Amount must be greater than zero."));
      return;
    }

    setLoading(true);
    setError(null);

    // الكائن الذي سيتم إرساله إلى الـ API
    const apiPayload: Partial<Expense> = {
      id: crypto.randomUUID(), // توليد UUID جديد
      description: newExpense.description,
      description_en: newExpense.description_en,
      amount: newExpense.amount,
      date: newExpense.date,
      category: newExpense.category,
      payment_method: newExpense.payment_method,
      supplier: newExpense.supplier,
      invoice_number: newExpense.invoice_number,
      notes: newExpense.notes,
      user_id: newExpense.user_id,
      // لا نرسل created_at و last_updated إلى الـ API لأن قاعدة البيانات تتعامل معهما
    };

    // الكائن الكامل الذي سيتم حفظه في IndexedDB محلياً
    const localExpense: Expense = {
      ...apiPayload as Expense, // استخدام apiPayload كأساس
      created_at: new Date().toISOString(), // تعيين هنا لـ IndexedDB
      last_updated: new Date().toISOString(), // تعيين هنا لـ IndexedDB
      // التأكد من أن الحقول غير القابلة للـ null في Expense موجودة
      description: apiPayload.description || '',
      amount: apiPayload.amount || 0,
      date: apiPayload.date || new Date().toISOString().split('T')[0],
      category: apiPayload.category || 'other',
    };


    try {
      // 1. حفظ في IndexedDB فورياً
      await putToCache('expenses', localExpense);
      setExpenses(prev => [...prev, localExpense]); // تحديث الواجهة فوراً

      // 2. إضافة العملية إلى قائمة انتظار المزامنة
      await addToSyncQueue('addExpense', apiPayload); // إضافة الـ payload الخاص بالـ API

      // 3. محاولة الإرسال إلى API (سيتم معالجتها بواسطة syncPendingOperations لاحقاً)
      // ولكن يمكننا محاولة الإرسال مباشرة هنا أيضاً لتحسين الاستجابة الفورية
      console.log('Data being sent:', apiPayload); // <--- إضافة Logging هنا
      const response = await fetch('/api/v1/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload), // <--- استخدام apiPayload هنا
      });

      console.log('Response status:', response.status); // <--- إضافة Logging هنا
      if (!response.ok) {
        const errorData = await response.text(); // <--- استخدام .text() لجلب تفاصيل الخطأ الخام
        console.log('Error details from server:', errorData); // <--- إضافة Logging هنا
        throw new Error('Failed to save expense');
      }

      toast.success(t("تم الحفظ بنجاح", "Expense Saved"));
      setNewExpense({
        description: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        category: 'other',
      });
      await fetchExpenses(); // إعادة جلب المصاريف لتحديث القائمة من Supabase بعد المزامنة

    } catch (err: any) {
      console.error('Failed to save expense:', err);
      toast.error(t("فشل حفظ المصروف: ", "Failed to save expense: ") + (err.message || "خطأ غير معروف"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">{t("إدارة المصاريف", "Expense Management")}</h1>

      {/* نموذج إضافة مصروف جديد */}
      <section className="mb-12 bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">{t("إضافة مصروف جديد", "Add New Expense")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label htmlFor="description" className="mb-2 block">{t("الوصف", "Description")}</Label>
            <Input
              id="description"
              value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              placeholder={t("وصف المصروف", "Expense description")}
            />
          </div>
          <div>
            <Label htmlFor="amount" className="mb-2 block">{t("المبلغ", "Amount")}</Label>
            <Input
              id="amount"
              type="number"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })}
              placeholder={t("المبلغ", "Amount")}
            />
          </div>
          <div>
            <Label htmlFor="date" className="mb-2 block">{t("التاريخ", "Date")}</Label>
            <Input
              id="date"
              type="date"
              value={newExpense.date}
              onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
            />
            {/* أو استخدام DatePicker إذا كان متاحاً */}
            {/* <DatePicker value={newExpense.date} onChange={(date) => setNewExpense({ ...newExpense, date: date.toISOString().split('T')[0] })} /> */}
          </div>
          <div>
            <Label htmlFor="category" className="mb-2 block">{t("الفئة", "Category")}</Label>
            <Select value={newExpense.category} onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder={t("اختر فئة", "Select a category")} />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map(category => (
                  <SelectItem key={category} value={category}>{t(category, category)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="notes" className="mb-2 block">{t("ملاحظات (اختياري)", "Notes (Optional)")}</Label>
            <Textarea
              id="notes"
              value={newExpense.notes || ''}
              onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
              placeholder={t("ملاحظات إضافية", "Additional notes")}
            />
          </div>
        </div>
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white w-full">
          {t("حفظ المصروف", "Save Expense")}
        </Button>
      </section>

      {/* قائمة المصاريف الحالية */}
      <section className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">{t("المصاريف الحالية", "Current Expenses")}</h2>
        {loading && <div className="text-center">{t("جاري تحميل المصاريف...", "Loading expenses...")}</div>}
        {error && <div className="text-center text-red-600">{t("خطأ: ", "Error: ") + error}</div>}
        {!loading && expenses.length === 0 && (
          <div className="text-center text-gray-500">{t("لا توجد مصاريف لعرضها.", "No expenses to display.")}</div>
        )}
        <div className="space-y-4">
          {expenses.map((expense) => (
            <div key={expense.id} className="border p-4 rounded-md flex justify-between items-center">
              <div>
                <p className="font-semibold">{expense.description}</p>
                <p className="text-sm text-gray-600">{t("المبلغ", "Amount")}: {expense.amount} {t("ريال", "SAR")}</p>
                <p className="text-sm text-gray-600">{t("التاريخ", "Date")}: {expense.date}</p>
                <p className="text-sm text-gray-600">{t("الفئة", "Category")}: {t(expense.category, expense.category)}</p>
              </div>
              {/* يمكن إضافة أزرار التعديل والحذف هنا لاحقاً */}
              {/* <div>
                <Button size="sm" variant="outline" className="mr-2">تعديل</Button>
                <Button size="sm" variant="destructive">حذف</Button>
              </div> */}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
