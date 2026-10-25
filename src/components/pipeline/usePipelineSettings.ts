import { useQuery } from "@tanstack/react-query";
import { fetchPipelineSettings, getStoredTenantId } from "../../services/api";

// The steps and currency, shared by every screen that shows a lead.
export function usePipelineSettings(enabled = true) {
  const tenant = getStoredTenantId();
  return useQuery({
    queryKey: ["leads", tenant, "settings"],
    queryFn: fetchPipelineSettings,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
