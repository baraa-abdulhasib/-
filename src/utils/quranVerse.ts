/**
 * أدوات تنسيق ومعالجة الآيات القرآنية داخل محرر «بصائر» وعارض المقالات
 * تقوم بإحاطة النص المحدد بالأقواس القرآنية المزخرفة ﴿ ... ﴾ وتطبيق خط المصحف المخصص
 */

/**
 * تنظيف النص المحدد من أي أقواس خارجية مكررة (مثل () أو «» أو {} أو ﴿﴾) قبل إحاطته بالأقواس المزخرفة
 */
export function cleanVerseText(rawText: string): string {
  return rawText
    .trim()
    .replace(/^[﴿(\[{«"'\s]+/, '')
    .replace(/[﴾)\]}»"'\s]+$/, '')
    .trim();
}

export const OPEN_QURAN_BRACKET_HTML =
  '<span class="quran-bracket quran-bracket-open" data-quran-bracket="open" contenteditable="false" aria-hidden="true">﴿</span>';

export const CLOSE_QURAN_BRACKET_HTML =
  '<span class="quran-bracket quran-bracket-close" data-quran-bracket="close" contenteditable="false" aria-hidden="true">﴾</span>';

/**
 * بناء وسم HTML الخاص بالآية القرآنية مع الأقواس المزخرفة ﴿ ﴾ والخط المخصص
 */
export function buildQuranVerseHtml(rawText: string): string {
  const cleaned = cleanVerseText(rawText) || 'آية قرآنية';
  return `<span class="quran-verse" data-quran-verse="true">${OPEN_QURAN_BRACKET_HTML}${cleaned}${CLOSE_QURAN_BRACKET_HTML}</span>`;
}

/**
 * ترقية أي نص محاط بأقواس قرآنية ﴿...﴾ أو أقواس مفردة ﴿ / ﴾ ليأخذ رسم أقواس المصحف المزخرفة وخط الآيات تلقائياً
 */
export function enhanceQuranicVersesInHtml(html: string): string {
  if (!html || (!html.includes('﴿') && !html.includes('﴾'))) return html;

  // 1. توحيد أي أوسمة quran-bracket سابقة لتضمن وجود quran-bracket-open / quran-bracket-close
  const normalizedExisting = html
    .replace(/<span[^>]*class="[^"]*quran-bracket[^"]*"[^>]*>\s*﴿\s*<\/span>/gi, OPEN_QURAN_BRACKET_HTML)
    .replace(/<span[^>]*class="[^"]*quran-bracket[^"]*"[^>]*>\s*﴾\s*<\/span>/gi, CLOSE_QURAN_BRACKET_HTML);

  // 2. تقسيم النص بحسب وسوم quran-verse الموجودة حتى لا نعيد تغليفها
  const parts = normalizedExisting.split(
    /(<span[^>]*class="[^"]*quran-verse[^"]*"[^>]*>[\s\S]*?<\/span>(?:\s*<span[^>]*class="[^"]*quran-bracket[^"]*"[^>]*>[\s\S]*?<\/span>\s*<\/span>)?)/gi
  );

  const pairedEnhanced = parts
    .map((part) => {
      if (part.includes('quran-verse')) {
        return part;
      }

      // معالجة الآيات الكاملة بين ﴿ ... ﴾ (سواء كانت محاطة بوسم quran-bracket أو محارف خام)
      const withPairedVerses = part.replace(
        /(?:<span[^>]*class="[^"]*quran-bracket[^"]*"[^>]*>\s*﴿\s*<\/span>|﴿)([\s\S]*?)(?:<span[^>]*class="[^"]*quran-bracket[^"]*"[^>]*>\s*﴾\s*<\/span>|﴾)/g,
        (_match, innerVerse) => {
          const cleaned = String(innerVerse).trim();
          if (!cleaned) return _match;
          return `<span class="quran-verse" data-quran-verse="true">${OPEN_QURAN_BRACKET_HTML}${cleaned}${CLOSE_QURAN_BRACKET_HTML}</span>`;
        }
      );

      // 3. تحويل أي قوس مفرد متبقٍ (﴿ أو ﴾ خارج وسم quran-bracket) إلى قوس مصحف مزخرف
      const subParts = withPairedVerses.split(/(<span[^>]*class="[^"]*quran-bracket[^"]*"[^>]*>[\s\S]*?<\/span>)/gi);
      return subParts
        .map((sub) => {
          if (sub.includes('quran-bracket')) return sub;
          return sub
            .replace(/﴿/g, OPEN_QURAN_BRACKET_HTML)
            .replace(/﴾/g, CLOSE_QURAN_BRACKET_HTML);
        })
        .join('');
    })
    .join('');

  return pairedEnhanced;
}
