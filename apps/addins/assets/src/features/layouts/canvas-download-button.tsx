import { CanvasDownloadButtonView } from "@/features/layouts/canvas-download-button-view";
import { useCanvasDownloadButtonController } from "@/features/layouts/use-canvas-download-button-controller";

export function CanvasDownloadButton() {
  const controller = useCanvasDownloadButtonController();

  return (
    <CanvasDownloadButtonView isExporting={controller.isExporting} onDownload={controller.onDownload} />
  );
}
