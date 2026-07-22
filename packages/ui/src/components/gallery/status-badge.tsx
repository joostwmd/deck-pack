import { Badge } from "@deck-pack/ui/components/system/badge";

import type { GalleryItemStatus } from "@deck-pack/db/gallery-catalog";

const LABELS: Record<GalleryItemStatus, string> = {
  pending: "Draft",
  ready: "Published",
  archived: "Archived",
};

export function GalleryStatusBadge({ status }: { status: GalleryItemStatus }) {
  const variant = status === "ready" ? "default" : status === "archived" ? "outline" : "secondary";
  return <Badge variant={variant}>{LABELS[status]}</Badge>;
}
