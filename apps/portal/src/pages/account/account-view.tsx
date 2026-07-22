import { Button } from "@deck-pack/ui/components/system/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@deck-pack/ui/components/system/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@deck-pack/ui/components/system/dialog";
import { useState } from "react";

import { PortalPageShell } from "@/components/portal-page-shell";

export type AccountViewProps = {
  name?: string | null;
  email?: string | null;
  addinOnly?: boolean;
  deleting?: boolean;
  onDeleteAccount?: () => void | Promise<void>;
};

export function AccountView({
  name,
  email,
  addinOnly,
  deleting = false,
  onDeleteAccount,
}: AccountViewProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <PortalPageShell
      title="Account"
      description={
        addinOnly
          ? "Your organization access is through the DeckPack add-in in PowerPoint."
          : `${email ?? "—"} · personal account`
      }
    >
      {addinOnly ? (
        <p className="text-muted-foreground text-sm">
          Portal administration is not available for add-in-only users. Open PowerPoint and use the
          DeckPack add-in to get started.
        </p>
      ) : null}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your signed-in Deck Pack account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                Name
              </p>
              <p className="text-base font-medium">{name ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                Email
              </p>
              <p className="text-base font-medium">{email ?? "—"}</p>
            </div>
          </CardContent>
        </Card>

        {onDeleteAccount ? (
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-destructive">Danger zone</CardTitle>
              <CardDescription>
                Permanently delete your account and associated solo workspace data. This cannot be
                undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogTrigger
                  render={
                    <Button type="button" variant="destructive" disabled={deleting}>
                      Delete account
                    </Button>
                  }
                />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete your account?</DialogTitle>
                    <DialogDescription>
                      Are you sure? This permanently deletes your account. If you own a team
                      organization, transfer ownership first.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDeleteOpen(false)}
                      disabled={deleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={deleting}
                      onClick={() => {
                        void (async () => {
                          await onDeleteAccount();
                          setDeleteOpen(false);
                        })();
                      }}
                    >
                      {deleting ? "Deleting…" : "Delete account"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </PortalPageShell>
  );
}
