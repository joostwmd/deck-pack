import { Info } from "@phosphor-icons/react";
import { Button } from "@deck-pack/ui/components/system/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@deck-pack/ui/components/system/dialog";
import { useState } from "react";

import { ShortcutRulesContent } from "@/components/shortcuts/settings/shortcut-rules-help";

export function ShortcutRulesDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="How shortcuts work"
          >
            <Info className="size-4" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How shortcuts work</DialogTitle>
          <DialogDescription>
            Shortcuts use one key combination at a time and save to your account.
          </DialogDescription>
        </DialogHeader>
        <ShortcutRulesContent />
      </DialogContent>
    </Dialog>
  );
}
