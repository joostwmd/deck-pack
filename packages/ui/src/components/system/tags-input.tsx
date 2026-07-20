"use client";

import * as TagsInputPrimitive from "@diceui/tags-input";
import { XIcon } from "@phosphor-icons/react";
import type * as React from "react";

import { badgeVariants } from "@deck-pack/ui/components/system/badge";
import { cn } from "@deck-pack/ui/lib/utils";

function TagsInput({
  className,
  ...props
}: React.ComponentProps<typeof TagsInputPrimitive.Root>) {
  return (
    <TagsInputPrimitive.Root
      data-slot="tags-input"
      className={cn("flex w-full flex-col gap-2", className)}
      {...props}
    />
  );
}

function TagsInputLabel({
  className,
  ...props
}: React.ComponentProps<typeof TagsInputPrimitive.Label>) {
  return (
    <TagsInputPrimitive.Label
      data-slot="tags-input-label"
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className,
      )}
      {...props}
    />
  );
}

function TagsInputList({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="tags-input-list"
      className={cn(
        "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-3xl border border-transparent bg-input/50 px-3 py-1.5 text-sm transition-[color,box-shadow,background-color] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20",
        className,
      )}
      {...props}
    />
  );
}

function TagsInputInput({
  className,
  ...props
}: React.ComponentProps<typeof TagsInputPrimitive.Input>) {
  return (
    <TagsInputPrimitive.Input
      data-slot="tags-input-input"
      className={cn(
        "min-w-24 flex-1 bg-transparent outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function TagsInputItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TagsInputPrimitive.Item>) {
  return (
    <TagsInputPrimitive.Item
      data-slot="tags-input-item"
      className={cn(
        badgeVariants({ variant: "default" }),
        "max-w-[calc(100%-0.5rem)] h-auto min-h-5 gap-1 bg-primary/15 text-primary focus:outline-hidden data-disabled:cursor-not-allowed data-editable:select-none data-editing:bg-transparent data-editing:text-foreground data-disabled:opacity-50 data-editing:ring-1 data-editing:ring-ring [&:not([data-editing])]:pr-1 [&[data-highlighted]:not([data-editing])]:bg-primary/25 [&[data-highlighted]:not([data-editing])]:text-primary",
        className,
      )}
      {...props}
    >
      {children ?? (
        <>
          <TagsInputItemText />
          <TagsInputItemDelete />
        </>
      )}
    </TagsInputPrimitive.Item>
  );
}

function TagsInputItemText({
  className,
  ...props
}: React.ComponentProps<typeof TagsInputPrimitive.ItemText>) {
  return (
    <TagsInputPrimitive.ItemText
      data-slot="tags-input-item-text"
      className={cn("truncate", className)}
      {...props}
    />
  );
}

function TagsInputItemDelete({
  className,
  ...props
}: React.ComponentProps<typeof TagsInputPrimitive.ItemDelete>) {
  return (
    <TagsInputPrimitive.ItemDelete
      data-slot="tags-input-item-delete"
      className={cn(
        "inline-flex size-3.5 shrink-0 items-center justify-center rounded-sm opacity-70 transition-opacity hover:opacity-100",
        className,
      )}
      {...props}
    >
      <XIcon className="size-3" aria-hidden />
      <span className="sr-only">Remove</span>
    </TagsInputPrimitive.ItemDelete>
  );
}

function TagsInputClear({
  ...props
}: React.ComponentProps<typeof TagsInputPrimitive.Clear>) {
  return <TagsInputPrimitive.Clear data-slot="tags-input-clear" {...props} />;
}

export {
  TagsInput,
  TagsInputClear,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDelete,
  TagsInputItemText,
  TagsInputLabel,
  TagsInputList,
};
