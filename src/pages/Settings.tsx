import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">الإعدادات</h1>
      <Card>
        <CardHeader><CardTitle>معلومات البرنامج</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
              <Car className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold">لافاج</h2>
              <p className="text-muted-foreground">نظام إدارة محلات غسل السيارات</p>
              <p className="text-sm text-muted-foreground">الإصدار 1.0.0</p>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            برنامج لافاج هو نظام متكامل لإدارة محلات غسل السيارات. يتيح لك إدارة الطلبات، العملاء، الموظفين، الخدمات، الفواتير، والتقارير المالية مع دعم لأكثر من فرع.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
