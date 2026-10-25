import { useState } from "react";
import { cn, initials } from "@/lib/format";

export function PlayerAvatar({
  name,
  src,
  size = 36,
  className,
}: {
  name: string;
  src?: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-full bg-white/10 text-[10px] font-semibold text-zinc-300",
          className,
        )}
        style={{ width: size, height: size }}
      >
        {initials(name)}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      className={cn(
        "shrink-0 rounded-full bg-white/10 object-cover",
        className,
      )}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
