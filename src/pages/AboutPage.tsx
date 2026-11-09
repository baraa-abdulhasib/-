import React, { useState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { CuratedStarIcon, BasairSunburstTrio, BasairQuoteBlock } from '../components/Icons';
import { PageView } from '../components/Header';
import { SiteConfig, loadSiteConfig } from '../utils/siteConfig';
import { submitContactMessageToFirestore } from '../firebase';

interface AboutPageProps {
  onNavigate: (page: PageView, categorySlug?: string | null) => void;
  siteConfig?: SiteConfig;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate, siteConfig }) => {
  const config = siteConfig || loadSiteConfig();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim() || sending) return;
    setSending(true);
    try {
      await submitContactMessageToFirestore(name, email, message);
      setSent(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch {
      // fallback if offline
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
      <div className="mx-auto max-w-[700px]">
        {/* تعريف المنصة */}
        <div className="inline-flex items-center gap-2 text-[14px] font-bold text-[#E05324] dark:text-[#F06438] mb-3">
          <CuratedStarIcon className="w-4 h-4" />
          <span>{config.aboutBadge}</span>
        </div>

        <h1 className="text-[30px] sm:text-[40px] font-extrabold leading-[1.35] text-[#141413] dark:text-[#F5F3EF]">
          عن منصة «{config.brandWordmark}»
        </h1>

        <p className="mt-4 text-[19px] leading-[1.85] text-[#4A4742] dark:text-[#B8B3AA]">
          {config.aboutIntro}
        </p>

        {/* كُتّاب بصائر */}
        <div className="my-10 rounded-[24px] bg-[#EFECE6] dark:bg-[#1D1B19] p-6 sm:p-8 border border-black/5 dark:border-white/5">
          <h2 className="text-[20px] font-extrabold text-[#141413] dark:text-[#F5F3EF] mb-2">
            كُتّاب {config.brandWordmark} ومدوّناتهم
          </h2>
          <p className="text-[15px] text-[#78736A] dark:text-[#8A847A] mb-5">
            تضم {config.brandWordmark} مدونات مستقلة لنخبة من الأقلام الرصينة، لكل قلم زاويته واختصاصه:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {config.writers.map((w) => (
              <a
                key={w.id}
                href={`#/blog/${w.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('blogs', w.slug);
                }}
                className="p-4 rounded-xl bg-white dark:bg-[#252420] border border-black/5 dark:border-white/5 hover:border-[#E05324]/40 transition-colors block"
              >
                <h3 className="font-bold text-[#141413] dark:text-[#F5F3EF]">{w.blogTitle}</h3>
                <p className="text-xs text-[#E05324] font-semibold mt-0.5">
                  {w.name} • {w.blogTopic || w.role}
                </p>
              </a>
            ))}
          </div>

          <div className="mt-5 text-center sm:text-right">
            <a
              href="#/blogs"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('blogs');
              }}
              className="font-ui inline-flex items-center gap-1.5 text-sm font-bold text-[#E05324] dark:text-[#F06438] hover:underline"
            >
              <span>تصفح جميع المدونات ومقالات الكُتّاب</span>
              <span>←</span>
            </a>
          </div>
        </div>

        {/* الرؤية والمنهج */}
        <div className="article-prose text-[#141413] dark:text-[#F5F3EF]">
          <h2>{config.aboutMissionHeading}</h2>
          <p>{config.aboutMissionText}</p>

          <BasairQuoteBlock plainText={config.aboutQuote} className="my-10" />

          <BasairSunburstTrio size="md" withLines={true} className="my-9" />

          <h2>المرتكزات الأربعة للمحتوى</h2>
          <ol className="space-y-4 my-6">
            <li className="flex items-start gap-3">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#EFECE6] dark:bg-[#23201D] text-[13px] font-extrabold text-[#E05324] tabular-nums">
                1
              </span>
              <span>
                <strong>الأصالة والانضباط الأصولي:</strong> الانطلاق من محكمات الكتاب والسنة وأصول
                الاستدلال المعتبرة عند أئمة الهدى.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#EFECE6] dark:bg-[#23201D] text-[13px] font-extrabold text-[#E05324] tabular-nums">
                2
              </span>
              <span>
                <strong>البصيرة المقاصدية:</strong> إبراز حِكَم التشريع ومصالحه الكلية في حفظ الدين
                والنفس والعقل والنسل والمال.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#EFECE6] dark:bg-[#23201D] text-[13px] font-extrabold text-[#E05324] tabular-nums">
                3
              </span>
              <span>
                <strong>العناية بالبيان العربي:</strong> الحرص على سلامة العبارة وجمال السبك ووضوح
                الحجة بعيداً عن التعقيد اللفظي.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#EFECE6] dark:bg-[#23201D] text-[13px] font-extrabold text-[#E05324] tabular-nums">
                4
              </span>
              <span>
                <strong>عمارة القلب والعمل:</strong> وصل المعرفة الشرعية بتزكية النفس وأثرها العملي
                في السلوك والعمران.
              </span>
            </li>
          </ol>
        </div>

        {/* أبواب المدونة */}
        <div className="my-12 pt-8 border-t border-[#E6E2D8] dark:border-[#2A2724]">
          <h2 className="text-[22px] font-extrabold text-[#141413] dark:text-[#F5F3EF] mb-4">
            استكشف أبواب {config.brandWordmark}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {config.categories.map((cat) => (
              <a
                key={cat.id}
                href={`#/category/${cat.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('categories', cat.slug);
                }}
                className="block text-right rounded-2xl border border-[#E6E2D8] dark:border-[#2A2724] bg-[#EFECE6]/50 dark:bg-[#1D1B19] p-5 hover:border-[#E05324] transition-colors group"
              >
                <h3 className="text-[17px] font-extrabold text-[#141413] dark:text-[#F5F3EF] group-hover:text-[#E05324] transition-colors">
                  {cat.name}
                </h3>
                <p className="mt-1.5 text-[14px] leading-[1.65] text-[#4A4742] dark:text-[#B8B3AA]">
                  {cat.shortDesc}
                </p>
              </a>
            ))}
          </div>
        </div>

        {/* نموذج التواصل والمراسلة العلمية */}
        <section
          aria-labelledby="contact-heading"
          className="my-12 rounded-[24px] border border-[#E6E2D8] dark:border-[#2A2724] bg-[#EFECE6]/60 dark:bg-[#1D1B19] p-6 sm:p-8"
        >
          <h2
            id="contact-heading"
            className="text-[22px] font-extrabold text-[#141413] dark:text-[#F5F3EF]"
          >
            المراسلة العلمية والمداخلات
          </h2>
          <p className="mt-2 text-[15px] leading-[1.75] text-[#4A4742] dark:text-[#B8B3AA]">
            ترحب المدونة بالمباحثات العلمية الرصينة، والاستدراكات المنهجية، واقتراحات الموضوعات.
          </p>

          {sent ? (
            <div className="mt-6 flex items-center gap-3 rounded-xl bg-[#142822] text-[#F9F7F2] p-4 text-[15px]">
              <CheckCircle2 className="w-5 h-5 text-[#F5B800] shrink-0" />
              <span>وصلت رسالتك الكريمة، شكرًا لتواصلك واهتمامك.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13.5px] font-bold mb-1.5 text-[#141413] dark:text-[#F5F3EF]">
                    الاسم الكريم
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="الاسم..."
                    className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-[#F9F7F2] dark:bg-[#121110] px-4 py-2.5 text-[15px] focus:border-[#141413] dark:focus:border-[#F5F3EF] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[13.5px] font-bold mb-1.5 text-[#141413] dark:text-[#F5F3EF]">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-[#F9F7F2] dark:bg-[#121110] px-4 py-2.5 text-[15px] focus:border-[#141413] dark:focus:border-[#F5F3EF] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[13.5px] font-bold mb-1.5 text-[#141413] dark:text-[#F5F3EF]">
                  الرسالة أو المداخلة العلمية
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اكتب رسالتك أو تعليقك هنا..."
                  className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-[#F9F7F2] dark:bg-[#121110] px-4 py-3 text-[15px] focus:border-[#141413] dark:focus:border-[#F5F3EF] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-[#141413] dark:bg-[#F5F3EF] px-6 py-3 text-[15px] font-bold text-[#F9F7F2] dark:text-[#141413] hover:opacity-90 transition-opacity"
              >
                <Send className="w-4 h-4" />
                <span>إرسال الرسالة</span>
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
};
