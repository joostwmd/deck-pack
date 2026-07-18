import { Button } from "@deck-pack/ui/components/system/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@deck-pack/ui/components/system/dialog";
import { useState } from "react";

interface ResetShortcutsDialogProps {
  onConfirm: () => Promise<void>;
}

export function ResetShortcutsDialog({ onConfirm }: ResetShortcutsDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const handleConfirm = async () => {
    setPending(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm">
            Reset all to defaults
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset all shortcuts?</DialogTitle>
          <DialogDescription>
            This removes every custom shortcut and restores the original defaults on your account.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleConfirm()} disabled={pending}>
            {pending ? "Resetting..." : "Reset all"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
