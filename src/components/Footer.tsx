import React from 'react';
import { PageView } from './Header';
import { BasairLogoMark, BasairSunburstTrio } from './Icons';
import { SiteConfig, loadSiteConfig } from '../utils/siteConfig';

interface FooterProps {
  onNavigate: (page: PageView, filterSlug?: string | null) => void;
  onSecretStudioTrigger?: () => void;
  siteConfig?: SiteConfig;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onSecretStudioTrigger,
  siteConfig,
}) => {
  const config = siteConfig || loadSiteConfig();
  return (
    <footer className="font-ui mt-16 border-t border-[#E6E2D8] dark:border-[#2A2724] bg-[#F4F1EA] dark:bg-[#151412]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* عمود الهوية والتعريف */}
          <div className="md:col-span-5">
            <button
              type="button"
              onClick={() => onNavigate('home', null)}
              className="group inline-flex items-center gap-3 text-right cursor-pointer select-none focus:outline-none"
            >
              <BasairLogoMark className="w-9 h-9 shrink-0 transition-transform duration-300 group-hover:scale-[1.03]" />
              <span className="font-display text-[30px] font-bold tracking-tight text-[#141413] dark:text-[#F5F3EF] group-hover:text-[#E05324] dark:group-hover:text-[#F06438] transition-colors">
                {config.brandWordmark}
              </span>
            </button>
            <p className="mt-2 text-[14px] font-bold text-[#E05324] dark:text-[#F06438]">
              {config.brandWordmark} — {config.tagline}
            </p>
            <p className="font-prose mt-3 text-[15px] leading-[1.8] text-[#4A4742] dark:text-[#B8B3AA] max-w-sm">
              {config.subtitle}
            </p>
            <div className="mt-4 flex justify-start">
              <BasairSunburstTrio size="sm" withLines={false} className="!my-1" />
            </div>
          </div>

          {/* عمود مدونات الكُتّاب */}
          <div className="md:col-span-4">
            <h3 className="font-ui text-[15px] font-bold text-[#141413] dark:text-[#F5F3EF] mb-4">
              مدوّنات الكُتّاب في {config.brandWordmark}
            </h3>
            <ul className="space-y-2.5 text-[14.5px]">
              {config.writers.map((wb) => (
                <li key={wb.slug}>
                  <a
                    href={`#/blog/${wb.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('blogs', wb.slug);
                    }}
                    className="flex items-center justify-between text-[#4A4742] dark:text-[#B8B3AA] hover:text-[#E05324] dark:hover:text-[#F06438] transition-colors"
                  >
                    <span>{wb.blogTitle}</span>
                    <span className="text-xs text-[#78736A] dark:text-[#8A847A]">{wb.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* عمود الروابط السريعة */}
          <div className="md:col-span-3">
            <h3 className="font-ui text-[15px] font-bold text-[#141413] dark:text-[#F5F3EF] mb-4">
              روابط سريعة
            </h3>
            <ul className="space-y-2.5 text-[14.5px]">
              <li>
                <a
                  href="#/"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('home', null);
                  }}
                  className="text-[#4A4742] dark:text-[#B8B3AA] hover:text-[#E05324] transition-colors"
                >
                  الرئيسية
                </a>
              </li>
              <li>
                <a
                  href="#/blogs"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('blogs', null);
                  }}
                  className="text-[#4A4742] dark:text-[#B8B3AA] hover:text-[#E05324] transition-colors"
                >
                  المدوّنات
                </a>
              </li>
              <li>
                <a
                  href="#/articles"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('articles', null);
                  }}
                  className="text-[#4A4742] dark:text-[#B8B3AA] hover:text-[#E05324] transition-colors"
                >
                  جميع المقالات
                </a>
              </li>
              <li>
                <a
                  href="#/categories"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('categories', null);
                  }}
                  className="text-[#4A4742] dark:text-[#B8B3AA] hover:text-[#E05324] transition-colors"
                >
                  التصنيفات الموضوعية
                </a>
              </li>
              <li>
                <a
                  href="#/about"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('about', null);
                  }}
                  className="text-[#4A4742] dark:text-[#B8B3AA] hover:text-[#E05324] transition-colors"
                >
                  عن منصة بصائر
                </a>
              </li>
              <li>
                <a
                  href="#/bookmarks"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('bookmarks', null);
                  }}
                  className="text-[#4A4742] dark:text-[#B8B3AA] hover:text-[#E05324] transition-colors"
                >
                  قائمة القراءة المحفوظة
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* سطر الحقوق والمفتاح السري */}
        <div className="mt-12 pt-6 border-t border-[#E6E2D8] dark:border-[#2A2724] flex flex-col sm:flex-row items-center justify-between gap-4 text-[13.5px] text-[#78736A] dark:text-[#8A847A]">
          <p>
            © {new Date().getFullYear()} منصة{' '}
            <span className="font-bold text-[#141413] dark:text-[#F5F3EF]">
              {config.brandWordmark}
            </span>
            . جميع الحقوق محفوظة.
          </p>
          <p className="flex items-center gap-1.5">
            <span>{config.footerNote}</span>
            {/* المفتاح السري المباشر للاستوديو: النقر على براء العامري */}
            <span
              role="button"
              tabIndex={0}
              onClick={() => onSecretStudioTrigger?.()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSecretStudioTrigger?.();
                }
              }}
              className="cursor-pointer select-none font-bold text-[#141413] dark:text-[#F5F3EF] hover:text-[#E05324] dark:hover:text-[#F06438] transition-colors underline underline-offset-4 decoration-transparent hover:decoration-[#E05324]"
              title={config.brandWordmark}
            >
              {config.supervisorName || 'براء العامري'}
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
};
