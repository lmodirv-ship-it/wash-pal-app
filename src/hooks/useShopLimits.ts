import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ShopLimits {
  max_employees: number;
  max_branches: number;
  plan_code: string;
  current_employees: number;
  current_branches: number;
}

export function useShopLimits(shopId: string | null | undefined) {
  const [data, setData] = useState<ShopLimits | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!shopId) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);

    (async () => {
      const [{ data: limits }, empCount, brCount] = await Promise.all([
        supabase.rpc("get_shop_limits", { _shop_id: shopId }),
        supabase
          .from("employees")
          .select("id", { count: "exact", head: true })
          .eq("shop_id", shopId)
          .eq("is_active", true),
        supabase
          .from("branches")
          .select("id", { count: "exact", head: true })
          .eq("shop_id", shopId)
          .eq("is_active", true),
      ]);

      if (cancelled) return;
      const row = Array.isArray(limits) ? limits[0] : null;
      setData({
        max_employees: row?.max_employees ?? 5,
        max_branches: row?.max_branches ?? 1,
        plan_code: row?.plan_code ?? "starter",
        current_employees: empCount.count ?? 0,
        current_branches: brCount.count ?? 0,
      });
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [shopId]);

  return { data, loading };
}