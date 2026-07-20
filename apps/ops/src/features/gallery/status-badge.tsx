import { Badge } from "@deck-pack/ui/components/system/badge";

import type { LibraryItemStatus } from "@/services/types";

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
