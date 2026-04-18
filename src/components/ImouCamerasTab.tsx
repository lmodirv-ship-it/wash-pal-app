import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Camera, RefreshCw, Trash2, Wifi, WifiOff, Plus, CloudDownload } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";

interface ImouDevice {
  id: string;
  device_id: string;
  device_name: string;
  channel_id: string;
  branch_id: string | null;
  is_active: boolean;
  last_snapshot_at: string | null;
}

interface RemoteDevice {
  deviceId: string;
  name?: string;
  deviceModel?: string;
  status?: string;
  online?: number;
}

export default function ImouCamerasTab() {
  const { branches } = useApp();
  const [devices, setDevices] = useState<ImouDevice[]>([]);
  const [remote, setRemote] = useState<RemoteDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [manualForm, setManualForm] = useState({ device_id: "", device_name: "", channel_id: "0", branch_id: "" });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("imou_devices").select("*").order("created_at", { ascending: false });
    setDevices((data as ImouDevice[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const scanRemote = async () => {
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("imou-camera", { body: { action: "listDevices" } });
      if (error) throw error;
      const list = data?.result?.data?.deviceList || data?.result?.data?.devices || [];
      setRemote(list);
      if (list.length === 0) {
        toast.info("لم يتم العثور على كاميرات في حسابك. تأكد من ربط الكاميرات في تطبيق IMOU Life بنفس الحساب");
      } else {
        toast.success(`تم العثور على ${list.length} كاميرا في حسابك`);
      }
    } catch (e) {
      toast.error("فشل الاتصال بـ IMOU. تحقق من المفاتيح");
    } finally {
      setScanning(false);
    }
  };

  const addDevice = async (deviceId: string, deviceName: string) => {
    const { error } = await supabase.from("imou_devices").insert({
      device_id: deviceId,
      device_name: deviceName || deviceId,
      channel_id: "0",
    });
    if (error) {
      if (error.code === "23505") toast.warning("هذه الكاميرا مضافة من قبل");
      else toast.error("فشل الإضافة: " + error.message);
      return;
    }
    toast.success("تمت إضافة الكاميرا");
    load();
  };

  const addManual = async () => {
    if (!manualForm.device_id || !manualForm.device_name) {
      toast.error("أدخل Device SN واسم الكاميرا");
      return;
    }
    const { error } = await supabase.from("imou_devices").insert({
      device_id: manualForm.device_id.trim(),
      device_name: manualForm.device_name.trim(),
      channel_id: manualForm.channel_id || "0",
      branch_id: manualForm.branch_id || null,
    });
    if (error) {
      if (error.code === "23505") toast.warning("هذه الكاميرا مضافة من قبل");
      else toast.error("فشل الإضافة: " + error.message);
      return;
    }
    toast.success("تمت إضافة الكاميرا يدوياً");
    setManualForm({ device_id: "", device_name: "", channel_id: "0", branch_id: "" });
    load();
  };

  const updateBranch = async (id: string, branch_id: string) => {
    const { error } = await supabase.from("imou_devices").update({ branch_id: branch_id || null }).eq("id", id);
    if (error) { toast.error("فشل التحديث"); return; }
    toast.success("تم ربط الفرع");
    load();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("imou_devices").update({ is_active: !current }).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف هذه الكاميرا من النظام؟")) return;
    await supabase.from("imou_devices").delete().eq("id", id);
    toast.success("تم الحذف");
    load();
  };

  const testSnapshot = async (deviceId: string, channelId: string) => {
    toast.loading("جاري طلب لقطة...", { id: "snap" });
    try {
      const { data, error } = await supabase.functions.invoke("imou-camera", {
        body: { action: "snapshot", deviceId, channelId },
      });
      if (error) throw error;
      const url = data?.result?.data?.url;
      toast.dismiss("snap");
      if (url) {
        toast.success("تم! الصورة جاهزة");
        window.open(url, "_blank");
      } else {
        toast.error("فشل: " + JSON.stringify(data?.result?.msg || data));
      }
    } catch (e) {
      toast.dismiss("snap");
      toast.error("فشل طلب اللقطة");
    }
  };

  return (
    <div className="space-y-4">
      {/* Sync from IMOU Cloud */}
      <div className="lavage-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <CloudDownload className="w-5 h-5 text-primary" />
              مزامنة من حساب IMOU Cloud
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              اجلب قائمة الكاميرات المربوطة بحسابك في تطبيق IMOU Life
            </p>
          </div>
          <Button onClick={scanRemote} disabled={scanning} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${scanning ? "animate-spin" : ""}`} />
            {scanning ? "جاري المسح..." : "مسح الكاميرات"}
          </Button>
        </div>

        {remote.length > 0 && (
          <div className="space-y-2">
            {remote.map((d) => {
              const already = devices.some((x) => x.device_id === d.deviceId);
              return (
                <div key={d.deviceId} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                  <div>
                    <p className="font-bold text-sm">{d.name || d.deviceId}</p>
                    <p className="text-xs text-muted-foreground">SN: {d.deviceId} · {d.deviceModel}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {d.online === 1 ? (
                      <Badge variant="outline" className="border-success text-success"><Wifi className="w-3 h-3 ml-1" />متصلة</Badge>
                    ) : (
                      <Badge variant="outline" className="border-muted-foreground"><WifiOff className="w-3 h-3 ml-1" />غير متصلة</Badge>
                    )}
                    <Button
                      size="sm"
                      disabled={already}
                      onClick={() => addDevice(d.deviceId, d.name || d.deviceId)}
                    >
                      {already ? "مضافة ✓" : "إضافة"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual add */}
      <div className="lavage-card p-4">
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" />
          إضافة كاميرا يدوياً
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <Input
            placeholder="Device SN (مثل 60AD3...)"
            value={manualForm.device_id}
            onChange={(e) => setManualForm({ ...manualForm, device_id: e.target.value })}
          />
          <Input
            placeholder="اسم الكاميرا"
            value={manualForm.device_name}
            onChange={(e) => setManualForm({ ...manualForm, device_name: e.target.value })}
          />
          <Input
            placeholder="Channel (افتراضي: 0)"
            value={manualForm.channel_id}
            onChange={(e) => setManualForm({ ...manualForm, channel_id: e.target.value })}
          />
          <Button onClick={addManual} className="gap-1"><Plus className="w-4 h-4" /> إضافة</Button>
        </div>
      </div>

      {/* Saved devices */}
      <div className="lavage-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            الكاميرات المحفوظة ({devices.length})
          </h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الاسم</TableHead>
              <TableHead className="text-right">Device SN</TableHead>
              <TableHead className="text-right">الفرع</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">جاري التحميل...</TableCell></TableRow>
            ) : devices.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد كاميرات. ابدأ بمزامنة حسابك أعلاه</TableCell></TableRow>
            ) : devices.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-bold">{d.device_name}</TableCell>
                <TableCell className="font-mono text-xs">{d.device_id}</TableCell>
                <TableCell>
                  <Select value={d.branch_id || ""} onValueChange={(v) => updateBranch(d.id, v)}>
                    <SelectTrigger className="w-32 h-8"><SelectValue placeholder="اختر..." /></SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={d.is_active ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleActive(d.id, d.is_active)}
                  >
                    {d.is_active ? "مفعّلة" : "معطّلة"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => testSnapshot(d.device_id, d.channel_id)}>
                      <Camera className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => remove(d.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-xs text-muted-foreground p-3 rounded-lg bg-primary/5 border border-primary/20">
        💡 <strong>كيفية الاستخدام:</strong> 1) تأكد أن كاميراتك مربوطة في تطبيق IMOU Life بنفس حساب الـ Open Platform.
        2) اضغط "مسح الكاميرات" لجلبها. 3) أضفها للنظام واربطها بفرع. 4) في وضع الكاميرا الذكي بـ /work، ستظهر كخيار للمسح التلقائي للوحات.
      </div>
    </div>
  );
}
