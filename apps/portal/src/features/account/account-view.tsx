import { PortalPageShell } from "@/components/portal-page-shell";

export type AccountViewProps = {
  email?: string | null;
  apiMessage?: string;
};

export function AccountView({ email, apiMessage }: AccountViewProps) {
  return (
    <PortalPageShell
      title="Account"
      description={`${email ?? "—"} · individual workspace`}
    >
      {apiMessage ? <p className="text-sm">API: {apiMessage}</p> : null}
    </PortalPageShell>
  );
}
