import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { OrganizationDetailView } from "@/features/organizations/organization-detail-view";
import { useServices } from "@/services/services-context";

export function OrganizationDetailPanel({ orgId }: { orgId: string }) {
  const queryClient = useQueryClient();
  const { organization } = useServices();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const detailQuery = useQuery({
    queryKey: ["organization", "detail", orgId],
    queryFn: () => organization.getOrganization(orgId),
  });

  const membersQuery = useQuery({
    queryKey: ["organization", "members", orgId],
    queryFn: () => organization.listMembers(orgId),
  });

  useEffect(() => {
    if (detailQuery.data) {
      setName(detailQuery.data.name);
      setSlug(detailQuery.data.slug);
    }
  }, [detailQuery.data]);

  const updateMutation = useMutation({
    mutationFn: (input: { name: string; slug: string }) =>
      organization.updateOrganization({
        organizationId: orgId,
        name: input.name,
        slug: input.slug,
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

  const dirty =
    Boolean(detailQuery.data) &&
    (name.trim() !== detailQuery.data?.name || slug.trim() !== detailQuery.data?.slug);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }
    updateMutation.mutate({ name: name.trim(), slug: slug.trim() });
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
      saving={updateMutation.isPending}
      onSubmit={handleSubmit}
      dirty={dirty}
    />
  );
}
