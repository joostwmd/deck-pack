import { WebCanvasProvider } from "@/contexts/web-canvas-context";
import { AssetsShell } from "@/features/assets-shell";

import { WebCanvas } from "./web-canvas";

export function WebLayout() {
  return (
    <WebCanvasProvider>
      <div className="flex h-svh overflow-hidden">
        <WebCanvas />
        <aside className="flex h-svh w-[380px] shrink-0 flex-col border-l bg-background">
          <AssetsShell mode="web" />
        </aside>
      </div>
    </WebCanvasProvider>
  );
}
