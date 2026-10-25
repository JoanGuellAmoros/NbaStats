import type { Article } from "@/lib/espn";
import { timeAgo } from "@/lib/format";

export function NewsList({
  articles,
  limit,
}: {
  articles: Article[];
  limit?: number;
}) {
  const items =
    typeof limit === "number" ? articles.slice(0, limit) : articles;

  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 text-sm text-zinc-400">
        No hi ha notícies disponibles ara mateix.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((article) => {
        const href = article.links?.web?.href;
        const image = article.images?.[0]?.url;

        return (
          <a
            key={article.id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 transition-colors hover:border-white/25"
          >
            {image && (
              <div className="relative aspect-video w-full overflow-hidden bg-zinc-800">
                <img
                  src={image}
                  alt=""
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            )}
            <div className="flex flex-1 flex-col gap-2 p-4">
              <span className="text-[11px] uppercase tracking-wider text-orange-400">
                {timeAgo(article.published)}
              </span>
              <h3 className="text-sm font-semibold leading-snug text-zinc-100 group-hover:text-white">
                {article.headline}
              </h3>
              {article.description && (
                <p className="line-clamp-2 text-xs leading-relaxed text-zinc-400">
                  {article.description}
                </p>
              )}
            </div>
          </a>
        );
      })}
    </div>
  );
}
