import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@deck-pack/ui/components/system/breadcrumb";
import { Separator } from "@deck-pack/ui/components/system/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@deck-pack/ui/components/system/sidebar";
import { Link, useRouterState } from "@tanstack/react-router";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

type PortalAppShellProps = {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  areaLabel: string;
  areaHomeTo: "/account" | "/org/dashboard";
};

export function PortalAppShell({ children, sidebar, areaLabel, areaHomeTo }: PortalAppShellProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const pageLabel = (() => {
    if (pathname === "/account") return "Account";
    if (pathname === "/org/dashboard" || pathname === "/org") return "Dashboard";
    if (pathname === "/org/members") return "Members";
    return "Overview";
  })();

  return (
    <SidebarProvider>
      {sidebar}
      <SidebarInset>
        <header className="flex h-16 w-full min-w-0 shrink-0 items-center justify-between gap-2 border-b">
          <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <Link
                    to={areaHomeTo}
                    className="text-muted-foreground text-sm font-medium transition-colors hover:text-foreground"
                  >
                    {areaLabel}
                  </Link>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden sm:block" />
                <BreadcrumbItem className="hidden sm:block">
                  <BreadcrumbPage>{pageLabel}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex shrink-0 items-center gap-2 pr-2">
            <ModeToggle />
            <UserMenu />
          </div>
        </header>
        <div className="w-full min-w-0 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
