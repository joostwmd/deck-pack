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

import { opsPageLabel } from "@/config/ops-nav";
import { ThemeToggle } from "@deck-pack/ui/components/composite/theme-toggle";

import AppSidebar from "./app-sidebar";
import UserMenu from "./user-menu";

type OpsAppShellProps = {
  children: React.ReactNode;
};

export function OpsAppShell({ children }: OpsAppShellProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const pageLabel = opsPageLabel(pathname);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 w-full min-w-0 shrink-0 items-center justify-between gap-2 border-b">
          <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <Link
                    to="/dashboard"
                    className="text-muted-foreground text-sm font-medium transition-colors hover:text-foreground"
                  >
                    Ops
                  </Link>
                </BreadcrumbItem>
                {pathname !== "/dashboard" ? (
                  <>
                    <BreadcrumbSeparator className="hidden sm:block" />
                    <BreadcrumbItem className="hidden sm:block">
                      <BreadcrumbPage>{pageLabel}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                ) : null}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex shrink-0 items-center gap-2 pr-2">
            <ThemeToggle variant="default" />
            <UserMenu />
          </div>
        </header>
        <div className="w-full min-w-0 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
