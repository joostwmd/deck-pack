import { AppError } from "@deck-pack/errors";

export class OrganizationNotFoundError extends AppError {
  constructor(organizationId: string, options?: { cause?: unknown }) {
    super("ORGANIZATION_NOT_FOUND", `Organization ${organizationId} not found`, 404, options);
    this.name = "OrganizationNotFoundError";
  }
}

export class OrganizationSlugConflictError extends AppError {
  constructor(slug: string, options?: { cause?: unknown }) {
    super(
      "ORGANIZATION_SLUG_CONFLICT",
      `An organization with slug "${slug}" already exists`,
      409,
      options,
    );
    this.name = "OrganizationSlugConflictError";
  }
}

export class UserAlreadyInOrganizationError extends AppError {
  constructor(options?: { cause?: unknown }) {
    super(
      "USER_ALREADY_IN_ORGANIZATION",
      "This user already belongs to an organization",
      409,
      options,
    );
    this.name = "UserAlreadyInOrganizationError";
  }
}

export class InvalidOrganizationTypeError extends AppError {
  constructor(options?: { cause?: unknown }) {
    super("INVALID_ORGANIZATION_TYPE", "Invalid organization type", 400, options);
    this.name = "InvalidOrganizationTypeError";
  }
}
