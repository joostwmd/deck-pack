import type { LucideIcon } from "lucide-react";

interface LogoEmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function LogoEmptyState({ title, description, icon: Icon }: LogoEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
