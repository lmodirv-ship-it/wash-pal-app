import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, Video, Car, Loader2, X, FileVideo, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Detection {
  global_index: number;     // ترقيم متسلسل عبر كل الفيديوهات
  video_index: number;      // رقم الفيديو
  video_name: string;
  timestamp_sec: number;
  plate: string;
  frame_image: string;
}

interface VideoJob {
  file: File;
  status: "pending" | "processing" | "done" | "error" | "canceled";
  cars: number;
  progress: number;
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

  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [processing, setProcessing] = useState(false);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [globalCounter, setGlobalCounter] = useState(0);

  const reset = () => {
    cancelRef.current = true;
    setProcessing(false);
    setJobs([]);
    setDetections([]);
    setCurrentJobIndex(0);
    setGlobalCounter(0);
    if (videoRef.current) videoRef.current.src = "";
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

  const processOneVideo = async (
    job: VideoJob,
    videoIndex: number,
    startCounter: number,
  ): Promise<{ added: Detection[]; nextCounter: number }> => {
    const file = job.file;
    const url = URL.createObjectURL(file);
    const video = videoRef.current!;
    video.src = url;

    await new Promise<void>((resolve) => {
      const onMeta = () => { video.removeEventListener("loadedmetadata", onMeta); resolve(); };
      video.addEventListener("loadedmetadata", onMeta);
    });

    const totalDuration = Math.floor(video.duration) || 0;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("not authed");

    const { data: scan } = await supabase
      .from("video_scans")
      .insert({ admin_id: user.id, video_name: file.name, duration_sec: totalDuration, status: "processing" })
      .select()
      .single();

    const seenPlates = new Set<string>();
    const localDetections: Detection[] = [];
    const totalSteps = Math.max(1, Math.ceil(totalDuration / FRAME_INTERVAL_SEC));
    let step = 0;
    let counter = startCounter;

    for (let t = 0; t < totalDuration; t += FRAME_INTERVAL_SEC) {
      if (cancelRef.current) break;
      step++;
      try {
        await seekTo(video, t);
        await new Promise((r) => setTimeout(r, 60));
        const frameImage = captureFrame(video, canvasRef.current!);

        const { data, error } = await supabase.functions.invoke("scan-video-frame", {
          body: { image: frameImage },
        });

        if (!error && data?.has_car && data?.plate) {
          const plateKey = String(data.plate).replace(/\s+/g, "").toUpperCase();
          if (!seenPlates.has(plateKey)) {
            seenPlates.add(plateKey);
            counter++;
            const detection: Detection = {
              global_index: counter,
              video_index: videoIndex + 1,
              video_name: file.name,
              timestamp_sec: t,
              plate: data.plate,
              frame_image: frameImage,
            };
            localDetections.push(detection);
            setDetections((prev) => [...prev, detection]);
            setGlobalCounter(counter);

            if (scan) {
              await supabase.from("video_scan_detections").insert({
                scan_id: scan.id, plate: data.plate, timestamp_sec: t,
                frame_image: frameImage, has_car: true,
              });
            }
          }
        }
      } catch (err) {
        console.error("frame err", err);
      }
      const pct = Math.round((step / totalSteps) * 100);
      setJobs((prev) => prev.map((j, i) => i === videoIndex ? { ...j, progress: pct, cars: localDetections.length } : j));
    }

    if (scan) {
      await supabase.from("video_scans").update({
        total_cars: localDetections.length,
        status: cancelRef.current ? "canceled" : "done",
      }).eq("id", scan.id);
    }

    URL.revokeObjectURL(url);
    return { added: localDetections, nextCounter: counter };
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const videos = files.filter((f) => f.type.startsWith("video/"));
    if (!videos.length) {
      toast.error("لم يتم اختيار أي فيديو");
      return;
    }

    cancelRef.current = false;
    const newJobs: VideoJob[] = videos.map((f) => ({
      file: f, status: "pending", cars: 0, progress: 0,
    }));
    setJobs(newJobs);
    setDetections([]);
    setGlobalCounter(0);
    setProcessing(true);
    toast.success(`بدأ تحليل ${videos.length} فيديو`);

    let counter = 0;
    for (let i = 0; i < newJobs.length; i++) {
      if (cancelRef.current) break;
      setCurrentJobIndex(i);
      setJobs((prev) => prev.map((j, idx) => idx === i ? { ...j, status: "processing" } : j));
      try {
        const { nextCounter } = await processOneVideo(newJobs[i], i, counter);
        counter = nextCounter;
        setJobs((prev) => prev.map((j, idx) => idx === i ? { ...j, status: cancelRef.current ? "canceled" : "done", progress: 100 } : j));
      } catch (err) {
        console.error("video err", err);
        setJobs((prev) => prev.map((j, idx) => idx === i ? { ...j, status: "error" } : j));
      }
    }

    setProcessing(false);
    if (!cancelRef.current) {
      toast.success(`اكتمل التحليل: ${counter} سيارة عبر ${newJobs.length} فيديو`);
    }
    // reset input so same files can be re-selected
    e.target.value = "";
  };

  const totalVideos = jobs.length;
  const doneVideos = jobs.filter((j) => j.status === "done").length;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">قارئ الفيديوهات (دفعة) — كشف السيارات وترقيمها</h3>
        </div>
        {!processing && jobs.length > 0 && (
          <Button variant="outline" size="sm" onClick={reset}>
            <X className="w-4 h-4 ml-1" /> مسح
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        يمكنك رفع <strong>عدد كبير من الفيديوهات</strong> (100+ فيديو) دفعة واحدة. سيتم تحليلها واحداً تلو الآخر،
        وترقيم كل سيارة مكتشفة بشكل متسلسل عبر كل الفيديوهات.
      </p>

      {jobs.length === 0 && (
        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-8 cursor-pointer hover:bg-muted/30 transition">
          <Upload className="w-8 h-8 text-muted-foreground" />
          <span className="text-sm font-medium">اضغط لاختيار فيديوهات متعددة</span>
          <span className="text-xs text-muted-foreground">MP4 / MOV / WEBM — اختر 1 أو 100+ ملف</span>
          <input type="file" accept="video/*" multiple className="hidden" onChange={handleFiles} />
        </label>
      )}

      <video ref={videoRef} className="hidden" muted playsInline />
      <canvas ref={canvasRef} className="hidden" />

      {jobs.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-muted/40 rounded-lg p-2">
              <div className="text-xs text-muted-foreground">الفيديوهات</div>
              <div className="text-lg font-bold tabular-nums">{doneVideos} / {totalVideos}</div>
            </div>
            <div className="bg-muted/40 rounded-lg p-2">
              <div className="text-xs text-muted-foreground">الفيديو الحالي</div>
              <div className="text-lg font-bold tabular-nums">#{Math.min(currentJobIndex + 1, totalVideos)}</div>
            </div>
            <div className="bg-success/10 rounded-lg p-2">
              <div className="text-xs text-muted-foreground">سيارات مُكتشفة</div>
              <div className="text-lg font-bold text-success tabular-nums">{globalCounter}</div>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1 border border-border rounded-lg p-2">
            {jobs.map((j, i) => (
              <div key={i} className="flex items-center gap-2 text-xs py-1">
                <span className="w-6 tabular-nums text-muted-foreground">{i + 1}.</span>
                {j.status === "done" && <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />}
                {j.status === "processing" && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />}
                {j.status === "pending" && <FileVideo className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                {j.status === "error" && <X className="w-3.5 h-3.5 text-destructive shrink-0" />}
                <span className="truncate flex-1">{j.file.name}</span>
                {j.status === "processing" && (
                  <span className="text-muted-foreground tabular-nums">{j.progress}%</span>
                )}
                {j.status === "done" && (
                  <span className="text-success font-medium">{j.cars} 🚗</span>
                )}
              </div>
            ))}
          </div>

          {processing && (
            <Progress value={Math.round((doneVideos / totalVideos) * 100)} />
          )}
        </div>
      )}

      {detections.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Car className="w-4 h-4 text-success" />
            النتائج الإجمالية: {detections.length} سيارة
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground text-xs uppercase border-b border-border sticky top-0 bg-card">
                <tr>
                  <th className="text-right py-2 px-2">#</th>
                  <th className="text-right py-2 px-2">صورة</th>
                  <th className="text-right py-2 px-2">رقم اللوحة</th>
                  <th className="text-right py-2 px-2">التوقيت</th>
                  <th className="text-right py-2 px-2">الفيديو</th>
                </tr>
              </thead>
              <tbody>
                {detections.map((d) => (
                  <tr key={d.global_index} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-2 font-bold tabular-nums">{d.global_index}</td>
                    <td className="py-2 px-2">
                      <img src={d.frame_image} alt="" className="w-20 h-12 object-cover rounded" />
                    </td>
                    <td className="py-2 px-2 font-mono font-bold">{d.plate}</td>
                    <td className="py-2 px-2 tabular-nums">{fmtTime(d.timestamp_sec)}</td>
                    <td className="py-2 px-2 text-xs text-muted-foreground truncate max-w-[150px]">
                      #{d.video_index} · {d.video_name}
                    </td>
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
