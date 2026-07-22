import { Link } from "@tanstack/react-router";

import { ThemeToggle } from "@deck-pack/ui/components/composite/theme-toggle";

const links = [{ to: "/", label: "Home" }] as const;

export default function PublicHeader() {
  return (
    <div>
      <div className="flex flex-row items-center justify-between px-2 py-1">
        <nav className="flex gap-4 text-lg">
          {links.map(({ to, label }) => (
            <Link key={to} to={to}>
              {label}
            </Link>
          ))}
        </nav>
        <ThemeToggle variant="default" />
      </div>
      <hr />
    </div>
  );
}
