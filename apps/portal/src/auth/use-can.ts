import { useCallback, useEffect, useState } from "react";

import {
  isOrganizationRoleName,
  type OrganizationRoleName,
  type Permissions,
} from "@deck-pack/auth/rbac";
import { getAuthClient } from "@/utils/auth";

type UseCanResult = {
  can: (permissions: Permissions) => boolean;
  role: OrganizationRoleName | null;
  isLoading: boolean;
};

export function useCan(): UseCanResult {
  const authClient = getAuthClient();
  const [role, setRole] = useState<OrganizationRoleName | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const result = await authClient.organization.getActiveMemberRole();
        if (!cancelled) {
          const activeRole = result.data?.role;
          setRole(activeRole && isOrganizationRoleName(activeRole) ? activeRole : null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authClient]);

  const can = useCallback(
    (permissions: Permissions) => {
      if (!role) {
        return false;
      }

      return authClient.organization.checkRolePermission({
        role,
        permissions,
      });
    },
    [authClient, role],
  );

  return { can, role, isLoading };
}
