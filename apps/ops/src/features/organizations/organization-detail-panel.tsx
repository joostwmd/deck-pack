import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useBreadcrumbLabel } from "@deck-pack/ui/components/composite/breadcrumb-label-context";
import { OrganizationDetailView } from "@/features/organizations/organization-detail-view";
import { useServices } from "@/services/services-context";

export function OrganizationDetailPanel({ orgId }: { orgId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { organization } = useServices();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState<"individual" | "team">("individual");

  const detailQuery = useQuery({
    queryKey: ["organization", "detail", orgId],
    queryFn: () => organization.getOrganization(orgId),
  });

  const membersQuery = useQuery({
    queryKey: ["organization", "members", orgId],
    queryFn: () => organization.listMembers(orgId),
  });

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

  const updateMutation = useMutation({
    mutationFn: (input: { name: string; slug: string; type: "individual" | "team" }) =>
      organization.updateOrganization({
        organizationId: orgId,
        name: input.name,
        slug: input.slug,
        type: input.type,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["organization", "detail", orgId] });
      void queryClient.invalidateQueries({ queryKey: ["organization", "list"] });
      toast.success("Organization updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => organization.deleteOrganization(orgId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["organization", "list"] });
      void queryClient.removeQueries({ queryKey: ["organization", "detail", orgId] });
      void queryClient.removeQueries({ queryKey: ["organization", "members", orgId] });
      toast.success("Organization deleted");
      void navigate({ to: "/organizations" });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

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
    updateMutation.mutate({ name: name.trim(), slug: slug.trim(), type });
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
      deleting={deleteMutation.isPending}
      onDelete={async () => {
        await deleteMutation.mutateAsync();
      }}
    />
  );
}
