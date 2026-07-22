import { useState } from "react";
import { toast } from "sonner";

import { useAssignSeat, useRevokeSeat, useSeatCapacity, useSeats } from "@deck-pack/hooks/seats";
import { Button } from "@deck-pack/ui/components/system/button";
import { AssignSeatDialogView, SeatsView } from "@deck-pack/ui/components/seats/seats-view";

import { useCan } from "@/auth/use-can";
import { Can } from "@/components/can";
import { PortalPageShell } from "@/components/portal-page-shell";
import { useServices } from "@/services/services-context";

export function SeatsPanel() {
  const { seats } = useServices();
  const { can } = useCan();
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

  const canAssign = can({ seat: ["assign"] });

  return (
    <PortalPageShell
      title="Seats"
      description={capacityLine}
      actions={
        <Can permissions={{ seat: ["assign"] }}>
          <AssignSeatDialogView
            open={assignOpen}
            onOpenChange={setAssignOpen}
            email={email}
            onEmailChange={setEmail}
            isPending={assignMutation.isPending}
            trigger={<Button type="button">Assign seat</Button>}
            onSubmit={() =>
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
          />
        </Can>
      }
    >
      <SeatsView
        loading={seatsQuery.isLoading}
        errorMessage={seatsQuery.isError ? seatsQuery.error.message : undefined}
        seats={seatsQuery.data ?? []}
        revokePending={revokeMutation.isPending}
        canRevoke={canAssign}
        onRevokeSeat={(seatId) =>
          revokeMutation.mutate(
            { seatId },
            {
              onSuccess: () => toast.success("Seat revoked"),
              onError: (error: Error) => toast.error(error.message),
            },
          )
        }
      />
    </PortalPageShell>
  );
}
