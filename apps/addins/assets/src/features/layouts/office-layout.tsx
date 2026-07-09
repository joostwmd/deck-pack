import { AssetsShell } from "@/features/assets-shell";

export function OfficeLayout() {
  return (
    <div className="flex h-svh justify-center bg-background">
      <div className="flex h-full w-full max-w-[400px] flex-col overflow-hidden bg-background">
        <AssetsShell mode="office" />
      </div>
    </div>
  );
}
