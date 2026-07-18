import { Button } from "@deck-pack/ui/components/system/button";
import type { Applicability, FormattingActionId } from "@deck-pack/presentation-formatting";

interface FormatActionButtonProps {
  id: FormattingActionId;
  label: string;
  description?: string;
  applicability: Applicability;
  busy?: boolean;
  onClick: (id: FormattingActionId) => void;
}

export function FormatActionButton({
  id,
  label,
  description,
  applicability,
  busy = false,
  onClick,
}: FormatActionButtonProps) {
  const disabled = !applicability.applicable || busy;
  const reason = applicability.applicable ? undefined : applicability.reason;

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="justify-start"
        disabled={disabled}
        onClick={() => onClick(id)}
      >
        {busy ? "Applying..." : label}
      </Button>
      {reason ? <p className="text-xs text-muted-foreground">{reason}</p> : null}
      {!reason && description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
    </div>
  );
}
