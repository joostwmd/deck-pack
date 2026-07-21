import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CreateOrganizationInput, OrganizationStore } from "./organization-store";
import { organizationKeys } from "./query-keys";

export function useCreateOrganization(organization: OrganizationStore) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrganizationInput) => organization.createOrganization(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: organizationKeys.list() });
    },
  });
}
