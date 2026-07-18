import { OpsPageShell } from "@/components/ops-page-shell";

export function UsersPage() {
  return (
    <OpsPageShell
      title="Users"
      description="Search platform users, view memberships, and manage access"
    >
      <div className="text-muted-foreground rounded-lg border border-dashed px-4 py-12 text-center text-sm">
        User management UI is coming next — list, search, and impersonation will live here.
      </div>
    </OpsPageShell>
  );
}
