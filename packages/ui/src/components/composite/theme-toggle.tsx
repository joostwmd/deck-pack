import { Button } from "@deck-pack/ui/components/system/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@deck-pack/ui/components/system/dropdown-menu";
import { useTheme } from "@deck-pack/ui/components/system/theme-provider";
import { Desktop, Moon, Sun } from "@phosphor-icons/react";

export type ThemeToggleVariant = "default" | "enhanced";
export type ThemeToggleSize = "default" | "sm";

export interface ThemeToggleProps {
  /** Basic dropdown (portal/ops) or enhanced with icons and active state (assets). */
  variant?: ThemeToggleVariant;
  /** Trigger button size: default uses icon, sm uses icon-sm. */
  size?: ThemeToggleSize;
}

export function ThemeToggle({ variant = "enhanced", size = "default" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const isEnhanced = variant === "enhanced";
  const triggerSize = size === "sm" ? "icon-sm" : "icon";
  const triggerVariant = isEnhanced ? "ghost" : "outline";
  const iconClass = isEnhanced ? "size-4" : "h-[1.2rem] w-[1.2rem]";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant={triggerVariant}
            size={triggerSize}
            aria-label={isEnhanced ? "Select theme" : undefined}
          />
        }
      >
        <Sun
          className={`${iconClass} scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90`}
        />
        <Moon
          className={`absolute ${iconClass} scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0`}
        />
        <span className="sr-only">{isEnhanced ? "Select theme" : "Toggle theme"}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          {isEnhanced ? <Sun className="size-4" /> : null}
          Light
          {isEnhanced && theme === "light" ? (
            <span className="ml-auto text-xs text-muted-foreground">Active</span>
          ) : null}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          {isEnhanced ? <Moon className="size-4" /> : null}
          Dark
          {isEnhanced && theme === "dark" ? (
            <span className="ml-auto text-xs text-muted-foreground">Active</span>
          ) : null}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          {isEnhanced ? <Desktop className="size-4" /> : null}
          System
          {isEnhanced && theme === "system" ? (
            <span className="ml-auto text-xs text-muted-foreground">Active</span>
          ) : null}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** @deprecated Use ThemeToggle with variant="default" instead. */
export function ModeToggle() {
  return <ThemeToggle variant="default" />;
}
