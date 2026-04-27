import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle } from "lucide-react";
import { useCountdown, formatCountdown } from "@/hooks/useCountdown";

interface EtaBadgeProps {
  expectedEndAt?: string | null;
  status?: string;
  compact?: boolean;
}

/**
 * Live ETA badge driven by `expected_end_at`. Hidden when:
 *  - no expected end set
 *  - order already completed/cancelled
 */
export function EtaBadge({ expectedEndAt, status, compact }: EtaBadgeProps) {
  const secs = useCountdown(expectedEndAt);
  if (!expectedEndAt) return null;
  if (status === "completed" || status === "cancelled") return null;
  if (secs === null) return null;

  const overdue = secs < 0;
  const Icon = overdue ? AlertTriangle : Clock;
  const cls = overdue
    ? "bg-destructive/10 text-destructive border-destructive/30"
    : "bg-primary/10 text-primary border-primary/30";

  return (
    <Badge variant="outline" className={`${cls} gap-1 font-mono`}>
      <Icon className="w-3 h-3" />
      {compact ? formatCountdown(secs) : `ETA ${formatCountdown(secs)}`}
    </Badge>
  );
}