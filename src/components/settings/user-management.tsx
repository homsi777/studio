
"use client";

import React, { useState, useEffect } from 'react';
import { type User, type UserRole } from '@/types';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MoreHorizontal, FilePenLine, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

const roleMap: Record<UserRole, { ar: string, en: string, className: string }> = {
    manager: { ar: 'مدير', en: 'Manager', className: 'bg-primary/20 text-primary-foreground' },
    employee: { ar: 'موظف', en: 'Employee', className: 'bg-secondary text-secondary-foreground' },
};


export function UserManagement() {
    const { language, dir } = useLanguage();
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;
    const { toast } = useToast();

    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setFormOpen] = useState(false);
    const [isConfirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/v1/users');
            if (!response.ok) throw new Error('Failed to fetch users');
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: t("خطأ في جلب البيانات", "Fetch Error"),
                description: t("لم نتمكن من جلب قائمة المستخدمين.", "Could not fetch the user list."),
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [t, toast]);


    const openAddDialog = () => {
        setEditingUser(null);
        setFormOpen(true);
    };

    const openEditDialog = (user: User) => {
        setEditingUser(user);
        setFormOpen(true);
    };

    const openDeleteDialog = (user: User) => {
        setUserToDelete(user);
        setConfirmDeleteOpen(true);
    };

    const handleSaveUser = async (formData: Omit<User, 'id'>) => {
        if (editingUser) {
            // TODO: Implement user update (PUT request to /api/v1/users/[id])
            await fetchUsers(); // Refetch to get updated data
            toast({ title: t('تم التحديث بنجاح', 'Update Successful'), description: t(`تم تحديث بيانات المستخدم ${formData.username}.`, `User ${formData.username} has been updated.`) });
        } else {
            try {
                const response = await fetch('/api/v1/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });
                if (response.status === 409) {
                     toast({ variant: "destructive", title: t("خطأ", "Error"), description: t("اسم المستخدم موجود بالفعل.", "Username already exists.") });
                     return;
                }
                if (!response.ok) throw new Error('Failed to save user');
                
                await fetchUsers(); // Refetch to get the new user with its ID
                toast({ title: t('تمت الإضافة بنجاح', 'Added Successfully'), description: t(`تمت إضافة المستخدم الجديد ${formData.username}.`, `New user ${formData.username} has been added.`) });

            } catch (error) {
                 console.error(error);
                 toast({
                    variant: "destructive",
                    title: t("خطأ في الحفظ", "Save Error"),
                    description: t("لم نتمكن من حفظ المستخدم الجديد.", "Could not save the new user."),
                });
            }
        }
        setFormOpen(false);
    };
    
    const handleDeleteUser = async () => {
        if (userToDelete) {
             // TODO: Implement user deletion (DELETE request to /api/v1/users/[id])
            await fetchUsers();
            toast({ title: t('تم الحذف', 'Deleted'), description: t(`تم حذف المستخدم ${userToDelete.username}.`, `User ${userToDelete.username} has been deleted.`), variant: 'destructive' });
        }
        setConfirmDeleteOpen(false);
        setUserToDelete(null);
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>{t('إدارة المستخدمين', 'User Management')}</CardTitle>
                    <CardDescription>{t('إضافة وتعديل وحذف حسابات المستخدمين.', 'Add, edit, and delete user accounts.')}</CardDescription>
                </div>
                <Button onClick={openAddDialog}>
                    <PlusCircle className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                    {t('إضافة مستخدم', 'Add User')}
                </Button>
            </CardHeader>
            <CardContent>
                 {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                 ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('اسم المستخدم', 'Username')}</TableHead>
                                    <TableHead>{t('الدور', 'Role')}</TableHead>
                                    <TableHead><span className="sr-only">{t('الإجراءات', 'Actions')}</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.username}</TableCell>
                                        <TableCell>
                                            <Badge className={roleMap[user.role].className}>{roleMap[user.role][language]}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">{t('فتح القائمة', 'Open menu')}</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align={language === 'ar' ? 'start' : 'end'}>
                                                    <DropdownMenuItem onClick={() => openEditDialog(user)} disabled>
                                                        <FilePenLine className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                                                        {t('تعديل (قريباً)', 'Edit (soon)')}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openDeleteDialog(user)} className="text-red-500 focus:text-red-500" disabled>
                                                        <Trash2 className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                                                        {t('حذف (قريباً)', 'Delete (soon)')}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>

            <UserFormDialog
                key={editingUser?.id || 'new'}
                isOpen={isFormOpen}
                onOpenChange={setFormOpen}
                user={editingUser}
                onSave={handleSaveUser}
            />

            <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setConfirmDeleteOpen} dir={dir}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('هل أنت متأكد تماماً؟', 'Are you absolutely sure?')}</AlertDialogTitle>
                        <AlertDialogDescription>
                           {t('هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف المستخدم بشكل دائم', 'This action cannot be undone. This will permanently delete the user')} "{userToDelete?.username}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('إلغاء', 'Cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">
                            {t('نعم، قم بالحذف', 'Yes, delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}

// --- UserFormDialog Component ---

interface UserFormDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    user: User | null;
    onSave: (formData: Omit<User, 'id'>) => void;
}

function UserFormDialog({ isOpen, onOpenChange, user, onSave }: UserFormDialogProps) {
    const { language, dir } = useLanguage();
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>('employee');
    const [showPassword, setShowPassword] = useState(false);

    React.useEffect(() => {
        if (isOpen && user) {
            setUsername(user.username);
            setRole(user.role);
            setPassword(''); // Clear password field when editing
        } else if (isOpen && !user) {
            setUsername('');
            setPassword('');
            setRole('employee');
        }
    }, [isOpen, user]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ username, role, password });
    };

    return (
         <Dialog open={isOpen} onOpenChange={onOpenChange} dir={dir}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="font-headline">{user ? t('تعديل مستخدم', 'Edit User') : t('إضافة مستخدم جديد', 'Add New User')}</DialogTitle>
                        <DialogDescription>
                            {t('املأ التفاصيل أدناه لإنشاء أو تحديث حساب مستخدم.', 'Fill in the details below to create or update a user account.')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">{t('اسم المستخدم', 'Username')}</Label>
                            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">{t('كلمة المرور', 'Password')}</Label>
                            <div className="relative">
                                <Input 
                                    id="password" 
                                    type={showPassword ? 'text' : 'password'}
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    required={!user} // Password is required only for new users
                                    placeholder={user ? t('اتركه فارغاً لعدم التغيير', 'Leave blank to keep unchanged') : ''}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-1/2 -translate-y-1/2 h-7 w-7 ltr:right-1 rtl:left-1"
                                    onClick={() => setShowPassword(p => !p)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">{t('الدور', 'Role')}</Label>
                            <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('اختر دوراً', 'Select a role')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="employee">{t('موظف', 'Employee')}</SelectItem>
                                    <SelectItem value="manager">{t('مدير', 'Manager')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>{t('إلغاء', 'Cancel')}</Button>
                        <Button type="submit">{t('حفظ', 'Save')}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
