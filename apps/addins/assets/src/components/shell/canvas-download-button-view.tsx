import { Button } from "@deck-pack/ui/components/system/button";
import { FilePptIcon } from "@phosphor-icons/react";

export interface CanvasDownloadButtonViewProps {
  isExporting: boolean;
  onDownload: () => void;
}

export function CanvasDownloadButtonView({ isExporting, onDownload }: CanvasDownloadButtonViewProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      className="absolute bottom-6 left-6 z-10 shadow-sm"
      onClick={onDownload}
      disabled={isExporting}
      aria-label="Download canvas as PowerPoint file"
    >
      <FilePptIcon className="size-4" aria-hidden />
      {isExporting ? "Exporting..." : "Download .pptx"}
    </Button>
  );
}
