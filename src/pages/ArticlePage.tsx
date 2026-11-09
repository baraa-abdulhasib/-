import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  Check,
  Clock,
  Link2,
  ListOrdered,
  Share2,
} from 'lucide-react';
import { Article } from '../data/articles';
import { CuratedStarIcon, BasairSunburstTrio, BasairQuoteBlock } from '../components/Icons';
import { ArticleCard } from '../components/ArticleCard';
import { NewsletterSection } from '../components/NewsletterSection';
import { ArticleWheelIndex, WheelHeadingItem } from '../components/ArticleWheelIndex';
import { enhanceQuranicVersesInHtml } from '../utils/quranVerse';
import { loadSiteConfig } from '../utils/siteConfig';

interface ArticlePageProps {
  article: Article;
  relatedArticles: Article[];
  onBack: () => void;
  onSelectArticle: (slug: string) => void;
  onSelectCategory: (categorySlug: string) => void;
  onSelectWriterBlog?: (writerSlug: string | null) => void;
  isBookmarked: boolean;
  onToggleBookmark: (articleId: string, e: React.MouseEvent) => void;
}

export const ArticlePage: React.FC<ArticlePageProps> = ({
  article,
  relatedArticles,
  onBack,
  onSelectArticle,
  onSelectCategory,
  onSelectWriterBlog,
  isBookmarked,
  onToggleBookmark,
}) => {
  const [readingProgress, setReadingProgress] = useState(0);
  const [fontScale, setFontScale] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [copied, setCopied] = useState(false);
  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const siteConfig = useMemo(() => loadSiteConfig(), []);

  // استخراج محاور المقال لعجلة الفهرس التفاعلية (مع توليد محاور تلقائية إذا كان المقال المخصص قصيراً)
  const headings: WheelHeadingItem[] = useMemo(() => {
    const explicitHeadings = article.content
      .filter((block): block is Extract<typeof block, { type: 'heading' }> => block.type === 'heading')
      .map((h) => ({ id: h.id, text: h.text, level: h.level }));

    if (explicitHeadings.length >= 2) {
      return explicitHeadings;
    }

    const fallbackItems: WheelHeadingItem[] = [];
    article.content.forEach((block, idx) => {
      if (block.type === 'heading') {
        fallbackItems.push({ id: block.id, text: block.text, level: block.level });
      } else if (block.type === 'callout' && block.title) {
        fallbackItems.push({ id: `article-block-${idx}`, text: block.title, level: 2 });
      } else if (block.type === 'list' && block.title) {
        fallbackItems.push({
          id: `article-block-${idx}`,
          text: block.title.replace(/[:：]/g, ''),
          level: 2,
        });
      } else if (block.type === 'paragraph' && idx === 0) {
        fallbackItems.push({ id: `article-block-${idx}`, text: 'مطلع المبحث ومدخله', level: 2 });
      } else if (block.type === 'quote') {
        fallbackItems.push({ id: `article-block-${idx}`, text: 'شاهد ومحور تأصيلي', level: 3 });
      }
    });

    return fallbackItems.length > 0 ? fallbackItems : explicitHeadings;
  }, [article.content]);

  const [activeHeadingId, setActiveHeadingId] = useState<string>(() => headings[0]?.id || '');
  const [chapterProgresses, setChapterProgresses] = useState<number[]>(() =>
    headings.map(() => 0)
  );
  const articleEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setActiveHeadingId(headings[0]?.id || '');
    setChapterProgresses(headings.map(() => 0));
    setIsWheelOpen(false);
  }, [article.id, headings]);

  // الانتقال المباشر إلى محور معين عند الضغط على مقطعه في الشريط العلوي
  const scrollToChapterHeading = (headingId: string) => {
    if (!headingId) return;
    setActiveHeadingId(headingId);
    const el = document.getElementById(headingId);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({
        top: Math.max(0, y),
        behavior: 'smooth',
      });
    }
  };

  // حساب شريط تقدم القراءة المقسّم حسب المحاور حتى نهاية نص المقال فقط (وليس نهاية الموقع)
  useEffect(() => {
    if (isWheelOpen) return;

    const updateProgressAndActiveHeading = () => {
      const scrollTop = window.scrollY;
      const fallbackDocHeight = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );

      // نقطة نهاية المقال الفعلية عند الفاصل الختامي لنص المقال (قبل المراجع وبطاقة الكاتب والمقالات المشابهة والفوتر)
      const endEl = articleEndRef.current;
      const articleMaxScroll = endEl
        ? Math.max(
            1,
            Math.min(
              fallbackDocHeight,
              endEl.getBoundingClientRect().top + scrollTop - window.innerHeight * 0.72
            )
          )
        : fallbackDocHeight;

      const overallProgress = Math.min(
        100,
        Math.max(0, (scrollTop / articleMaxScroll) * 100)
      );
      setReadingProgress(overallProgress);

      if (headings.length > 0) {
        const triggerOffset = window.innerHeight * 0.42;
        const positions: number[] = headings.map((h, i) => {
          const el = document.getElementById(h.id);
          if (!el) return (articleMaxScroll * i) / headings.length;
          return Math.max(0, el.getBoundingClientRect().top + scrollTop - triggerOffset);
        });

        let currentId = headings[0].id;
        for (let i = 0; i < headings.length; i++) {
          if (scrollTop >= positions[i] - 4) {
            currentId = headings[i].id;
          }
        }
        setActiveHeadingId((prev) => (prev === currentId ? prev : currentId));

        // حساب نسبة امتلاء كل فصل/محور على حدة حتى نهاية نص المقال (0% إلى 100%)
        const nextFills = headings.map((_, i) => {
          const startY = i === 0 ? 0 : positions[i];
          const endY =
            i < headings.length - 1
              ? Math.max(startY + 40, positions[i + 1])
              : Math.max(startY + 40, articleMaxScroll);

          if (scrollTop <= startY) return 0;
          if (scrollTop >= endY) return 100;
          return Math.min(100, Math.max(0, ((scrollTop - startY) / (endY - startY)) * 100));
        });
        setChapterProgresses(nextFills);
      }
    };

    window.addEventListener('scroll', updateProgressAndActiveHeading, { passive: true });
    window.addEventListener('resize', updateProgressAndActiveHeading, { passive: true });
    updateProgressAndActiveHeading();
    return () => {
      window.removeEventListener('scroll', updateProgressAndActiveHeading);
      window.removeEventListener('resize', updateProgressAndActiveHeading);
    };
  }, [article.id, headings, isWheelOpen]);

  // تحديث عنوان الصفحة لمحركات البحث عند فتح المقال
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${article.title} — بصائر`;
    return () => {
      document.title = prevTitle;
    };
  }, [article.title]);

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#/post/${article.slug}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const fontSizeStyle =
    fontScale === 'normal'
      ? { fontSize: '18px', lineHeight: '1.92' }
      : fontScale === 'large'
      ? { fontSize: '20px', lineHeight: '1.95' }
      : { fontSize: '22px', lineHeight: '2.0' };

  return (
    <>
      {/* عجلة فهرس المقال الجانبية التفاعلية على يمين الشاشة (مع حلقة تقدم القراءة في زر الفهرس السفلي) */}
      <ArticleWheelIndex
        headings={headings}
        brandWordmark={siteConfig.brandWordmark || 'بصائر'}
        activeHeadingId={activeHeadingId}
        readingProgress={readingProgress}
        isOpen={isWheelOpen}
        onOpen={() => setIsWheelOpen(true)}
        onClose={() => setIsWheelOpen(false)}
        onSelectHeading={(id) => setActiveHeadingId(id)}
      />

      {/* شريط الفصول والمحاور المقسّم (Segmented Chapters Progress Bar) في أعلى النافذة */}
      <div
        role="progressbar"
        aria-label="تقدم قراءة محاور المقال"
        aria-valuenow={Math.round(readingProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="fixed top-0 right-0 left-0 z-50 px-1.5 sm:px-2.5 pt-1 pb-1 pointer-events-none"
      >
        <div className="mx-auto flex items-center gap-1 sm:gap-1.5 w-full">
          {headings.length > 0 ? (
            headings.map((h, idx) => {
              const segFill = chapterProgresses[idx] ?? 0;
              const isCurrentChapter = h.id === activeHeadingId;

              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => scrollToChapterHeading(h.id)}
                  title={`${idx + 1}. ${h.text}`}
                  aria-label={`الانتقال إلى محور: ${h.text}`}
                  className="group relative flex-1 py-1 pointer-events-auto cursor-pointer focus:outline-none"
                >
                  {/* مسار الفصل الفردي */}
                  <div
                    className={`relative h-[3px] sm:h-[3.5px] w-full overflow-hidden rounded-full transition-all duration-200 ${
                      isCurrentChapter
                        ? 'bg-[#D6CEBE] dark:bg-[#332F2B] ring-1 ring-[#E05324]/25 dark:ring-[#FFD24C]/25'
                        : 'bg-[#E2DDD2]/85 dark:bg-[#252320]/90 group-hover:bg-[#D6CEBE] dark:group-hover:bg-[#332F2B]'
                    }`}
                  >
                    {/* التعبئة المتدرجة للفصل */}
                    <div
                      className="h-full w-full origin-right rounded-full bg-gradient-to-l from-[#E05324] to-[#F5B800] dark:from-[#F06438] dark:to-[#FFD24C] transition-transform duration-150 ease-out"
                      style={{ transform: `scaleX(${segFill / 100})` }}
                    />
                  </div>

                  {/* تلميح اسم المحور عند تمرير الماوس على شريط الفصل */}
                  <span className="pointer-events-none absolute top-full mt-1 right-1/2 translate-x-1/2 hidden sm:inline-flex items-center gap-1 rounded-full bg-[#141413]/95 dark:bg-[#23201D]/95 border border-[#D6CEBE]/20 dark:border-[#FFD24C]/25 px-2.5 py-0.5 font-ui text-[10.5px] font-bold text-[#F9F7F2] whitespace-nowrap opacity-0 translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150 shadow-sm">
                    <span className="text-[#F5B800]">{idx + 1}.</span>
                    <span>{h.text}</span>
                  </span>
                </button>
              );
            })
          ) : (
            <div className="h-[3px] w-full overflow-hidden rounded-full bg-[#E2DDD2]/85 dark:bg-[#252320]/90">
              <div
                className="h-full w-full origin-right bg-gradient-to-l from-[#E05324] to-[#F5B800] transition-transform duration-150 ease-out"
                style={{ transform: `scaleX(${readingProgress / 100})` }}
              />
            </div>
          )}
        </div>
      </div>

      <article className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 relative">
        {/* هالة إضاءة القراءة الدافئة حول مطلع المقال وعنوانه */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-6 h-[480px] sm:h-[540px] editorial-focal-halo -z-10"
        />

        {/* رأس المقال: عمود القراءة المحوري (700px) */}
        <div className="mx-auto max-w-[700px] relative">
          {/* شريط العودة والتصنيف */}
          <div className="font-ui mb-6 flex items-center justify-between gap-4">
            <a
              href="#/"
              onClick={(e) => {
                e.preventDefault();
                onBack();
              }}
              className="inline-flex items-center gap-2 text-[14.5px] font-bold text-[#57534E] dark:text-[#A8A29E] hover:text-[#141413] dark:hover:text-[#F5F3EF] transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة إلى المقالات</span>
            </a>

            <div className="flex flex-wrap items-center gap-1.5 text-[14px] text-[#78736A] dark:text-[#8A847A]">
              <span>في</span>
              <a
                href={`#/category/${article.categorySlug}`}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectCategory(article.categorySlug);
                }}
                className="font-bold text-[#E05324] dark:text-[#F06438] hover:underline"
              >
                {article.categoryName}
              </a>
              <span>من</span>
              <a
                href={`#/blog/${article.authorSlug || 'baraa'}`}
                onClick={(e) => {
                  e.preventDefault();
                  if (onSelectWriterBlog) {
                    onSelectWriterBlog(article.authorSlug || 'baraa');
                  }
                }}
                className="font-bold text-[#141413] dark:text-[#F5F3EF] hover:text-[#E05324] transition-colors"
              >
                {article.blogTitle || `مدونة ${article.author.name}`}
              </a>
              <span aria-hidden="true">·</span>
              <span>{article.seriesName}</span>
            </div>
          </div>

          {/* العنوان الرئيسي للمقال (h1 بخط thmanyahserifdisplay-Bold) */}
          <h1 className="font-display text-[28px] sm:text-[36px] lg:text-[42px] font-bold leading-[1.36] tracking-tight text-[#141413] dark:text-[#F5F3EF]">
            {article.title}
          </h1>

          {/* الملخص التمهيدي (Subtitle / Deck بخط thmanyahseriftext-Medium) */}
          <p className="font-prose font-medium mt-4 text-[18px] sm:text-[20px] leading-[1.8] text-[#4A4742] dark:text-[#B8B3AA]">
            {article.subtitle}
          </p>

          {/* بيانات الكاتب والتاريخ ووقت القراءة وأدوات القراءة (بخط thmanyahsans) */}
          <div className="font-ui mt-6 pt-5 pb-6 border-y border-[#E6E2D8] dark:border-[#2A2724] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={article.author.avatar}
                alt={article.author.name}
                loading="lazy"
                className="h-11 w-11 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/10"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[16px] font-extrabold text-[#E05324] dark:text-[#F06438]">
                    {article.author.name}
                  </span>
                  {article.isCuratedStar && <CuratedStarIcon className="w-4 h-4" />}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px] text-[#78736A] dark:text-[#8A847A]">
                  <time className="tabular-nums">{article.publishedAt}</time>
                  <span aria-hidden="true">•</span>
                  <span>{article.hijriDate}</span>
                  <span aria-hidden="true">•</span>
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <Clock className="w-3.5 h-3.5" />
                    {article.readingTimeMinutes} دقائق للقراءة
                  </span>
                </div>
              </div>
            </div>

            {/* أدوات التحكم بحجم الخط والحفظ والنسخ */}
            <div className="flex items-center gap-2">
              <div
                aria-label="حجم خط القراءة"
                className="flex items-center rounded-xl bg-[#EFECE6] dark:bg-[#1D1B19] p-1"
              >
                <button
                  type="button"
                  onClick={() => setFontScale('normal')}
                  className={`px-2.5 py-1 rounded-lg text-[13px] font-bold transition-colors ${
                    fontScale === 'normal'
                      ? 'bg-white dark:bg-[#2C2825] text-[#141413] dark:text-[#F5F3EF] shadow-xs'
                      : 'text-[#78736A]'
                  }`}
                >
                  ع
                </button>
                <button
                  type="button"
                  onClick={() => setFontScale('large')}
                  className={`px-2.5 py-1 rounded-lg text-[14.5px] font-bold transition-colors ${
                    fontScale === 'large'
                      ? 'bg-white dark:bg-[#2C2825] text-[#141413] dark:text-[#F5F3EF] shadow-xs'
                      : 'text-[#78736A]'
                  }`}
                >
                  ع+
                </button>
                <button
                  type="button"
                  onClick={() => setFontScale('xlarge')}
                  className={`px-2.5 py-1 rounded-lg text-[16px] font-bold transition-colors ${
                    fontScale === 'xlarge'
                      ? 'bg-white dark:bg-[#2C2825] text-[#141413] dark:text-[#F5F3EF] shadow-xs'
                      : 'text-[#78736A]'
                  }`}
                >
                  ع++
                </button>
              </div>

              <button
                type="button"
                onClick={(e) => onToggleBookmark(article.id, e)}
                aria-label={isBookmarked ? 'إزالة من المحفوظات' : 'حفظ المقال'}
                className={`p-2.5 rounded-xl border border-[#D6CEBE] dark:border-[#2E2A26] transition-colors ${
                  isBookmarked
                    ? 'bg-[#EFECE6] dark:bg-[#262320] text-[#E05324]'
                    : 'text-[#141413] dark:text-[#F5F3EF] hover:bg-[#EFECE6] dark:hover:bg-[#1D1B19]'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                aria-label="نسخ رابط المقال"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#D6CEBE] dark:border-[#2E2A26] text-[13.5px] font-bold text-[#141413] dark:text-[#F5F3EF] hover:bg-[#EFECE6] dark:hover:bg-[#1D1B19] transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-[#E05324]" />
                    <span>تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    <span>مشاركة</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* الصورة الرئيسية للمقال */}
        <figure className="mx-auto max-w-[780px] my-8 sm:my-10">
          <div className="overflow-hidden rounded-[22px] bg-[#EFECE6] dark:bg-[#1D1B19]">
            <img
              src={article.coverImage}
              alt={article.title}
              loading="lazy"
              className="w-full aspect-[16/10] object-cover"
            />
          </div>
          {article.coverCaption && (
            <figcaption className="mt-3 text-center text-[13.5px] text-[#78736A] dark:text-[#8A847A]">
              {article.coverCaption}
            </figcaption>
          )}
        </figure>

        {/* عمود متن المقال: عرض 700px (بين 680 و720px)، حجم خط 18px، ارتفاع سطر 1.92 */}
        <div
          className="article-prose mx-auto text-[#141413] dark:text-[#F5F3EF]"
          style={fontSizeStyle}
        >
          {/* شريط فتح عجلة فهرس المقال التفاعلية */}
          {headings.length > 0 && (
            <nav
              aria-label="عناصر المقال"
              className="mb-10 rounded-2xl border border-[#E6E2D8] dark:border-[#2A2724] bg-[#EFECE6]/55 dark:bg-[#1D1B19]/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#141413] dark:bg-[#121110] ring-1 ring-[#FFD24C]/35">
                  <CuratedStarIcon className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2 text-[15.5px] font-extrabold text-[#141413] dark:text-[#F5F3EF]">
                    <span>فهرس محاور المقال</span>
                    <span className="font-ui rounded-full bg-[#E05324]/12 px-2.5 py-0.5 text-[12px] font-bold text-[#E05324] dark:text-[#F06438] tabular-nums">
                      {headings.length} محاور
                    </span>
                  </div>
                  <p className="!mb-0 mt-0.5 text-[13.5px] text-[#57534E] dark:text-[#A8A29E] font-ui">
                    تصفّح عناصر المبحث عبر عجلة «{siteConfig.brandWordmark || 'بصائر'}» الجانبية التفاعلية
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsWheelOpen(true)}
                className="font-ui inline-flex items-center justify-center gap-2 rounded-xl bg-[#141413] dark:bg-[#F5F3EF] px-4 py-2.5 text-[13.5px] font-bold text-[#F9F7F2] dark:text-[#141413] hover:opacity-90 transition-opacity shrink-0 cursor-pointer"
              >
                <ListOrdered className="w-4 h-4 text-[#FFD24C] dark:text-[#E05324]" />
                <span>فتح عجلة الفهرس</span>
              </button>
            </nav>
          )}

          {/* عرض كتل المحتوى المنسقة */}
          {article.content.map((block, index) => {
            switch (block.type) {
              case 'paragraph':
                return (
                  <p
                    key={index}
                    id={`article-block-${index}`}
                    className={
                      block.dropCap
                        ? 'scroll-mt-24 text-[19px] sm:text-[20px] font-medium leading-[1.95] text-[#141413] dark:text-[#F5F3EF]'
                        : 'scroll-mt-24 text-[#1F1E1C] dark:text-[#E7E3DC]'
                    }
                    dangerouslySetInnerHTML={{ __html: enhanceQuranicVersesInHtml(block.text) }}
                  />
                );

              case 'heading':
                return block.level === 2 ? (
                  <h2
                    key={index}
                    id={block.id}
                    className="scroll-mt-24 text-[#141413] dark:text-[#F5F3EF]"
                  >
                    {block.text}
                  </h2>
                ) : (
                  <h3
                    key={index}
                    id={block.id}
                    className="scroll-mt-24 text-[#141413] dark:text-[#F5F3EF]"
                  >
                    {block.text}
                  </h3>
                );

              case 'quote':
                return (
                  <BasairQuoteBlock
                    key={index}
                    id={`article-block-${index}`}
                    variant={block.variant}
                    weight={block.weight}
                    htmlText={enhanceQuranicVersesInHtml(block.text)}
                    plainText={block.text}
                    cite={block.cite}
                  />
                );

              case 'list':
                return (
                  <div key={index} id={`article-block-${index}`} className="scroll-mt-24 my-8">
                    {block.title && (
                      <p className="mb-3.5 font-bold text-[#141413] dark:text-[#F5F3EF]">
                        {block.title}
                      </p>
                    )}
                    {block.style === 'ordered' ? (
                      <ol className="space-y-3.5 pr-1">
                        {block.items.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#EFECE6] dark:bg-[#23201D] text-[13px] font-extrabold text-[#E05324] tabular-nums">
                              {idx + 1}
                            </span>
                            <span
                              className="flex-1"
                              dangerouslySetInnerHTML={{ __html: enhanceQuranicVersesInHtml(item) }}
                            />
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <ul className="space-y-3 pr-2">
                        {block.items.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span
                              aria-hidden="true"
                              className="mt-3 h-2 w-2 shrink-0 rounded-full bg-[#E05324]"
                            />
                            <span
                              className="flex-1"
                              dangerouslySetInnerHTML={{ __html: enhanceQuranicVersesInHtml(item) }}
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );

              case 'callout':
                return (
                  <aside
                    key={index}
                    id={`article-block-${index}`}
                    className="basair-callout-box scroll-mt-24 my-9 rounded-[20px] p-6 sm:p-7"
                  >
                    <div className="mb-2.5 flex items-center gap-2 font-prose text-[15.5px] font-bold text-[#E05324] dark:text-[#F06438]">
                      <CuratedStarIcon className="w-4.5 h-4.5 shrink-0" />
                      <span>{block.title}</span>
                    </div>
                    <p
                      className="!mb-0 font-prose text-[16.5px] leading-[1.85] text-[#141413] dark:text-[#F5F3EF]"
                      dangerouslySetInnerHTML={{ __html: enhanceQuranicVersesInHtml(block.text) }}
                    />
                  </aside>
                );

              case 'image':
                return (
                  <figure key={index} className="my-10">
                    <div className="overflow-hidden rounded-2xl border border-[#E6E2D8] dark:border-[#2A2724] bg-[#EFECE6] dark:bg-[#1D1B19]">
                      <img
                        src={block.src}
                        alt={block.alt}
                        loading="lazy"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                    {block.caption && (
                      <figcaption className="mt-2.5 text-center text-[13.5px] text-[#78736A] dark:text-[#8A847A]">
                        {block.caption}
                      </figcaption>
                    )}
                  </figure>
                );

              case 'video': {
                const ytMatch = block.url.match(
                  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/
                );
                return (
                  <figure key={index} className="my-10">
                    <div className="overflow-hidden rounded-2xl border border-[#E6E2D8] dark:border-[#2A2724] bg-[#EFECE6] dark:bg-[#1D1B19]">
                      {ytMatch ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${ytMatch[1]}`}
                          title={block.caption || 'فيديو'}
                          allowFullScreen
                          className="aspect-video w-full"
                        />
                      ) : (
                        <video
                          src={block.url}
                          controls
                          className="aspect-video w-full bg-black"
                        />
                      )}
                    </div>
                    {block.caption && (
                      <figcaption className="mt-2.5 text-center text-[13.5px] text-[#78736A] dark:text-[#8A847A]">
                        {block.caption}
                      </figcaption>
                    )}
                  </figure>
                );
              }

              case 'divider':
                return <BasairSunburstTrio key={index} size="md" withLines={true} className="my-10" />;

              default:
                return null;
            }
          })}

          {/* نقطة نهاية نص المقال (تكتمل عندها نسبة تقدم القراءة 100%) */}
          <div ref={articleEndRef}>
            <BasairSunburstTrio size="md" withLines={true} className="mt-12 mb-6" />
          </div>

          {/* صندوق المراجع والإحالات المرجعية */}
          {article.footnotes && article.footnotes.length > 0 && (
            <section
              aria-label="الإحالات والمراجع"
              className="basair-callout-box mt-10 rounded-[20px] p-6 sm:p-7"
            >
              <div className="mb-3.5 flex items-center gap-2 font-prose text-[16px] font-bold text-[#E05324] dark:text-[#F06438]">
                <CuratedStarIcon className="w-4.5 h-4.5 shrink-0" />
                <h3 className="!m-0 !text-[16px] !font-bold text-[#E05324] dark:text-[#F06438]">
                  الإحالات والمصادر المرجعية:
                </h3>
              </div>
              <ol className="space-y-2.5 text-[14.5px] leading-[1.8] text-[#4A4742] dark:text-[#B8B3AA]">
                {article.footnotes.map((fn, idx) => (
                  <li key={`${fn.id}-${idx}`} className="flex items-start gap-2.5">
                    <span className="font-ui mt-0.5 inline-flex h-5.5 min-w-[26px] shrink-0 items-center justify-center rounded-md bg-[#E05324]/12 dark:bg-[#F06438]/15 px-1.5 text-[12px] font-bold text-[#E05324] dark:text-[#F06438] tabular-nums">
                      [{fn.id}]
                    </span>
                    <span className="flex-1">{fn.text}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* الموضوعات الدلالية ومشاركة المقال */}
          <div className="mt-10 pt-6 border-t border-[#E6E2D8] dark:border-[#2A2724] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 text-[13.5px] text-[#78736A] dark:text-[#8A847A]">
              <span className="font-bold text-[#141413] dark:text-[#F5F3EF]">الموضوعات:</span>
              {article.tags.map((tag, i) => (
                <React.Fragment key={tag}>
                  <span>{tag}</span>
                  {i < article.tags.length - 1 && <span aria-hidden="true">·</span>}
                </React.Fragment>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 rounded-xl bg-[#141413] dark:bg-[#F5F3EF] px-4 py-2.5 text-[14px] font-bold text-[#F9F7F2] dark:text-[#141413] hover:opacity-90 transition-opacity"
              >
                {copied ? <Check className="w-4 h-4 text-[#F5B800]" /> : <Share2 className="w-4 h-4" />}
                <span>{copied ? 'تم نسخ رابط المقال' : 'مشاركة المقال'}</span>
              </button>
            </div>
          </div>

          {/* بطاقة تعريف الكاتب أسفل المقال */}
          <div className="mt-10 rounded-[22px] bg-[#EFECE6] dark:bg-[#1D1B19] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <img
              src={article.author.avatar}
              alt={article.author.name}
              loading="lazy"
              className="h-16 w-16 rounded-full object-cover shrink-0 ring-2 ring-[#E05324]/30"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[18px] font-extrabold text-[#141413] dark:text-[#F5F3EF]">
                  {article.author.name}
                </span>
                <span className="text-[13.5px] text-[#E05324] dark:text-[#F06438] font-bold">
                  • {article.author.role}
                </span>
              </div>
              <p className="!mb-0 mt-2 text-[15px] leading-[1.75] text-[#4A4742] dark:text-[#B8B3AA]">
                {article.author.bio}
              </p>
              <div className="mt-3">
                <a
                  href={`#/blog/${article.authorSlug || 'baraa'}`}
                  onClick={(e) => {
                    e.preventDefault();
                    if (onSelectWriterBlog) {
                      onSelectWriterBlog(article.authorSlug || 'baraa');
                    }
                  }}
                  className="font-ui inline-flex items-center gap-1 text-xs font-bold text-[#E05324] dark:text-[#F06438] hover:underline"
                >
                  <span>زيارة {article.blogTitle || `مدونة ${article.author.name}`}</span>
                  <span aria-hidden="true">←</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* قسم مقالات ذات صلة */}
        {relatedArticles.length > 0 && (
          <section
            aria-labelledby="related-articles-heading"
            className="mt-16 pt-12 border-t border-[#E6E2D8] dark:border-[#2A2724]"
          >
            <div className="flex items-center justify-between mb-6">
              <h2
                id="related-articles-heading"
                className="text-[24px] sm:text-[28px] font-extrabold text-[#141413] dark:text-[#F5F3EF]"
              >
                مقالات ذات صلة
              </h2>
              <a
                href={`#/category/${article.categorySlug}`}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectCategory(article.categorySlug);
                }}
                className="font-ui text-[15.5px] font-bold text-[#E05324] dark:text-[#F06438] underline underline-offset-4"
              >
                المزيد في {article.categoryName}
              </a>
            </div>

            <div className="divide-y divide-[#E6E2D8] dark:divide-[#2A2724]">
              {relatedArticles.map((rel) => (
                <ArticleCard
                  key={rel.id}
                  article={rel}
                  variant="horizontal"
                  onSelectArticle={onSelectArticle}
                  onSelectCategory={onSelectCategory}
                  onSelectWriterBlog={onSelectWriterBlog}
                />
              ))}
            </div>
          </section>
        )}

        <NewsletterSection />
      </article>
    </>
  );
};
