export type LogoListItem = {
  id: string;
  imageUrl: string;
  name: string;
  scope?: "global" | "org";
};

export type LogoInsertPayload = {
  type: "image" | "svg";
  imageUrl?: string;
  svg?: string;
};

export type LogoVariantItem = LogoListItem & {
  insert: LogoInsertPayload;
};

export type LogoSearchResponse = {
  results: LogoListItem[];
};

export type LogoDetailsResponse = {
  id: string;
  name: string;
  imageUrl: string;
  variants: LogoVariantItem[];
  metadata: Record<string, string>;
};
