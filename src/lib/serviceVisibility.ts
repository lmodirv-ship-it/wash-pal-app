import type { Service } from "@/types";

export type ServiceVisibilityRole = "owner" | "admin" | "manager" | "supervisor" | "employee" | "customer";

export function getOwnerVisibleServices(services: Service[]) {
  return services;
}

export function getEmployeeVisibleServices(
  services: Service[],
  employeeShopId: string | null | undefined,
  disabledServiceIds: Iterable<string> = []
) {
  if (!employeeShopId) return [];
  const disabled = new Set(disabledServiceIds);
  return services.filter(
    (service) => service.shopId === employeeShopId && service.isActive && !disabled.has(service.id)
  );
}

export function assertSeedShopHasServices(counts: Record<string, number>) {
  const emptyShop = Object.entries(counts).find(([, count]) => count <= 0);
  if (emptyShop) {
    throw new Error(`Seed shop ${emptyShop[0]} has zero services`);
  }
  return true;
}