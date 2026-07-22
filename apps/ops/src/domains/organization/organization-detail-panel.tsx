import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  useDeleteOrganization,
  useOrganization,
  useOrganizationMembers,
  useUpdateOrganization,
} from "@deck-pack/hooks/organization";
import { usersKeys } from "@deck-pack/hooks/users";
import { useBreadcrumbLabel } from "@deck-pack/ui/components/composite/breadcrumb-label-context";
import { OrganizationDetailView } from "@deck-pack/ui/components/organization/organization-detail-view";

import { useServices } from "@/services/services-context";

export function OrganizationDetailPanel({ orgId }: { orgId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { organization } = useServices();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState<"individual" | "team">("individual");

  const detailQuery = useOrganization(organization, orgId);
  const membersQuery = useOrganizationMembers(organization, orgId);

  useBreadcrumbLabel(
    `/organizations/${orgId}`,
    detailQuery.data?.name ?? (detailQuery.isLoading ? "Loading…" : "Organization"),
  );

  useEffect(() => {
    if (detailQuery.data) {
      setName(detailQuery.data.name);
      setSlug(detailQuery.data.slug);
      setType(detailQuery.data.type ?? "individual");
    }
  }, [detailQuery.data]);

  const updateMutation = useUpdateOrganization(organization);
  const deleteMutation = useDeleteOrganization(organization);
  const downgradeMutation = useUpdateOrganization(organization);

  const dirty =
    Boolean(detailQuery.data) &&
    (name.trim() !== detailQuery.data?.name ||
      slug.trim() !== detailQuery.data?.slug ||
      type !== (detailQuery.data?.type ?? "individual"));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }
    updateMutation.mutate(
      { organizationId: orgId, name: name.trim(), slug: slug.trim(), type },
      {
        onSuccess: () => toast.success("Organization updated"),
        onError: (error: Error) => toast.error(error.message),
      },
    );
  };

  const handleDowngrade = async () => {
    const org = detailQuery.data;
    if (!org || org.type !== "team") {
      throw new Error("Only team organizations can be downgraded");
    }
    await downgradeMutation.mutateAsync(
      { organizationId: orgId, name: org.name, slug: org.slug, type: "individual" },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: usersKeys.list() });
          toast.success("Organization downgraded to solo");
        },
      },
    );
  };

  return (
    <OrganizationDetailView
      loading={detailQuery.isLoading}
      errorMessage={detailQuery.isError ? detailQuery.error.message : undefined}
      organization={detailQuery.data}
      membersLoading={membersQuery.isLoading}
      membersErrorMessage={membersQuery.isError ? membersQuery.error.message : undefined}
      members={membersQuery.data ?? []}
      name={name}
      onNameChange={setName}
      slug={slug}
      onSlugChange={setSlug}
      type={type}
      onTypeChange={setType}
      saving={updateMutation.isPending}
      onSubmit={handleSubmit}
      dirty={dirty}
      downgrading={downgradeMutation.isPending}
      onDowngradeToSolo={detailQuery.data?.type === "team" ? handleDowngrade : undefined}
      deleting={deleteMutation.isPending}
      onDelete={async () => {
        await deleteMutation.mutateAsync(orgId, {
          onSuccess: () => {
            toast.success("Organization deleted");
            void navigate({ to: "/organizations" });
          },
          onError: (error: Error) => toast.error(error.message),
        });
      }}
    />
  );
}
