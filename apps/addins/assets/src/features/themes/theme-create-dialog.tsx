import { Button } from "@deck-pack/ui/components/system/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@deck-pack/ui/components/system/dialog";
import { Input } from "@deck-pack/ui/components/system/input";
import { Label } from "@deck-pack/ui/components/system/label";
import { DEFAULT_BRAND_PROFILE_CONFIGURATION } from "@deck-pack/presentation-check";
import { extractThemeDraftFromPresentation } from "@deck-pack/office-js";
import { useState } from "react";
import { toast } from "sonner";

import { PowerPointGuard } from "@/components/power-point-guard";

interface ThemeCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateManual: () => void;
  onCreateFromDraft: (draft: {
    name: string;
    configuration: typeof DEFAULT_BRAND_PROFILE_CONFIGURATION;
  }) => void;
}

export function ThemeCreateDialog({
  open,
  onOpenChange,
  onCreateManual,
  onCreateFromDraft,
}: ThemeCreateDialogProps) {
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    setImporting(true);
    try {
      const draft = await extractThemeDraftFromPresentation();
      onCreateFromDraft({
        name: draft.suggestedName,
        configuration: draft.configuration,
      });
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to extract theme");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create theme</DialogTitle>
          <DialogDescription>
            Start from scratch or extract typography and colors from the open presentation.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Button type="button" onClick={onCreateManual}>
            Start from scratch
          </Button>
          <PowerPointGuard powerpointRequired>
            <Button
              type="button"
              variant="outline"
              disabled={importing}
              onClick={() => void handleImport()}
            >
              {importing ? "Extracting..." : "Create from current presentation"}
            </Button>
          </PowerPointGuard>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ThemeImportReviewProps {
  name: string;
  onNameChange: (name: string) => void;
  headingFonts: string;
  bodyFonts: string;
  onHeadingFontsChange: (value: string) => void;
  onBodyFontsChange: (value: string) => void;
}

export function ThemeImportReview({
  name,
  onNameChange,
  headingFonts,
  bodyFonts,
  onHeadingFontsChange,
  onBodyFontsChange,
}: ThemeImportReviewProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="import-name">Theme name</Label>
        <Input id="import-name" value={name} onChange={(event) => onNameChange(event.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="import-heading">Detected heading fonts</Label>
        <Input
          id="import-heading"
          value={headingFonts}
          onChange={(event) => onHeadingFontsChange(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="import-body">Detected body fonts</Label>
        <Input
          id="import-body"
          value={bodyFonts}
          onChange={(event) => onBodyFontsChange(event.target.value)}
        />
      </div>
    </div>
  );
}
