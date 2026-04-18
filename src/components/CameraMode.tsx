import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, X, Loader2, Sparkles, Car, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Tesseract from "tesseract.js";
import { Order, Service } from "@/types";

interface CameraModeProps {
  open: boolean;
  onClose: () => void;
  services: Service[];
  pastOrders: Order[];
  onConfirm: (data: { plate: string; serviceId: string; price: number }) => Promise<void> | void;
}

function cleanPlate(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9\u0600-\u06FF\-\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .trim();
}

export function CameraMode({ open, onClose, services, pastOrders, onConfirm }: CameraModeProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const busyRef = useRef(false);

  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [autoScan, setAutoScan] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [detectedPlate, setDetectedPlate] = useState<string | null>(null);
  const [suggestedServiceId, setSuggestedServiceId] = useState<string | null>(null);

  const activeServices = useMemo(() => services.filter(s => s.isActive), [services]);

  // Lookup previous service for a plate
  const findSuggestion = (plate: string): string | null => {
    const prev = pastOrders.find(o => o.carPlate?.toUpperCase() === plate.toUpperCase());
    if (prev && prev.services?.[0]) {
      const sid = prev.services[0];
      if (activeServices.some(s => s.id === sid)) return sid;
    }
    return null;
  };

  // Start camera
  useEffect(() => {
    if (!open) return;
    setError(null);
    setReady(false);
    setDetectedPlate(null);
    setSuggestedServiceId(null);

    (async () => {
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
        setError(
          e?.name === "NotAllowedError"
            ? "تم رفض إذن الكاميرا. الرجاء السماح بالوصول."
            : "تعذّر فتح الكاميرا."
        );
      }
    })();

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      if (scanLoopRef.current) {
        window.clearInterval(scanLoopRef.current);
        scanLoopRef.current = null;
      }
    };
  }, [open]);

  // Auto-scan loop (every 2.5s) — placeholder for future car detection
  useEffect(() => {
    if (!open || !ready || !autoScan) return;
    scanLoopRef.current = window.setInterval(() => {
      if (!busyRef.current && !detectedPlate) doScan();
    }, 2500);
    return () => {
      if (scanLoopRef.current) {
        window.clearInterval(scanLoopRef.current);
        scanLoopRef.current = null;
      }
    };
  }, [open, ready, autoScan, detectedPlate]);

  const doScan = async () => {
    if (!videoRef.current || !canvasRef.current || busyRef.current) return;
    busyRef.current = true;
    setScanning(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w || !h) return;
      const cropH = Math.floor(h * 0.35);
      const cropY = Math.floor((h - cropH) / 2);
      canvas.width = w;
      canvas.height = cropH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, cropY, w, cropH, 0, 0, w, cropH);

      // contrast pass
      const img = ctx.getImageData(0, 0, w, cropH);
      const data = img.data;
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const v = avg > 130 ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = v;
      }
      ctx.putImageData(img, 0, 0);

      const blob: Blob = await new Promise(res => canvas.toBlob(b => res(b!), "image/png"));
      const { data: { text } } = await Tesseract.recognize(blob, "eng");
      const plate = cleanPlate(text);
      if (plate && plate.length >= 4) {
        setDetectedPlate(plate);
        const sugg = findSuggestion(plate);
        if (sugg) {
          setSuggestedServiceId(sugg);
          toast.success(`عميل سابق: ${plate} — اقترحنا خدمته المعتادة`);
        } else if (activeServices[0]) {
          setSuggestedServiceId(activeServices[0].id);
        }
      }
    } catch (e) {
      // silent in auto mode
    } finally {
      busyRef.current = false;
      setScanning(false);
    }
  };

  const reset = () => {
    setDetectedPlate(null);
    setSuggestedServiceId(null);
  };

  const confirm = async () => {
    if (!detectedPlate || !suggestedServiceId) return;
    const svc = activeServices.find(s => s.id === suggestedServiceId);
    if (!svc) return;
    await onConfirm({ plate: detectedPlate, serviceId: svc.id, price: svc.price });
    onClose();
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
              <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
              <canvas ref={canvasRef} className="hidden" />

              {/* Top bar */}
              <div className="absolute top-0 inset-x-0 p-3 flex items-center justify-between z-10">
                <Badge className="bg-black/60 text-white border-0 backdrop-blur">
                  <Sparkles className="w-3 h-3 ml-1" /> وضع الكاميرا الذكي
                </Badge>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Frame overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 h-32 border-2 border-primary rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]" />
                <p className="absolute top-14 inset-x-0 text-center text-white/80 text-xs">
                  وجّه الكاميرا نحو لوحة السيارة
                </p>
                {scanning && !detectedPlate && (
                  <div className="absolute top-1/2 -translate-y-1/2 inset-x-0 text-center text-white text-xs">
                    <Loader2 className="w-4 h-4 inline animate-spin ml-1" /> يبحث عن لوحة...
                  </div>
                )}
              </div>

              {/* Suggestion / confirm card */}
              <div className="absolute bottom-0 inset-x-0 p-4 z-10">
                {detectedPlate ? (
                  <div className="bg-card/95 backdrop-blur-xl rounded-2xl p-4 space-y-3 border border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-muted-foreground">لوحة مكتشفة</p>
                        <p className="text-xl font-bold tracking-wider">{detectedPlate}</p>
                      </div>
                      <Badge className="bg-success/15 text-success border-success/30">
                        <Car className="w-3 h-3 ml-1" /> جاهز
                      </Badge>
                    </div>

                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1.5">اختر الخدمة</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {activeServices.map(s => (
                          <button
                            key={s.id}
                            onClick={() => setSuggestedServiceId(s.id)}
                            className={`p-2 rounded-lg border text-right transition ${
                              suggestedServiceId === s.id
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-primary/40"
                            }`}
                          >
                            <p className="text-xs font-bold line-clamp-1">{s.name}</p>
                            <p className="text-[11px] opacity-70">{s.price} DH</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={reset} className="h-11 rounded-xl">
                        إعادة المسح
                      </Button>
                      <Button
                        onClick={confirm}
                        disabled={!suggestedServiceId}
                        className="h-11 rounded-xl font-bold"
                        style={{ background: "var(--gradient-primary)" }}
                      >
                        <CheckCircle2 className="w-4 h-4 ml-1" /> تأكيد
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <button
                      onClick={() => setAutoScan(v => !v)}
                      className={`flex-1 h-11 rounded-xl text-xs font-medium transition ${
                        autoScan
                          ? "bg-primary/20 text-primary border border-primary/40"
                          : "bg-black/50 text-white/70 border border-white/10"
                      }`}
                    >
                      {autoScan ? "🤖 المسح التلقائي مفعّل" : "تفعيل المسح التلقائي"}
                    </button>
                    <button
                      onClick={doScan}
                      disabled={!ready || scanning}
                      className="w-16 h-16 rounded-full bg-white border-4 border-primary disabled:opacity-50 active:scale-95 transition flex items-center justify-center"
                    >
                      {scanning ? (
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6 text-primary" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
