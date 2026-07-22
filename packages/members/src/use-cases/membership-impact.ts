import type { CurrentMembershipSummary, MembershipImpact } from "../domain/member";

export function membershipImpact(
  summary: CurrentMembershipSummary | null,
): MembershipImpact | null {
  if (!summary) return null;
  return {
    organizationId: summary.organizationId,
    organizationName: summary.organizationName,
    organizationType: summary.organizationType,
    willDeleteOnVacate: summary.willDeleteOnVacate,
    blockedSoleOwner: summary.blockedSoleOwner,
  };
}
