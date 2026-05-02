import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImpersonationState {
  sessionId: string | null;
  shopId: string | null;
  shopName: string | null;
  startedAt: string | null;
  start: (shopId: string, shopName: string, reason: string) => Promise<void>;
  stop: () => Promise<void>;
  isActive: boolean;
}

const STORAGE_KEY = "owner_impersonation_v1";
const Ctx = createContext<ImpersonationState | null>(null);

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopName, setShopName] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const v = JSON.parse(raw);
        setSessionId(v.sessionId);
        setShopId(v.shopId);
        setShopName(v.shopName);
        setStartedAt(v.startedAt);
      }
    } catch {}
  }, []);

  const persist = (v: { sessionId: string; shopId: string; shopName: string; startedAt: string } | null) => {
    if (v) localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const start = useCallback(async (sid: string, sname: string, reason: string) => {
    const { data, error } = await supabase.rpc("owner_start_impersonation" as any, {
      _shop_id: sid,
      _reason: reason,
    });
    if (error) {
      toast.error("تعذّر بدء جلسة التقمص: " + error.message);
      throw error;
    }
    const startedNow = new Date().toISOString();
    setSessionId(data as string);
    setShopId(sid);
    setShopName(sname);
    setStartedAt(startedNow);
    persist({ sessionId: data as string, shopId: sid, shopName: sname, startedAt: startedNow });
    toast.success(`بدأت مشاهدة المتجر: ${sname}`);
  }, []);

  const stop = useCallback(async () => {
    if (!sessionId) return;
    const { error } = await supabase.rpc("owner_end_impersonation" as any, { _session_id: sessionId });
    if (error) toast.error("تعذّر إنهاء الجلسة: " + error.message);
    setSessionId(null);
    setShopId(null);
    setShopName(null);
    setStartedAt(null);
    persist(null);
    toast.info("تم إنهاء جلسة المشاهدة");
  }, [sessionId]);

  return (
    <Ctx.Provider value={{ sessionId, shopId, shopName, startedAt, start, stop, isActive: !!sessionId }}>
      {children}
    </Ctx.Provider>
  );
}

export function useImpersonation() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useImpersonation must be used inside ImpersonationProvider");
  return ctx;
}