import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Car, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DetectionRow {
  id: string;
  plate: string | null;
  timestamp_sec: number;
  frame_image: string | null;
  created_at: string;
  scan_id: string;
}

interface ScanRow {
  id: string;
  video_name: string;
  created_at: string;
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function dateKey(iso: string) {
  const d = new Date(iso);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function dateLabel(key: string) {
  const d = new Date(key + "T00:00:00");
  return d.toLocaleDateString("ar", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

export function PlateHistoryByDate() {
  const [loading, setLoading] = useState(true);
  const [detections, setDetections] = useState<DetectionRow[]>([]);
  const [scans, setScans] = useState<Record<string, ScanRow>>({});
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    const [{ data: dets }, { data: scs }] = await Promise.all([
      supabase
        .from("video_scan_detections")
        .select("id, plate, timestamp_sec, frame_image, created_at, scan_id")
        .eq("has_car", true)
        .order("created_at", { ascending: false })
        .limit(2000),
      supabase.from("video_scans").select("id, video_name, created_at"),
    ]);
    setDetections((dets || []) as DetectionRow[]);
    const map: Record<string, ScanRow> = {};
    (scs || []).forEach((s: any) => { map[s.id] = s; });
    setScans(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const grouped = useMemo(() => {
    const g: Record<string, DetectionRow[]> = {};
    for (const d of detections) {
      const k = dateKey(d.created_at);
      (g[k] = g[k] || []).push(d);
    }
    return Object.entries(g).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [detections]);

  const toggle = (key: string) => setOpenDays((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">سجل أرقام السيارات حسب التاريخ</h3>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ml-1 ${loading ? "animate-spin" : ""}`} />
          تحديث
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        كل اللوحات المُكتشفة من الفيديوهات، مرتبة حسب اليوم (الأحدث أولاً). إجمالي اللوحات: <strong>{detections.length}</strong>
      </p>

      {loading && <div className="text-center py-8 text-sm text-muted-foreground">جاري التحميل…</div>}

      {!loading && grouped.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          لا توجد بيانات بعد. ارفع فيديو من قارئ الفيديوهات أعلاه.
        </div>
      )}

      <div className="space-y-2">
        {grouped.map(([day, rows]) => {
          const isOpen = openDays[day] ?? true;
          return (
            <div key={day} className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => toggle(day)}
                className="w-full flex items-center justify-between px-3 py-2 bg-muted/40 hover:bg-muted/60 transition"
              >
                <div className="flex items-center gap-2">
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm">{dateLabel(day)}</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Car className="w-4 h-4 text-success" />
                  <span className="font-bold tabular-nums">{rows.length}</span>
                  <span className="text-muted-foreground text-xs">سيارة</span>
                </div>
              </button>

              {isOpen && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-muted-foreground text-xs uppercase border-b border-border">
                      <tr>
                        <th className="text-right py-2 px-2">#</th>
                        <th className="text-right py-2 px-2">صورة</th>
                        <th className="text-right py-2 px-2">رقم اللوحة</th>
                        <th className="text-right py-2 px-2">وقت التسجيل</th>
                        <th className="text-right py-2 px-2">داخل الفيديو</th>
                        <th className="text-right py-2 px-2">الفيديو</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((d, i) => {
                        const scan = scans[d.scan_id];
                        const recordedAt = new Date(d.created_at).toLocaleTimeString("ar", {
                          hour: "2-digit", minute: "2-digit",
                        });
                        return (
                          <tr key={d.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="py-2 px-2 font-bold tabular-nums">{i + 1}</td>
                            <td className="py-2 px-2">
                              {d.frame_image ? (
                                <img src={d.frame_image} alt="" className="w-20 h-12 object-cover rounded" />
                              ) : <span className="text-muted-foreground text-xs">—</span>}
                            </td>
                            <td className="py-2 px-2 font-mono font-bold">{d.plate || "—"}</td>
                            <td className="py-2 px-2 tabular-nums">{recordedAt}</td>
                            <td className="py-2 px-2 tabular-nums">{fmtTime(d.timestamp_sec)}</td>
                            <td className="py-2 px-2 text-xs text-muted-foreground truncate max-w-[180px]">
                              {scan?.video_name || "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
