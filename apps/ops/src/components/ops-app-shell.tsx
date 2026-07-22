import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
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
import { Fragment } from "react";

import {
  BreadcrumbLabelProvider,
  useBreadcrumbLabels,
} from "@deck-pack/ui/components/composite/breadcrumb-label-context";
import { opsBreadcrumbs } from "@/config/ops-nav";
import { ThemeToggle } from "@deck-pack/ui/components/composite/theme-toggle";

import AppSidebar from "./app-sidebar";
import UserMenu from "./user-menu";

type OpsAppShellProps = {
  children: React.ReactNode;
};

function OpsBreadcrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const dynamicLabels = useBreadcrumbLabels();
  const crumbs = opsBreadcrumbs(pathname, { dynamicLabels });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <Fragment key={`${crumb.label}-${String(index)}`}>
              {index > 0 ? <BreadcrumbSeparator className="hidden sm:block" /> : null}
              <BreadcrumbItem className={index > 0 ? "hidden sm:block" : undefined}>
                {isLast || !crumb.to ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link to={crumb.to} />}>{crumb.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function OpsAppShell({ children }: OpsAppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <BreadcrumbLabelProvider>
          <header className="flex h-16 w-full min-w-0 shrink-0 items-center justify-between gap-2 border-b">
            <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <OpsBreadcrumbs />
            </div>
            <div className="flex shrink-0 items-center gap-2 pr-2">
              <ThemeToggle variant="default" />
              <UserMenu />
            </div>
          </header>
          <div className="w-full min-w-0 p-4">{children}</div>
        </BreadcrumbLabelProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
