import type { ReactNode } from "react";

import { WebCanvasProvider } from "@/contexts/web-canvas-context";
import { AssetsShell } from "@/components/shell/assets-shell";

import { WebCanvas } from "./web-canvas";

interface WebLayoutProps {
  children: ReactNode;
}

export function WebLayout({ children }: WebLayoutProps) {
  return (
    <WebCanvasProvider>
      <div className="flex h-svh w-full min-w-0 flex-1 overflow-hidden">
        <WebCanvas />
        <aside className="flex h-svh w-[480px] shrink-0 flex-col border-l bg-background">
          <AssetsShell mode="web">{children}</AssetsShell>
        </aside>
      </div>
    </WebCanvasProvider>
  );
}
