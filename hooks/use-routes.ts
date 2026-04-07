"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface RouteFilters {
  origin?: string;
  destination?: string;
  vehicleType?: string;
  maxPrice?: number;
}

export function useActiveRoutes(filters: RouteFilters = {}) {
  // Strip out empty strings so the backend filter isn't triggered
  const args = {
    ...(filters.origin?.trim() ? { origin: filters.origin.trim() } : {}),
    ...(filters.destination?.trim() ? { destination: filters.destination.trim() } : {}),
    ...(filters.vehicleType ? { vehicleType: filters.vehicleType } : {}),
    ...(filters.maxPrice ? { maxPrice: filters.maxPrice } : {}),
  };

  const routes = useQuery(api.routes.getActiveRoutes, args);

  return {
    routes: routes ?? [],
    isLoading: routes === undefined,
  };
}
