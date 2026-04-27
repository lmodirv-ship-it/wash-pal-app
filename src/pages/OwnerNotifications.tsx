import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export default function OwnerNotifications() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [scope, setScope] = useState("all");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("الرجاء إدخال العنوان والرسالة");
      return;
    }
    if (!confirm(`سيتم إرسال هذا الإعلان لـ ${scope === "all" ? "كل" : scope} المستخدمين. متابعة؟`)) return;
    setSending(true);
    const { data, error } = await supabase.rpc("owner_broadcast", {
      _title: title,
      _message: message,
      _scope: scope,
    });
    setSending(false);
    if (error) {
      toast.error("فشل الإرسال: " + error.message);
      return;
    }
    toast.success(`تم الإرسال إلى ${data} مستخدم`);
    setTitle("");
    setMessage("");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Megaphone className="w-7 h-7 text-cyan-400" />
          الإشعارات والإعلانات
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          إرسال إعلان in-app لكل المستخدمين أو فئة محددة. (البريد قادم لاحقاً)
        </p>
      </div>

      <div className="rounded-2xl border border-[hsl(220_20%_16%)] bg-[hsl(220_25%_7%)] p-6 space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">العنوان</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: صيانة مجدولة الليلة"
            maxLength={120}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">الرسالة</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="نص الإعلان الكامل..."
            rows={5}
            maxLength={1000}
          />
          <div className="text-xs text-muted-foreground mt-1 text-left">{message.length}/1000</div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">المستهدفون</label>
          <Select value={scope} onValueChange={setScope}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المستخدمين</SelectItem>
              <SelectItem value="admins">المدراء وأصحاب المتاجر فقط</SelectItem>
              <SelectItem value="owners">المالكون فقط</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={send} disabled={sending} className="w-full gap-2 h-11">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          إرسال الإعلان
        </Button>
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
        <h3 className="font-semibold text-amber-400 mb-2">الميزات القادمة</h3>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>إرسال عبر البريد (يحتاج إعداد Lovable Emails)</li>
          <li>قوالب رسائل قابلة لإعادة الاستخدام</li>
          <li>تتبع التسليم والقراءة</li>
        </ul>
      </div>
    </div>
  );
}
