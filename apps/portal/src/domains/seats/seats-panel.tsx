import { useState } from "react";
import { toast } from "sonner";

import { useAssignSeat, useRevokeSeat, useSeatCapacity, useSeats } from "@deck-pack/hooks/seats";
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

import { Can } from "@/components/can";
import { PortalPageShell } from "@/components/portal-page-shell";
import { useServices } from "@/services/services-context";

function seatStatusLabel(status: string): string {
  if (status === "pending") return "Pending";
  if (status === "active") return "Active";
  return status;
}

export function SeatsPanel() {
  const { seats } = useServices();
  const [assignOpen, setAssignOpen] = useState(false);
  const [email, setEmail] = useState("");

  const capacityQuery = useSeatCapacity(seats);
  const seatsQuery = useSeats(seats);

  const assignMutation = useAssignSeat(seats);
  const revokeMutation = useRevokeSeat(seats);

  const capacity = capacityQuery.data;
  const capacityLine =
    capacity != null
      ? `${capacity.used} of ${capacity.purchased} seats used`
      : "Loading seat capacity…";

  return (
    <PortalPageShell
      title="Seats"
      description={capacityLine}
      actions={
        <Can permissions={{ seat: ["assign"] }}>
          <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
            <DialogTrigger render={<Button type="button">Assign seat</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign seat</DialogTitle>
                <DialogDescription>
                  They do not need a portal invite. Access activates when they sign in to the
                  add-in.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-2 py-2">
                <Label htmlFor="seat-email">Email</Label>
                <Input
                  id="seat-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="consultant@company.com"
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  disabled={assignMutation.isPending || !email.trim()}
                  onClick={() =>
                    assignMutation.mutate(
                      { email: email.trim() },
                      {
                        onSuccess: () => {
                          toast.success("Seat assigned");
                          setAssignOpen(false);
                          setEmail("");
                        },
                        onError: (error: Error) => toast.error(error.message),
                      },
                    )
                  }
                >
                  Assign seat
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Can>
      }
    >
      {seatsQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">Loading seats…</p>
      ) : seatsQuery.isError ? (
        <p className="text-destructive text-sm">{seatsQuery.error.message}</p>
      ) : (
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
              {(seatsQuery.data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground h-24 text-center">
                    No seats assigned yet.
                  </TableCell>
                </TableRow>
              ) : (
                (seatsQuery.data ?? []).map((seat) => (
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
                      <Can permissions={{ seat: ["assign"] }}>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={revokeMutation.isPending}
                          onClick={() =>
                            revokeMutation.mutate(
                              { seatId: seat.seatId },
                              {
                                onSuccess: () => toast.success("Seat revoked"),
                                onError: (error: Error) => toast.error(error.message),
                              },
                            )
                          }
                        >
                          Revoke
                        </Button>
                      </Can>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </PortalPageShell>
  );
}
