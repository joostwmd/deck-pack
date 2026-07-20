import {
  TagsInput,
  TagsInputClear,
  TagsInputInput,
  TagsInputItem,
  TagsInputLabel,
  TagsInputList,
} from "@deck-pack/ui/components/system/tags-input";
import { cn } from "@deck-pack/ui/lib/utils";

export type TagsInputViewProps = {
  value: string[];
  onValueChange: (tags: string[]) => void;
  /** Return false to reject a tag (e.g. duplicates). */
  onValidate?: (tag: string) => boolean;
  onInvalid?: (tag: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  editable?: boolean;
  addOnPaste?: boolean;
  addOnTab?: boolean;
  delimiter?: string;
  max?: number;
  blurBehavior?: "add" | "clear";
  label?: string;
  placeholder?: string;
  description?: string;
  showClear?: boolean;
  className?: string;
  id?: string;
  name?: string;
};

export function TagsInputView({
  value,
  onValueChange,
  onValidate,
  onInvalid,
  disabled = false,
  readOnly = false,
  editable = true,
  addOnPaste = true,
  addOnTab = true,
  delimiter = ",",
  max,
  blurBehavior = "add",
  label = "Tags",
  placeholder = "Type and press Enter…",
  description,
  showClear = true,
  className,
  id,
  name,
}: TagsInputViewProps) {
  return (
    <TagsInput
      id={id}
      name={name}
      value={value}
      onValueChange={onValueChange}
      onValidate={onValidate}
      onInvalid={onInvalid}
      disabled={disabled}
      readOnly={readOnly}
      editable={editable}
      addOnPaste={addOnPaste}
      addOnTab={addOnTab}
      delimiter={delimiter}
      max={max}
      blurBehavior={blurBehavior}
      className={cn("w-full", className)}
    >
      {label ? <TagsInputLabel>{label}</TagsInputLabel> : null}
      {description ? (
        <p className="text-muted-foreground -mt-1 text-xs">{description}</p>
      ) : null}
      <TagsInputList>
        {value.map((tag) => (
          <TagsInputItem key={tag} value={tag} />
        ))}
        <TagsInputInput placeholder={placeholder} />
      </TagsInputList>
      {showClear && value.length > 0 ? (
        <div className="flex justify-end">
          <TagsInputClear className="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline">
            Clear all
          </TagsInputClear>
        </div>
      ) : null}
    </TagsInput>
  );
}
