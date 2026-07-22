import { useDeleteOwnAccount } from "@deck-pack/hooks/users";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { AccountView } from "@/pages/account/account-view";
import { useServices } from "@/services/services-context";

const accountRoute = getRouteApi("/_protected/solo/account");

export function AccountPanel() {
  const { session } = accountRoute.useRouteContext();
  const { addinOnly } = accountRoute.useSearch();
  const { auth, users } = useServices();
  const navigate = useNavigate();
  const deleteOwnAccount = useDeleteOwnAccount(users);

  return (
    <AccountView
      name={session.data?.user.name}
      email={session.data?.user.email}
      addinOnly={addinOnly === true}
      deleting={deleteOwnAccount.isPending}
      onDeleteAccount={async () => {
        try {
          await deleteOwnAccount.mutateAsync();
          await auth.signOut({
            fetchOptions: {
              onSuccess: () => {
                void navigate({ to: "/" });
              },
            },
          });
          toast.success("Account deleted");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Could not delete account";
          toast.error(message);
        }
      }}
    />
  );
}
