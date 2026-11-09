/**
 * رسوم تحريرية فنية بصيغة SVG عالية الدقة مخصصة لمقالات مدونة براء العامري
 * تعمل مباشرة داخل وسوم <img loading="lazy" /> بأداء فوري ودون أي تبعيات خارجية
 */

function svgToDataUri(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
}

export const AUTHOR_AVATAR = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1E2923"/>
      <stop offset="100%" stop-color="#0F1512"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#E05324"/>
      <stop offset="100%" stop-color="#F5B800"/>
    </linearGradient>
  </defs>
  <rect width="240" height="240" rx="120" fill="url(#bg)"/>
  <circle cx="120" cy="120" r="106" fill="none" stroke="#D6CEBE" stroke-opacity="0.22" stroke-width="1.5"/>
  <!-- زخرفة نجمة ثمانية خفيفة في الخلفية -->
  <g transform="translate(120,120)" opacity="0.12" stroke="#F5B800" stroke-width="1.5" fill="none">
    <rect x="-65" y="-65" width="130" height="130" />
    <rect x="-65" y="-65" width="130" height="130" transform="rotate(45)" />
  </g>
  <!-- رمز تعبيري رصين للكاتب -->
  <circle cx="120" cy="92" r="34" fill="#F4EFE6"/>
  <path d="M62 204 C62 158 90 140 120 140 C150 140 178 158 178 204" fill="#F4EFE6"/>
  <path d="M84 82 C88 56 152 56 156 82 C158 98 156 122 156 122 L146 118 C146 92 138 74 120 74 C102 74 94 92 94 118 L84 122 Z" fill="url(#accent)" opacity="0.9"/>
  <path d="M92 145 L120 178 L148 145" fill="none" stroke="#E05324" stroke-width="4" stroke-linecap="round"/>
</svg>
`);

export const WRITER_AVATARS = {
  baraa: AUTHOR_AVATAR,
  shehri: svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
  <defs>
    <linearGradient id="bg_shehri" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#142822"/>
      <stop offset="100%" stop-color="#0B1A15"/>
    </linearGradient>
  </defs>
  <rect width="240" height="240" rx="120" fill="url(#bg_shehri)"/>
  <circle cx="120" cy="120" r="106" fill="none" stroke="#F5B800" stroke-opacity="0.3" stroke-width="1.5"/>
  <circle cx="120" cy="88" r="32" fill="#F4EFE6"/>
  <path d="M66 204 C66 160 92 142 120 142 C148 142 174 160 174 204" fill="#F4EFE6"/>
  <path d="M96 74 C104 62 136 62 144 74 C150 90 146 110 146 110 L120 102 L94 110 Z" fill="#F5B800" opacity="0.85"/>
  <!-- رمز المصحف الشريف المفتوح للشيخ -->
  <path d="M100 162 Q120 152 140 162 L140 186 Q120 176 100 186 Z" fill="#142822" stroke="#F5B800" stroke-width="2"/>
</svg>
`),
  abdali: svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
  <defs>
    <linearGradient id="bg_abdali" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1E2B37"/>
      <stop offset="100%" stop-color="#0E1720"/>
    </linearGradient>
  </defs>
  <rect width="240" height="240" rx="120" fill="url(#bg_abdali)"/>
  <circle cx="120" cy="120" r="106" fill="none" stroke="#93C5FD" stroke-opacity="0.25" stroke-width="1.5"/>
  <circle cx="120" cy="90" r="32" fill="#F4EFE6"/>
  <path d="M66 204 C66 162 92 142 120 142 C148 142 174 162 174 204" fill="#F4EFE6"/>
  <circle cx="106" cy="88" r="10" fill="none" stroke="#1E2B37" stroke-width="2.5"/>
  <circle cx="134" cy="88" r="10" fill="none" stroke="#1E2B37" stroke-width="2.5"/>
  <line x1="116" y1="88" x2="124" y2="88" stroke="#1E2B37" stroke-width="2.5"/>
  <path d="M102 152 L120 172 L138 152" fill="none" stroke="#60A5FA" stroke-width="3" stroke-linecap="round"/>
</svg>
`),
  hudhayri: svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
  <defs>
    <linearGradient id="bg_hudhayri" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#261E1A"/>
      <stop offset="100%" stop-color="#140E0B"/>
    </linearGradient>
  </defs>
  <rect width="240" height="240" rx="120" fill="url(#bg_hudhayri)"/>
  <circle cx="120" cy="120" r="106" fill="none" stroke="#F97316" stroke-opacity="0.25" stroke-width="1.5"/>
  <circle cx="120" cy="90" r="32" fill="#F4EFE6"/>
  <path d="M66 204 C66 160 92 142 120 142 C148 142 174 160 174 204" fill="#F4EFE6"/>
  <path d="M96 74 C104 60 136 60 144 74 C148 88 144 104 144 104 L96 104 Z" fill="#F97316" opacity="0.8"/>
  <path d="M110 160 L120 150 L130 160 L120 170 Z" fill="#F97316"/>
</svg>
`),
};

export const ARTICLE_ARTWORKS = {
  maqasidHero: svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
  <defs>
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#142822"/>
      <stop offset="55%" stop-color="#1E3A31"/>
      <stop offset="100%" stop-color="#0F1D18"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F5B800"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="42%" r="48%">
      <stop offset="0%" stop-color="#E05324" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#142822" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#g1)"/>
  <rect width="1200" height="800" fill="url(#glow)"/>
  
  <!-- شبكة هندسية معمارية -->
  <g stroke="#F9F7F2" stroke-opacity="0.07" stroke-width="1.5" fill="none">
    <circle cx="600" cy="400" r="320"/>
    <circle cx="600" cy="400" r="240"/>
    <circle cx="600" cy="400" r="160"/>
    <line x1="120" y1="400" x2="1080" y2="400"/>
    <line x1="600" y1="60" x2="600" y2="740"/>
    <line x1="300" y1="100" x2="900" y2="700"/>
    <line x1="900" y1="100" x2="300" y2="700"/>
  </g>

  <!-- قوس معماري إسلامي مركزي وميزان المقاصد -->
  <path d="M 410 680 L 410 380 C 410 250 600 170 600 170 C 600 170 790 250 790 380 L 790 680 Z" fill="#F9F7F2" fill-opacity="0.05" stroke="#F5B800" stroke-opacity="0.45" stroke-width="2"/>
  <path d="M 450 680 L 450 400 C 450 290 600 220 600 220 C 600 220 750 290 750 400 L 750 680 Z" fill="#0F1D18" fill-opacity="0.55" stroke="#F9F7F2" stroke-opacity="0.18" stroke-width="1.5"/>

  <!-- النجمة الثمانية في القلب -->
  <g transform="translate(600, 390)">
    <rect x="-85" y="-85" width="170" height="170" fill="none" stroke="url(#gold)" stroke-width="3"/>
    <rect x="-85" y="-85" width="170" height="170" transform="rotate(45)" fill="none" stroke="url(#gold)" stroke-width="3"/>
    <circle cx="0" cy="0" r="46" fill="#E05324"/>
    <circle cx="0" cy="0" r="18" fill="#F9F7F2"/>
  </g>

  <!-- عناصر توازن جانبية -->
  <circle cx="330" cy="400" r="32" fill="#E05324" fill-opacity="0.85"/>
  <circle cx="870" cy="400" r="32" fill="#F5B800" fill-opacity="0.85"/>
  <path d="M 330 400 Q 600 490 870 400" fill="none" stroke="#F9F7F2" stroke-opacity="0.4" stroke-width="2" stroke-dasharray="6 6"/>
</svg>
  `),

  digitalSilence: svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <rect width="800" height="800" fill="#231F1D"/>
  <circle cx="400" cy="400" r="290" fill="#2E2825"/>
  <circle cx="400" cy="400" r="210" fill="none" stroke="#E05324" stroke-width="2" stroke-opacity="0.4"/>
  <!-- نافذة ضوء وهدوء وسط الضجيج -->
  <path d="M270 590 L270 320 A130 130 0 0 1 530 320 L530 590 Z" fill="#F9F7F2"/>
  <circle cx="400" cy="310" r="48" fill="#E05324"/>
  <path d="M220 590 L580 590" stroke="#F5B800" stroke-width="6" stroke-linecap="round"/>
  <!-- موجات الضجيج المتلاشية -->
  <path d="M120 240 Q 200 200 240 260" fill="none" stroke="#F9F7F2" stroke-opacity="0.2" stroke-width="3"/>
  <path d="M560 260 Q 610 200 680 240" fill="none" stroke="#F9F7F2" stroke-opacity="0.2" stroke-width="3"/>
  <path d="M310 590 L400 420 L490 590 Z" fill="#F5B800" fill-opacity="0.28"/>
</svg>
  `),

  fiqhAi: svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <rect width="800" height="800" fill="#182232"/>
  <!-- دوائر خوارزمية متداخلة مع هندسة إسلامية -->
  <g stroke="#93C5FD" stroke-opacity="0.16" stroke-width="2" fill="none">
    <rect x="140" y="140" width="520" height="520" rx="40"/>
    <rect x="210" y="210" width="380" height="380" rx="28"/>
    <line x1="400" y1="80" x2="400" y2="720"/>
    <line x1="80" y1="400" x2="720" y2="400"/>
  </g>
  <g transform="translate(400,400)">
    <polygon points="0,-190 165,-95 165,95 0,190 -165,95 -165,-95" fill="#1E2E46" stroke="#F5B800" stroke-width="3"/>
    <polygon points="0,-130 112,-65 112,65 0,130 -112,65 -112,-65" fill="#E05324" fill-opacity="0.9"/>
    <circle cx="0" cy="0" r="44" fill="#F9F7F2"/>
    <circle cx="0" cy="0" r="16" fill="#182232"/>
  </g>
  <circle cx="210" cy="210" r="14" fill="#F5B800"/>
  <circle cx="590" cy="210" r="14" fill="#F5B800"/>
  <circle cx="210" cy="590" r="14" fill="#F5B800"/>
  <circle cx="590" cy="590" r="14" fill="#F5B800"/>
</svg>
  `),

  shatibiTurath: svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <rect width="800" height="800" fill="#EFEAE1"/>
  <rect x="70" y="70" width="660" height="660" rx="32" fill="#E4DDD0" stroke="#C5BBA8" stroke-width="2"/>
  <!-- كتاب مفتوح وأوراق مخطوطة -->
  <g transform="translate(400, 415)">
    <path d="M -230 -130 Q -115 -160 0 -115 Q 115 -160 230 -130 L 230 140 Q 115 110 0 155 Q -115 110 -230 140 Z" fill="#F9F7F2" stroke="#141413" stroke-width="4"/>
    <line x1="0" y1="-115" x2="0" y2="155" stroke="#141413" stroke-width="4"/>
    <!-- سطور المخطوطة -->
    <g stroke="#78736A" stroke-width="4" stroke-linecap="round">
      <line x1="-185" y1="-70" x2="-45" y2="-60"/>
      <line x1="-185" y1="-30" x2="-45" y2="-20"/>
      <line x1="-185" y1="10" x2="-45" y2="20"/>
      <line x1="-185" y1="50" x2="-85" y2="57"/>
      <line x1="45" y1="-60" x2="185" y2="-70"/>
      <line x1="45" y1="-20" x2="185" y2="-30"/>
      <line x1="45" y1="20" x2="185" y2="10"/>
      <line x1="85" y1="57" x2="185" y2="50"/>
    </g>
    <!-- شمس البصيرة أعلى الكتاب -->
    <circle cx="0" cy="-190" r="46" fill="#E05324"/>
    <circle cx="0" cy="-190" r="20" fill="#F5B800"/>
  </g>
</svg>
  `),

  islamicEconomy: svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <rect width="800" height="800" fill="#1F2421"/>
  <g stroke="#F9F7F2" stroke-opacity="0.1" stroke-width="2">
    <line x1="0" y1="200" x2="800" y2="200"/>
    <line x1="0" y1="400" x2="800" y2="400"/>
    <line x1="0" y1="600" x2="800" y2="600"/>
    <line x1="200" y1="0" x2="200" y2="800"/>
    <line x1="400" y1="0" x2="400" y2="800"/>
    <line x1="600" y1="0" x2="600" y2="800"/>
  </g>
  <!-- ميزان القسط والعدل -->
  <line x1="400" y1="160" x2="400" y2="630" stroke="#F5B800" stroke-width="8" stroke-linecap="round"/>
  <line x1="210" y1="280" x2="590" y2="280" stroke="#F9F7F2" stroke-width="8" stroke-linecap="round"/>
  <circle cx="400" cy="280" r="26" fill="#E05324"/>
  <!-- كفتا الميزان -->
  <path d="M210 280 L150 450 L270 450 Z" fill="none" stroke="#F9F7F2" stroke-width="3"/>
  <path d="M135 450 A75 45 0 0 0 285 450 Z" fill="#E05324"/>
  <path d="M590 280 L530 450 L650 450 Z" fill="none" stroke="#F9F7F2" stroke-width="3"/>
  <path d="M515 450 A75 45 0 0 0 665 450 Z" fill="#F5B800"/>
  <rect x="290" y="630" width="220" height="24" rx="12" fill="#F9F7F2"/>
</svg>
  `),

  languageIdentity: svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <rect width="800" height="800" fill="#3B1F16"/>
  <circle cx="400" cy="400" r="300" fill="#522B1E"/>
  <!-- تشكيل حروفي هندسي (نقطة وحرف) -->
  <path d="M 220 430 C 220 560 580 560 580 430 C 580 370 530 330 490 330" fill="none" stroke="#F9F7F2" stroke-width="34" stroke-linecap="round"/>
  <rect x="372" y="240" width="56" height="56" transform="rotate(45 400 268)" fill="#F5B800"/>
  <circle cx="250" cy="290" r="24" fill="#E05324"/>
  <path d="M 200 610 L 600 610" stroke="#F5B800" stroke-opacity="0.4" stroke-width="3"/>
</svg>
  `),

  familyValues: svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <rect width="800" height="800" fill="#1B2A26"/>
  <!-- أقواس متداخلة ترمز للمودة والسكينة والميثاق الغليظ -->
  <path d="M 160 640 L 160 390 A 160 160 0 0 1 480 390 L 480 640 Z" fill="#E05324" fill-opacity="0.85"/>
  <path d="M 320 640 L 320 390 A 160 160 0 0 1 640 390 L 640 640 Z" fill="#F5B800" fill-opacity="0.82"/>
  <path d="M 320 640 L 320 390 A 160 160 0 0 1 480 390 L 480 640 Z" fill="#F9F7F2" fill-opacity="0.92"/>
  <circle cx="400" cy="200" r="28" fill="#F5B800"/>
</svg>
  `),

  usulUnderstanding: svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <rect width="800" height="800" fill="#171717"/>
  <!-- بوصلة الأصول والثوابت -->
  <circle cx="400" cy="400" r="270" fill="none" stroke="#F9F7F2" stroke-opacity="0.2" stroke-width="2"/>
  <circle cx="400" cy="400" r="220" fill="none" stroke="#F5B800" stroke-opacity="0.45" stroke-width="2" stroke-dasharray="10 10"/>
  <g transform="translate(400,400)">
    <polygon points="0,-210 42,0 0,210 -42,0" fill="#E05324"/>
    <polygon points="-210,0 0,-42 210,0 0,42" fill="#F9F7F2"/>
    <circle cx="0" cy="0" r="32" fill="#171717" stroke="#F5B800" stroke-width="6"/>
  </g>
</svg>
  `),

  diagramMaqasid: svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 520" width="1000" height="520">
  <rect width="1000" height="520" rx="24" fill="#EFECE6"/>
  <rect x="20" y="20" width="960" height="480" rx="16" fill="#F9F7F2" stroke="#D6CEBE" stroke-width="1.5"/>
  <!-- دوائر مراتب المصالح الشرعية الثلاث -->
  <g transform="translate(500, 260)">
    <circle cx="0" cy="0" r="210" fill="#F5B800" fill-opacity="0.14" stroke="#D97706" stroke-width="2" stroke-dasharray="6 6"/>
    <circle cx="0" cy="0" r="142" fill="#E05324" fill-opacity="0.16" stroke="#E05324" stroke-width="2"/>
    <circle cx="0" cy="0" r="76" fill="#142822" stroke="#142822" stroke-width="2"/>
    <text x="0" y="6" text-anchor="middle" fill="#F9F7F2" font-family="Tajawal, sans-serif" font-size="22" font-weight="bold">الضروريات</text>
    <text x="0" y="-102" text-anchor="middle" fill="#141413" font-family="Tajawal, sans-serif" font-size="20" font-weight="bold">الحاجيات</text>
    <text x="0" y="-172" text-anchor="middle" fill="#4A4742" font-family="Tajawal, sans-serif" font-size="19" font-weight="bold">التحسينيات ومكملاتها</text>
  </g>
  <!-- الكليات الخمس على الجوانب -->
  <g font-family="Tajawal, sans-serif" font-size="16" font-weight="bold" fill="#141413">
    <rect x="70" y="90" width="150" height="48" rx="12" fill="#EFECE6" stroke="#D6CEBE"/>
    <text x="145" y="120" text-anchor="middle">حفظ الدين</text>
    <rect x="70" y="236" width="150" height="48" rx="12" fill="#EFECE6" stroke="#D6CEBE"/>
    <text x="145" y="266" text-anchor="middle">حفظ النفس</text>
    <rect x="70" y="380" width="150" height="48" rx="12" fill="#EFECE6" stroke="#D6CEBE"/>
    <text x="145" y="410" text-anchor="middle">حفظ العقل</text>
    <rect x="780" y="160" width="150" height="48" rx="12" fill="#EFECE6" stroke="#D6CEBE"/>
    <text x="855" y="190" text-anchor="middle">حفظ النسل والعرض</text>
    <rect x="780" y="310" width="150" height="48" rx="12" fill="#EFECE6" stroke="#D6CEBE"/>
    <text x="855" y="340" text-anchor="middle">حفظ المال والعمران</text>
  </g>
</svg>
  `),
};
