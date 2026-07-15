import { Button } from "@deck-pack/ui/components/system/button";
import { cn } from "@deck-pack/ui/lib/utils";
import { Keyboard } from "@phosphor-icons/react";
import { useNavigate } from "@tanstack/react-router";

import type { AppEnvironment } from "@/lib/navigation";
import { getPageRouteParams, getPageRouteTo } from "@/lib/navigation";

export function ShortcutSettingsButton({ environment }: { environment: AppEnvironment }) {
  const navigate = useNavigate();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Shortcut settings"
      onClick={() =>
        navigate({
          to: getPageRouteTo("shortcuts"),
          params: getPageRouteParams(environment),
        })
      }
    >
      <Keyboard className="size-4" />
    </Button>
  );
}
