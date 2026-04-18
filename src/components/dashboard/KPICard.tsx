import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { ReactNode } from "react";

interface KPICardProps {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  accent?: "primary" | "success" | "warning" | "info" | "accent";
  loading?: boolean;
}

const accentMap = {
  primary: { iconBg: "bg-primary/10", icon: "text-primary", glow: "hsl(var(--primary) / 0.30)" },
  success: { iconBg: "bg-success/10", icon: "text-success", glow: "hsl(var(--success) / 0.30)" },
  warning: { iconBg: "bg-warning/15", icon: "text-warning", glow: "hsl(var(--warning) / 0.30)" },
  info:    { iconBg: "bg-info/10",    icon: "text-info",    glow: "hsl(var(--info) / 0.30)" },
  accent:  { iconBg: "bg-accent/10",  icon: "text-accent",  glow: "hsl(var(--accent) / 0.30)" },
};

export function KPICard({ label, value, icon: Icon, trend, trendLabel, accent = "primary", loading }: KPICardProps) {
  const colors = accentMap[accent];
  const trendIsUp = trend !== undefined && trend > 0;
  const trendIsDown = trend !== undefined && trend < 0;
  const trendIsFlat = trend === 0;

  return (
    <div className="kpi-card animate-in-up">
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground mb-2">{label}</p>
          {loading ? (
            <div className="h-8 w-24 rounded-md skeleton-shimmer" />
          ) : (
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground tabular-nums">{value}</h3>
          )}
          {trend !== undefined && !loading && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold rounded-md px-1.5 py-0.5 ${
                trendIsUp ? "trend-up" : trendIsDown ? "trend-down" : "bg-muted text-muted-foreground border border-border"
              }`}>
                {trendIsUp && <ArrowUpRight className="w-3 h-3" />}
                {trendIsDown && <ArrowDownRight className="w-3 h-3" />}
                {trendIsFlat && <Minus className="w-3 h-3" />}
                {Math.abs(trend).toFixed(1)}%
              </span>
              {trendLabel && <span className="text-[11px] text-muted-foreground">{trendLabel}</span>}
            </div>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.iconBg}`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
      </div>
    </div>
  );
}
