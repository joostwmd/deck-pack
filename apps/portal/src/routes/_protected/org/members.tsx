import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/org/members")({
  component: OrgMembersPage,
});

function OrgMembersPage() {
  const { activeOrganizationId } = Route.useRouteContext();

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">Members</h1>
      <p className="text-sm text-muted-foreground">Org: {activeOrganizationId}</p>
      <p>Member list (stub) — add team management here.</p>
    </div>
  );
}
