import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-zinc-900/30 p-8 text-center sm:p-10">
      {icon && <div className="mb-3 flex justify-center text-orange-400">{icon}</div>}
      <p className="text-sm font-medium text-zinc-200">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-zinc-500">
          {description}
        </p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
