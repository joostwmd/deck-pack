import { useState } from "react";
import { toast } from "sonner";

import { useWebCanvas } from "@/contexts/web-canvas-context";
import { downloadCanvasAsPptx } from "@/utils/download-presentation";

export function useCanvasDownloadButtonController() {
  const { items } = useWebCanvas();
  const [isExporting, setIsExporting] = useState(false);

  const handleDownload = async () => {
    if (items.length === 0) {
      toast.error("Add at least one asset to the canvas before downloading.");
      return;
    }

    setIsExporting(true);

    try {
      await downloadCanvasAsPptx(items);
      toast.success("PowerPoint file downloaded.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to download presentation.";
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isExporting,
    onDownload: () => void handleDownload(),
  };
}

export type CanvasDownloadButtonController = ReturnType<typeof useCanvasDownloadButtonController>;
