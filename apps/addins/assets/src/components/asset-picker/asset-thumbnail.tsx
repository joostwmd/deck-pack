import { cn } from "@deck-pack/ui/lib/utils";

interface AssetThumbnailProps {
  src?: string;
  alt: string;
  size?: number;
  className?: string;
}

export function AssetThumbnail({ src, alt, size = 48, className }: AssetThumbnailProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-sm border border-border bg-background p-1 shadow-md",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt={alt} className="size-full object-contain" />
      ) : (
        <div className="size-full rounded-sm bg-muted" />
      )}
    </div>
  );
}
