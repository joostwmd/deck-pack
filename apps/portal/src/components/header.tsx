import { Link, useRouteContext } from "@tanstack/react-router";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
  const { session } = useRouteContext({ from: "/_protected" });
  const isOrgUser = Boolean(session.data?.session?.activeOrganizationId);

  const links = [
    { to: "/" as const, label: "Home" },
    ...(isOrgUser
      ? ([
          { to: "/org/dashboard" as const, label: "Org" },
          { to: "/org/members" as const, label: "Members" },
        ] as const)
      : []),
    { to: "/account" as const, label: isOrgUser ? "Personal" : "Account" },
  ] as const;

  return (
    <div>
      <div className="flex flex-row items-center justify-between px-2 py-1">
        <nav className="flex gap-4 text-lg">
          {links.map(({ to, label }) => {
            return (
              <Link key={`${to}-${label}`} to={to}>
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
      <hr />
    </div>
  );
}
