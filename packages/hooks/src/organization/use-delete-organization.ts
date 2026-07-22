import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { OrganizationStore } from "./organization-store";
import { organizationKeys } from "./query-keys";

export function useDeleteOrganization(organization: OrganizationStore) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (organizationId: string) => organization.deleteOrganization(organizationId),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: organizationKeys.list() });
      void queryClient.removeQueries({ queryKey: organizationKeys.detail(result.organizationId) });
      void queryClient.removeQueries({ queryKey: organizationKeys.members(result.organizationId) });
    },
  });
}
