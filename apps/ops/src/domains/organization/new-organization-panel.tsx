import { useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { useCreateOrganization, useLookupUser } from "@deck-pack/hooks/organization";
import { NewOrganizationView } from "@deck-pack/ui/components/organization/new-organization-view";
import { slugifyName } from "@deck-pack/ui/lib/slugify";

import { useServices } from "@/services/services-context";

export function NewOrganizationPanel() {
  const navigate = useNavigate();
  const { organization } = useServices();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [lookupEmail, setLookupEmail] = useState<string | null>(null);

  const derivedSlug = useMemo(() => slugifyName(name), [name]);
  const effectiveSlug = slugTouched ? slug : derivedSlug;

  const lookupQuery = useLookupUser(organization, lookupEmail);

  const createMutation = useCreateOrganization(organization);

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
    createMutation.mutate(
      { name: name.trim(), slug: s, ownerEmail: ownerEmail.trim() },
      {
        onSuccess: (result) => {
          toast.success("Organization created");
          void navigate({
            to: "/organizations/$orgId",
            params: { orgId: result.organizationId },
          });
        },
        onError: (error: Error) => toast.error(error.message),
      },
    );
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
