import type { PhotoSearchRequest, PhotoSearchResponse } from "./types";
import { PhotoSearchView } from "./photo-search-view";
import { usePhotoSearchController } from "@/hooks/photos/use-photo-search-controller";

interface PhotoSearchPanelProps {
  search: (input: PhotoSearchRequest) => Promise<PhotoSearchResponse>;
}

export function PhotoSearchPanel({ search }: PhotoSearchPanelProps) {
  const controller = usePhotoSearchController(search);

  return <PhotoSearchView controller={controller} />;
}
