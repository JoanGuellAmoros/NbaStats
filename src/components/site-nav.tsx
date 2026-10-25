"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/format";

const LINKS = [
  { href: "/", label: "Inici" },
  { href: "/partits", label: "Partits" },
  { href: "/classificacio", label: "Classificació" },
  { href: "/equips", label: "Equips" },
  { href: "/jugadors", label: "Jugadors" },
  { href: "/noticies", label: "Notícies" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="no-scrollbar flex w-full items-center gap-1 overflow-x-auto pb-1 lg:ml-auto lg:w-auto lg:pb-0">
      {LINKS.map((link) => {
        const active =
          link.href === "/"
            ? pathname === "/"
            : pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-white/10 text-white"
                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
