import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  variant?: "admin" | "owner";
}

export function ChangePasswordButton({ variant = "admin" }: Props) {
  const [open, setOpen] = useState(false);
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (pwd.length < 6) {
      toast.error("كلمة السر يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    if (pwd !== confirm) {
      toast.error("كلمتا السر غير متطابقتين");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwd });
      if (error) throw error;
      toast.success("تم تحديث كلمة السر بنجاح");
      setPwd("");
      setConfirm("");
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message || "فشل تحديث كلمة السر");
    } finally {
      setLoading(false);
    }
  };

  const isOwner = variant === "owner";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={
            isOwner
              ? "h-10 rounded-xl gap-2 border-[hsl(48_95%_55%/0.4)] text-[hsl(48_95%_65%)] hover:bg-[hsl(48_95%_55%/0.1)] hover:text-[hsl(48_95%_75%)]"
              : "h-10 rounded-xl gap-2 bg-transparent border-2 border-[hsl(48_95%_55%)] text-[hsl(48_95%_65%)] hover:bg-[hsl(48_95%_55%/0.15)] hover:text-[hsl(48_95%_75%)] font-bold px-4 shadow-[0_0_20px_-6px_hsl(48_95%_55%/0.7)]"
          }
          title="تغيير كلمة السر"
        >
          <KeyRound className="w-4 h-4" />
          <span className="hidden md:inline">تغيير كلمة السر</span>
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            تغيير كلمة السر
          </DialogTitle>
          <DialogDescription>
            أدخل كلمة سر جديدة لحسابك. سيتم تحديثها فوراً.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="new-pwd">كلمة السر الجديدة</Label>
            <Input
              id="new-pwd"
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder="6 أحرف على الأقل"
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-pwd">تأكيد كلمة السر</Label>
            <Input
              id="confirm-pwd"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="أعد كتابة كلمة السر"
              autoComplete="new-password"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 ms-2 animate-spin" />}
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}