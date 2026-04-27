import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type RangePreset = "today" | "7d" | "30d" | "custom";

export interface DateRange {
  from: Date;
  to: Date;
  preset: RangePreset;
}

export function buildPresetRange(preset: Exclude<RangePreset, "custom">): DateRange {
  const to = new Date();
  const from = new Date();
  if (preset === "today") {
    from.setHours(0, 0, 0, 0);
  } else if (preset === "7d") {
    from.setDate(from.getDate() - 7);
  } else {
    from.setDate(from.getDate() - 30);
  }
  return { from, to, preset };
}

interface Props {
  value: DateRange;
  onChange: (r: DateRange) => void;
}

export function DateRangeFilter({ value, onChange }: Props) {
  const [openFrom, setOpenFrom] = useState(false);
  const [openTo, setOpenTo] = useState(false);

  const presets: { key: Exclude<RangePreset, "custom">; label: string }[] = [
    { key: "today", label: "اليوم" },
    { key: "7d", label: "7 أيام" },
    { key: "30d", label: "30 يوم" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((p) => (
        <Button
          key={p.key}
          size="sm"
          variant={value.preset === p.key ? "default" : "outline"}
          className="h-9"
          onClick={() => onChange(buildPresetRange(p.key))}
        >
          {p.label}
        </Button>
      ))}

      <Popover open={openFrom} onOpenChange={setOpenFrom}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant={value.preset === "custom" ? "default" : "outline"}
            className={cn("h-9 gap-1")}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            {format(value.from, "yyyy-MM-dd")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value.from}
            onSelect={(d) => {
              if (!d) return;
              const next: DateRange = {
                from: d,
                to: value.to < d ? d : value.to,
                preset: "custom",
              };
              onChange(next);
              setOpenFrom(false);
            }}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      <span className="text-muted-foreground text-xs">→</span>

      <Popover open={openTo} onOpenChange={setOpenTo}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant={value.preset === "custom" ? "default" : "outline"}
            className="h-9 gap-1"
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            {format(value.to, "yyyy-MM-dd")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value.to}
            onSelect={(d) => {
              if (!d) return;
              const next: DateRange = {
                from: value.from > d ? d : value.from,
                to: d,
                preset: "custom",
              };
              onChange(next);
              setOpenTo(false);
            }}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}