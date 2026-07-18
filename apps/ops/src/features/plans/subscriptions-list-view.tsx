import { Badge } from "@deck-pack/ui/components/system/badge";
import { Button } from "@deck-pack/ui/components/system/button";
import { Input } from "@deck-pack/ui/components/system/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@deck-pack/ui/components/system/table";
import { Link } from "@tanstack/react-router";

import type { OrganizationSubscription } from "@/services/types";

export type SubscriptionsListViewProps = {
  loading: boolean;
  errorMessage?: string;
  subscriptions: OrganizationSubscription[];
  editingId: string | null;
  editQuantity: string;
  onEditQuantityChange: (value: string) => void;
  onStartEdit: (subscription: OrganizationSubscription) => void;
  onCancelEdit: () => void;
  onSaveQuantity: (subscriptionId: string) => void;
  saving: boolean;
};

export function SubscriptionsListView({
  loading,
  errorMessage,
  subscriptions,
  editingId,
  editQuantity,
  onEditQuantityChange,
  onStartEdit,
  onCancelEdit,
  onSaveQuantity,
  saving,
}: SubscriptionsListViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground text-sm">
            Organization plan entitlements — quantity is the seat count
          </p>
        </div>
        <Button render={<Link to="/plans/subscriptions/new" />}>New subscription</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : errorMessage ? (
        <p className="text-destructive text-sm">{errorMessage}</p>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Organization</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="w-[100px]">Seats</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[180px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground h-24 text-center">
                    No organization subscriptions yet.
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((sub) => {
                  const isEditing = editingId === sub.id;
                  return (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div className="font-medium">{sub.organizationName}</div>
                        <div className="text-muted-foreground text-xs">{sub.organizationSlug}</div>
                      </TableCell>
                      <TableCell>{sub.planName}</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            min={1}
                            step={1}
                            className="w-24"
                            value={editQuantity}
                            onChange={(e) => onEditQuantityChange(e.target.value)}
                            disabled={saving}
                          />
                        ) : (
                          sub.quantity
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={sub.status === "active" ? "default" : "secondary"}>
                          {sub.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              disabled={saving}
                              onClick={() => onSaveQuantity(sub.id)}
                            >
                              {saving ? "Saving…" : "Save"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={saving}
                              onClick={onCancelEdit}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={sub.status !== "active"}
                            onClick={() => onStartEdit(sub)}
                          >
                            Edit seats
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
