import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, X, Loader2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import Tesseract from "tesseract.js";

interface PlateScannerProps {
  open: boolean;
  onClose: () => void;
  onDetected: (plate: string) => void;
}

// Clean OCR result → plate format (keep alnum + Arabic letters + dashes)
function cleanPlate(raw: string): string {
  const cleaned = raw
    .toUpperCase()
    .replace(/[^A-Z0-9\u0600-\u06FF\-\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .trim();
  return cleaned;
}

export function PlateScanner({ open, onClose, onDetected }: PlateScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setReady(false);

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch (e: any) {
        setError(e?.message?.includes("Permission") || e?.name === "NotAllowedError"
          ? "تم رفض إذن الكاميرا. الرجاء السماح بالوصول."
          : "تعذّر فتح الكاميرا. تأكد من توفرها.");
      }
    };
    startCamera();

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, [open]);

  const capture = async () => {
    if (!videoRef.current || !canvasRef.current || scanning) return;
    setScanning(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      // Crop center band where plate usually sits
      const w = video.videoWidth;
      const h = video.videoHeight;
      const cropH = Math.floor(h * 0.35);
      const cropY = Math.floor((h - cropH) / 2);
      canvas.width = w;
      canvas.height = cropH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas error");
      ctx.drawImage(video, 0, cropY, w, cropH, 0, 0, w, cropH);

      // Increase contrast for better OCR
      const img = ctx.getImageData(0, 0, w, cropH);
      const data = img.data;
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const v = avg > 130 ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = v;
      }
      ctx.putImageData(img, 0, 0);

      const blob: Blob = await new Promise((res) => canvas.toBlob(b => res(b!), "image/png"));

      const { data: { text } } = await Tesseract.recognize(blob, "eng", {
        // suppress logs
      });

      const plate = cleanPlate(text);
      if (!plate || plate.length < 3) {
        toast.error("تعذّر قراءة اللوحة. حاول مجدداً أو أدخل يدوياً");
        setScanning(false);
        return;
      }
      // Save to history
      const history = JSON.parse(localStorage.getItem("plate_history") || "[]");
      const updated = [plate, ...history.filter((p: string) => p !== plate)].slice(0, 10);
      localStorage.setItem("plate_history", JSON.stringify(updated));

      toast.success(`تم: ${plate}`);
      onDetected(plate);
      onClose();
    } catch (e: any) {
      toast.error("فشل التحليل: " + (e?.message || ""));
    } finally {
      setScanning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-black border-0">
        <div className="relative aspect-[3/4] bg-black">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white gap-3">
              <Camera className="w-12 h-12 opacity-50" />
              <p className="text-sm">{error}</p>
              <Button variant="outline" onClick={onClose}>إغلاق</Button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Overlay scanning frame */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 h-32 border-2 border-primary rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]" />
                <p className="absolute top-6 inset-x-0 text-center text-white text-sm font-medium">
                  ضع لوحة السيارة داخل الإطار
                </p>
              </div>

              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Capture button */}
              <div className="absolute bottom-6 inset-x-0 flex items-center justify-center">
                <button
                  onClick={capture}
                  disabled={!ready || scanning}
                  className="w-20 h-20 rounded-full bg-white border-4 border-primary disabled:opacity-50 active:scale-95 transition flex items-center justify-center"
                >
                  {scanning ? (
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  ) : (
                    <Camera className="w-8 h-8 text-primary" />
                  )}
                </button>
              </div>

              {scanning && (
                <div className="absolute bottom-32 inset-x-0 text-center text-white text-sm">
                  <RefreshCcw className="w-4 h-4 inline animate-spin ml-1" /> جاري التحليل...
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
