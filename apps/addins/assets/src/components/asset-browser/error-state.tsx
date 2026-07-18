import { Button } from "@deck-pack/ui/components/system/button";
import { WarningCircle } from "@phosphor-icons/react";

interface ErrorStateProps {
  title: string;
  description: string;
  onRetry: () => void | Promise<void>;
}

export function ErrorState({ title, description, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      <WarningCircle className="size-6 text-destructive" aria-hidden />
      <div className="max-w-64 space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => void onRetry()}>
        Try again
      </Button>
    </div>
  );
}
