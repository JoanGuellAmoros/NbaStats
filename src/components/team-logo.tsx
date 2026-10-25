import type { TeamRef } from "@/lib/espn";
import { teamLogo } from "@/lib/espn";
import { cn } from "@/lib/format";

export function TeamLogo({
  team,
  size = 40,
  className,
}: {
  team?: TeamRef | null;
  size?: number;
  className?: string;
}) {
  const src = teamLogo(team);

  if (!src) {
    return (
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-full bg-white/10 text-[10px] font-semibold text-zinc-300",
          className,
        )}
        style={{ width: size, height: size }}
      >
        {team?.abbreviation ?? "?"}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={team?.displayName ?? "Escut de l'equip"}
      width={size}
      height={size}
      className={cn("shrink-0 object-contain", className)}
      loading="lazy"
    />
  );
}
