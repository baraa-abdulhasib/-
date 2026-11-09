import React from 'react';
import { Article } from '../data/articles';
import { ArticleCard } from '../components/ArticleCard';
import { ArticlesShelfIcon } from '../components/Icons';
import { SiteConfig, loadSiteConfig } from '../utils/siteConfig';

interface CategoriesPageProps {
  articles: Article[];
  selectedCategorySlug: string | null;
  onSelectCategory: (slug: string | null) => void;
  onSelectArticle: (slug: string) => void;
  bookmarkedIds: string[];
  onToggleBookmark: (articleId: string, e: React.MouseEvent) => void;
  siteConfig?: SiteConfig;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  articles,
  selectedCategorySlug,
  onSelectCategory,
  onSelectArticle,
  bookmarkedIds,
  onToggleBookmark,
  siteConfig,
}) => {
  const config = siteConfig || loadSiteConfig();
  const displayedCategories = selectedCategorySlug
    ? config.categories.filter((c) => c.slug === selectedCategorySlug)
    : config.categories;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
      {/* ترويسة صفحة التصنيفات */}
      <div className="pb-8 border-b border-[#E6E2D8] dark:border-[#2A2724]">
        <div className="flex items-center gap-3">
          <ArticlesShelfIcon className="w-7 h-7 text-[#E05324]" />
          <h1 className="font-display text-[28px] sm:text-[36px] font-bold text-[#141413] dark:text-[#F5F3EF]">
            التصنيفات والأبواب الموضوعية
          </h1>
        </div>
        <p className="font-prose mt-3 text-[16.5px] sm:text-[18px] leading-[1.75] text-[#4A4742] dark:text-[#B8B3AA] max-w-2xl">
          تنتظم مقالات منصة {config.brandWordmark} في أبواب موضوعية متكاملة تجمع بين التأصيل المقاصدي، وفقه الواقع، وتزكية النفس، وقراءة التراث.
        </p>

        {/* شريط اختيار التصنيف بروابط هاش أصلية */}
        <div className="font-ui mt-6 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <a
            href="#/categories"
            onClick={(e) => {
              e.preventDefault();
              onSelectCategory(null);
            }}
            className={`px-4 py-2 rounded-xl text-[14.5px] transition-colors whitespace-nowrap shrink-0 ${
              selectedCategorySlug === null
                ? 'bg-[#141413] dark:bg-[#F5F3EF] font-bold text-[#F9F7F2] dark:text-[#141413]'
                : 'bg-[#EFECE6] dark:bg-[#1D1B19] font-medium text-[#4A4742] dark:text-[#B8B3AA] hover:text-[#141413] dark:hover:text-[#F5F3EF]'
            }`}
          >
            جميع التصنيفات ({articles.length})
          </a>
          {config.categories.map((cat) => {
            const count = articles.filter((a) => a.categorySlug === cat.slug).length;
            const isSelected = selectedCategorySlug === cat.slug;
            return (
              <a
                key={cat.id}
                href={`#/category/${cat.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectCategory(cat.slug);
                }}
                className={`px-4 py-2 rounded-xl text-[14.5px] transition-colors whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-[#141413] dark:bg-[#F5F3EF] font-bold text-[#F9F7F2] dark:text-[#141413]'
                    : 'bg-[#EFECE6] dark:bg-[#1D1B19] font-medium text-[#4A4742] dark:text-[#B8B3AA] hover:text-[#141413] dark:hover:text-[#F5F3EF]'
                }`}
              >
                {cat.name} ({count})
              </a>
            );
          })}
        </div>
      </div>

      {/* عرض كل تصنيف مع مقالاته */}
      <div className="space-y-14 pt-10">
        {displayedCategories.map((category) => {
          const categoryArticles = articles.filter((a) => a.categorySlug === category.slug);
          return (
            <section
              key={category.id}
              aria-labelledby={`heading-${category.slug}`}
              className="pb-10 border-b border-[#E6E2D8] dark:border-[#2A2724] last:border-b-0"
            >
              <div className="mb-6 rounded-[22px] bg-[#EFECE6]/70 dark:bg-[#1D1B19] p-6 sm:p-8">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2
                    id={`heading-${category.slug}`}
                    className="font-prose text-[24px] sm:text-[28px] font-bold text-[#141413] dark:text-[#F5F3EF]"
                  >
                    {category.name}
                  </h2>
                  <span className="font-ui text-[14px] font-bold text-[#E05324] dark:text-[#F06438] tabular-nums">
                    {categoryArticles.length} مقالات منشورة
                  </span>
                </div>
                <p className="font-prose mt-2.5 text-[16px] leading-[1.8] text-[#4A4742] dark:text-[#B8B3AA] max-w-3xl">
                  {category.description}
                </p>
              </div>

              {categoryArticles.length === 0 ? (
                <div className="rounded-2xl border border-[#E6E2D8] dark:border-[#2A2724] bg-[#EFECE6]/40 dark:bg-[#1D1B19]/50 py-10 px-6 text-center">
                  <p className="font-prose text-[16px] text-[#78736A] dark:text-[#8A847A]">
                    لا توجد مقالات منشورة في هذا الباب حالياً.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#E6E2D8] dark:divide-[#2A2724]">
                  {categoryArticles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      variant="horizontal"
                      onSelectArticle={onSelectArticle}
                      onSelectCategory={(slug) => onSelectCategory(slug)}
                      isBookmarked={bookmarkedIds.includes(article.id)}
                      onToggleBookmark={onToggleBookmark}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};
