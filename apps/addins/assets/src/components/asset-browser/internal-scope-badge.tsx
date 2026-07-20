import { Badge } from "@deck-pack/ui/components/system/badge";

import type { AssetScope } from "@/types/asset-types";

interface InternalScopeBadgeProps {
  scope?: AssetScope;
  className?: string;
}

export function InternalScopeBadge({ scope, className }: InternalScopeBadgeProps) {
  if (scope !== "org") {
    return null;
  }

  return (
    <Badge variant="secondary" className={className}>
      Internal
    </Badge>
  );
}
