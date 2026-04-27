import { Bell, Check, Trash2, X } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { items, unreadCount, markAsRead, markAllAsRead, remove } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-xl hover:bg-[hsl(220_25%_12%)]"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -end-1 h-5 min-w-[20px] rounded-full px-1 text-[10px] font-bold"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[360px] p-0 bg-[#060612] border-[hsl(220_20%_16%)]"
      >
        <div className="flex items-center justify-between p-3 border-b border-[hsl(220_20%_16%)]">
          <h3 className="font-bold text-foreground">الإشعارات</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-7 gap-1"
            >
              <Check className="w-3 h-3" />
              تعليم الكل كمقروء
            </Button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              لا توجد إشعارات بعد
            </div>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-3 p-3 border-b border-[hsl(220_20%_14%)] hover:bg-[hsl(220_25%_8%)] transition-colors",
                  !n.read && "bg-primary/5"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {n.title}
                    </p>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    {formatDistanceToNow(new Date(n.created_at), {
                      addSuffix: true,
                      locale: ar,
                    })}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  {!n.read && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="text-muted-foreground hover:text-primary"
                      title="تعليم كمقروء"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => remove(n.id)}
                    className="text-muted-foreground hover:text-destructive"
                    title="حذف"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default NotificationBell;