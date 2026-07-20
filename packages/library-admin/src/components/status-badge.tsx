import { Badge } from "@deck-pack/ui/components/system/badge";

import type { LibraryItemStatus } from "@deck-pack/db/library-catalog";

const LABELS: Record<LibraryItemStatus, string> = {
  pending: "Draft",
  ready: "Published",
  archived: "Archived",
};

export function LibraryStatusBadge({ status }: { status: LibraryItemStatus }) {
  const variant =
    status === "ready" ? "default" : status === "archived" ? "outline" : "secondary";
  return <Badge variant={variant}>{LABELS[status]}</Badge>;
}
