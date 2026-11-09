import React from 'react';
import { Search, Moon, Sun, X, Bookmark } from 'lucide-react';
import { Article } from '../data/articles';
import { CuratedStarIcon, BasairSunburstTrio } from './Icons';
import { buildHashPath } from '../utils/router';
import { SiteConfig, loadSiteConfig } from '../utils/siteConfig';

export type PageView = 'home' | 'blogs' | 'articles' | 'categories' | 'about' | 'article-detail' | 'bookmarks';

interface HeaderProps {
  currentPage: PageView;
  selectedCategorySlug: string | null;
  onNavigate: (page: PageView, filterSlug?: string | null) => void;
  onSelectArticle: (slug: string) => void;
  isDark: boolean;
  onToggleDark: () => void;
  isSearchOpen: boolean;
  onToggleSearch: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchResults: Article[];
  bookmarkedCount: number;
  onScrollToNewsletter: () => void;
  siteConfig?: SiteConfig;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  selectedCategorySlug,
  onNavigate,
  onSelectArticle,
  isDark,
  onToggleDark,
  isSearchOpen,
  onToggleSearch,
  searchQuery,
  onSearchChange,
  searchResults,
  bookmarkedCount,
  onScrollToNewsletter,
  siteConfig,
}) => {
  const config = siteConfig || loadSiteConfig();
  const navItems: { id: PageView; label: string; href: string }[] = [
    { id: 'home', label: 'الرئيسية', href: buildHashPath('home') },
    { id: 'blogs', label: 'المدوّنات', href: buildHashPath('blogs') },
    { id: 'articles', label: 'المقالات', href: buildHashPath('articles') },
    { id: 'categories', label: 'التصنيفات', href: buildHashPath('categories') },
    { id: 'about', label: `عن ${config.brandWordmark}`, href: buildHashPath('about') },
  ];

  return (
    <header className="font-ui relative z-10 w-full border-b border-[#E6E2D8]/85 dark:border-[#2A2724]/85 bg-transparent backdrop-blur-[2px]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* الصف العلوي: الشعار والاسم (يمين) — روابط التنقل (وسط للشاشات المتوسطة والكبيرة) — البحث والوضع الداكن والاشتراك (يسار) */}
        <div className="flex items-center justify-between gap-4 py-4 sm:py-5">
          {/* اسم بصائر وتحته النجمات الذهبية الثلاث */}
          <a
            href="#/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('home', null);
            }}
            className="inline-flex flex-col items-center justify-center text-center group focus:outline-none shrink-0"
            aria-label={`${config.brandWordmark} — الصفحة الرئيسية`}
          >
            <span className="font-display block text-[28px] sm:text-[34px] font-bold tracking-tight leading-tight text-[#141413] dark:text-[#F5F3EF] group-hover:text-[#E05324] dark:group-hover:text-[#F06438] transition-colors whitespace-nowrap">
              {config.brandWordmark}
            </span>
            <BasairSunburstTrio size="xs" withLines={false} className="!my-0 mt-2.5 sm:mt-3" />
          </a>

          {/* روابط التنقل على الحاسوب */}
          <nav
            aria-label="التنقل الرئيسي"
            className="hidden md:flex items-center gap-2"
          >
            {navItems.map((item) => {
              const isActive =
                currentPage === item.id ||
                (item.id === 'articles' && currentPage === 'article-detail');
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(item.id, null);
                  }}
                  className={`px-4 py-2 text-[15.5px] rounded-xl transition-all duration-150 whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#EFECE6] dark:bg-[#23201D] font-bold text-[#141413] dark:text-[#F5F3EF]'
                      : 'font-medium text-[#57534E] dark:text-[#A8A29E] hover:text-[#141413] dark:hover:text-[#F5F3EF]'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* أزرار الأدوات (البحث، المحفوظات، الوضع الداكن، الاشتراك) */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* زر البحث */}
            <button
              type="button"
              onClick={onToggleSearch}
              aria-label="بحث في المقالات"
              aria-expanded={isSearchOpen}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                isSearchOpen
                  ? 'bg-[#EFECE6] dark:bg-[#23201D] text-[#141413] dark:text-[#F5F3EF]'
                  : 'text-[#141413] dark:text-[#F5F3EF] hover:bg-[#EFECE6]/80 dark:hover:bg-[#23201D]'
              }`}
            >
              {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </button>

            {/* رابط المحفوظات */}
            <a
              href="#/bookmarks"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('bookmarks', null);
              }}
              aria-label="المقالات المحفوظة"
              className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                currentPage === 'bookmarks'
                  ? 'bg-[#EFECE6] dark:bg-[#23201D] text-[#E05324]'
                  : 'text-[#141413] dark:text-[#F5F3EF] hover:bg-[#EFECE6]/80 dark:hover:bg-[#23201D]'
              }`}
            >
              <Bookmark className="h-5 w-5" />
              {bookmarkedCount > 0 && (
                <span className="absolute -top-0.5 -left-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E05324] px-1 text-[10px] font-bold text-white tabular-nums">
                  {bookmarkedCount}
                </span>
              )}
            </a>

            {/* زر تبديل الوضع الفاتح / الداكن */}
            <button
              type="button"
              onClick={onToggleDark}
              aria-label={isDark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-white/80 dark:bg-[#1D1B19] text-[#141413] dark:text-[#F5F3EF] hover:bg-[#EFECE6] dark:hover:bg-[#282522] transition-colors"
            >
              {isDark ? <Sun className="h-[18px] w-[18px] text-[#F5B800]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>

            {/* زر الاشتراك الأسود المميز مع النجمة الذهبية (كما في المرجع البصري) */}
            <button
              type="button"
              onClick={onScrollToNewsletter}
              className="inline-flex items-center gap-2 rounded-xl bg-[#141413] dark:bg-[#F5F3EF] px-3.5 sm:px-4 py-2.5 text-[14px] sm:text-[15px] font-bold text-[#F9F7F2] dark:text-[#141413] hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
            >
              <CuratedStarIcon className="h-4 w-4 shrink-0" />
              <span>اشتراك</span>
            </button>
          </div>
        </div>

        {/* شريط التنقل للجوال (مستلهم مباشرة من الصورة المرجعية IMG_5125) */}
        <nav
          aria-label="تنقل الجوال"
          className="flex md:hidden items-center justify-between gap-1 pb-3 pt-0.5 overflow-x-auto no-scrollbar"
        >
          {navItems.map((item) => {
            const isActive =
              currentPage === item.id ||
              (item.id === 'articles' && currentPage === 'article-detail');
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(item.id, null);
                }}
                className={`px-3.5 py-2 text-[15px] rounded-xl transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#EFECE6] dark:bg-[#23201D] font-bold text-[#141413] dark:text-[#F5F3EF]'
                    : 'font-medium text-[#57534E] dark:text-[#A8A29E]'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* لوحة البحث الفوري المنسدلة (مستلهمة من الصورة المرجعية IMG_5132) */}
        {isSearchOpen && (
          <div className="pb-6 pt-2 animate-fadeIn">
            <div className="relative">
              <Search className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#141413] dark:text-[#F5F3EF]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="ابحث في المقالات، المقاصد، أو المفاهيم الشرعية..."
                autoFocus
                className="w-full rounded-xl border-[1.5px] border-[#141413] dark:border-[#F5F3EF] bg-transparent py-3 pr-12 pl-10 text-[16px] text-[#141413] dark:text-[#F5F3EF] placeholder:text-[#78736A] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="مسح البحث"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#78736A] hover:text-[#141413] dark:hover:text-[#F5F3EF]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* نتائج البحث الفورية أو التصنيفات السريعة */}
            <div className="mt-5">
              {searchQuery.trim() !== '' ? (
                <div>
                  <div className="mb-3 flex items-center justify-between text-[13.5px] text-[#78736A] dark:text-[#8A847A]">
                    <span>نتائج البحث عن «{searchQuery}»</span>
                    <span className="tabular-nums">{searchResults.length} مقال</span>
                  </div>
                  {searchResults.length > 0 ? (
                    <div className="divide-y divide-[#E6E2D8] dark:divide-[#2A2724] rounded-2xl bg-[#EFECE6]/60 dark:bg-[#1D1B19] px-4">
                      {searchResults.map((art) => (
                        <a
                          key={art.id}
                          href={`#/post/${art.slug}`}
                          onClick={(e) => {
                            e.preventDefault();
                            onSelectArticle(art.slug);
                            onToggleSearch();
                          }}
                          className="w-full py-3.5 text-right flex items-center gap-3.5 group"
                        >
                          <img
                            src={art.coverImage}
                            alt={art.title}
                            loading="lazy"
                            className="h-12 w-12 rounded-xl object-cover shrink-0 bg-[#EFECE6] dark:bg-[#142822]" onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-[15.5px] text-[#141413] dark:text-[#F5F3EF] group-hover:text-[#E05324] truncate">
                              {art.title}
                            </p>
                            <p className="text-[13px] text-[#78736A] dark:text-[#8A847A] mt-0.5">
                              في {art.categoryName} • {art.publishedAt}
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="py-6 text-center text-[15px] text-[#78736A]">
                      لم نعثر على مقالات تطابق عبارة البحث. جرّب كلمات أخرى أو تصفّح التصنيفات.
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="mb-3 text-[14px] font-bold text-[#141413] dark:text-[#F5F3EF]">
                    تصفّح حسب الموضوعات والتصنيفات:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {config.categories.map((cat) => (
                      <a
                        key={cat.id}
                        href={`#/category/${cat.slug}`}
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate('categories', cat.slug);
                          onToggleSearch();
                        }}
                        className={`px-3.5 py-2 rounded-xl text-[14px] font-medium transition-colors whitespace-nowrap ${
                          selectedCategorySlug === cat.slug
                            ? 'bg-[#141413] text-[#F9F7F2] dark:bg-[#F5F3EF] dark:text-[#141413]'
                            : 'bg-[#EFECE6] dark:bg-[#1D1B19] text-[#141413] dark:text-[#F5F3EF] hover:bg-[#E4DFD5] dark:hover:bg-[#282522]'
                        }`}
                      >
                        {cat.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
