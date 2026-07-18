import { Button } from "@deck-pack/ui/components/system/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@deck-pack/ui/components/system/table";
import { Link } from "@tanstack/react-router";

export type OrganizationsListViewProps = {
  loading: boolean;
  errorMessage?: string;
  organizations: Array<{
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    ownerEmail: string | null;
  }>;
};

export function OrganizationsListView({
  loading,
  errorMessage,
  organizations,
}: OrganizationsListViewProps) {
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

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : errorMessage ? (
        <p className="text-destructive text-sm">{errorMessage}</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Owner email</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground h-24 text-center">
                    No organizations yet. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                organizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">
                      <Link
                        to="/organizations/$orgId"
                        params={{ orgId: org.id }}
                        className="hover:underline"
                      >
                        {org.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{org.slug}</TableCell>
                    <TableCell>{org.ownerEmail ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {org.createdAt.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
