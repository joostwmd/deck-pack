import type { ShortcutDef } from "@/lib/shortcuts";
import { SHORTCUTS } from "@/lib/shortcuts";

export type AppEnvironment = "office" | "web";

export const APP_ENVIRONMENTS = ["office", "web"] as const satisfies readonly AppEnvironment[];

export function isAppEnvironment(value: string): value is AppEnvironment {
  return APP_ENVIRONMENTS.includes(value as AppEnvironment);
}

export type NavigationSection = "assets" | "utilities" | "settings";

export type NavigationPageId =
  | "logos"
  | "flags"
  | "icons"
  | "photos"
  | "harvey-balls"
  | "slides"
  | "shapes"
  | "agenda"
  | "check"
  | "format"
  | "themes"
  | "account"
  | "shortcuts";

export interface NavigationPage {
  id: NavigationPageId;
  label: string;
  section: NavigationSection;
  path: NavigationPageId;
  shortcut?: ShortcutDef;
}

export const NAVIGATION_SECTIONS: { id: NavigationSection; label: string }[] = [
  { id: "assets", label: "Assets" },
  { id: "utilities", label: "Utilities" },
  { id: "settings", label: "Settings" },
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
    id: "harvey-balls",
    label: "Harvey balls",
    section: "assets",
    path: "harvey-balls",
    shortcut: SHORTCUTS["harvey-balls"],
  },
  {
    id: "slides",
    label: "Slides",
    section: "assets",
    path: "slides",
    shortcut: SHORTCUTS.slides,
  },
  {
    id: "shapes",
    label: "Shapes",
    section: "assets",
    path: "shapes",
    shortcut: SHORTCUTS.shapes,
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
  {
    id: "themes",
    label: "Themes",
    section: "utilities",
    path: "themes",
    shortcut: SHORTCUTS.themes,
  },
  {
    id: "account",
    label: "Account",
    section: "settings",
    path: "account",
  },
  {
    id: "shortcuts",
    label: "Shortcuts",
    section: "settings",
    path: "shortcuts",
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

export function getNavigationPagesWithShortcuts(): NavigationPage[] {
  return NAVIGATION_PAGES.filter((page): page is NavigationPage & { shortcut: ShortcutDef } =>
    Boolean(page.shortcut),
  );
}

export const PAGE_ROUTE_TO = {
  logos: "/$environment/logos",
  flags: "/$environment/flags",
  icons: "/$environment/icons",
  photos: "/$environment/photos",
  "harvey-balls": "/$environment/harvey-balls",
  slides: "/$environment/slides",
  shapes: "/$environment/shapes",
  agenda: "/$environment/agenda",
  check: "/$environment/check",
  format: "/$environment/format",
  themes: "/$environment/themes",
  account: "/$environment/account",
  shortcuts: "/$environment/shortcuts",
} as const satisfies Record<NavigationPageId, string>;

export function getPageRouteTo(pageId: NavigationPageId) {
  return PAGE_ROUTE_TO[pageId];
}

export function getPageRouteParams(environment: AppEnvironment) {
  return { environment } as const;
}
