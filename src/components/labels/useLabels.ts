import { useQuery } from "@tanstack/react-query";
import { fetchLabels, getStoredTenantId } from "../../services/api";

// The company's labels, shared by every screen that shows or picks them.
export function useLabels(enabled = true) {
  const tenant = getStoredTenantId();
  return useQuery({ queryKey: ["labels", tenant], queryFn: fetchLabels, enabled, staleTime: 30000 });
}
