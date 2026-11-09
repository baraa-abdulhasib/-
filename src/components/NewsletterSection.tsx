import React, { useState } from 'react';
import { Check, Copy, ArrowUpLeft } from 'lucide-react';
import { CuratedStarIcon } from './Icons';
import { SiteConfig, loadSiteConfig } from '../utils/siteConfig';

interface NewsletterSectionProps {
  siteConfig?: SiteConfig;
}

/**
 * أيقونة تليجرام الرسمية بصيغة فيكتور نقية (SVG) مع حركة انسيابية
 */
const TelegramVectorIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M21.66 3.44C21.25 3.12 20.62 3.06 19.93 3.32L3.29 9.73C2.41 10.07 1.88 10.63 1.86 11.28C1.84 11.92 2.34 12.5 3.19 12.82L7.38 14.37L9.06 19.65C9.27 20.32 9.77 20.69 10.37 20.73C10.97 20.77 11.55 20.49 12.01 19.99L14.48 17.31L18.67 20.52C19.29 21 19.95 21.14 20.54 20.91C21.13 20.67 21.55 20.09 21.71 19.27L23.94 5.56C24.1 4.61 23.87 3.84 21.66 3.44ZM9.05 13.79L18.21 8.03C18.46 7.87 18.69 8.17 18.47 8.38L10.91 15.32L10.52 18.66L9.05 13.79Z"
      fill="currentColor"
    />
  </svg>
);

export const NewsletterSection: React.FC<NewsletterSectionProps> = ({ siteConfig }) => {
  const config = siteConfig || loadSiteConfig();
  const [copied, setCopied] = useState(false);
  const [isTouched, setIsTouched] = useState(false);

  const telegramUrl = (config.telegramUrl || 'https://t.me/BasairPlatform').trim();
  const telegramHandle =
    telegramUrl.replace(/^https?:\/\/(www\.)?t\.me\//i, '@').replace(/\/$/, '') ||
    '@BasairPlatform';

  const handleCopyChannelLink = async () => {
    try {
      await navigator.clipboard.writeText(telegramUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2600);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = telegramUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2600);
    }
  };

  const triggerMobileTouch = () => {
    setIsTouched(true);
    window.setTimeout(() => setIsTouched(false), 950);
  };

  // المنصات الإضافية المستقبلية (لا تظهر إلا إذا تم تفعيلها وإضافة رابطها من لوحة الإدارة)
  const additionalPlatforms = [
    {
      id: 'x',
      label: 'منصة X',
      enabled: Boolean(config.xEnabled && config.xUrl?.trim()),
      url: config.xUrl?.trim() || '',
    },
    {
      id: 'facebook',
      label: 'فيسبوك',
      enabled: Boolean(config.facebookEnabled && config.facebookUrl?.trim()),
      url: config.facebookUrl?.trim() || '',
    },
    {
      id: 'whatsapp',
      label: 'قناة واتساب',
      enabled: Boolean(config.whatsappEnabled && config.whatsappUrl?.trim()),
      url: config.whatsappUrl?.trim() || '',
    },
    {
      id: 'youtube',
      label: 'يوتيوب',
      enabled: Boolean(config.youtubeEnabled && config.youtubeUrl?.trim()),
      url: config.youtubeUrl?.trim() || '',
    },
  ].filter((p) => p.enabled);

  return (
    <section
      id="newsletter-section"
      aria-labelledby="newsletter-heading"
      className="my-12 sm:my-16"
    >
      <div className="relative overflow-hidden rounded-[28px] bg-[#141413] dark:bg-[#1C1A17] text-[#F9F7F2] px-6 py-10 sm:px-12 sm:py-14 border border-black/10 dark:border-[#2E2A26] shadow-lg">
        {/* هالة ضوئية خلفية مريحة للعين تتناغم مع هوية بصائر */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-[#E05324]/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#F5B800]/12 blur-3xl"
        />

        <div className="relative mx-auto max-w-2xl text-center">
          {/* 1. الشارة العلوية الذهبية: مجتمع بصائر */}
          <div className="font-ui inline-flex items-center gap-2 rounded-full bg-[#F5B800]/12 border border-[#F5B800]/25 px-4 py-1.5 text-[14px] font-bold text-[#F5B800] mb-5">
            <CuratedStarIcon className="w-4 h-4" />
            <span>{config.newsletterBadge || 'مجتمع بصائر'}</span>
          </div>

          {/* 2. العنوان الرئيسي */}
          <h2
            id="newsletter-heading"
            className="font-display text-[25px] sm:text-[34px] font-extrabold leading-[1.4] text-[#F9F7F2]"
          >
            {config.newsletterHeading}
          </h2>

          {/* 3. الوصف التعريفي */}
          <p className="font-prose mt-4 text-[16px] sm:text-[18px] leading-[1.85] text-[#D6CEBE] max-w-xl mx-auto">
            {config.newsletterDescription}
          </p>

          {/* 4. أزرار التفاعل: زر الانضمام لقناة تليجرام + زر نسخ رابط القناة للمشاركة */}
          <div className="font-ui mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            {/* الزر الرئيسي: الانتقال المباشر إلى قناة تليجرام مع تأثير حركي أنيق */}
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onTouchStart={triggerMobileTouch}
              className={`group/tg relative inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded-2xl bg-gradient-to-l from-[#FFB800] to-[#F5A800] px-7 py-4 text-[16px] font-extrabold text-[#141413] shadow-[0_8px_28px_-6px_rgba(245,168,0,0.45)] transition-all duration-300 hover:shadow-[0_12px_34px_-4px_rgba(255,196,46,0.62)] hover:-translate-y-0.5 active:translate-y-0 ${
                isTouched ? 'scale-[1.02] shadow-[0_12px_34px_-4px_rgba(255,196,46,0.65)]' : ''
              }`}
            >
              {/* وهج داخلي ناعم يتحرك عند التمرير أو اللمس */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-1 rounded-2xl bg-[#FFC42E]/25 blur-md opacity-0 transition-opacity duration-300 group-hover/tg:opacity-100"
              />

              <TelegramVectorIcon
                className={`relative w-5 h-5 shrink-0 text-[#141413] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isTouched
                    ? '-translate-y-0.5 -translate-x-1 -rotate-12 scale-110'
                    : 'group-hover/tg:-translate-y-0.5 group-hover/tg:-translate-x-1 group-hover/tg:-rotate-12 group-hover/tg:scale-110'
                }`}
              />
              <span className="relative">
                {config.telegramButtonText || 'انضم إلى قناة بصائر على تليجرام'}
              </span>
              <span
                dir="ltr"
                className="relative hidden md:inline-block rounded-lg bg-[#141413]/12 px-2 py-0.5 text-[12.5px] font-bold text-[#141413]/90"
              >
                {telegramHandle}
              </span>
            </a>

            {/* الزر الثانوي: نسخ رابط القناة للمشاركة */}
            <button
              type="button"
              onClick={handleCopyChannelLink}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-[#3A3632] bg-[#1F1D1A] hover:bg-[#282521] hover:border-[#F5B800]/45 px-5 py-4 text-[14.5px] font-bold text-[#F9F7F2] transition-all duration-200 cursor-pointer shrink-0"
              title="نسخ رابط قناة تليجرام لمشاركته"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[#F5B800] shrink-0" />
                  <span className="text-[#F5B800]">تم نسخ رابط القناة!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#B8B3AA] shrink-0" />
                  <span>نسخ رابط القناة</span>
                </>
              )}
            </button>
          </div>

          {/* 5. المنصات الإضافية المستقبلية (تظهر تلقائياً عند تفعيل أي منصة من لوحة الإدارة) */}
          {additionalPlatforms.length > 0 && (
            <div className="font-ui mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-center gap-2.5">
              <span className="text-[13px] text-[#8A847A] ml-1">تابعنا أيضاً عبر:</span>
              {additionalPlatforms.map((platform) => (
                <a
                  key={platform.id}
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#3A3632] bg-[#1F1D1A]/80 hover:border-[#F5B800]/50 hover:text-[#F5B800] px-3.5 py-2 text-[13px] font-bold text-[#D6CEBE] transition-colors"
                >
                  <span>{platform.label}</span>
                  <ArrowUpLeft className="w-3.5 h-3.5 opacity-75" />
                </a>
              ))}
            </div>
          )}

          {/* سطر ختامي هادئ أسفل الأزرار */}
          <p className="font-ui mt-5 text-[13px] text-[#8A847A] flex flex-wrap items-center justify-center gap-2">
            <span>قناة رسمية هادئة</span>
            <span aria-hidden="true">•</span>
            <span dir="ltr" className="text-[#D6CEBE] font-semibold">
              t.me/BasairPlatform
            </span>
            <span aria-hidden="true">•</span>
            <span>بدون ضجيج أو رسائل دعائية</span>
          </p>
        </div>
      </div>
    </section>
  );
};



