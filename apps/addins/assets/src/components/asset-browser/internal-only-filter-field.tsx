import { Checkbox } from "@deck-pack/ui/components/system/checkbox";
import { Label } from "@deck-pack/ui/components/system/label";

interface InternalOnlyFilterFieldProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function InternalOnlyFilterField({
  id,
  checked,
  onCheckedChange,
}: InternalOnlyFilterFieldProps) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <Label htmlFor={id} className="text-xs font-medium text-foreground">
        Internal only
      </Label>
    </div>
  );
}
