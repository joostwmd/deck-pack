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
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/60 p-1.5",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-1.5 rounded-sm bg-muted" aria-hidden />
      {src ? (
        <img
          src={src}
          alt={alt}
          decoding="async"
          className="relative size-full object-contain"
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
      ) : null}
    </div>
  );
}
