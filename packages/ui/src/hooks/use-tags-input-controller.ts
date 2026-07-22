import { useCallback, useState } from "react";

import type { TagsInputViewProps } from "../components/composite/tags-input-view";

/**
 * Host-injected API for tags. Keep `@deck-pack/ui` free of tRPC — the app
 * passes functions that call the API (e.g. `trpcClient.gallery.suggestAliases.query`).
 */
export type TagsInputApi = {
  /**
   * Optional async suggestions for the current input query.
   * Reserved for combobox-style UIs; the base view does not render a menu yet.
   */
  suggestTags?: (query: string) => Promise<string[]>;
};

export type UseTagsInputControllerOptions = {
  /** Controlled tags. When set, the controller does not own tag state. */
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (tags: string[]) => void;
  /**
   * Extra validation after trim + duplicate checks.
   * Return false (or a reason string) to reject.
   */
  validate?: (tag: string) => boolean | string;
  onInvalid?: (tag: string, reason?: string) => void;
  /** Injected API helpers (suggestions, etc.) — never import tRPC here. */
  api?: TagsInputApi;
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
  id?: string;
  name?: string;
  /** Max tag length after trim. */
  maxLength?: number;
};

export type TagsInputController = TagsInputViewProps & {
  /** Latest suggestion results from `api.suggestTags` (if provided). */
  suggestions: string[];
  /** Fetch suggestions for the current draft query. */
  loadSuggestions: (query: string) => Promise<void>;
};

function normalizeTag(tag: string): string {
  return tag.trim().replace(/\s+/g, " ");
}

export function useTagsInputController(
  options: UseTagsInputControllerOptions = {},
): TagsInputController {
  const isControlled = options.value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState<string[]>(
    () => options.defaultValue ?? [],
  );
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const value = isControlled ? (options.value ?? []) : uncontrolledValue;

  const onValueChange = useCallback(
    (next: string[]) => {
      const normalized = next.map(normalizeTag).filter(Boolean);
      if (!isControlled) {
        setUncontrolledValue(normalized);
      }
      options.onValueChange?.(normalized);
    },
    [isControlled, options.onValueChange],
  );

  const onValidate = useCallback(
    (raw: string) => {
      const tag = normalizeTag(raw);
      if (!tag) {
        options.onInvalid?.(raw, "empty");
        return false;
      }
      if (options.maxLength != null && tag.length > options.maxLength) {
        options.onInvalid?.(tag, "too_long");
        return false;
      }
      const duplicate = value.some((existing) => existing.toLowerCase() === tag.toLowerCase());
      if (duplicate) {
        options.onInvalid?.(tag, "duplicate");
        return false;
      }
      if (options.validate) {
        const result = options.validate(tag);
        if (result === false) {
          options.onInvalid?.(tag, "invalid");
          return false;
        }
        if (typeof result === "string") {
          options.onInvalid?.(tag, result);
          return false;
        }
      }
      return true;
    },
    [value, options.validate, options.onInvalid, options.maxLength],
  );

  const onInvalid = useCallback(
    (tag: string) => {
      options.onInvalid?.(tag);
    },
    [options.onInvalid],
  );

  const loadSuggestions = useCallback(
    async (query: string) => {
      if (!options.api?.suggestTags) {
        setSuggestions([]);
        return;
      }
      const next = await options.api.suggestTags(query);
      setSuggestions(next);
    },
    [options.api],
  );

  return {
    value,
    onValueChange,
    onValidate,
    onInvalid,
    disabled: options.disabled,
    readOnly: options.readOnly,
    editable: options.editable ?? true,
    addOnPaste: options.addOnPaste ?? true,
    addOnTab: options.addOnTab ?? true,
    delimiter: options.delimiter ?? ",",
    max: options.max,
    blurBehavior: options.blurBehavior ?? "add",
    label: options.label,
    placeholder: options.placeholder,
    description: options.description,
    showClear: options.showClear,
    id: options.id,
    name: options.name,
    suggestions,
    loadSuggestions,
  };
}
