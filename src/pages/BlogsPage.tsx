import React from 'react';
import { Article, WriterBlog } from '../data/articles';
import { ArticleCard } from '../components/ArticleCard';
import { buildHashPath } from '../utils/router';
import { SiteConfig, loadSiteConfig } from '../utils/siteConfig';

interface BlogsPageProps {
  articles: Article[];
  selectedWriterSlug?: string | null;
  onSelectWriter: (writerSlug: string | null) => void;
  onSelectArticle: (slug: string) => void;
  onSelectCategory?: (category: string) => void;
  bookmarkedIds?: string[];
  onToggleBookmark?: (articleId: string, e: React.MouseEvent) => void;
  siteConfig?: SiteConfig;
}

export const BlogsPage: React.FC<BlogsPageProps> = ({
  articles,
  selectedWriterSlug,
  onSelectWriter,
  onSelectArticle,
  onSelectCategory,
  bookmarkedIds = [],
  onToggleBookmark,
  siteConfig,
}) => {
  const config = siteConfig || loadSiteConfig();
  const currentWriter: WriterBlog | undefined = selectedWriterSlug
    ? config.writers.find((w) => w.slug === selectedWriterSlug)
    : undefined;

  // مقالات الكاتب المحدد
  const writerArticles = currentWriter
    ? articles.filter(
        (a) =>
          a.authorSlug === currentWriter.slug ||
          a.author.name === currentWriter.name
      )
    : [];

  // إحصائية المقالات لكل كاتب
  const getArticleCount = (writer: WriterBlog) => {
    return articles.filter(
      (a) => a.authorSlug === writer.slug || a.author.name === writer.name
    ).length;
  };

  // وضع عرض مدونة كاتب محدد
  if (currentWriter) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#1C1B18] text-[#141413] dark:text-[#F5F3EF] pb-24">
        {/* شريط المسار والرجوع */}
        <div className="border-b border-black/5 dark:border-white/5 bg-white/40 dark:bg-black/20 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <nav className="font-ui flex items-center gap-2 text-sm text-[#78736A] dark:text-[#8A847A]">
              <a
                href={buildHashPath({ page: 'home' })}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectWriter(null);
                }}
                className="hover:text-[#E05324] transition-colors"
              >
                بصائر
              </a>
              <span>/</span>
              <a
                href={buildHashPath({ page: 'blogs' })}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectWriter(null);
                }}
                className="hover:text-[#E05324] transition-colors"
              >
                المدونات
              </a>
              <span>/</span>
              <span className="font-bold text-[#141413] dark:text-[#F5F3EF]">
                {currentWriter.blogTitle}
              </span>
            </nav>

            <button
              onClick={() => onSelectWriter(null)}
              className="font-ui text-xs font-bold text-[#E05324] dark:text-[#F06438] hover:underline flex items-center gap-1.5"
            >
              <span>← عرض جميع المدوّنات</span>
            </button>
          </div>
        </div>

        {/* ترويسة مدونة الكاتب */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
          <div className="bg-white dark:bg-[#252420] rounded-3xl p-6 sm:p-10 border border-black/10 dark:border-white/10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-[#E05324] via-[#F28C38] to-[#141413]" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <img
                src={currentWriter.avatar}
                alt={currentWriter.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-[#E05324]/20 shadow-md shrink-0"
              />

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-ui inline-flex items-center gap-1 px-3 py-1 text-xs font-bold bg-[#E05324]/10 text-[#E05324] dark:bg-[#E05324]/20 dark:text-[#F06438] rounded-full">
                    مدوّنة خاصة في بصائر
                  </span>
                  <span className="font-ui text-xs text-[#78736A] dark:text-[#8A847A]">
                    {writerArticles.length} مقال منشور
                  </span>
                </div>

                <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#141413] dark:text-[#F5F3EF] mt-2">
                  {currentWriter.blogTitle}
                </h1>

                <p className="font-ui text-sm sm:text-base font-semibold text-[#E05324] dark:text-[#F06438] mt-1">
                  بقلم: {currentWriter.name} • {currentWriter.role}
                </p>

                <p className="font-serif text-base sm:text-lg text-[#524E48] dark:text-[#B5B0A6] leading-relaxed mt-3 max-w-3xl">
                  {currentWriter.bio}
                </p>

                {/* وسوم مجالات المدونة */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {currentWriter.topics.map((topic) => (
                    <span
                      key={topic}
                      className="font-ui text-xs px-2.5 py-1 rounded-md bg-[#FAF9F5] dark:bg-[#1C1B18] text-[#78736A] dark:text-[#8A847A] border border-black/5 dark:border-white/5"
                    >
                      #{topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* مقالات المدونة */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10 mb-8">
            <h2 className="font-display text-xl sm:text-2xl font-bold">
              مقالات {currentWriter.blogTitle}
            </h2>
            <span className="font-ui text-sm text-[#78736A] dark:text-[#8A847A]">
              مرتبة حسب الأحدث
            </span>
          </div>

          {writerArticles.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#252420] rounded-2xl border border-black/5 dark:border-white/5">
              <p className="font-serif text-lg text-[#78736A] dark:text-[#8A847A]">
                لم تنشر هذه المدونة أي مقالات بعد، ترقبوا الإصدارات القادمة قريباً.
              </p>
              <button
                onClick={() => onSelectWriter(null)}
                className="font-ui mt-4 inline-flex items-center px-4 py-2 text-sm font-bold bg-[#E05324] text-white rounded-lg hover:bg-[#c94519] transition-colors"
              >
                تصفح باقي المدونات
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {writerArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  variant="grid"
                  onSelectArticle={onSelectArticle}
                  onSelectCategory={onSelectCategory}
                  onSelectWriterBlog={onSelectWriter}
                  isBookmarked={bookmarkedIds.includes(article.id)}
                  onToggleBookmark={onToggleBookmark}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // وضع عرض شبكة جميع مدونات بصائر
  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#1C1B18] text-[#141413] dark:text-[#F5F3EF] pb-24">
      {/* الترويسة الرئيسية للمدونات */}
      <section className="border-b border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/20 backdrop-blur-sm py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="font-ui inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold tracking-wide uppercase bg-[#E05324]/10 text-[#E05324] dark:bg-[#E05324]/20 dark:text-[#F06438] rounded-full mb-4">
            فضاءات الفكر والمعرفة
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#141413] dark:text-[#F5F3EF]">
            مدوّنات بصائر
          </h1>
          <p className="font-serif text-lg sm:text-xl text-[#78736A] dark:text-[#8A847A] max-w-2xl mx-auto mt-4 leading-relaxed">
            منصة تجمع مدونات مستقلة لكوكبة من الكتاب والباحثين في الفكر الإسلامي،
            علوم الشريعة، والتقنية والمجتمع.
          </p>
        </div>
      </section>

      {/* شبكة المدونات */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {config.writers.map((writer) => {
            const count = getArticleCount(writer);
            const blogHref = buildHashPath({ page: 'blogs', writerSlug: writer.slug });

            return (
              <div
                key={writer.slug}
                className="bg-white dark:bg-[#252420] rounded-3xl p-7 border border-black/10 dark:border-white/10 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center gap-4">
                    <img
                      src={writer.avatar}
                      alt={writer.name}
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-black/10 dark:ring-white/10 group-hover:ring-[#E05324] transition-all"
                    />
                    <div>
                      <h2 className="font-display text-xl sm:text-2xl font-bold text-[#141413] dark:text-[#F5F3EF] group-hover:text-[#E05324] transition-colors">
                        {writer.blogTitle}
                      </h2>
                      <p className="font-ui text-sm font-semibold text-[#E05324] dark:text-[#F06438]">
                        بقلم: {writer.name}
                      </p>
                      <p className="font-ui text-xs text-[#78736A] dark:text-[#8A847A]">
                        {writer.role}
                      </p>
                    </div>
                  </div>

                  <p className="font-serif text-[15px] sm:text-base text-[#524E48] dark:text-[#B5B0A6] mt-4 leading-relaxed line-clamp-3">
                    {writer.bio}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-5">
                    {writer.topics.map((t) => (
                      <span
                        key={t}
                        className="font-ui text-[11px] px-2.5 py-0.5 rounded-full bg-[#FAF9F5] dark:bg-[#1C1B18] text-[#78736A] dark:text-[#8A847A] border border-black/5 dark:border-white/5"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                  <span className="font-ui text-xs text-[#78736A] dark:text-[#8A847A]">
                    {count} مقال منشور
                  </span>

                  <a
                    href={blogHref}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelectWriter(writer.slug);
                    }}
                    className="font-ui inline-flex items-center gap-1.5 text-sm font-bold text-[#E05324] dark:text-[#F06438] group-hover:translate-x-[-3px] transition-transform"
                  >
                    <span>زيارة المدونة</span>
                    <span aria-hidden="true">←</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
