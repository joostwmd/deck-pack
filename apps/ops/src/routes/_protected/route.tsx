import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@deck-pack/ui/components/system/sidebar";
import { Separator } from "@deck-pack/ui/components/system/separator";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@deck-pack/ui/components/system/breadcrumb";
import AppSidebar from "@/components/app-sidebar";
import { ThemeToggle } from "@deck-pack/ui/components/composite/theme-toggle";
import UserMenu from "@/components/user-menu";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async ({ context }) => {
    const session = await context.authClient.getSession();
    console.log("session", session);
    if (!session.data || session.data.user.role !== "admin") {
      redirect({
        to: "/",
        throw: true,
      });
    }
    return { session };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { session } = Route.useRouteContext();
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
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Build Your Application</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex shrink-0 items-center gap-2 pr-2">
            <ThemeToggle variant="default" />
            <UserMenu />
          </div>
        </header>
        <div className="w-full min-w-0 p-4">
          <h1>Protected Route</h1>
          <p>Welcome {session.data?.user.name}</p>
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
