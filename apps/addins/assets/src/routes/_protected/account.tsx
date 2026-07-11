import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/account")({
  component: AccountPage,
});

function AccountPage() {
  const { session } = Route.useRouteContext();

  return (
    <div className="space-y-2 p-4">
      <h1 className="text-xl font-semibold">Account</h1>
      <p className="text-muted-foreground">{session.data?.user.email}</p>
      {session.data?.user.name && (
        <p className="text-sm text-muted-foreground">{session.data.user.name}</p>
      )}
    </div>
  );
}
