import { useNavigate } from "@tanstack/react-router";

import { UserMenuView } from "@/components/shell/user-menu-view";
import type { AppEnvironment } from "@/constants/navigation";
import { getPageRouteParams, getPageRouteTo } from "@/constants/navigation";
import { getUserInitials } from "@/lib/user-initials";
import { useServices } from "@/services/services-context";

export function UserMenu({ environment }: { environment: AppEnvironment }) {
  const navigate = useNavigate();
  const { auth, signOut } = useServices();
  const { data: session, isPending } = auth.useSession();

  const initials = session
    ? getUserInitials({
        name: session.user.name,
        email: session.user.email,
      })
    : undefined;

  const displayName = session?.user.name?.trim() || session?.user.email;

  return (
    <UserMenuView
      isPending={isPending}
      initials={initials}
      displayName={displayName}
      onAccountClick={() =>
        navigate({
          to: getPageRouteTo("account"),
          params: getPageRouteParams(environment),
        })
      }
      onSignOut={() => {
        void signOut
          .signOut()
          .catch(() => {
            // Local session is cleared in the Office strategy finally block.
          })
          .finally(() => {
            void navigate({
              to: "/login",
            });
          });
      }}
    />
  );
}
