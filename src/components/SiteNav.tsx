import { NavLink } from "react-router-dom";
import { cn } from "@/lib/format";

const LINKS = [
  { to: "/", label: "Inici", end: true },
  { to: "/partits", label: "Partits" },
  { to: "/classificacio", label: "Classificació" },
  { to: "/equips", label: "Equips" },
  { to: "/jugadors", label: "Jugadors" },
  { to: "/dades", label: "Dades" },
];

export function SiteNav() {
  return (
    <nav className="no-scrollbar flex w-full items-center gap-0.5 overflow-x-auto pb-1 sm:gap-1 lg:ml-auto lg:w-auto lg:pb-0">
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) =>
            cn(
              "whitespace-nowrap rounded-lg px-1.5 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm",
              isActive
                ? "bg-white/10 text-white"
                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
            )
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
