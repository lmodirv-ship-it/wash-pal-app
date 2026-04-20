import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, Video, Car, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Detection {
  timestamp_sec: number;
  plate: string;
  has_car: boolean;
  frame_image: string;
}

const FRAME_INTERVAL_SEC = 2;

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function VideoScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cancelRef = useRef(false);

  const [fileName, setFileName] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const reset = () => {
    cancelRef.current = true;
    setProcessing(false);
    setProgress(0);
    setDetections([]);
    setDuration(0);
    setCurrentTime(0);
    setFileName("");
    if (videoRef.current) {
      videoRef.current.src = "";
    }
  };

  const captureFrame = (video: HTMLVideoElement, canvas: HTMLCanvasElement): string => {
    const w = Math.min(video.videoWidth, 800);
    const ratio = w / video.videoWidth;
    const h = Math.round(video.videoHeight * ratio);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.7);
  };

  const seekTo = (video: HTMLVideoElement, time: number) =>
    new Promise<void>((resolve) => {
      const onSeeked = () => { video.removeEventListener("seeked", onSeeked); resolve(); };
      video.addEventListener("seeked", onSeeked);
      video.currentTime = time;
    });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("الملف ليس فيديو");
      return;
    }

    cancelRef.current = false;
    setFileName(file.name);
    setDetections([]);
    setProgress(0);

    const url = URL.createObjectURL(file);
    const video = videoRef.current!;
    video.src = url;

    await new Promise<void>((resolve) => {
      const onMeta = () => { video.removeEventListener("loadedmetadata", onMeta); resolve(); };
      video.addEventListener("loadedmetadata", onMeta);
    });

    const totalDuration = Math.floor(video.duration);
    setDuration(totalDuration);
    setProcessing(true);

    // Create scan record
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("يجب تسجيل الدخول");
      setProcessing(false);
      return;
    }
    const { data: scan, error: scanErr } = await supabase
      .from("video_scans")
      .insert({ admin_id: user.id, video_name: file.name, duration_sec: totalDuration, status: "processing" })
      .select()
      .single();
    if (scanErr || !scan) {
      toast.error("فشل إنشاء سجل التحليل");
      setProcessing(false);
      return;
    }

    const localDetections: Detection[] = [];
    const seenPlates = new Set<string>();
    const totalSteps = Math.ceil(totalDuration / FRAME_INTERVAL_SEC);
    let step = 0;

    for (let t = 0; t < totalDuration; t += FRAME_INTERVAL_SEC) {
      if (cancelRef.current) break;
      step++;
      setCurrentTime(t);
      try {
        await seekTo(video, t);
        await new Promise((r) => setTimeout(r, 80));
        const frameImage = captureFrame(video, canvasRef.current!);

        const { data, error } = await supabase.functions.invoke("scan-video-frame", {
          body: { image: frameImage },
        });

        if (error) {
          console.error("frame error", error);
        } else if (data?.has_car && data?.plate) {
          const plateKey = data.plate.replace(/\s+/g, "").toUpperCase();
          // Skip duplicate plates within ~6s window
          if (!seenPlates.has(plateKey)) {
            seenPlates.add(plateKey);
            const detection: Detection = {
              timestamp_sec: t,
              plate: data.plate,
              has_car: true,
              frame_image: frameImage,
            };
            localDetections.push(detection);
            setDetections([...localDetections]);
            await supabase.from("video_scan_detections").insert({
              scan_id: scan.id,
              plate: data.plate,
              timestamp_sec: t,
              frame_image: frameImage,
              has_car: true,
            });
          }
        }
      } catch (err) {
        console.error("step error", err);
      }
      setProgress(Math.round((step / totalSteps) * 100));
    }

    await supabase.from("video_scans").update({
      total_cars: localDetections.length,
      status: cancelRef.current ? "canceled" : "done",
    }).eq("id", scan.id);

    setProcessing(false);
    URL.revokeObjectURL(url);
    if (!cancelRef.current) {
      toast.success(`تم اكتشاف ${localDetections.length} سيارة`);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">قارئ الفيديوهات — كشف السيارات واللوحات</h3>
        </div>
        {!processing && fileName && (
          <Button variant="outline" size="sm" onClick={reset}>
            <X className="w-4 h-4 ml-1" /> إعادة
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        ارفع فيديو من حاسوبك (CCTV / كاميرا المغسلة). سيُحلل كل {FRAME_INTERVAL_SEC} ثوانٍ
        ويُسجَّل عدد السيارات + رقم اللوحة + توقيت الظهور.
      </p>

      {!fileName && (
        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-8 cursor-pointer hover:bg-muted/30 transition">
          <Upload className="w-8 h-8 text-muted-foreground" />
          <span className="text-sm font-medium">اضغط لرفع ملف فيديو</span>
          <span className="text-xs text-muted-foreground">MP4 / MOV / WEBM</span>
          <input type="file" accept="video/*" className="hidden" onChange={handleFile} />
        </label>
      )}

      <video ref={videoRef} className="hidden" muted playsInline />
      <canvas ref={canvasRef} className="hidden" />

      {fileName && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium truncate max-w-[60%]">{fileName}</span>
            <span className="text-muted-foreground">
              {processing ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {fmtTime(currentTime)} / {fmtTime(duration)}
                </span>
              ) : (
                <>المدة: {fmtTime(duration)}</>
              )}
            </span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      {detections.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Car className="w-4 h-4 text-success" />
            النتائج: {detections.length} سيارة
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground text-xs uppercase border-b border-border">
                <tr>
                  <th className="text-right py-2 px-2">#</th>
                  <th className="text-right py-2 px-2">صورة</th>
                  <th className="text-right py-2 px-2">رقم اللوحة</th>
                  <th className="text-right py-2 px-2">التوقيت</th>
                </tr>
              </thead>
              <tbody>
                {detections.map((d, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-2 font-bold">{i + 1}</td>
                    <td className="py-2 px-2">
                      <img src={d.frame_image} alt="" className="w-20 h-12 object-cover rounded" />
                    </td>
                    <td className="py-2 px-2 font-mono font-bold">{d.plate}</td>
                    <td className="py-2 px-2 tabular-nums">{fmtTime(d.timestamp_sec)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
