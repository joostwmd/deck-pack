export type IconListItem = {
  id: string;
  imageUrl: string;
  name: string;
  scope?: "global" | "org";
};

export type IconInsertPayload = {
  type: "image" | "svg";
  imageUrl?: string;
  svg?: string;
};

export type IconVariantItem = IconListItem & {
  insert: IconInsertPayload;
};

export type IconSearchResponse = {
  results: IconListItem[];
};

export type IconDetailsResponse = {
  id: string;
  name: string;
  imageUrl: string;
  variants: IconVariantItem[];
  metadata: Record<string, string>;
};
