import type { NavigationPageId } from "@/constants/navigation";

export type AppShellMode = "office" | "web";

export type AssetsRoute = `/${AppShellMode}/${NavigationPageId}`;

export const ASSETS_PAGE_OPTIONS: { value: NavigationPageId; title: string }[] = [
  { value: "flags", title: "Flags" },
  { value: "logos", title: "Logos" },
  { value: "icons", title: "Icons" },
  { value: "photos", title: "Photos" },
  { value: "harvey-balls", title: "Harvey balls" },
  { value: "slides", title: "Slides" },
  { value: "shapes", title: "Shapes" },
  { value: "agenda", title: "Agenda" },
  { value: "check", title: "Check" },
  { value: "format", title: "Format" },
  { value: "themes", title: "Themes" },
  { value: "account", title: "Account" },
  { value: "shortcuts", title: "Shortcuts" },
];

export function toAssetsRoute(mode: AppShellMode, page: NavigationPageId): AssetsRoute {
  return `/${mode}/${page}`;
}
