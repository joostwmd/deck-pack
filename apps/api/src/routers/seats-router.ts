import { z } from "zod";

import { AssignSeat, GetSeatCapacity, ListSeats, RevokeSeat } from "@deck-pack/seats";
import {
  assignSeatInputSchema,
  organizationSeatSchema,
  revokeSeatInputSchema,
  seatCapacitySchema,
} from "@deck-pack/seats/schemas";

import type { AppContainer } from "../container";
import { requireActiveOrganizationId } from "../trpc/guards/assertions/require-active-organization-id";
import { requirePermission } from "../trpc/guards/middleware/require-permission";
import { teamWorkspaceProcedure } from "../trpc/procedures";
import { router } from "../trpc/init";

const listSeatsProcedure = teamWorkspaceProcedure.use(requirePermission({ seat: ["view"] }));
const assignSeatProcedure = teamWorkspaceProcedure.use(requirePermission({ seat: ["assign"] }));
const revokeSeatProcedure = teamWorkspaceProcedure.use(requirePermission({ seat: ["assign"] }));

export function seatsRouter(container: AppContainer) {
  return router({
    capacity: listSeatsProcedure.output(seatCapacitySchema).query(({ ctx }) => {
      const organizationId = requireActiveOrganizationId(ctx);
      return new GetSeatCapacity(container.seatsRepository).execute({ organizationId });
    }),

    list: listSeatsProcedure.output(z.array(organizationSeatSchema)).query(({ ctx }) => {
      const organizationId = requireActiveOrganizationId(ctx);
      return new ListSeats(container.seatsRepository).execute({ organizationId });
    }),

    assign: assignSeatProcedure
      .input(assignSeatInputSchema)
      .output(organizationSeatSchema)
      .mutation(({ ctx, input }) => {
        const organizationId = requireActiveOrganizationId(ctx);
        return new AssignSeat(container.seatsRepository).execute({
          organizationId,
          email: input.email,
          assignedBy: ctx.session!.user.id,
        });
      }),

    revoke: revokeSeatProcedure
      .input(revokeSeatInputSchema)
      .output(z.object({ seatId: z.string() }))
      .mutation(({ ctx, input }) => {
        const organizationId = requireActiveOrganizationId(ctx);
        return new RevokeSeat(container.seatsRepository).execute({
          organizationId,
          seatId: input.seatId,
        });
      }),
  });
}
