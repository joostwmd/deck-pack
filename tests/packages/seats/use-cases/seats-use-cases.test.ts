import { describe, expect, it } from "vitest";

import {
  AssignSeat,
  GetSeatCapacity,
  ListSeats,
  NoSubscriptionError,
  RevokeSeat,
  SeatAlreadyRevokedError,
  SeatAtCapacityError,
  SeatEmailAlreadyAssignedError,
  SeatNotFoundError,
} from "@deck-pack/seats";
import { InMemorySeatsRepository } from "@deck-pack/seats/repositories/in-memory-seats-repository";

function createSeededRepo() {
  const repo = new InMemorySeatsRepository();
  repo.seed({
    organizations: [{ organizationId: "org-1", purchased: 2 }],
    users: [
      {
        id: "user-1",
        name: "Alice",
        email: "alice@acme.com",
        hasOrg: false,
      },
      {
        id: "admin",
        name: "Admin",
        email: "admin@acme.com",
        hasOrg: true,
        organizationId: "org-1",
      },
    ],
  });
  return repo;
}

describe("GetSeatCapacity", () => {
  it("returns purchased/used/remaining", async () => {
    const repo = createSeededRepo();
    await new AssignSeat(repo).execute({
      organizationId: "org-1",
      email: "pending@acme.com",
      assignedBy: "admin",
    });
    const capacity = await new GetSeatCapacity(repo).execute({ organizationId: "org-1" });
    expect(capacity).toEqual({ purchased: 2, used: 1, remaining: 1 });
  });
});

describe("ListSeats", () => {
  it("lists assigned seats", async () => {
    const repo = createSeededRepo();
    await new AssignSeat(repo).execute({
      organizationId: "org-1",
      email: "pending@acme.com",
      assignedBy: "admin",
    });
    const seats = await new ListSeats(repo).execute({ organizationId: "org-1" });
    expect(seats).toHaveLength(1);
    expect(seats[0]?.email).toBe("pending@acme.com");
    expect(seats[0]?.status).toBe("pending");
  });
});

describe("AssignSeat", () => {
  it("assigns active seat and returns full row for existing user without org", async () => {
    const repo = createSeededRepo();
    const seat = await new AssignSeat(repo).execute({
      organizationId: "org-1",
      email: "alice@acme.com",
      assignedBy: "admin",
    });
    expect(seat.status).toBe("active");
    expect(seat.userId).toBe("user-1");
    expect(seat.userName).toBe("Alice");
  });

  it("throws NoSubscriptionError when org has no subscription", async () => {
    const repo = new InMemorySeatsRepository();
    await expect(
      new AssignSeat(repo).execute({
        organizationId: "missing",
        email: "a@x.com",
        assignedBy: "admin",
      }),
    ).rejects.toBeInstanceOf(NoSubscriptionError);
  });

  it("throws SeatAtCapacityError when full", async () => {
    const repo = createSeededRepo();
    await new AssignSeat(repo).execute({
      organizationId: "org-1",
      email: "a@acme.com",
      assignedBy: "admin",
    });
    await new AssignSeat(repo).execute({
      organizationId: "org-1",
      email: "b@acme.com",
      assignedBy: "admin",
    });
    await expect(
      new AssignSeat(repo).execute({
        organizationId: "org-1",
        email: "c@acme.com",
        assignedBy: "admin",
      }),
    ).rejects.toBeInstanceOf(SeatAtCapacityError);
  });

  it("throws SeatEmailAlreadyAssignedError on duplicate", async () => {
    const repo = createSeededRepo();
    await new AssignSeat(repo).execute({
      organizationId: "org-1",
      email: "dup@acme.com",
      assignedBy: "admin",
    });
    await expect(
      new AssignSeat(repo).execute({
        organizationId: "org-1",
        email: "dup@acme.com",
        assignedBy: "admin",
      }),
    ).rejects.toBeInstanceOf(SeatEmailAlreadyAssignedError);
  });
});

describe("RevokeSeat", () => {
  it("revokes an assigned seat", async () => {
    const repo = createSeededRepo();
    const seat = await new AssignSeat(repo).execute({
      organizationId: "org-1",
      email: "pending@acme.com",
      assignedBy: "admin",
    });
    const result = await new RevokeSeat(repo).execute({
      organizationId: "org-1",
      seatId: seat.seatId,
    });
    expect(result.seatId).toBe(seat.seatId);
    expect(await new ListSeats(repo).execute({ organizationId: "org-1" })).toHaveLength(0);
  });

  it("throws SeatNotFoundError for missing seat", async () => {
    const repo = createSeededRepo();
    await expect(
      new RevokeSeat(repo).execute({ organizationId: "org-1", seatId: "missing" }),
    ).rejects.toBeInstanceOf(SeatNotFoundError);
  });

  it("throws SeatAlreadyRevokedError when already revoked", async () => {
    const repo = createSeededRepo();
    const seat = await new AssignSeat(repo).execute({
      organizationId: "org-1",
      email: "pending@acme.com",
      assignedBy: "admin",
    });
    await new RevokeSeat(repo).execute({
      organizationId: "org-1",
      seatId: seat.seatId,
    });
    await expect(
      new RevokeSeat(repo).execute({
        organizationId: "org-1",
        seatId: seat.seatId,
      }),
    ).rejects.toBeInstanceOf(SeatAlreadyRevokedError);
  });
});
