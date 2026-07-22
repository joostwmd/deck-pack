import type { ReactElement } from "react";

import { Badge } from "@deck-pack/ui/components/system/badge";
import { Button } from "@deck-pack/ui/components/system/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@deck-pack/ui/components/system/dialog";
import { Input } from "@deck-pack/ui/components/system/input";
import { Label } from "@deck-pack/ui/components/system/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@deck-pack/ui/components/system/table";

import type { OrganizationSeat } from "./types";

function seatStatusLabel(status: string): string {
  if (status === "pending") return "Pending";
  if (status === "active") return "Active";
  return status;
}

export type SeatsViewProps = {
  loading: boolean;
  errorMessage?: string;
  seats: OrganizationSeat[];
  revokePending: boolean;
  canRevoke: boolean;
  onRevokeSeat: (seatId: string) => void;
};

export function SeatsView({
  loading,
  errorMessage,
  seats,
  revokePending,
  canRevoke,
  onRevokeSeat,
}: SeatsViewProps) {
  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading seats…</p>;
  }

  if (errorMessage) {
    return <p className="text-destructive text-sm">{errorMessage}</p>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assigned</TableHead>
            <TableHead>Activated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {seats.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground h-24 text-center">
                No seats assigned yet.
              </TableCell>
            </TableRow>
          ) : (
            seats.map((seat) => (
              <TableRow key={seat.seatId}>
                <TableCell>{seat.email}</TableCell>
                <TableCell>{seat.userName ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={seat.status === "pending" ? "outline" : "default"}>
                    {seatStatusLabel(seat.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {seat.assignedAt.toLocaleString()}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {seat.activatedAt?.toLocaleString() ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {canRevoke ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={revokePending}
                      onClick={() => onRevokeSeat(seat.seatId)}
                    >
                      Revoke
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export type AssignSeatDialogViewProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  onEmailChange: (email: string) => void;
  onSubmit: () => void;
  isPending: boolean;
  trigger: ReactElement;
};

export function AssignSeatDialogView({
  open,
  onOpenChange,
  email,
  onEmailChange,
  onSubmit,
  isPending,
  trigger,
}: AssignSeatDialogViewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign seat</DialogTitle>
          <DialogDescription>
            They do not need a portal invite. Access activates when they sign in to the add-in.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-2">
          <Label htmlFor="seat-email">Email</Label>
          <Input
            id="seat-email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="consultant@company.com"
          />
        </div>
        <DialogFooter>
          <Button type="button" disabled={isPending || !email.trim()} onClick={onSubmit}>
            Assign seat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
