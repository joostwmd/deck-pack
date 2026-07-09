import { useWebCanvas } from "@/contexts/web-canvas-context";

export function WebCanvas() {
  const { item } = useWebCanvas();

  return (
    <main className="flex min-w-0 flex-1 items-center justify-center bg-muted/40 p-6 md:p-10">
      <div className="aspect-[16/9] w-full max-w-5xl overflow-hidden rounded-sm border bg-white shadow-sm">
        {item ? (
          <div className="flex h-full items-center justify-center p-12">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center px-8 text-center text-sm text-muted-foreground">
            Your slide preview will appear here. Search for an asset in the sidebar and add it to
            the canvas.
          </div>
        )}
      </div>
    </main>
  );
}
