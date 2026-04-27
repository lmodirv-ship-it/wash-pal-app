import { describe, expect, it } from "vitest";
import { assertSeedShopHasServices, getEmployeeVisibleServices, getOwnerVisibleServices } from "./serviceVisibility";
import type { Service } from "@/types";

const services: Service[] = [
  { id: "s1", name: "Wash", price: 30, duration: 20, description: "", isActive: true, category: "standard", startingFrom: false, shopId: "seed-shop-1" },
  { id: "s2", name: "VIP", price: 80, duration: 40, description: "", isActive: true, category: "vip", startingFrom: false, shopId: "seed-shop-1" },
  { id: "s3", name: "Disabled", price: 10, duration: 10, description: "", isActive: false, category: "extra", startingFrom: false, shopId: "seed-shop-1" },
  { id: "s4", name: "Other", price: 25, duration: 15, description: "", isActive: true, category: "standard", startingFrom: false, shopId: "seed-shop-2" },
];

describe("service visibility regression", () => {
  it("owner sees all services across shops", () => {
    expect(getOwnerVisibleServices(services)).toHaveLength(4);
  });

  it("employee sees active services for their shop only", () => {
    expect(getEmployeeVisibleServices(services, "seed-shop-1").map((service) => service.id)).toEqual(["s1", "s2"]);
  });

  it("employee overrides cannot hide unrelated shops or inactive services", () => {
    expect(getEmployeeVisibleServices(services, "seed-shop-1", ["s2"]).map((service) => service.id)).toEqual(["s1"]);
  });

  it("guard fails if a seed shop service count reaches zero", () => {
    expect(() => assertSeedShopHasServices({ "seed-shop-1": 2, "seed-shop-2": 0 })).toThrow(/zero services/);
  });
});