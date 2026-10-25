import { Link } from "react-router-dom";
import { ArrowRightIcon } from "./icons";

export function SectionHeading({
  title,
  description,
  to,
  linkLabel = "Veure-ho tot",
}: {
  title: string;
  description?: string;
  to?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-xs text-zinc-500">{description}</p>
        )}
      </div>
      {to && (
        <Link
          to={to}
          className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-zinc-400 transition-colors hover:text-orange-400"
        >
          {linkLabel}
          <ArrowRightIcon className="size-3.5" />
        </Link>
      )}
    </div>
  );
}
