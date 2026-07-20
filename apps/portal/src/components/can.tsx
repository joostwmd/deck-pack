import type { ReactNode } from "react";

import type { Permissions } from "@deck-pack/auth/rbac";

import { useCan } from "@/auth/use-can";

type CanProps = {
  permissions: Permissions;
  children: ReactNode;
  fallback?: ReactNode;
};

export function Can({ permissions, children, fallback = null }: CanProps) {
  const { can, isLoading } = useCan();

  if (isLoading) {
    return null;
  }

  return can(permissions) ? children : fallback;
}
