import React, { useId, useState } from 'react';

interface CubicSegment {
  p0: [number, number];
  p1: [number, number];
  p2: [number, number];
  p3: [number, number];
}

/**
 * المنحنيات الهندسية المحسّنة بصرياً لنجمة بصائر الثمانية المفصّصة ذات الإطار المزدوج
 * (8-Lobed Double-Contoured Islamic/Arabic Ogee Rosette — Optical Sculpted Edition)
 * تجمع بين روح النموذج المرجعي وبروز الرؤوس الثمانية والفجوة المفرّغة من المسافات البعيدة:
 * - تعميق الخصور الغائرة بين الفصوص الثمانية إلى 28.5% لإبراز التموّج الثماني بوضوح فوري
 * - توسيع الفجوة المفرّغة بين الإطار الخارجي والكتلة الداخلية لضمان عدم اندماجها عند التصغير
 */
const ROSETTE_OUTER_CURVE: CubicSegment = {
  p0: [0.0, -1.0],
  p1: [0.062, -0.825],
  p2: [0.242, -0.845],
  p3: [0.2736, -0.6606],
};

const ROSETTE_MID_CURVE: CubicSegment = {
  p0: [0.0, -0.918],
  p1: [0.072, -0.768],
  p2: [0.226, -0.782],
  p3: [0.2457, -0.5931],
};

const ROSETTE_INNER_CURVE: CubicSegment = {
  p0: [0.0, -0.815],
  p1: [0.082, -0.692],
  p2: [0.204, -0.698],
  p3: [0.2112, -0.51],
};

/**
 * نسخة متكيّفة حجمياً للأيقونات المصغّرة جداً (14px–16px مثل شارة المقال المختار وزر الفهرس)
 * ذات تخصّر أعمق (32%) وفجوة أوضح لتبقى مقروءة بحدّة تامة في المساحات الضيقة
 */
const MICRO_ROSETTE_OUTER_CURVE: CubicSegment = {
  p0: [0.0, -1.0],
  p1: [0.055, -0.795],
  p2: [0.232, -0.815],
  p3: [0.2602, -0.6282],
};

const MICRO_ROSETTE_MID_CURVE: CubicSegment = {
  p0: [0.0, -0.895],
  p1: [0.066, -0.725],
  p2: [0.21, -0.738],
  p3: [0.2258, -0.5451],
};

const MICRO_ROSETTE_INNER_CURVE: CubicSegment = {
  p0: [0.0, -0.765],
  p1: [0.076, -0.628],
  p2: [0.182, -0.635],
  p3: [0.1837, -0.4435],
};

function buildEightLobedSubpath(
  cx: number,
  cy: number,
  radius: number,
  seg: CubicSegment,
  counterClockwise = false
): string {
  const dir = counterClockwise ? -1 : 1;
  const project = (x: number, y: number, deg: number): [string, string] => {
    const rad = (deg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const rx = x * cos - y * sin;
    const ry = x * sin + y * cos;
    return [
      (cx + dir * radius * rx).toFixed(2),
      (cy + radius * ry).toFixed(2),
    ];
  };

  const cmds: string[] = [];
  for (let k = 0; k < 8; k++) {
    const a0 = k * 45;
    const a1 = (k + 1) * 45;

    if (k === 0) {
      const [x0, y0] = project(seg.p0[0], seg.p0[1], a0);
      cmds.push(`M ${x0} ${y0}`);
    }

    const [c1x, c1y] = project(seg.p1[0], seg.p1[1], a0);
    const [c2x, c2y] = project(seg.p2[0], seg.p2[1], a0);
    const [vx, vy] = project(seg.p3[0], seg.p3[1], a0);
    cmds.push(`C ${c1x} ${c1y} ${c2x} ${c2y} ${vx} ${vy}`);

    const [mc1x, mc1y] = project(-seg.p2[0], seg.p2[1], a1);
    const [mc2x, mc2y] = project(-seg.p1[0], seg.p1[1], a1);
    const [nx, ny] = project(seg.p0[0], seg.p0[1], a1);
    cmds.push(`C ${mc1x} ${mc1y} ${mc2x} ${mc2y} ${nx} ${ny}`);
  }

  cmds.push('Z');
  return cmds.join(' ');
}

function createBasairRosetteStarPath(
  cx: number,
  cy: number,
  outerRadius: number,
  isMicro = false
): string {
  const outerCurve = isMicro ? MICRO_ROSETTE_OUTER_CURVE : ROSETTE_OUTER_CURVE;
  const midCurve = isMicro ? MICRO_ROSETTE_MID_CURVE : ROSETTE_MID_CURVE;
  const innerCurve = isMicro ? MICRO_ROSETTE_INNER_CURVE : ROSETTE_INNER_CURVE;

  const outerPath = buildEightLobedSubpath(cx, cy, outerRadius, outerCurve, false);
  const midPath = buildEightLobedSubpath(cx, cy, outerRadius, midCurve, true);
  const innerPath = buildEightLobedSubpath(cx, cy, outerRadius, innerCurve, false);
  return `${outerPath} ${midPath} ${innerPath}`;
}

export const SUNBURST_PATH_24 = createBasairRosetteStarPath(12, 12, 11.6, true);
export const SUNBURST_PATH_48 = createBasairRosetteStarPath(24, 24, 23.2, false);

/**
 * شارة نجمة بصائر الثمانية الذهبية الفردية (بتصميم الشمسية المزخرفة ذات الإطار المزدوج)
 */
export const CuratedStarIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-transform duration-500 ease-out hover:rotate-[22.5deg] ${className}`}
    aria-hidden="true"
  >
    <path
      d={SUNBURST_PATH_24}
      fillRule="evenodd"
      clipRule="evenodd"
      className="fill-[#F5A800] dark:fill-[#FFC42E] transition-colors duration-300"
    />
  </svg>
);

/**
 * أيقونة رف المقالات / الكتب (مستلهمة من عنوان "المقالات الجديدة")
 */
export const ArticlesShelfIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <line
      x1="23"
      y1="4"
      x2="23"
      y2="24"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <line
      x1="17.5"
      y1="4"
      x2="17.5"
      y2="24"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <rect
      x="6.5"
      y="4.5"
      width="6.5"
      height="19"
      rx="1"
      transform="rotate(-8 6.5 4.5)"
      stroke="currentColor"
      strokeWidth="2.2"
    />
  </svg>
);

/**
 * شعار منصة «بصائر» الرسمي (BasairLogoMark)
 * مبني على نجمة بصائر الثمانية المفصّصة ذات الإطار المزدوج،
 * مزوّد بوهج خلفي مريح للعين، ويتفاعل بنعومة عند مرور الماوس أو اللمس على الهاتف،
 * ويتكيف لونه تلقائياً بين الوضع النهاري والليلي.
 */
export const BasairLogoMark: React.FC<{
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ className = 'w-10 h-10' }) => {
  const gradId = useId();
  const [isTouched, setIsTouched] = useState(false);

  const handleTouchPulse = () => {
    setIsTouched(true);
    window.setTimeout(() => setIsTouched(false), 950);
  };

  return (
    <span
      onTouchStart={handleTouchPulse}
      className={`relative inline-flex items-center justify-center select-none group/logo ${className}`}
      aria-hidden="true"
    >
      {/* وهج خلفي ناعم ومريح للعين يتكيف مع الوضع النهاري والليلي */}
      <span
        className={`pointer-events-none absolute -inset-1.5 rounded-full blur-md transition-all duration-500 ${
          isTouched
            ? 'opacity-100 scale-125 bg-[#F5A800]/45 dark:bg-[#FFC42E]/40'
            : 'opacity-75 scale-100 bg-[#F5A800]/25 dark:bg-[#FFC42E]/22 group-hover/logo:opacity-100 group-hover/logo:scale-125 group-hover:opacity-100 group-hover:scale-120'
        }`}
      />

      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative w-full h-full overflow-visible"
      >
        <defs>
          <linearGradient id={`${gradId}-sun`} x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
            <stop offset="0%" className="[stop-color:#FFB800] dark:[stop-color:#FFD452]" />
            <stop offset="100%" className="[stop-color:#EC9A00] dark:[stop-color:#F5A623]" />
          </linearGradient>
        </defs>

        {/* نجمة بصائر الثمانية المفصّصة ذات الإطار المزدوج */}
        <path
          d={SUNBURST_PATH_48}
          fillRule="evenodd"
          clipRule="evenodd"
          fill={`url(#${gradId}-sun)`}
          className={`origin-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isTouched
              ? 'rotate-[45deg] scale-105'
              : 'group-hover/logo:rotate-[45deg] group-hover/logo:scale-105 group-hover:rotate-[22.5deg]'
          }`}
        />
      </svg>
    </span>
  );
};

/**
 * الثلاث نجمات الذهبية المتجاورة (BasairSunburstTrio)
 * تحويل مباشر وعالي الدقة للصورة المرفقة (Three Golden Sunburst Icons) إلى صيغة SVG نقية:
 * - بدون أي خلفية بيضاء
 * - مع وهج خلفي (Ambient Glow) مريح للعين يتغير بين النهار والليل
 * - مع حركة تفاعلية متناغمة (دوران إشراقي + اتساع حدقة البصيرة) عند تمرير الماوس على الكمبيوتر أو الضغط باللمس على الهاتف
 */
export const BasairSunburstTrio: React.FC<{
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  withLines?: boolean;
  waveTrigger?: number;
}> = ({ className = '', size = 'md', withLines = true, waveTrigger = 0 }) => {
  const baseId = useId();
  const [isActiveWave, setIsActiveWave] = useState(false);

  const triggerInteractiveWave = () => {
    setIsActiveWave(true);
    window.setTimeout(() => {
      setIsActiveWave(false);
    }, 1100);
  };

  React.useEffect(() => {
    if (waveTrigger > 0) {
      setIsActiveWave(true);
      const timer = window.setTimeout(() => {
        setIsActiveWave(false);
      }, 1100);
      return () => window.clearTimeout(timer);
    }
  }, [waveTrigger]);

  const starSizeClasses =
    size === 'xs'
      ? 'w-5 h-5 sm:w-[22px] sm:h-[22px]'
      : size === 'sm'
      ? 'w-6 h-6 sm:w-7 sm:h-7'
      : size === 'lg'
      ? 'w-9 h-9 sm:w-11 sm:h-11'
      : 'w-7 h-7 sm:w-8 sm:h-8';

  const gapClasses =
    size === 'xs'
      ? 'gap-2.5 sm:gap-3.5'
      : size === 'sm'
      ? 'gap-3 sm:gap-4'
      : size === 'lg'
      ? 'gap-5 sm:gap-7'
      : 'gap-4 sm:gap-5';

  const containerPadding = size === 'xs' ? 'px-2 py-0.5' : 'px-4 py-2';

  return (
    <div
      role="presentation"
      onClick={triggerInteractiveWave}
      onTouchStart={triggerInteractiveWave}
      title="إشراق بصائر"
      className={`group/trio relative my-8 flex items-center justify-center select-none cursor-pointer ${className}`}
    >
      {/* خط جانبي أيمن اختياري لإبراز الفاصل البصري */}
      {withLines && (
        <span
          className={`h-[1px] w-12 sm:w-20 bg-gradient-to-l from-transparent via-[#D6CEBE] to-[#E5A93C]/50 dark:via-[#2E2A25] dark:to-[#FFC42E]/40 transition-all duration-500 ${
            isActiveWave ? 'w-16 sm:w-24 opacity-100' : 'opacity-80 group-hover/trio:w-16 sm:group-hover/trio:w-24 group-hover/trio:opacity-100'
          }`}
        />
      )}

      {/* حاوية النجمات الثلاث مع الوهج الخلفي المريح للعين */}
      <div className={`relative inline-flex items-center ${gapClasses} ${containerPadding}`}>
        {/* الوهج الخلفي المريح للعين (يتكيف تلقائياً مع الوضع النهاري والليلي) */}
        <div
          aria-hidden="true"
          className={`sunburst-ambient-glow pointer-events-none absolute -inset-x-3 -inset-y-1.5 rounded-full blur-lg transition-all duration-700 ${
            isActiveWave
              ? '!opacity-100 !scale-125'
              : 'group-hover/trio:!opacity-100 group-hover/trio:!scale-115 group-hover:!opacity-100 group-hover:!scale-115'
          }`}
        />

        {[0, 1, 2].map((index) => {
          const isCenter = index === 1;
          const gradId = `${baseId}-star-${index}`;

          // تناغم الحركة للثلاث نجمات عند مرور الماوس أو اللمس في الهاتف
          const activeTransform = isCenter
            ? 'rotate-[45deg] scale-[1.16] -translate-y-0.5'
            : index === 0
            ? 'rotate-[22.5deg] scale-[1.08]'
            : '-rotate-[22.5deg] scale-[1.08]';

          const hoverTransform = isCenter
            ? 'group-hover/trio:rotate-[45deg] group-hover/trio:scale-[1.16] group-hover/trio:-translate-y-0.5 group-hover:rotate-[45deg] group-hover:scale-[1.16] group-hover:-translate-y-0.5'
            : index === 0
            ? 'group-hover/trio:rotate-[22.5deg] group-hover/trio:scale-[1.08] group-hover:rotate-[22.5deg] group-hover:scale-[1.08]'
            : 'group-hover/trio:-rotate-[22.5deg] group-hover/trio:scale-[1.08] group-hover:-rotate-[22.5deg] group-hover:scale-[1.08]';

          const delayClass =
            index === 0 ? 'delay-0' : index === 1 ? 'delay-75' : 'delay-150';

          return (
            <div
              key={index}
              className={`relative flex items-center justify-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${delayClass} ${starSizeClasses} ${
                isActiveWave ? activeTransform : hoverTransform
              }`}
            >
              {/* هالة ضوئية فردية خفيفة تظهر عند التفاعل دون أن تطمس بروز الرؤوس الثمانية من بعيد */}
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute inset-1.5 rounded-full bg-[#F5A800]/16 dark:bg-[#FFC42E]/18 blur-md transition-all duration-500 ${
                  isActiveWave
                    ? 'scale-150 opacity-100'
                    : 'scale-95 opacity-25 dark:opacity-35 group-hover/trio:scale-135 group-hover/trio:opacity-90 group-hover:scale-135 group-hover:opacity-90'
                }`}
              />

              <svg
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="relative w-full h-full overflow-visible drop-shadow-[0_1px_2px_rgba(180,95,18,0.12)] dark:drop-shadow-[0_1px_3px_rgba(255,196,46,0.15)]"
              >
                <defs>
                  <linearGradient
                    id={gradId}
                    x1="6"
                    y1="6"
                    x2="42"
                    y2="42"
                    gradientUnits="userSpaceOnUse"
                  >
                    {/* الوضع النهاري: عنبر ذهبي دافئ | الوضع الليلي: ذهبي نوراني هادئ */}
                    <stop
                      offset="0%"
                      className="[stop-color:#FFB800] dark:[stop-color:#FFD24C]"
                    />
                    <stop
                      offset="100%"
                      className="[stop-color:#E89800] dark:[stop-color:#F5A623]"
                    />
                  </linearGradient>
                </defs>

                {/* نجمة بصائر الثمانية المفصّصة ذات الإطار المزدوج */}
                <path
                  d={SUNBURST_PATH_48}
                  fillRule="evenodd"
                  clipRule="evenodd"
                  fill={`url(#${gradId})`}
                />
              </svg>
            </div>
          );
        })}
      </div>

      {/* خط جانبي أيسر اختياري لإبراز الفاصل البصري */}
      {withLines && (
        <span
          className={`h-[1px] w-12 sm:w-20 bg-gradient-to-r from-transparent via-[#D6CEBE] to-[#E5A93C]/50 dark:via-[#2E2A25] dark:to-[#FFC42E]/40 transition-all duration-500 ${
            isActiveWave ? 'w-16 sm:w-24 opacity-100' : 'opacity-80 group-hover/trio:w-16 sm:group-hover/trio:w-24 group-hover/trio:opacity-100'
          }`}
        />
      )}
    </div>
  );
};

/**
 * شعار رمزي للمدونة (مرادف لشعار بصائر للاستخدام في البطاقات والفواصل)
 */
export const BlogMarkIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <BasairLogoMark className={className} />
);

export const ROSETTE_OUTER_PATH_48 = buildEightLobedSubpath(
  24,
  24,
  23.2,
  ROSETTE_OUTER_CURVE,
  false
);

export const ROSETTE_INNER_PATH_48 = buildEightLobedSubpath(
  24,
  24,
  23.2,
  ROSETTE_INNER_CURVE,
  false
);

/**
 * شارة نجمة بصائر العلوية الخاصة بقالب الاقتباس (علامة التنصيص 99) أو قالب الآيات (مخطوطة القرآن الكريم) أو قالب الحديث (مخطوطة الحديث النبوي)
 */
export const BasairQuoteStarBadge: React.FC<{
  className?: string;
  variant?: 'quote' | 'quran' | 'hadith';
}> = ({ className = 'w-14 h-14 sm:w-16 sm:h-16', variant = 'quote' }) => {
  const gradId = useId();

  return (
    <div
      aria-hidden="true"
      className={`relative inline-flex items-center justify-center select-none ${className}`}
    >
      {/* هالة دافئة ناعمة خلف نجمة الاقتباس/الآية/الحديث */}
      <span className="pointer-events-none absolute inset-1 rounded-full bg-[#F5A800]/22 dark:bg-[#FFD452]/20 blur-md transition-transform duration-500 group-hover/quote:scale-125" />

      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative w-full h-full overflow-visible drop-shadow-[0_3px_8px_rgba(20,20,19,0.14)] dark:drop-shadow-[0_4px_10px_rgba(0,0,0,0.55)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/quote:scale-[1.06]"
      >
        <defs>
          <linearGradient
            id={`${gradId}-quote-star`}
            x1="8"
            y1="4"
            x2="40"
            y2="44"
            gradientUnits="userSpaceOnUse"
          >
            {/* الوضع النهاري: كهرمان ذهبي مشرق | الوضع الليلي: ذهبي شمس دافئ كالصورة المرجعية */}
            <stop
              offset="0%"
              className="[stop-color:#FFCA28] dark:[stop-color:#FFE07D]"
            />
            <stop
              offset="100%"
              className="[stop-color:#EAA000] dark:[stop-color:#F5B82E]"
            />
          </linearGradient>
          <clipPath id={`${gradId}-inner-rosette-clip`}>
            <path d={ROSETTE_INNER_PATH_48} />
          </clipPath>
        </defs>

        {/* طبقة خلفية مطابقة للمحيط الخارجي للنجمة لمنع ظهور خط إطار البطاقة خلف الفجوة المفرّغة */}
        <path
          d={ROSETTE_OUTER_PATH_48}
          className="fill-[#EFECE6] dark:fill-[#161513] transition-colors duration-300"
        />

        {/* نجمة بصائر الثمانية المفصّصة ذات الإطار المزدوج */}
        <path
          d={SUNBURST_PATH_48}
          fillRule="evenodd"
          clipRule="evenodd"
          fill={`url(#${gradId}-quote-star)`}
        />

        {variant === 'quran' ? (
          /* مخطوطة «القرآن الكريم» متمركزة في قلب نجمة بصائر */
          <g clipPath={`url(#${gradId}-inner-rosette-clip)`}>
            <image
              href="./assets/aistudio/quran_calligraphy_transparent.png"
              x="11.6"
              y="11.6"
              width="24.8"
              height="24.8"
              preserveAspectRatio="xMidYMid meet"
            />
          </g>
        ) : variant === 'hadith' ? (
          /* مخطوطة «الحديث النبوي» متمركزة في قلب نجمة بصائر */
          <g clipPath={`url(#${gradId}-inner-rosette-clip)`}>
            <image
              href="./assets/aistudio/hadith_calligraphy_transparent.png"
              x="11.8"
              y="11.8"
              width="24.4"
              height="24.4"
              preserveAspectRatio="xMidYMid meet"
            />
          </g>
        ) : (
          /* علامتا التنصيص (99) في قلب نجمة بصائر */
          <g className="fill-[#141413] dark:fill-[#141311]">
            {/* العلامة اليسرى */}
            <circle cx="19.55" cy="20.4" r="3.35" />
            <path d="M 22.9 20.4 C 22.9 25.0 21.0 28.5 18.45 30.85 L 17.5 30.05 C 19.25 27.85 20.2 25.4 19.95 23.2 Z" />

            {/* العلامة اليمنى */}
            <circle cx="28.45" cy="20.4" r="3.35" />
            <path d="M 31.8 20.4 C 31.8 25.0 29.9 28.5 27.35 30.85 L 26.4 30.05 C 28.15 27.85 29.1 25.4 28.85 23.2 Z" />
          </g>
        )}
      </svg>
    </div>
  );
};

/**
 * مسار محرف القوس القرآني الأصيل ﴿ (U+FD3F) مستخرج مباشرة من خط أميري (Amiri)
 */
const AMIRI_OPEN_BRACKET_PATH =
  'M204 401Q161 231 57 79Q41 52 58 36Q76 20 100 43Q251 199 307 393Q354 398 397 415Q411 421 402 433L333 528Q338 533 342.5 537.5Q347 542 352 547L448 477Q461 467 467 482Q473 498 477.5 514.5Q482 531 485 548Q517 563 539 593Q543 600 539 607Q517 637 485 652Q479 685 467 718Q461 732 448 723L352 653Q351 652 333 672L402 766Q411 779 397 785Q375 794 352.5 799.5Q330 805 308 807Q252 1001 100 1158Q76 1182 58 1166Q40 1150 57 1122Q159 980 204 799Q194 796 184.0 793.5Q174 791 165 787Q146 779 156 766L226 671Q226 670 227 670Q223 665 219.5 661.0Q216 657 211 653L116 723Q107 729 102 724Q95 716 89.0 698.0Q83 680 78 652Q47 637 24 607Q20 600 24 593Q47 563 78 548Q81 531 86.0 514.5Q91 498 98 482Q104 468 116 477L211 547Q216 542 219.5 538.0Q223 534 227 530L226 529L156 433Q147 421 165 413Q174 409 184.0 406.5Q194 404 204 401ZM233 780Q208 882 169.5 971.0Q131 1060 78 1136Q72 1145 74 1148Q79 1146 83 1141Q235 985 287 793L289 784Q310 783 331.0 779.0Q352 775 373 768L317 692Q311 699 306.5 705.5Q302 712 298 718Q291 730 281 730Q272 730 264 718Q257 706 246 691L242 691L185 768Q197 772 209.0 775.0Q221 778 233 780ZM233 420Q221 422 209.0 424.5Q197 427 185 432L242 509L245 509Q251 501 256.0 494.5Q261 488 265 482Q273 470 282 470Q291 470 298 482Q306 494 316 509L373 432Q351 425 330.0 421.0Q309 417 289 416L286 405Q232 214 83 61Q79 56 74 54Q71 56 78 66Q193 237 233 420ZM348 600Q348 567 320 547Q302 535 282 535Q249 535 228 562Q217 578 217 600Q217 633 244 653Q262 665 282 665Q316 665 335 638Q348 620 348 600ZM191 564L191 563L114 506Q109 520 105.5 534.5Q102 549 100 564L89 570Q65 580 50 600Q67 619 89 630L100 635Q102 650 105.5 664.5Q109 679 114 694L191 637L191 636Q178 625 166 617Q155 610 153 600Q152 591 165 583Q171 579 177.5 574.5Q184 570 191 564ZM463 635L474 630Q498 619 514 600Q498 581 474 570L463 564Q461 549 457.5 534.5Q454 520 449 506L372 563L372 564Q380 569 386.5 574.0Q393 579 398 583Q410 592 410 600Q410 609 398 617Q392 621 385.5 626.0Q379 631 372 636L372 637L449 694Q454 679 457.5 664.5Q461 650 463 635Z';

/**
 * أيقونة قوس الآية القرآنية الأصيل (﴿ فتح / ﴾ إغلاق)
 * مطابقة 100% لشكل محرف ﴿ في خط أميري
 */
export const QuranOrnateBracketIcon: React.FC<{
  side: 'open' | 'close';
  className?: string;
}> = ({ side, className = 'w-3.5 h-5' }) => (
  <svg
    viewBox="0 0 563 1202"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${side === 'close' ? '-scale-x-100' : ''} ${className}`}
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      fill="currentColor"
      d={AMIRI_OPEN_BRACKET_PATH}
    />
  </svg>
);

/**
 * قالب الاقتباس والآيات القرآنية والأحاديث النبوية المعتمد لمنصة «بصائر» (BasairQuoteBlock)
 * مستوحى من التصميم المرجعي المضلّع مع نجمة بصائر العلوية (علامة التنصيص للاقتباس، مخطوطة القرآن للآيات، أو مخطوطة الحديث النبوي للأحاديث)
 * وشريط الهوية السفلي، ومتوافق بالكامل مع الوضعين النهاري والليلي.
 */
export const BasairQuoteBlock: React.FC<{
  htmlText?: string;
  plainText?: string;
  cite?: string;
  id?: string;
  className?: string;
  variant?: 'quote' | 'quran' | 'hadith';
  weight?: 'bold' | 'regular';
}> = ({ htmlText, plainText, cite, id, className = 'my-12', variant, weight }) => {
  const rawCheck = (plainText || htmlText || '').trim();
  const isQuran =
    variant === 'quran' ||
    (!variant && (rawCheck.includes('﴿') || rawCheck.includes('﴾')));
  const effectiveVariant: 'quote' | 'quran' | 'hadith' =
    variant === 'hadith' ? 'hadith' : isQuran ? 'quran' : 'quote';

  const alreadyQuoted =
    rawCheck.startsWith('"') ||
    rawCheck.startsWith('“') ||
    rawCheck.startsWith('”') ||
    rawCheck.startsWith('«');

  const hasOpenQuranBracket = rawCheck.includes('﴿');
  const hasCloseQuranBracket = rawCheck.includes('﴾');

  const effectiveWeight = weight || 'bold';

  return (
    <blockquote
      id={id}
      data-quote-type={effectiveVariant}
      data-weight={effectiveWeight}
      className={`basair-quote-custom group/quote relative scroll-mt-24 pt-7 sm:pt-8 ${className}`}
    >
      {/* نجمة بصائر المتمركزة أعلى منتصف إطار الاقتباس أو الآية أو الحديث */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 z-20">
        <BasairQuoteStarBadge variant={effectiveVariant} />
      </div>

      {/* بطاقة الاقتباس/الآية ذات السطح المضلّع العمودي */}
      <div className="basair-quote-ribbed relative overflow-hidden rounded-[20px] sm:rounded-[22px] border border-[#CFC6B4] dark:border-[#F9F7F2]/22 shadow-[0_12px_32px_-12px_rgba(20,20,19,0.08),inset_0_1px_0_rgba(255,255,255,0.75)] dark:shadow-[0_18px_42px_-12px_rgba(0,0,0,0.72),inset_0_1px_0_rgba(249,247,242,0.14)] transition-all duration-300">
        {/* إضاءة علوية خفيفة تحت النجمة لإبراز عمق التضليع */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(ellipse_50%_70%_at_50%_0%,rgba(245,168,0,0.11),transparent_80%)] dark:bg-[radial-gradient(ellipse_50%_70%_at_50%_0%,rgba(255,216,89,0.10),transparent_80%)]"
        />

        {/* نص الاقتباس أو الآية المتمركز */}
        <div className="relative z-10 px-6 sm:px-11 md:px-14 pt-10 sm:pt-12 pb-7 sm:pb-9 text-center">
          <p
            data-weight={effectiveWeight}
            className={`!mb-0 ${
              isQuran
                ? 'font-quran text-[22px] sm:text-[26px] md:text-[28px] leading-[2.0]'
                : 'font-prose text-[20px] sm:text-[23px] md:text-[25px] leading-[1.82]'
            } ${
              effectiveWeight === 'regular' ? 'font-normal' : 'font-bold'
            } tracking-tight text-[#141413] dark:text-[#F9F7F2] drop-shadow-[0_1px_0_rgba(255,255,255,0.55)] dark:drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]`}
          >
            {isQuran ? (
              <>
                {!hasOpenQuranBracket && (
                  <span
                    className="quran-bracket quran-bracket-open"
                    data-quran-bracket="open"
                    aria-hidden="true"
                  >
                    ﴿
                  </span>
                )}
                {htmlText ? (
                  <span dangerouslySetInnerHTML={{ __html: htmlText }} />
                ) : (
                  <span>{plainText}</span>
                )}
                {!hasCloseQuranBracket && (
                  <span
                    className="quran-bracket quran-bracket-close"
                    data-quran-bracket="close"
                    aria-hidden="true"
                  >
                    ﴾
                  </span>
                )}
              </>
            ) : (
              <>
                {!alreadyQuoted && (
                  <span className="inline-block select-none font-serif text-[1.08em] text-[#141413]/85 dark:text-[#F9F7F2]/90 ml-0.5">
                    &ldquo;
                  </span>
                )}
                {htmlText ? (
                  <span dangerouslySetInnerHTML={{ __html: htmlText }} />
                ) : (
                  <span>{plainText}</span>
                )}
                {!alreadyQuoted && (
                  <span className="inline-block select-none font-serif text-[1.08em] text-[#141413]/85 dark:text-[#F9F7F2]/90 mr-0.5">
                    &rdquo;
                  </span>
                )}
              </>
            )}
          </p>

          {cite && cite.trim().length > 0 && (() => {
            const cleanCite = cite.trim();
            const alreadyFormatted =
              cleanCite.startsWith('—') ||
              cleanCite.startsWith('-') ||
              cleanCite.startsWith('[') ||
              cleanCite.startsWith('(') ||
              cleanCite.startsWith('«');
            const displayCite = alreadyFormatted
              ? cleanCite
              : isQuran
              ? `[ ${cleanCite} ]`
              : `— ${cleanCite}`;
            return (
              <cite className="mt-3.5 block not-italic font-ui font-normal text-[13px] sm:text-[14px] leading-[1.65] tracking-normal text-[#78736A] dark:text-[#9E988E]">
                {displayCite}
              </cite>
            );
          })()}
        </div>

        {/* شريط الهوية السفلي النحيف: بخط ثمانية، تفصل بين الكلمة الإنجليزية والعربية نقطة، يبدأ باللون الرمادي من الوسط ويتلاشى باتجاه أطراف القالب */}
        <div
          aria-hidden="true"
          dir="ltr"
          className="relative z-10 flex items-center justify-center overflow-hidden border-t border-[#CFC6B4]/85 dark:border-[#F9F7F2]/16 px-4 sm:px-6 py-2 select-none"
        >
          <div
            className="flex items-center justify-center gap-2.5 sm:gap-3.5 whitespace-nowrap font-ui text-[10px] sm:text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#78736A] dark:text-[#F9F7F2]/58"
            style={{
              WebkitMaskImage:
                'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.16) 14%, rgba(0,0,0,0.72) 34%, rgba(0,0,0,1) 50%, rgba(0,0,0,0.72) 66%, rgba(0,0,0,0.16) 86%, transparent 100%)',
              maskImage:
                'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.16) 14%, rgba(0,0,0,0.72) 34%, rgba(0,0,0,1) 50%, rgba(0,0,0,0.72) 66%, rgba(0,0,0,0.16) 86%, transparent 100%)',
            }}
          >
            <span>BASAIRPLATFORM</span>
            <span className="opacity-85">•</span>
            <span className="tracking-normal">منصة بصائر</span>
            <span className="opacity-85">•</span>
            <span>BASAIRPLATFORM</span>
            <span className="opacity-85">•</span>
            <span className="tracking-normal">منصة بصائر</span>
            <span className="opacity-85">•</span>
            <span>BASAIRPLATFORM</span>
            <span className="opacity-85">•</span>
            <span className="tracking-normal">منصة بصائر</span>
            <span className="opacity-85">•</span>
            <span>BASAIRPLATFORM</span>
          </div>
        </div>
      </div>
    </blockquote>
  );
};



