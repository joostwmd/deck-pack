import { Button } from "@deck-pack/ui/components/system/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@deck-pack/ui/components/system/card";
import { Input } from "@deck-pack/ui/components/system/input";
import { Label } from "@deck-pack/ui/components/system/label";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@deck-pack/ui/components/system/table";
import { Link } from "@tanstack/react-router";

import { organizationRoleLabel } from "@/features/organizations/role-label";
import type { OrganizationDetail, OrganizationMember } from "@/services/types";

export type OrganizationDetailViewProps = {
  loading: boolean;
  errorMessage?: string;
  organization?: OrganizationDetail;
  membersLoading: boolean;
  membersErrorMessage?: string;
  members: OrganizationMember[];
  name: string;
  onNameChange: (value: string) => void;
  slug: string;
  onSlugChange: (value: string) => void;
  saving: boolean;
  onSubmit: (event: React.FormEvent) => void;
  dirty: boolean;
};

export function OrganizationDetailView({
  loading,
  errorMessage,
  organization,
  membersLoading,
  membersErrorMessage,
  members,
  name,
  onNameChange,
  slug,
  onSlugChange,
  saving,
  onSubmit,
  dirty,
}: OrganizationDetailViewProps) {
  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }

  if (errorMessage || !organization) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="-ml-2" render={<Link to="/organizations" />}>
          ← Back to organizations
        </Button>
        <p className="text-destructive text-sm">{errorMessage ?? "Organization not found"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" className="mb-2 -ml-2" render={<Link to="/organizations" />}>
          ← Back to organizations
        </Button>
        <h1 className="text-xl font-semibold">{organization.name}</h1>
        <p className="text-muted-foreground text-sm">
          {organization.memberCount} member{organization.memberCount === 1 ? "" : "s"} · Owner{" "}
          {organization.ownerEmail ?? "—"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Update the organization name and slug.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization name</Label>
              <Input
                id="org-name"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                autoComplete="organization"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-slug">Slug</Label>
              <Input
                id="org-slug"
                value={slug}
                onChange={(e) => onSlugChange(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={saving || !dirty}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Members</h2>
          <p className="text-muted-foreground text-sm">
            People with access to this organization
          </p>
        </div>

        {membersLoading ? (
          <p className="text-muted-foreground text-sm">Loading members…</p>
        ) : membersErrorMessage ? (
          <p className="text-destructive text-sm">{membersErrorMessage}</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableCaption>
                {members.length === 0
                  ? "No members yet."
                  : `${String(members.length)} member${members.length === 1 ? "" : "s"}`}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground h-24 text-center">
                      No members in this organization.
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member) => (
                    <TableRow key={member.memberId}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{organizationRoleLabel(member.role)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.createdAt.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
