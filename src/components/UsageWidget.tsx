import { useShopLimits } from "@/hooks/useShopLimits";
import { Card } from "@/components/ui/card";
import { Users, Building2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export function UsageWidget({ shopId }: { shopId: string | null | undefined }) {
  const { data, loading } = useShopLimits(shopId);
  if (loading || !data) return null;

  const empPct = (data.current_employees / Math.max(1, data.max_employees)) * 100;
  const brPct = (data.current_branches / Math.max(1, data.max_branches)) * 100;

  const Bar = ({ label, current, max, pct, icon: Icon }: any) => {
    const danger = pct >= 90;
    const warn = pct >= 70 && pct < 90;
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Icon className="w-3.5 h-3.5" />
            {label}
          </span>
          <span className={cn(
            "font-bold",
            danger ? "text-red-400" : warn ? "text-yellow-400" : "text-foreground"
          )}>
            {current} / {max}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-[hsl(220_25%_12%)] overflow-hidden">
          <div
            className={cn(
              "h-full transition-all",
              danger ? "bg-red-500" : warn ? "bg-yellow-500" : "bg-primary"
            )}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <Card className="p-4 bg-[hsl(220_25%_8%)] border-[hsl(220_20%_14%)] space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">استخدام الخطة</h3>
        </div>
        <Link
          to="/pricing"
          className="text-xs font-semibold text-primary hover:underline"
        >
          ترقية ↗
        </Link>
      </div>
      <Bar
        label="الموظفون"
        current={data.current_employees}
        max={data.max_employees}
        pct={empPct}
        icon={Users}
      />
      <Bar
        label="الفروع"
        current={data.current_branches}
        max={data.max_branches}
        pct={brPct}
        icon={Building2}
      />
      <div className="text-[10px] text-muted-foreground pt-1 border-t border-[hsl(220_20%_14%)]">
        الخطة الحالية: <span className="font-bold text-foreground uppercase">{data.plan_code}</span>
      </div>
    </Card>
  );
}

export default UsageWidget;