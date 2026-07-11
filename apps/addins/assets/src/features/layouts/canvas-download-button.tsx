import { Button } from "@deck-pack/ui/components/system/button";
import { FilePptIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";

import { useWebCanvas } from "@/contexts/web-canvas-context";
import { downloadCanvasAsPptx } from "@/lib/download-presentation";

export function CanvasDownloadButton() {
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

  return (
    <Button
      type="button"
      variant="secondary"
      className="absolute bottom-6 left-6 z-10 shadow-sm"
      onClick={() => void handleDownload()}
      disabled={isExporting}
      aria-label="Download canvas as PowerPoint file"
    >
      <FilePptIcon className="size-4" aria-hidden />
      {isExporting ? "Exporting..." : "Download .pptx"}
    </Button>
  );
}
