import type { ReactNode } from "react";

export interface AssetBrowserShellProps {
  liveMessage?: string;
  header?: ReactNode;
  toolbar?: ReactNode;
  results?: ReactNode;
  footer?: ReactNode;
}

export function AssetBrowserShell({
  liveMessage,
  header,
  toolbar,
  results,
  footer,
}: AssetBrowserShellProps) {
  return (
    <div className="flex flex-1 flex-col">
      {liveMessage ? (
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {liveMessage}
        </div>
      ) : null}

      {header}

      {toolbar ? <div className="px-4 pt-3">{toolbar}</div> : null}

      {results ? <div className="flex min-h-0 flex-1 flex-col px-4 pt-3">{results}</div> : null}

      {footer ? <div className="mt-auto px-4 pb-4 pt-3">{footer}</div> : null}
    </div>
  );
}
