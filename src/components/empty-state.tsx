export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-zinc-900/30 p-10 text-center">
      <p className="text-sm font-medium text-zinc-300">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-zinc-500">{description}</p>
      )}
    </div>
  );
}
