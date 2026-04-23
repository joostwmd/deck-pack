import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";

import PublicHeader from "@/components/public-header";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    const session = await context.authClient.getSession();
    if (session.data) {
      redirect({
        to: "/dashboard",
        throw: true,
      });
    }
  },
  component: HomeComponent,
});

const TITLE_TEXT = `
 ██████╗ ███████╗████████╗████████╗███████╗██████╗
 ██╔══██╗██╔════╝╚══██╔══╝╚══██╔══╝██╔════╝██╔══██╗
 ██████╔╝█████╗     ██║      ██║   █████╗  ██████╔╝
 ██╔══██╗██╔══╝     ██║      ██║   ██╔══╝  ██╔══██╗
 ██████╔╝███████╗   ██║      ██║   ███████╗██║  ██║
 ╚═════╝ ╚══════╝   ╚═╝      ╚═╝   ╚══════╝╚═╝  ╚═╝

 ████████╗    ███████╗████████╗ █████╗  ██████╗██╗  ██╗
 ╚══██╔══╝    ██╔════╝╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝
    ██║       ███████╗   ██║   ███████║██║     █████╔╝
    ██║       ╚════██║   ██║   ██╔══██║██║     ██╔═██╗
    ██║       ███████║   ██║   ██║  ██║╚██████╗██║  ██╗
    ╚═╝       ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
 `;

function HomeComponent() {
  const healthCheck = useQuery(trpc.healthCheck.queryOptions());

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PublicHeader />
      <div className="container mx-auto max-w-3xl min-h-0 flex-1 overflow-auto px-4 py-2">
        <pre className="overflow-x-auto font-mono text-sm">{TITLE_TEXT}</pre>
        <div className="grid gap-6">
          <section className="rounded-lg border p-4">
            <h2 className="mb-2 font-medium">API Status</h2>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${healthCheck.data ? "bg-green-500" : "bg-red-500"}`}
              />
              <span className="text-sm text-muted-foreground">
                {healthCheck.isLoading
                  ? "Checking..."
                  : healthCheck.data
                    ? "Connected"
                    : "Disconnected"}
              </span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
