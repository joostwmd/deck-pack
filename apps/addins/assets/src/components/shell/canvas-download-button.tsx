import { CanvasDownloadButtonView } from "@/components/shell/canvas-download-button-view";
import { useCanvasDownloadButtonController } from "@/components/shell/use-canvas-download-button-controller";

export function CanvasDownloadButton() {
  const controller = useCanvasDownloadButtonController();

  return (
    <CanvasDownloadButtonView isExporting={controller.isExporting} onDownload={controller.onDownload} />
  );
}
