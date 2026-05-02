import { useImpersonation } from "@/contexts/ImpersonationContext";
import { Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ImpersonationBanner() {
  const { isActive, shopName, stop } = useImpersonation();
  if (!isActive) return null;
  return (
    <div className="sticky top-0 z-[60] bg-gradient-to-r from-purple-600/90 to-fuchsia-600/90 backdrop-blur border-b border-purple-400/40 text-white px-4 py-2 flex items-center justify-between gap-3" dir="rtl">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Eye className="w-4 h-4" />
        وضع المشاهدة (للقراءة فقط) — المتجر: <span className="font-bold">{shopName}</span>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={stop}
        className="h-7 gap-1 bg-white/10 border-white/40 text-white hover:bg-white/20"
      >
        <X className="w-3 h-3" /> إنهاء
      </Button>
    </div>
  );
}