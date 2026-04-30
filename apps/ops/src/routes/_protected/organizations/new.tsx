import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

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
import { trpc, trpcClient } from "@/utils/trpc";

export const Route = createFileRoute("/_protected/organizations/new")({
  component: NewOrganizationPage,
});

function slugifyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 128);
}

function NewOrganizationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [lookupEmail, setLookupEmail] = useState<string | null>(null);

  const derivedSlug = useMemo(() => slugifyName(name), [name]);
  const effectiveSlug = slugTouched ? slug : derivedSlug;

  const lookupQuery = useQuery({
    ...trpc.organization.lookupUser.queryOptions({ email: lookupEmail ?? "" }),
    enabled: lookupEmail !== null && lookupEmail.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: (input: { name: string; slug: string; ownerEmail: string }) =>
      trpcClient.organization.createOrganization.mutate(input),
    onSuccess: () => {
      void queryClient.invalidateQueries(trpc.organization.listOrganizations.queryFilter());
      toast.success("Organization created");
      void navigate({ to: "/organizations" });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const onOwnerEmailBlur = useCallback(() => {
    const trimmed = ownerEmail.trim();
    if (!trimmed) {
      setLookupEmail(null);
      return;
    }
    setLookupEmail(trimmed);
  }, [ownerEmail]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = effectiveSlug;
    if (!name.trim() || !s || !ownerEmail.trim()) {
      toast.error("Fill in organization name, slug, and owner email");
      return;
    }
    createMutation.mutate({
      name: name.trim(),
      slug: s,
      ownerEmail: ownerEmail.trim(),
    });
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 -ml-2"
          render={<Link to="/organizations" />}
        >
          ← Back to organizations
        </Button>
        <h1 className="text-xl font-semibold">New organization</h1>
        <p className="text-muted-foreground text-sm">
          Create a customer org and assign an owner by email.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>
            Slug must be unique. Owner receives access on next portal login.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization name</Label>
              <Input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Corp"
                autoComplete="organization"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-slug">Slug</Label>
              <Input
                id="org-slug"
                value={effectiveSlug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                placeholder={derivedSlug || "acme-corp"}
              />
              {!slugTouched && derivedSlug ? (
                <p className="text-muted-foreground text-xs">
                  Auto-generated from name; edit if needed.
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner-email">Owner email</Label>
              <Input
                id="owner-email"
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                onBlur={onOwnerEmailBlur}
                placeholder="founder@customer.com"
                autoComplete="email"
              />
              {lookupEmail && lookupQuery.isFetching ? (
                <p className="text-muted-foreground text-xs">Looking up user…</p>
              ) : null}
              {lookupEmail && lookupQuery.data?.found === true ? (
                <p className="text-xs">
                  <span className="font-medium">Existing user:</span> {lookupQuery.data.name} (
                  {lookupQuery.data.email})
                  {lookupQuery.data.hasOrg ? (
                    <span className="text-destructive">
                      {" "}
                      — already in an organization (create will fail)
                    </span>
                  ) : null}
                </p>
              ) : null}
              {lookupEmail && lookupQuery.data?.found === false ? (
                <p className="text-muted-foreground text-xs">
                  New user will be created on first login.
                </p>
              ) : null}
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating…" : "Create organization"}
              </Button>
              <Button type="button" variant="outline" render={<Link to="/organizations" />}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
