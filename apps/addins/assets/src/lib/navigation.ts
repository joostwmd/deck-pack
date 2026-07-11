import type { ShortcutDef } from "@/lib/shortcuts";
import { SHORTCUTS } from "@/lib/shortcuts";

export type AppEnvironment = "office" | "web";

export const APP_ENVIRONMENTS = ["office", "web"] as const satisfies readonly AppEnvironment[];

export function isAppEnvironment(value: string): value is AppEnvironment {
  return APP_ENVIRONMENTS.includes(value as AppEnvironment);
}

export type NavigationSection = "assets" | "utilities";

export type NavigationPageId =
  | "logos"
  | "flags"
  | "icons"
  | "photos"
  | "balls"
  | "slides"
  | "agenda"
  | "check"
  | "format";

export interface NavigationPage {
  id: NavigationPageId;
  label: string;
  section: NavigationSection;
  path: NavigationPageId;
  shortcut: ShortcutDef;
}

export const NAVIGATION_SECTIONS: { id: NavigationSection; label: string }[] = [
  { id: "assets", label: "Assets" },
  { id: "utilities", label: "Utilities" },
];

export const NAVIGATION_PAGES: NavigationPage[] = [
  {
    id: "flags",
    label: "Flags",
    section: "assets",
    path: "flags",
    shortcut: SHORTCUTS.flags,
  },
  {
    id: "icons",
    label: "Icons",
    section: "assets",
    path: "icons",
    shortcut: SHORTCUTS.icons,
  },
  {
    id: "logos",
    label: "Logos",
    section: "assets",
    path: "logos",
    shortcut: SHORTCUTS.logos,
  },
  {
    id: "photos",
    label: "Photos",
    section: "assets",
    path: "photos",
    shortcut: SHORTCUTS.photos,
  },
  {
    id: "balls",
    label: "Balls",
    section: "assets",
    path: "balls",
    shortcut: SHORTCUTS.balls,
  },
  {
    id: "slides",
    label: "Slides",
    section: "assets",
    path: "slides",
    shortcut: SHORTCUTS.slides,
  },
  {
    id: "agenda",
    label: "Agenda",
    section: "utilities",
    path: "agenda",
    shortcut: SHORTCUTS.agenda,
  },
  {
    id: "check",
    label: "Check",
    section: "utilities",
    path: "check",
    shortcut: SHORTCUTS.check,
  },
  {
    id: "format",
    label: "Format",
    section: "utilities",
    path: "format",
    shortcut: SHORTCUTS.format,
  },
];

export const DEFAULT_NAVIGATION_PAGE_ID: NavigationPageId = "logos";

export function getNavigationPagesBySection(section: NavigationSection): NavigationPage[] {
  return NAVIGATION_PAGES.filter((page) => page.section === section);
}

export function getNavigationPageById(id: NavigationPageId): NavigationPage | undefined {
  return NAVIGATION_PAGES.find((page) => page.id === id);
}

export function getNavigationPageByPath(path: string): NavigationPage | undefined {
  return NAVIGATION_PAGES.find((page) => page.path === path);
}

export const PAGE_ROUTE_TO = {
  logos: "/$environment/logos",
  flags: "/$environment/flags",
  icons: "/$environment/icons",
  photos: "/$environment/photos",
  balls: "/$environment/balls",
  slides: "/$environment/slides",
  agenda: "/$environment/agenda",
  check: "/$environment/check",
  format: "/$environment/format",
} as const satisfies Record<NavigationPageId, string>;

export function getPageRouteTo(pageId: NavigationPageId) {
  return PAGE_ROUTE_TO[pageId];
}

export function getPageRouteParams(environment: AppEnvironment) {
  return { environment } as const;
}
