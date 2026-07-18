import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { NewOrganizationView } from "@/features/organizations/new-organization-view";
import { slugifyName } from "@/features/organizations/slugify";
import { useServices } from "@/services/services-context";

export function NewOrganizationPanel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { organization } = useServices();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [lookupEmail, setLookupEmail] = useState<string | null>(null);

  const derivedSlug = useMemo(() => slugifyName(name), [name]);
  const effectiveSlug = slugTouched ? slug : derivedSlug;

  const lookupQuery = useQuery({
    queryKey: ["organization", "lookupUser", lookupEmail],
    queryFn: () => organization.lookupUser(lookupEmail ?? ""),
    enabled: lookupEmail !== null && lookupEmail.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: (input: { name: string; slug: string; ownerEmail: string }) =>
      organization.createOrganization(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["organization", "list"] });
      toast.success("Organization created");
      void navigate({ to: "/organizations" });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const onOwnerEmailBlur = useCallback(() => {
    const trimmed = ownerEmail.trim();
    if (!trimmed) {
      setLookupEmail(null);
      return;
    }
    setLookupEmail(trimmed);
  }, [ownerEmail]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = effectiveSlug;
    if (!name.trim() || !s || !ownerEmail.trim()) {
      toast.error("Fill in organization name, slug, and owner email");
      return;
    }
    createMutation.mutate({
      name: name.trim(),
      slug: s,
      ownerEmail: ownerEmail.trim(),
    });
  };

  return (
    <NewOrganizationView
      name={name}
      onNameChange={setName}
      effectiveSlug={effectiveSlug}
      derivedSlug={derivedSlug}
      slugTouched={slugTouched}
      onSlugChange={(value) => {
        setSlugTouched(true);
        setSlug(value);
      }}
      ownerEmail={ownerEmail}
      onOwnerEmailChange={setOwnerEmail}
      onOwnerEmailBlur={onOwnerEmailBlur}
      lookupEmail={lookupEmail}
      lookupLoading={lookupQuery.isFetching}
      lookupResult={lookupQuery.data}
      submitting={createMutation.isPending}
      onSubmit={handleSubmit}
    />
  );
}
