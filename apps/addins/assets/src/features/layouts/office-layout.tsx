import type { ReactNode } from "react";

import { AssetsShell } from "@/features/assets-shell";

interface OfficeLayoutProps {
  children: ReactNode;
}

export function OfficeLayout({ children }: OfficeLayoutProps) {
  return (
    <div className="flex h-svh w-full bg-background">
      <div className="flex h-full w-full flex-col overflow-hidden bg-background">
        <AssetsShell mode="office">{children}</AssetsShell>
      </div>
    </div>
  );
}
