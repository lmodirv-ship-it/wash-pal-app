import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Subscribes to realtime changes on orders for a given shop and invalidates
 * any react-query cache keys starting with ["orders"].
 */
export function useRealtimeOrders(shopId: string | null | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!shopId) return;
    const channel = supabase
      .channel(`orders-${shopId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `shop_id=eq.${shopId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["orders"] });
          qc.invalidateQueries({ queryKey: ["dashboard"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId, qc]);
}