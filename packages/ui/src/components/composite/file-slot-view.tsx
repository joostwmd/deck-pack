import { Check, File as FileIcon, WarningCircle } from "@phosphor-icons/react";

import { Button } from "@deck-pack/ui/components/system/button";
import { FileUploaderView } from "@deck-pack/ui/components/composite/file-uploader-view";
import type { FileSlotController } from "@deck-pack/ui/hooks/use-file-slot-controller";
import type { FileSlotCurrent } from "@deck-pack/ui/lib/file-slot-machine";
import { cn } from "@deck-pack/ui/lib/utils";

export type FileSlotViewProps = {
  slot: FileSlotController;
  className?: string;
};

function formatBytes(bytes: number | undefined): string | null {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return null;
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function displayNameFor(current: FileSlotCurrent): string {
  if (current.name && current.name !== current.blobPath) return current.name;
  const base = current.blobPath.split("/").pop();
  return base && base.length > 0 ? base : current.name || "Attached file";
}

function CurrentFileCard({
  current,
  statusLabel,
  onReplace,
  onCancelReplace,
  replacing,
  disabled,
}: {
  current: FileSlotCurrent;
  statusLabel: string;
  onReplace?: () => void;
  onCancelReplace?: () => void;
  replacing?: boolean;
  disabled?: boolean;
}) {
  const sizeLabel = formatBytes(current.byteSize);

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-muted/20 px-3 py-2.5">
      <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
        <FileIcon className="text-muted-foreground size-5" weight="regular" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{displayNameFor(current)}</p>
        <p className="text-muted-foreground truncate text-xs">
          {statusLabel}
          {sizeLabel ? ` · ${sizeLabel}` : null}
        </p>
      </div>
      {!disabled ? (
        replacing ? (
          <Button type="button" variant="ghost" size="sm" onClick={onCancelReplace}>
            Cancel
          </Button>
        ) : onReplace ? (
          <Button type="button" variant="outline" size="sm" onClick={onReplace}>
            Replace
          </Button>
        ) : null
      ) : null}
    </div>
  );
}

function SlotStatusBadge({ missing }: { missing: boolean }) {
  if (missing) {
    return (
      <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
        <WarningCircle className="size-3.5" aria-hidden />
        Missing
      </span>
    );
  }
  return (
    <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
      <Check className="size-3.5" aria-hidden />
      Attached
    </span>
  );
}

export function FileSlotView({ slot, className }: FileSlotViewProps) {
  const {
    state,
    dispatch,
    uploader,
    showDropzone,
    showCurrentCard,
    currentForCard,
    needsUploader,
    label,
    disabled,
  } = slot;

  const missing = state.status === "empty" || (state.status === "error" && !state.current);
  const showMissingBadge = missing;

  return (
    <div className={cn("space-y-2 rounded-xl border p-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{label}</p>
        {state.status === "uploading" ? (
          <span className="text-muted-foreground text-xs">Uploading…</span>
        ) : (
          <SlotStatusBadge missing={showMissingBadge} />
        )}
      </div>

      {state.status === "error" ? (
        <p className="text-destructive text-xs">{state.message}</p>
      ) : null}

      {showCurrentCard && currentForCard ? (
        <CurrentFileCard
          current={currentForCard}
          statusLabel={
            state.status === "replacing"
              ? "Choose a replacement file"
              : state.status === "uploading"
                ? "Previous file"
                : "Ready"
          }
          replacing={state.status === "replacing"}
          disabled={disabled || state.status === "uploading"}
          onReplace={
            disabled || state.status === "uploading"
              ? undefined
              : () => dispatch({ type: "REPLACE" })
          }
          onCancelReplace={() => dispatch({ type: "CANCEL_REPLACE" })}
        />
      ) : null}

      {needsUploader && !disabled ? (
        <FileUploaderView
          {...uploader}
          showDropzone={showDropzone}
          compact
          forceFileIcon
          maxFiles={1}
          multiple={false}
          label={state.status === "replacing" ? `Replace ${label}` : `Add ${label}`}
          selectLabel={state.status === "replacing" ? "Select replacement" : "Select file"}
        />
      ) : null}

      {disabled && missing ? (
        <p className="text-muted-foreground text-sm">This slot cannot accept uploads.</p>
      ) : null}
    </div>
  );
}
