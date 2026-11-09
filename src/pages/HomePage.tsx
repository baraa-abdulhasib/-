import React, { useEffect, useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { Article } from '../data/articles';
import { ArticleCard } from '../components/ArticleCard';
import { ArticlesShelfIcon, BasairSunburstTrio } from '../components/Icons';
import { NewsletterSection } from '../components/NewsletterSection';
import { PageView } from '../components/Header';
import { buildHashPath } from '../utils/router';
import { SiteConfig, loadSiteConfig } from '../utils/siteConfig';

interface HomePageProps {
  articles: Article[];
  onSelectArticle: (slug: string) => void;
  onNavigate: (page: PageView, filterSlug?: string | null) => void;
  onSelectWriterBlog?: (writerSlug: string | null) => void;
  bookmarkedIds: string[];
  onToggleBookmark: (articleId: string, e: React.MouseEvent) => void;
  siteConfig?: SiteConfig;
}

export const HomePage: React.FC<HomePageProps> = ({
  articles,
  onSelectArticle,
  onNavigate,
  onSelectWriterBlog,
  bookmarkedIds,
  onToggleBookmark,
  siteConfig,
}) => {
  const config = siteConfig || loadSiteConfig();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'horizontal' | 'grid'>(
    config.defaultArticlesViewMode || 'horizontal'
  );

  useEffect(() => {
    setViewMode(config.defaultArticlesViewMode || 'horizontal');
  }, [config.defaultArticlesViewMode]);

  const featuredArticle = articles.find((a) => a.isFeatured) || articles[0];

  const filteredLatestArticles = articles.filter((art) => {
    if (activeCategory === 'all') {
      return config.showHeroSection && articles.length > 1
        ? art.id !== featuredArticle?.id
        : true;
    }
    return art.categorySlug === activeCategory;
  });

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 relative">
      {/* 1. المقال المميز الرئيسي (Hero Featured Article) مع هالة القراءة الدافئة */}
      {config.showHeroSection && featuredArticle && (
        <section
          aria-label="المقال المميز"
          className="relative pb-10 sm:pb-14 border-b border-[#E6E2D8] dark:border-[#2A2724]"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-6 -top-8 bottom-0 editorial-focal-halo -z-10 rounded-[36px]"
          />
          <ArticleCard
            article={featuredArticle}
            variant="featured"
            onSelectArticle={onSelectArticle}
            onSelectCategory={(catSlug) => onNavigate('categories', catSlug)}
            onSelectWriterBlog={onSelectWriterBlog}
            isBookmarked={bookmarkedIds.includes(featuredArticle.id)}
            onToggleBookmark={onToggleBookmark}
          />
        </section>
      )}

      {/* 2. رف كُتّاب بصائر ومدوناتهم (Writers & Individual Blogs) */}
      {config.showWritersShelf && (
        <section aria-labelledby="writers-shelf-heading" className="pt-10 sm:pt-12 pb-6 border-b border-[#E6E2D8] dark:border-[#2A2724]">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2
                id="writers-shelf-heading"
                className="text-[22px] sm:text-[26px] font-bold tracking-tight text-[#141413] dark:text-[#F5F3EF]"
              >
                كُتّاب {config.brandWordmark} ومدوّناتهم
              </h2>
              <p className="font-ui text-xs sm:text-sm text-[#78736A] dark:text-[#8A847A] mt-1">
                لكل كاتب مدوّنته المستقلة في {config.brandWordmark}، تجتمع معاً لإثراء المشهد الفكري
              </p>
            </div>

            <a
              href={buildHashPath({ page: 'blogs' })}
              onClick={(e) => {
                e.preventDefault();
                onNavigate('blogs', null);
              }}
              className="font-ui text-[15px] sm:text-[16px] font-bold text-[#E05324] dark:text-[#F06438] underline underline-offset-4 decoration-[1.5px] hover:opacity-80 transition-opacity whitespace-nowrap shrink-0"
            >
              جميع المدوّنات
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {config.writers.map((writer) => {
              const count = articles.filter(
                (a) => a.authorSlug === writer.slug || a.author.name === writer.name
              ).length;

              return (
                <a
                  key={writer.slug}
                  href={buildHashPath({ page: 'blogs', writerSlug: writer.slug })}
                  onClick={(e) => {
                    e.preventDefault();
                    if (onSelectWriterBlog) {
                      onSelectWriterBlog(writer.slug);
                    } else {
                      onNavigate('blogs', writer.slug);
                    }
                  }}
                  className="group flex flex-col items-center text-center p-4 rounded-2xl bg-white dark:bg-[#252420] border border-black/5 dark:border-white/5 hover:border-[#E05324]/40 dark:hover:border-[#E05324]/40 hover:shadow-md transition-all"
                >
                  <div className="relative mb-3">
                    <img
                      src={writer.avatar}
                      alt={writer.name}
                      className="w-16 h-16 sm:w-18 sm:h-18 rounded-full object-cover ring-2 ring-black/10 dark:ring-white/10 group-hover:ring-[#E05324] group-hover:scale-105 transition-all shadow-sm"
                    />
                    <span className="absolute -bottom-1 -right-1 font-ui text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#E05324] text-white">
                      {count}
                    </span>
                  </div>
                  <h3 className="font-display text-[15px] sm:text-[16px] font-bold text-[#141413] dark:text-[#F5F3EF] group-hover:text-[#E05324] transition-colors line-clamp-1">
                    {writer.blogTitle}
                  </h3>
                  <p className="font-ui text-xs font-semibold text-[#E05324] dark:text-[#F06438] mt-0.5">
                    {writer.name}
                  </p>
                  <p className="font-ui text-[11px] text-[#78736A] dark:text-[#8A847A] mt-1 line-clamp-1">
                    {writer.role}
                  </p>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. قسم المقالات الجديدة */}
      <section aria-labelledby="latest-articles-heading" className="pt-10 sm:pt-14">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <ArticlesShelfIcon className="w-7 h-7 sm:w-8 sm:h-8 text-[#141413] dark:text-[#F5F3EF] shrink-0" />
            <h2
              id="latest-articles-heading"
              className="text-[24px] sm:text-[30px] font-bold tracking-tight text-[#141413] dark:text-[#F5F3EF]"
            >
              المقالات الجديدة
            </h2>
          </div>

          <div className="font-ui flex items-center gap-4">
            {/* تبديل طريقة العرض على الشاشات المتوسطة والكبيرة */}
            <div className="hidden sm:flex items-center gap-1 rounded-xl bg-[#EFECE6] dark:bg-[#1D1B19] p-1">
              <button
                type="button"
                onClick={() => setViewMode('horizontal')}
                aria-label="عرض القائمة"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'horizontal'
                    ? 'bg-white dark:bg-[#2C2825] text-[#141413] dark:text-[#F5F3EF] shadow-xs'
                    : 'text-[#78736A] hover:text-[#141413] dark:hover:text-[#F5F3EF]'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="عرض الشبكة"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-[#2C2825] text-[#141413] dark:text-[#F5F3EF] shadow-xs'
                    : 'text-[#78736A] hover:text-[#141413] dark:hover:text-[#F5F3EF]'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <a
              href="#/articles"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('articles', null);
              }}
              className="text-[16px] sm:text-[17px] font-bold text-[#E05324] dark:text-[#F06438] underline underline-offset-4 decoration-[1.5px] hover:opacity-80 transition-opacity whitespace-nowrap shrink-0"
            >
              المزيد
            </a>
          </div>
        </div>

        {/* شريط التصفية السريعة حسب التصنيف */}
        <div className="font-ui mb-6 flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-xl text-[14.5px] transition-colors whitespace-nowrap shrink-0 ${
              activeCategory === 'all'
                ? 'bg-[#EFECE6] dark:bg-[#23201D] font-bold text-[#141413] dark:text-[#F5F3EF]'
                : 'font-medium text-[#57534E] dark:text-[#A8A29E] hover:text-[#141413] dark:hover:text-[#F5F3EF]'
            }`}
          >
            أحدث المقالات
          </button>
          {config.categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.slug)}
              className={`px-4 py-2 rounded-xl text-[14.5px] transition-colors whitespace-nowrap shrink-0 ${
                activeCategory === cat.slug
                  ? 'bg-[#EFECE6] dark:bg-[#23201D] font-bold text-[#141413] dark:text-[#F5F3EF]'
                  : 'font-medium text-[#57534E] dark:text-[#A8A29E] hover:text-[#141413] dark:hover:text-[#F5F3EF]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* قائمة المقالات */}
        {filteredLatestArticles.length === 0 ? (
          <div className="rounded-2xl border border-[#E6E2D8] dark:border-[#2A2724] bg-[#EFECE6]/45 dark:bg-[#1D1B19]/60 py-12 px-6 text-center">
            <p className="font-prose text-[16.5px] text-[#78736A] dark:text-[#8A847A]">
              لا توجد مقالات منشورة في هذا التصنيف حالياً.
            </p>
          </div>
        ) : viewMode === 'horizontal' ? (
          <div className="divide-y divide-[#E6E2D8] dark:divide-[#2A2724]">
            {filteredLatestArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                variant="horizontal"
                onSelectArticle={onSelectArticle}
                onSelectCategory={(catSlug) => onNavigate('categories', catSlug)}
                onSelectWriterBlog={onSelectWriterBlog}
                isBookmarked={bookmarkedIds.includes(article.id)}
                onToggleBookmark={onToggleBookmark}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-2">
            {filteredLatestArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                variant="grid"
                onSelectArticle={onSelectArticle}
                onSelectCategory={(catSlug) => onNavigate('categories', catSlug)}
                onSelectWriterBlog={onSelectWriterBlog}
                isBookmarked={bookmarkedIds.includes(article.id)}
                onToggleBookmark={onToggleBookmark}
              />
            ))}
          </div>
        )}
      </section>

      {/* 3. قسم الزوايا والسلاسل المعرفية */}
      {config.showSeriesSection && (
        <section
          aria-labelledby="featured-series-heading"
          className="pt-14 sm:pt-18 mt-10 border-t border-[#E6E2D8] dark:border-[#2A2724]"
        >
          <div className="flex items-center justify-between gap-4 mb-7">
            <h2
              id="featured-series-heading"
              className="text-[24px] sm:text-[30px] font-bold tracking-tight text-[#141413] dark:text-[#F5F3EF]"
            >
              سلاسل معرفية مميّزة
            </h2>
            <a
              href="#/categories"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('categories', null);
              }}
              className="font-ui text-[16px] sm:text-[17px] font-bold text-[#E05324] dark:text-[#F06438] underline underline-offset-4 decoration-[1.5px] hover:opacity-80 transition-opacity whitespace-nowrap shrink-0"
            >
              المزيد
            </a>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {config.series.map((series) => (
              <a
                key={series.id}
                href={`#/category/${series.categorySlug}`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('categories', series.categorySlug);
                }}
                className="group relative aspect-square w-full overflow-hidden rounded-[22px] bg-[#141413] text-right focus:outline-none block"
              >
                <img
                  src={series.coverArt}
                  alt={series.title}
                  loading="lazy"
                  className="h-full w-full object-cover opacity-85 transition-transform duration-300 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />

                {series.badgeText && (
                  <div className="font-ui absolute top-3.5 left-3.5 inline-flex items-center gap-1 rounded-lg bg-[#F5B800] px-2.5 py-1 text-[11.5px] font-bold text-[#141413]">
                    <span>{series.badgeText}</span>
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex flex-col justify-end">
                  <span className="font-ui text-[12px] font-bold text-[#F5B800] mb-1">
                    {(() => {
                      const seriesCount = articles.filter(
                        (a) => (a.seriesName || '').trim() === series.title.trim()
                      ).length;
                      return seriesCount > 0
                        ? `${seriesCount.toLocaleString('ar-EG')} ${seriesCount === 1 ? 'مقال منشور' : 'مقالات منشورة'}`
                        : series.countLabel;
                    })()}
                  </span>
                  <h3 className="font-prose text-[20px] sm:text-[23px] font-bold leading-tight text-[#F9F7F2] group-hover:text-[#F5B800] transition-colors">
                    {series.title}
                  </h3>
                  <p className="font-prose mt-1 text-[13px] sm:text-[13.5px] leading-snug text-[#D6CEBE] line-clamp-2">
                    {series.subtitle}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* فاصل بصري تفاعلي بالثلاث نجمات الذهبية قبل النشرة البريدية */}
      <BasairSunburstTrio size="md" withLines={true} className="mt-12 mb-2" />

      {/* 4. قسم الاشتراك في النشرة البريدية */}
      {config.showNewsletterSection && <NewsletterSection siteConfig={config} />}
    </div>
  );
};
