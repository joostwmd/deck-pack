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
import { Link } from "@tanstack/react-router";

export interface NewOrganizationViewProps {
  name: string;
  onNameChange: (value: string) => void;
  effectiveSlug: string;
  derivedSlug: string;
  slugTouched: boolean;
  onSlugChange: (value: string) => void;
  ownerEmail: string;
  onOwnerEmailChange: (value: string) => void;
  onOwnerEmailBlur: () => void;
  lookupEmail: string | null;
  lookupLoading: boolean;
  lookupResult:
    | { found: true; name: string; email: string; hasOrg: boolean }
    | { found: false }
    | undefined;
  submitting: boolean;
  onSubmit: (event: React.FormEvent) => void;
}

export function NewOrganizationView(props: NewOrganizationViewProps) {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
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
          <form onSubmit={props.onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization name</Label>
              <Input
                id="org-name"
                value={props.name}
                onChange={(e) => props.onNameChange(e.target.value)}
                placeholder="Acme Corp"
                autoComplete="organization"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-slug">Slug</Label>
              <Input
                id="org-slug"
                value={props.effectiveSlug}
                onChange={(e) => props.onSlugChange(e.target.value)}
                placeholder={props.derivedSlug || "acme-corp"}
              />
              {!props.slugTouched && props.derivedSlug ? (
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
                value={props.ownerEmail}
                onChange={(e) => props.onOwnerEmailChange(e.target.value)}
                onBlur={props.onOwnerEmailBlur}
                placeholder="founder@customer.com"
                autoComplete="email"
              />
              {props.lookupEmail && props.lookupLoading ? (
                <p className="text-muted-foreground text-xs">Looking up user…</p>
              ) : null}
              {props.lookupEmail && props.lookupResult?.found === true ? (
                <p className="text-xs">
                  <span className="font-medium">Existing user:</span> {props.lookupResult.name} (
                  {props.lookupResult.email})
                  {props.lookupResult.hasOrg ? (
                    <span className="text-destructive">
                      {" "}
                      — already in an organization (create will fail)
                    </span>
                  ) : null}
                </p>
              ) : null}
              {props.lookupEmail && props.lookupResult?.found === false ? (
                <p className="text-muted-foreground text-xs">
                  New user will be created on first login.
                </p>
              ) : null}
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={props.submitting}>
                {props.submitting ? "Creating…" : "Create organization"}
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
