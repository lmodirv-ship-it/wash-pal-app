import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { Service, ServiceCategory } from "@/types";
import { getEmployeeVisibleServices } from "@/lib/serviceVisibility";

export type EmptyReason =
  | "NO_SHOP_LINK"
  | "NO_ACTIVE_SERVICES"
  | "ALL_DISABLED_BY_OVERRIDE"
  | "LOAD_ERROR"
  | null;

function mapService(r: any): Service {
  return {
    id: r.id,
    reference: r.reference || undefined,
    name: r.name,
    nameAr: r.name_ar || undefined,
    nameFr: r.name_fr || undefined,
    nameEn: r.name_en || undefined,
    price: Number(r.price),
    duration: Number(r.duration ?? 0),
    description: r.description || "",
    descriptionAr: r.description_ar || undefined,
    descriptionFr: r.description_fr || undefined,
    descriptionEn: r.description_en || undefined,
    isActive: !!r.is_active,
    category: (r.category as ServiceCategory) || "standard",
    startingFrom: !!r.starting_from,
    shopId: r.shop_id || undefined,
  };
}

/**
 * Resolves the effective services list for the currently signed-in employee.
 * Effective = active services in their shop, minus overrides where enabled=false.
 * For non-employee roles falls back to the shop services from AppContext.
 */
export function useEffectiveServices() {
  const { user, profile } = useAuth();
  const { services: shopServices, tenantShops, loading: appLoading } = useApp();
  const [services, setServices] = useState<Service[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState<EmptyReason>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const isEmployee = profile?.role === "employee";

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;

    (async () => {
      setLoading(true);
      setReason(null);
      try {
        // Non-employees: use AppContext (shop-wide services, RLS-scoped already).
        if (!isEmployee) {
          if (cancelled) return;
          const active = shopServices.filter((s) => s.isActive);
          setServices(active);
          setReason(active.length === 0 ? (tenantShops.length === 0 ? "NO_SHOP_LINK" : "NO_ACTIVE_SERVICES") : null);
          setLoading(false);
          return;
        }

        // Employees: resolve their employee row, then call the effective_services RPC.
        const { data: empRows, error: empErr } = await supabase
          .from("employees")
          .select("id, shop_id")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .limit(1);
        if (empErr) throw empErr;

        if (!empRows || empRows.length === 0) {
          if (cancelled) return;
          setServices([]);
          setReason("NO_SHOP_LINK");
          setLoading(false);
          return;
        }

        const employeeId = empRows[0].id as string;
        const shopId = empRows[0].shop_id as string;

        // Pull active shop services + overrides in parallel.
        const [{ data: svcRows, error: svcErr }, { data: ovRows, error: ovErr }] = await Promise.all([
          supabase.from("services").select("*").eq("shop_id", shopId).eq("is_active", true),
          supabase.from("employee_service_overrides").select("service_id, enabled").eq("employee_id", employeeId),
        ]);
        if (svcErr) throw svcErr;
        if (ovErr) throw ovErr;

        const disabled = new Set((ovRows || []).filter((o: any) => o.enabled === false).map((o: any) => o.service_id));
        const all = (svcRows || []).map(mapService);
        const effective = getEmployeeVisibleServices(all, shopId, disabled);

        if (cancelled) return;
        setServices(effective);

        if (all.length === 0) setReason("NO_ACTIVE_SERVICES");
        else if (effective.length === 0) setReason("ALL_DISABLED_BY_OVERRIDE");
        else setReason(null);
      } catch (e) {
        if (cancelled) return;
        console.error("useEffectiveServices error", e);
        setServices([]);
        setReason("LOAD_ERROR");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, isEmployee, shopServices, tenantShops.length, refreshKey]);

  return {
    services: services ?? [],
    loading: loading || appLoading,
    reason,
    refresh,
  };
}