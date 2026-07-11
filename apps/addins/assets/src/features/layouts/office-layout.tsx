import { AssetsShell } from "@/features/assets-shell";

export function OfficeLayout() {
  return (
    <div className="flex h-svh w-full bg-background">
      <div className="flex h-full w-full flex-col overflow-hidden bg-background">
        <AssetsShell mode="office" />
      </div>
    </div>
  );
}
