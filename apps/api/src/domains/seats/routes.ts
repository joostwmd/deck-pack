import { organizationMemberProcedure } from "../../api/procedures";
import { requirePermission } from "../../api/guards/authorization";
import { requireActiveOrganizationId } from "../../api/guards/org-context";
import { unwrapServiceResult } from "../../api/resilience/service-result";

import {
  assignSeatInputSchema,
  organizationSeatSchema,
  revokeSeatInputSchema,
  seatCapacitySchema,
} from "./schemas";
import type { SeatsService } from "./service";
import { z } from "zod";

export const listSeatsProcedure = organizationMemberProcedure.use(
  requirePermission({ seat: ["view"] }),
);

export const assignSeatProcedure = organizationMemberProcedure.use(
  requirePermission({ seat: ["assign"] }),
);

export const revokeSeatProcedure = organizationMemberProcedure.use(
  requirePermission({ seat: ["assign"] }),
);

export function createSeatsRoutes(service: SeatsService) {
  return {
    capacity: listSeatsProcedure
      .output(seatCapacitySchema)
      .query(async ({ ctx }) => {
        const organizationId = requireActiveOrganizationId(ctx);
        return unwrapServiceResult(await service.capacity(ctx.tx, organizationId));
      }),

    list: listSeatsProcedure
      .output(z.array(organizationSeatSchema))
      .query(async ({ ctx }) => {
        const organizationId = requireActiveOrganizationId(ctx);
        return unwrapServiceResult(await service.list(ctx.tx, organizationId));
      }),

    assign: assignSeatProcedure
      .input(assignSeatInputSchema)
      .output(organizationSeatSchema)
      .mutation(async ({ ctx, input }) => {
        const organizationId = requireActiveOrganizationId(ctx);
        const assigned = unwrapServiceResult(
          await service.assign(ctx.tx, {
            organizationId,
            email: input.email,
            assignedBy: ctx.session!.user.id,
          }),
        );

        const seats = unwrapServiceResult(await service.list(ctx.tx, organizationId));
        const seat = seats.find((row) => row.seatId === assigned.seatId);
        if (!seat) {
          throw new Error("Assigned seat not found after assignment");
        }
        return seat;
      }),

    revoke: revokeSeatProcedure
      .input(revokeSeatInputSchema)
      .output(z.object({ seatId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const organizationId = requireActiveOrganizationId(ctx);
        return unwrapServiceResult(
          await service.revoke(ctx.tx, {
            organizationId,
            seatId: input.seatId,
          }),
        );
      }),
  };
}
