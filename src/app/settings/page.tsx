// src/app/settings/page.tsx

"use client"; // تأكد من أن هذا المكون هو Client Component

import { useState, useEffect, useRef } from 'react';
import { useSettingsCommand } from '../../hooks/use-settings-command';
import { Table, UserProfile, TableStatus, UserRole } from '../../types';
import { QRCodeCanvas } from 'qrcode.react'; // <--- تم التعديل هنا: استخدام { QRCodeCanvas }
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'; // افتراض استخدام shadcn/ui Dialog
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner'; // افتراض استخدام sonner لإشعارات الـ toast
// تم حذف: import { NextResponse } from 'next/server'; // <--- تم حذف هذا السطر

// مكونات صغيرة (يمكن وضعها في ملفات منفصلة مثل components/TableCard.tsx)
const TableCard = ({ table, onEdit, onDelete, onGenerateQR }: { table: Table; onEdit: (table: Table) => void; onDelete: (uuid: string) => void; onGenerateQR: (uuid: string) => void; }) => (
  <div className="bg-white p-4 rounded-lg shadow-md flex flex-col justify-between items-center text-center">
    <h3 className="text-lg font-semibold mb-2">الطاولة {table.display_number}</h3>
    <p className="text-sm text-gray-600">السعة: {table.capacity}</p>
    <p className={`text-sm font-medium ${table.is_active ? 'text-green-600' : 'text-red-600'}`}>
      الحالة: {table.is_active ? 'نشطة' : 'معطلة'}
    </p>
    <div className="mt-4 flex flex-wrap justify-center gap-2">
      <Button size="sm" onClick={() => onEdit(table)} className="bg-blue-500 hover:bg-blue-600 text-white">تعديل</Button>
      <Button size="sm" onClick={() => onDelete(table.uuid)} className="bg-red-500 hover:bg-red-600 text-white">تعطيل</Button>
      <Button size="sm" onClick={() => onGenerateQR(table.uuid)} className="bg-purple-500 hover:bg-purple-600 text-white">QR</Button>
    </div>
  </div>
);

const UserProfileCard = ({ user, onEdit, onDelete }: { user: UserProfile; onEdit: (user: UserProfile) => void; onDelete: (userId: string) => void; }) => (
  <div className="bg-white p-4 rounded-lg shadow-md flex flex-col justify-between items-center text-center">
    <h3 className="text-lg font-semibold mb-2">{user.full_name}</h3>
    <p className="text-sm text-gray-600">الدور: {user.role}</p>
    <p className={`text-sm font-medium ${user.is_active ? 'text-green-600' : 'text-red-600'}`}>
      الحالة: {user.is_active ? 'نشط' : 'معطل'}
    </p>
    <div className="mt-4 flex flex-wrap justify-center gap-2">
      <Button size="sm" onClick={() => onEdit(user)} className="bg-blue-500 hover:bg-blue-600 text-white">تعديل</Button>
      <Button size="sm" onClick={() => onDelete(user.user_id)} className="bg-red-500 hover:bg-red-600 text-white">تعطيل</Button>
    </div>
  </div>
);

export default function SettingsPage() {
  const {
    tables,
    userProfiles,
    loading,
    error,
    fetchTablesFromCache,
    fetchUsersFromCache,
    addTable,
    updateTable,
    deactivateTable,
    addUserProfile,
    updateUserProfile,
    deactivateUserProfile,
    generateTableQRUrl,
  } = useSettingsCommand();

  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
  const [isEditTableModalOpen, setIsEditTableModalOpen] = useState(false);
  const [currentTable, setCurrentTable] = useState<Partial<Table> | null>(null);
  const [newTableData, setNewTableData] = useState({ display_number: '', capacity: 0 });

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<Partial<UserProfile> | null>(null);
  const [newUserProfileData, setNewUserProfileData] = useState<Partial<UserProfile>>({ full_name: '', role: UserRole.WAITER, phone_number: '' });

  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrTableUrl, setQrTableUrl] = useState('');
  const qrCodeRef = useRef<HTMLDivElement>(null); // Ref for QR code component

  useEffect(() => {
    fetchTablesFromCache();
    fetchUsersFromCache();
  }, [fetchTablesFromCache, fetchUsersFromCache]);

  // --- Table Management Handlers ---
  const handleAddTable = async () => {
    if (!newTableData.display_number || newTableData.capacity <= 0) {
      toast.error('الرجاء إدخال رقم الطاولة والسعة بشكل صحيح.');
      return;
    }
    try {
      await addTable(newTableData);
      toast.success('تمت إضافة الطاولة بنجاح!');
      setIsAddTableModalOpen(false);
      setNewTableData({ display_number: '', capacity: 0 });
    } catch (err: any) {
      toast.error(`فشل إضافة الطاولة: ${err.message || 'خطأ غير معروف'}`);
    }
  };

  const handleEditTable = (table: Table) => {
    setCurrentTable(table);
    setNewTableData({ display_number: table.display_number || '', capacity: table.capacity || 0 });
    setIsEditTableModalOpen(true);
  };

  const handleUpdateTable = async () => {
    if (!currentTable?.uuid || !newTableData.display_number || newTableData.capacity <= 0) {
      toast.error('الرجاء إدخال رقم الطاولة والسعة بشكل صحيح.');
      return;
    }
    try {
      await updateTable(currentTable.uuid, {
        display_number: newTableData.display_number,
        capacity: newTableData.capacity,
      });
      toast.success('تم تحديث الطاولة بنجاح!');
      setIsEditTableModalOpen(false);
      setCurrentTable(null);
    } catch (err: any) {
      toast.error(`فشل تحديث الطاولة: ${err.message || 'خطأ غير معروف'}`);
    }
  };

  const handleDeleteTable = async (uuid: string) => {
    if (window.confirm('هل أنت متأكد من تعطيل هذه الطاولة؟ لن يتم حذفها ولكن ستصبح غير نشطة.')) {
      try {
        await deactivateTable(uuid);
        toast.success('تم تعطيل الطاولة بنجاح!');
      } catch (err: any) {
        toast.error(`فشل تعطيل الطاولة: ${err.message || 'خطأ غير معروف'}`);
      }
    }
  };

  const handleGenerateQR = (uuid: string) => {
    const url = generateTableQRUrl(uuid);
    setQrTableUrl(url);
    setIsQRModalOpen(true);
  };

  const handleDownloadQR = () => {
    if (qrCodeRef.current) {
      const canvas = qrCodeRef.current.querySelector('canvas');
      if (canvas) {
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `table_qr_${currentTable?.display_number || 'unknown'}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    }
  };

  const handlePrintQR = () => {
    if (qrCodeRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Print QR Code</title></head><body>');
        printWindow.document.write('<style>@media print { body { margin: 0; } canvas { width: 100%; height: auto; display: block; } }</style>');
        printWindow.document.write(qrCodeRef.current.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  // --- User Management Handlers ---
  const handleAddUser = async () => {
    if (!newUserProfileData.full_name || !newUserProfileData.role) {
      toast.error('الرجاء إدخال الاسم الكامل والدور للمستخدم.');
      return;
    }
    try {
      await addUserProfile(newUserProfileData);
      toast.success('تمت إضافة المستخدم بنجاح!');
      setIsAddUserModalOpen(false);
      setNewUserProfileData({ full_name: '', role: UserRole.WAITER, phone_number: '' });
    } catch (err: any) {
      toast.error(`فشل إضافة المستخدم: ${err.message || 'خطأ غير معروف'}`);
    }
  };

  const handleEditUser = (user: UserProfile) => {
    setCurrentUserProfile(user);
    setNewUserProfileData({
      full_name: user.full_name,
      role: user.role,
      phone_number: user.phone_number || '',
      is_active: user.is_active ?? true,
    });
    setIsEditUserModalOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!currentUserProfile?.user_id || !newUserProfileData.full_name || !newUserProfileData.role) {
      toast.error('الرجاء إدخال الاسم الكامل والدور للمستخدم.');
      return;
    }
    try {
      await updateUserProfile(currentUserProfile.user_id, newUserProfileData);
      toast.success('تم تحديث المستخدم بنجاح!');
      setIsEditUserModalOpen(false);
      setCurrentUserProfile(null);
    } catch (err: any) {
      toast.error(`فشل تحديث المستخدم: ${err.message || 'خطأ غير معروف'}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('هل أنت متأكد من تعطيل هذا المستخدم؟ لن يتم حذفه ولكن سيصبح غير نشط.')) {
      try {
        await deactivateUserProfile(userId);
        toast.success('تم تعطيل المستخدم بنجاح!');
      } catch (err: any) {
        toast.error(`فشل تعطيل المستخدم: ${err.message || 'خطأ غير معروف'}`);
      }
    }
  };

  if (loading) return <div className="text-center p-8">جاري التحميل...</div>;
  if (error) return <div className="text-center p-8 text-red-600">خطأ: {error}</div>;

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">مركز القيادة: الإعدادات</h1>

      {/* Table Management Section */}
      <section className="mb-12 bg-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-700">إدارة الطاولات</h2>
          <Button onClick={() => setIsAddTableModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white">
            إضافة طاولة جديدة
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {tables.filter(t => t.is_active).map(table => (
            <TableCard key={table.uuid} table={table} onEdit={handleEditTable} onDelete={handleDeleteTable} onGenerateQR={handleGenerateQR} />
          ))}
        </div>
      </section>

      {/* User Management Section */}
      <section className="mb-12 bg-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-700">إدارة المستخدمين</h2>
          <Button onClick={() => setIsAddUserModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white">
            إضافة مستخدم جديد
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {userProfiles.filter(u => u.is_active).map(user => (
            <UserProfileCard key={user.user_id} user={user} onEdit={handleEditUser} onDelete={handleDeleteUser} />
          ))}
        </div>
      </section>

      {/* Add/Edit Table Modal */}
      <Dialog open={isAddTableModalOpen || isEditTableModalOpen} onOpenChange={isAddTableModalOpen ? setIsAddTableModalOpen : setIsEditTableModalOpen}>
        <DialogContent className="sm:max-w-[425px] p-6 bg-white rounded-lg shadow-xl">
          <DialogHeader>
            <DialogTitle>{isEditTableModalOpen ? 'تعديل الطاولة' : 'إضافة طاولة جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="display_number" className="text-right">رقم الطاولة</Label>
              <Input
                id="display_number"
                value={newTableData.display_number}
                onChange={(e) => setNewTableData({ ...newTableData, display_number: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="capacity" className="text-right">السعة</Label>
              <Input
                id="capacity"
                type="number"
                value={newTableData.capacity}
                onChange={(e) => setNewTableData({ ...newTableData, capacity: parseInt(e.target.value) || 0 })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={isEditTableModalOpen ? handleUpdateTable : handleAddTable} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isEditTableModalOpen ? 'تحديث' : 'إضافة'}
            </Button>
            <Button variant="outline" onClick={() => {
              isAddTableModalOpen ? setIsAddTableModalOpen(false) : setIsEditTableModalOpen(false);
              setCurrentTable(null);
              setNewTableData({ display_number: '', capacity: 0 });
            }}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit User Modal */}
      <Dialog open={isAddUserModalOpen || isEditUserModalOpen} onOpenChange={isAddUserModalOpen ? setIsAddUserModalOpen : setIsEditUserModalOpen}>
        <DialogContent className="sm:max-w-[425px] p-6 bg-white rounded-lg shadow-xl">
          <DialogHeader>
            <DialogTitle>{isEditUserModalOpen ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="full_name" className="text-right">الاسم الكامل</Label>
              <Input
                id="full_name"
                value={newUserProfileData.full_name || ''}
                onChange={(e) => setNewUserProfileData({ ...newUserProfileData, full_name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone_number" className="text-right">رقم الهاتف</Label>
              <Input
                id="phone_number"
                value={newUserProfileData.phone_number || ''}
                onChange={(e) => setNewUserProfileData({ ...newUserProfileData, phone_number: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">الدور</Label>
              <Select value={newUserProfileData.role} onValueChange={(value: UserRole) => setNewUserProfileData({ ...newUserProfileData, role: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="اختر دوراً" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(UserRole).map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={isEditUserModalOpen ? handleUpdateUser : handleAddUser} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isEditUserModalOpen ? 'تحديث' : 'إضافة'}
            </Button>
            <Button variant="outline" onClick={() => {
              isAddUserModalOpen ? setIsAddUserModalOpen(false) : setIsEditUserModalOpen(false);
              setCurrentUserProfile(null);
              setNewUserProfileData({ full_name: '', role: UserRole.WAITER, phone_number: '' });
            }}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Display Modal */}
      <Dialog open={isQRModalOpen} onOpenChange={setIsQRModalOpen}>
        <DialogContent className="sm:max-w-[425px] p-6 bg-white rounded-lg shadow-xl text-center">
          <DialogHeader>
            <DialogTitle>رمز QR للطاولة {currentTable?.display_number}</DialogTitle>
          </DialogHeader>
          <div className="py-4 flex justify-center" ref={qrCodeRef}>
            {qrTableUrl && <QRCodeCanvas value={qrTableUrl} size={256} level="H" includeMargin={true} />} {/* <--- تم التعديل هنا: استخدام QRCodeCanvas */}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleDownloadQR} className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto">تحميل QR</Button>
            <Button onClick={handlePrintQR} className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto">طباعة QR</Button>
            <Button variant="outline" onClick={() => setIsQRModalOpen(false)} className="w-full sm:w-auto">إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
