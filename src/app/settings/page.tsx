import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { QrCodeGenerator } from "@/components/settings/qr-code-generator";

export default function SettingsPage() {
  return (
    <main className="flex-1 p-4 sm:p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="font-headline text-2xl font-semibold">الإعدادات</h1>
            <Button>حفظ التغييرات</Button>
        </div>
        <Separator />

        <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-6">
                <Card>
                <CardHeader>
                    <CardTitle>الإعدادات العامة</CardTitle>
                    <CardDescription>إدارة الإعدادات الأساسية للمطعم.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                    <Label htmlFor="restaurant-name">اسم المطعم</Label>
                    <Input id="restaurant-name" defaultValue="المائدة" />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="restaurant-address">العنوان</Label>
                    <Input id="restaurant-address" defaultValue="دمشق، سوريا" />
                    </div>
                </CardContent>
                </Card>

                <Card>
                <CardHeader>
                    <CardTitle>إعدادات العملة</CardTitle>
                    <CardDescription>تحديد سعر صرف العملات.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                    <Label htmlFor="usd-rate">سعر صرف الدولار الأمريكي (مقابل الليرة السورية)</Label>
                    <Input id="usd-rate" type="number" defaultValue="15000" />
                    </div>
                </CardContent>
                </Card>

                <Card>
                <CardHeader>
                    <CardTitle>إعدادات الطابعة</CardTitle>
                    <CardDescription>إدارة إعدادات طابعة الفواتير.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                    <Label htmlFor="printer-name">اسم الطابعة</Label>
                    <Input id="printer-name" defaultValue="POS-80C" />
                    </div>
                    <Button variant="outline">اختبار الطباعة</Button>
                </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>رموز QR للطاولات</CardTitle>
                        <CardDescription>إنشاء وطباعة رموز QR لتوجيه الزبائن إلى قائمة الطعام الرقمية لكل طاولة.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <QrCodeGenerator />
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </main>
  );
}
