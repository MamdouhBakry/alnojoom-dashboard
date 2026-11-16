import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import type { ErpConflict, Lookups, OfferSlot, Role } from "./types";

export const keys = {
  lookups: ["lookups"],
  products: ["products"],
  product: (id: number) => ["products", "one", id],
  conflicts: ["products", "conflicts"],
  offers: ["offers"],
  staff: ["staff"],
  roles: ["roles"],
  permissions: ["permissions"],
};

export function useLookups() {
  return useQuery({ queryKey: keys.lookups, queryFn: () => api.get<Lookups>("/lookups"), staleTime: 10 * 60_000 });
}

export function useErpConflicts(enabled = true) {
  return useQuery({ queryKey: keys.conflicts, queryFn: () => api.get<ErpConflict[]>("/products/erp-name-conflicts"), enabled });
}

export function useOffers(enabled = true) {
  return useQuery({ queryKey: keys.offers, queryFn: () => api.get<OfferSlot[]>("/offers"), enabled });
}

export function useRoles(enabled = true) {
  return useQuery({ queryKey: keys.roles, queryFn: () => api.get<Role[]>("/roles"), enabled });
}
