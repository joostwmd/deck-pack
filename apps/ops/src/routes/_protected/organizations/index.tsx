import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "@deck-pack/ui/components/system/button";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_protected/organizations/")({
  component: OrganizationsListPage,
});

function OrganizationsListPage() {
  const listQuery = useQuery(trpc.organization.listOrganizations.queryOptions());

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Organizations</h1>
          <p className="text-muted-foreground text-sm">
            Customer organizations and assigned owners
          </p>
        </div>
        <Button render={<Link to="/organizations/new" />}>New organization</Button>
      </div>

      {listQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : listQuery.isError ? (
        <p className="text-destructive text-sm">{listQuery.error.message}</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Slug</th>
                <th className="px-3 py-2 font-medium">Owner email</th>
                <th className="px-3 py-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {listQuery.data?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted-foreground px-3 py-8 text-center">
                    No organizations yet. Create one to get started.
                  </td>
                </tr>
              ) : (
                listQuery.data?.map((org) => (
                  <tr key={org.id} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium">{org.name}</td>
                    <td className="text-muted-foreground px-3 py-2">{org.slug}</td>
                    <td className="px-3 py-2">{org.ownerEmail ?? "—"}</td>
                    <td className="text-muted-foreground px-3 py-2">
                      {org.createdAt.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
