export type LibraryBlobRole =
  | "primary"
  | "thumbnail"
  | "svg"
  | "presentation"
  | "variant_rectangle"
  | "variant_square"
  | "variant_circle";

export type BuildLibraryObjectKeyInput = {
  scope: "global" | "org";
  organizationId?: string;
  assetClass: "flag" | "shape" | "slide";
  libraryItemId: string;
  role: LibraryBlobRole;
  /** File extension without dot, e.g. `svg`, `pptx`, `png`. */
  extension: string;
};

/**
 * Deterministic blob path for library uploads.
 * Kept provider-agnostic so the same key works on Azure or Supabase later.
 */
export function buildLibraryObjectKey(input: BuildLibraryObjectKeyInput): string {
  const extension = input.extension.replace(/^\./, "").toLowerCase();
  if (!extension) {
    throw new Error("extension is required");
  }

  if (input.scope === "org") {
    if (!input.organizationId) {
      throw new Error("organizationId is required when scope is org");
    }
    return [
      "org",
      input.organizationId,
      input.assetClass,
      input.libraryItemId,
      `${input.role}.${extension}`,
    ].join("/");
  }

  return ["global", input.assetClass, input.libraryItemId, `${input.role}.${extension}`].join(
    "/",
  );
}
