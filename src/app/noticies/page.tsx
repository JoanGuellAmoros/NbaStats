import { NewsList } from "@/components/news-list";
import { PageHeader } from "@/components/page-header";
import { getNews } from "@/lib/espn";

export const revalidate = 300;

export default async function NoticiesPage() {
  const news = await getNews(12);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <PageHeader
        eyebrow="Actualitat"
        title="Notícies"
        description="Les últimes notícies de l'NBA publicades per ESPN."
      />
      <NewsList articles={news.articles ?? []} />
    </div>
  );
}
