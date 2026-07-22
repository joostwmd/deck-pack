import type { GalleryBlobRole } from "@deck-pack/storage";

import type { GalleryUploadRole } from "./domain/gallery-item";

export function extensionFor(role: GalleryUploadRole, contentType: string): string {
  if (role === "svg" || contentType.includes("svg")) return "svg";
  if (role === "presentation") return "pptx";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  if (contentType.includes("webp")) return "webp";
  return "bin";
}

export function toBlobRole(role: GalleryUploadRole): GalleryBlobRole {
  if (role === "rectangle" || role === "square" || role === "circle") {
    return `variant_${role}`;
  }
  return role;
}
