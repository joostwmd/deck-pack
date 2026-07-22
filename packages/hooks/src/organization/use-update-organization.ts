import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { OrganizationStore, UpdateOrganizationInput } from "./organization-store";
import { organizationKeys } from "./query-keys";

export function useUpdateOrganization(organization: OrganizationStore) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateOrganizationInput) => organization.updateOrganization(input),
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.detail(input.organizationId),
      });
      void queryClient.invalidateQueries({ queryKey: organizationKeys.list() });
    },
  });
}
