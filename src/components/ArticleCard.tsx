import React, { useState, useEffect } from 'react';
import { Bookmark, Clock } from 'lucide-react';
import { Article } from '../data/articles';
import { CuratedStarIcon } from './Icons';

interface ArticleCardProps {
  article: Article;
  variant?: 'featured' | 'horizontal' | 'grid';
  onSelectArticle: (slug: string) => void;
  onSelectCategory?: (categorySlug: string) => void;
  onSelectWriterBlog?: (authorSlug: string) => void;
  isBookmarked?: boolean;
  onToggleBookmark?: (articleId: string, e: React.MouseEvent) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  variant = 'horizontal',
  onSelectArticle,
  onSelectCategory,
  onSelectWriterBlog,
  isBookmarked = false,
  onToggleBookmark,
}) => {
  const [imgError, setImgError] = useState(false);
  const hasValidCoverImage = Boolean(article.coverImage?.trim()) && !imgError;
  useEffect(() => {
    setImgError(false);
  }, [article.coverImage]);
  const postHref = `#/post/${article.slug}`;
  const categoryHref = `#/category/${article.categorySlug}`;
  const writerSlug = article.authorSlug || article.author.slug || '';
  const blogHref = writerSlug ? `#/blog/${writerSlug}` : '#/blogs';
  const blogTitle = article.blogTitle || `مدونة ${article.author.name}`;

  const handleArticleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectArticle(article.slug);
  };

  const handleCategoryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopPropagation();
    if (onSelectCategory) {
      onSelectCategory(article.categorySlug);
    }
  };

  const handleBlogClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopPropagation();
    if (onSelectWriterBlog) {
      onSelectWriterBlog(writerSlug);
    } else {
      window.location.hash = blogHref;
    }
  };

  if (variant === 'featured') {
    return (
      <article
        onClick={() => onSelectArticle(article.slug)}
        className="group cursor-pointer rounded-[24px] transition-all duration-200"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          {/* الصورة الرئيسية للمقال المميز */}
          <div className="lg:col-span-6 order-1">
            <a
              href={postHref}
              onClick={handleArticleClick}
              className="block relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] w-full overflow-hidden rounded-[22px] bg-[#EFECE6] dark:bg-[#1D1B19]"
            >
              {hasValidCoverImage ? (
                <img
                  src={article.coverImage}
                  alt={article.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#142822] to-[#0F1D18] p-6 text-center text-[#F9F7F2]">
                  <span className="text-lg font-bold">{article.categoryName}</span>
                </div>
              )}
            </a>
          </div>

          {/* تفاصيل المقال المميز */}
          <div className="lg:col-span-6 order-2 flex flex-col justify-center">
            <div className="font-ui mb-3 flex items-center gap-2 text-[14px] text-[#78736A] dark:text-[#8A847A]">
              <CuratedStarIcon className="w-4 h-4 shrink-0" />
              <span className="font-bold text-[#141413] dark:text-[#F5F3EF]">مقال العدد المميز</span>
              <span aria-hidden="true">·</span>
              <span>{article.seriesName}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Clock className="w-3.5 h-3.5" />
                {article.readingTimeMinutes} دقائق للقراءة
              </span>
            </div>

            <h1 className="font-display text-[26px] sm:text-[32px] lg:text-[38px] font-bold leading-[1.36] tracking-tight text-[#141413] dark:text-[#F5F3EF] transition-colors duration-150 group-hover:text-[#E05324] dark:group-hover:text-[#F06438]">
              <a href={postHref} onClick={handleArticleClick} className="focus:outline-none">
                {article.title}
              </a>
            </h1>

            <p className="font-prose mt-3.5 text-[16.5px] sm:text-[18px] leading-[1.8] text-[#4A4742] dark:text-[#B8B3AA] line-clamp-3">
              {article.subtitle || article.excerpt}
            </p>

            {/* صف الكاتب (صورة دائرية + اسم باللون البرتقالي المميز كما في المرجع) */}
            <div className="font-ui mt-5 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <img
                    src={article.author.avatar}
                    alt={article.author.name}
                    loading="lazy"
                    className="h-7 w-7 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/10"
                  />
                  <span className="text-[15.5px] font-bold text-[#E05324] dark:text-[#F06438]">
                    {article.author.name}
                  </span>
                </div>

                {/* سطر التصنيف والتاريخ بأسلوب المرجع: في [التصنيف] من [المدونة] • التاريخ */}
                <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[14px] text-[#78736A] dark:text-[#8A847A]">
                  <span>في</span>
                  <a
                    href={categoryHref}
                    onClick={handleCategoryClick}
                    className="font-bold text-[#141413] dark:text-[#F5F3EF] hover:text-[#E05324] dark:hover:text-[#F06438] transition-colors"
                  >
                    {article.categoryName}
                  </a>
                  <span>من</span>
                  <a
                    href={blogHref}
                    onClick={handleBlogClick}
                    className="font-bold text-[#141413] dark:text-[#F5F3EF] hover:text-[#E05324] dark:hover:text-[#F06438] transition-colors"
                  >
                    {blogTitle}
                  </a>
                  <span aria-hidden="true" className="mx-0.5">
                    •
                  </span>
                  <time className="tabular-nums">{article.publishedAt}</time>
                  {article.isCuratedStar && (
                    <CuratedStarIcon className="w-4 h-4 inline-block mr-0.5" />
                  )}
                </div>
              </div>

              {onToggleBookmark && (
                <button
                  type="button"
                  onClick={(e) => onToggleBookmark(article.id, e)}
                  aria-label={isBookmarked ? 'إزالة من المحفوظات' : 'حفظ المقال للقراءة لاحقاً'}
                  className={`p-2.5 rounded-xl transition-colors ${
                    isBookmarked
                      ? 'text-[#E05324] bg-[#EFECE6] dark:bg-[#262320]'
                      : 'text-[#78736A] hover:text-[#141413] dark:hover:text-[#F5F3EF] hover:bg-[#EFECE6]/70 dark:hover:bg-[#1D1B19]'
                  }`}
                >
                  <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>
              )}
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (variant === 'grid') {
    return (
      <article
        onClick={() => onSelectArticle(article.slug)}
        className="group cursor-pointer flex flex-col justify-between rounded-[20px] transition-all duration-200"
      >
        <div>
          <a
            href={postHref}
            onClick={handleArticleClick}
            className="block relative aspect-[16/10] w-full overflow-hidden rounded-[18px] bg-[#EFECE6] dark:bg-[#1D1B19] mb-4"
          >
            {hasValidCoverImage ? (
              <img
                src={article.coverImage}
                alt={article.title}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#142822] text-[#F9F7F2] font-bold">
                {article.categoryName}
              </div>
            )}
          </a>

          <h3 className="font-prose text-[20px] sm:text-[22px] font-bold leading-[1.42] text-[#141413] dark:text-[#F5F3EF] transition-colors duration-150 group-hover:text-[#E05324] dark:group-hover:text-[#F06438]">
            <a href={postHref} onClick={handleArticleClick}>
              {article.title}
            </a>
          </h3>

          <p className="font-prose mt-2 text-[15.5px] leading-[1.72] text-[#4A4742] dark:text-[#B8B3AA] line-clamp-2">
            {article.excerpt}
          </p>
        </div>

        <div className="font-ui mt-4 pt-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <img
                src={article.author.avatar}
                alt={article.author.name}
                loading="lazy"
                className="h-6 w-6 rounded-full object-cover"
              />
              <span className="text-[14.5px] font-bold text-[#E05324] dark:text-[#F06438]">
                {article.author.name}
              </span>
            </div>

            {onToggleBookmark && (
              <button
                type="button"
                onClick={(e) => onToggleBookmark(article.id, e)}
                aria-label={isBookmarked ? 'إزالة من المحفوظات' : 'حفظ المقال'}
                className={`p-1.5 rounded-lg transition-colors ${
                  isBookmarked
                    ? 'text-[#E05324]'
                    : 'text-[#78736A] hover:text-[#141413] dark:hover:text-[#F5F3EF]'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13.5px] text-[#78736A] dark:text-[#8A847A]">
            <span>في</span>
            <a
              href={categoryHref}
              onClick={handleCategoryClick}
              className="font-bold text-[#141413] dark:text-[#F5F3EF] hover:text-[#E05324] transition-colors"
            >
              {article.categoryName}
            </a>
            <span>من</span>
            <a
              href={blogHref}
              onClick={handleBlogClick}
              className="font-bold text-[#141413] dark:text-[#F5F3EF] hover:text-[#E05324] dark:hover:text-[#F06438] transition-colors"
            >
              {blogTitle}
            </a>
            <span aria-hidden="true">•</span>
            <time className="tabular-nums">{article.publishedAt}</time>
            {article.isCuratedStar && <CuratedStarIcon className="w-3.5 h-3.5 inline-block" />}
          </div>
        </div>
      </article>
    );
  }

  // النمط الأفقي الأصيل (Horizontal List Card)
  return (
    <article
      onClick={() => onSelectArticle(article.slug)}
      className="group cursor-pointer flex items-start gap-4 sm:gap-6 py-6 first:pt-2 border-b border-[#E6E2D8] dark:border-[#2A2724] last:border-b-0 transition-colors"
    >
      {/* الصورة المربعة على اليمين (بداية السطر في RTL) */}
      <a
        href={postHref}
        onClick={handleArticleClick}
        className="block relative h-[96px] w-[96px] sm:h-[124px] sm:w-[124px] shrink-0 overflow-hidden rounded-[18px] bg-[#EFECE6] dark:bg-[#1D1B19]"
      >
        {hasValidCoverImage ? (
          <img
            src={article.coverImage}
            alt={article.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#142822] p-2 text-center text-xs font-bold text-[#F9F7F2]">
            {article.categoryName}
          </div>
        )}
      </a>

      {/* عمود النص على اليسار */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-prose text-[18.5px] sm:text-[21.5px] font-bold leading-[1.42] text-[#141413] dark:text-[#F5F3EF] transition-colors duration-150 group-hover:text-[#E05324] dark:group-hover:text-[#F06438]">
            <a href={postHref} onClick={handleArticleClick}>
              {article.title}
            </a>
          </h3>

          {onToggleBookmark && (
            <button
              type="button"
              onClick={(e) => onToggleBookmark(article.id, e)}
              aria-label={isBookmarked ? 'إزالة من المحفوظات' : 'حفظ المقال'}
              className={`shrink-0 p-1.5 rounded-lg transition-colors ${
                isBookmarked
                  ? 'text-[#E05324]'
                  : 'text-[#78736A] opacity-70 hover:opacity-100 hover:text-[#141413] dark:hover:text-[#F5F3EF]'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        <p className="font-prose mt-1.5 text-[15.5px] sm:text-[16.5px] leading-[1.7] text-[#4A4742] dark:text-[#B8B3AA] line-clamp-2">
          {article.excerpt}
        </p>

        {/* اسم الكاتب باللون البرتقالي مع صورته المصغرة */}
        <div className="font-ui mt-3 flex items-center gap-2">
          <img
            src={article.author.avatar}
            alt={article.author.name}
            loading="lazy"
            className="h-6 w-6 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/10"
          />
          <span className="text-[14.5px] font-bold text-[#E05324] dark:text-[#F06438]">
            {article.author.name}
          </span>
        </div>

        {/* سطر البيانات: في [التصنيف] من [مدونة براء العامري] • التاريخ + النجمة */}
        <div className="font-ui mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13.5px] text-[#78736A] dark:text-[#8A847A]">
          <span>في</span>
          <a
            href={categoryHref}
            onClick={handleCategoryClick}
            className="font-bold text-[#141413] dark:text-[#F5F3EF] hover:text-[#E05324] dark:hover:text-[#F06438] transition-colors"
          >
            {article.categoryName}
          </a>
          <span>من</span>
          <a
            href={blogHref}
            onClick={handleBlogClick}
            className="font-bold text-[#141413] dark:text-[#F5F3EF] hover:text-[#E05324] dark:hover:text-[#F06438] transition-colors"
          >
            {blogTitle}
          </a>
          <span aria-hidden="true">•</span>
          <time className="tabular-nums">{article.publishedAt}</time>
          <span aria-hidden="true">•</span>
          <span className="tabular-nums">{article.readingTimeMinutes} د</span>
          {article.isCuratedStar && <CuratedStarIcon className="w-4 h-4 inline-block mr-0.5" />}
        </div>
      </div>
    </article>
  );
};
