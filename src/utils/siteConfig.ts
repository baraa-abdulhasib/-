import {
  BLOG_META,
  CATEGORIES,
  Category,
  EDITORIAL_SERIES,
  SeriesItem,
  WRITER_BLOGS,
  WriterBlog,
} from '../data/articles';
import {
  saveSiteAnalyticsToFirestore,
  saveSiteConfigToFirestore,
} from '../firebase';

const LEGACY_SITE_CONFIG_KEY_V1 = 'basair_site_config_v1';
const LEGACY_SITE_ANALYTICS_KEY_V1 = 'basair_site_analytics_v1';
const SITE_CONFIG_STORAGE_KEY = 'basair_site_config_v2';
const SITE_ANALYTICS_STORAGE_KEY = 'basair_site_analytics_v2';
const SESSION_UNIQUE_VISITOR_KEY = 'basair_unique_session_counted_v1';

export interface SiteConfig {
  // الهوية والنصوص العامة
  siteName: string;
  brandWordmark: string;
  tagline: string;
  subtitle: string;
  footerNote: string;
  supervisorName: string; // يبقى براء العامري افتراضياً للمفتاح السري

  // نصوص وروابط قسم الاشتراك (مجتمع بصائر وقناة تليجرام والمنصات)
  newsletterBadge: string;
  newsletterHeading: string;
  newsletterDescription: string;
  telegramUrl: string;
  telegramButtonText: string;
  xUrl?: string;
  xEnabled?: boolean;
  facebookUrl?: string;
  facebookEnabled?: boolean;
  whatsappUrl?: string;
  whatsappEnabled?: boolean;
  youtubeUrl?: string;
  youtubeEnabled?: boolean;

  // نصوص صفحة عن بصائر
  aboutBadge: string;
  aboutHeading: string;
  aboutIntro: string;
  aboutMissionHeading: string;
  aboutMissionText: string;
  aboutQuote: string;

  // إعدادات الصفحة الرئيسية
  showHeroSection: boolean;
  showWritersShelf: boolean;
  showSeriesSection: boolean;
  showNewsletterSection: boolean;
  defaultArticlesViewMode: 'horizontal' | 'grid';
  defaultWriterSlug: string;

  // القوائم الديناميكية القابلة للإدارة الكاملة
  writers: WriterBlog[];
  categories: Category[];
  series: SeriesItem[];
}

export interface DailyVisitStat {
  dayLabel: string;
  dateKey: string;
  visits: number;
  uniqueVisitors: number;
}

export interface SiteAnalytics {
  totalSiteVisits: number;
  uniqueVisitors: number;
  avgSessionDurationSeconds: number;
  avgCompletionRate: number;
  newsletterSubscribersCount: number;
  dailyStats: DailyVisitStat[];
  articleViews: Record<string, number>;
  articleReadsCompleted: Record<string, number>;
  writerVisits: Record<string, number>;
  categoryVisits: Record<string, number>;
  trafficSources: {
    direct: number;
    search: number;
    social: number;
    referral: number;
  };
  lastUpdated: string;
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  siteName: BLOG_META.name,
  brandWordmark: BLOG_META.brandWordmark,
  tagline: BLOG_META.tagline,
  subtitle: BLOG_META.subtitle,
  footerNote: 'منصة تدوين جماعية بإشراف',
  supervisorName: 'براء العامري',

  newsletterBadge: 'مجتمع بصائر',
  newsletterHeading: 'تابع جديد «بصائر» ومقالات كُتّابنا أولاً بأول عبر تليجرام',
  newsletterDescription:
    'انضم إلى قناة منصة بصائر على تليجرام لتصلك تنبيهات المقالات الجديدة، والمقتطفات المختارة، وإصدارات الكُتّاب فور نشرها.',
  telegramUrl: 'https://t.me/BasairPlatform',
  telegramButtonText: 'انضم إلى قناة بصائر على تليجرام',
  xUrl: '',
  xEnabled: false,
  facebookUrl: '',
  facebookEnabled: false,
  whatsappUrl: '',
  whatsappEnabled: false,
  youtubeUrl: '',
  youtubeEnabled: false,

  aboutBadge: 'التعريف بمنصة بصائر ورؤيتها',
  aboutHeading: 'عن منصة «بصائر»',
  aboutIntro:
    '«بصائر» هي منصة تدوين فكرية وشرعية مستقلة، صُممت لتجمع كوكبة من الكُتّاب والباحثين الجادين؛ حيث يمتلك كل كاتب فيها مدوّنته الخاصة ومساحته التحريرية المستقلة، تحت مظلة معرفية واحدة تُعنى بقضايا الفكر، الشريعة، والواقع المعاصر بلغة عربية فصيحة وبيان مشرق.',
  aboutMissionHeading: 'رسالة المنصة ومنهجها في الكتابة',
  aboutMissionText:
    'انطلقت هذه المنصة من قناعة راسخة بأن القارئ العربي المعاصر متعطشٌ إلى الكتابة الرصينة التي تتجاوز الطرح السطحي العابر، وتشتبك مع أسئلة الواقع الحقيقية انطلاقاً من كليات الوحي ومقاصد الشريعة الغراء.',
  aboutQuote:
    '«لا يستقيم فقه الواقع إلا بفقه الوحي، ولا يثمر فقه الوحي في حياة الناس إلا ببصيرةٍ في الواقع ومآلاته.»',

  showHeroSection: true,
  showWritersShelf: true,
  showSeriesSection: false,
  showNewsletterSection: true,
  defaultArticlesViewMode: 'horizontal',
  defaultWriterSlug: 'baraa',

  writers: [...WRITER_BLOGS],
  categories: [...CATEGORIES],
  series: [...EDITORIAL_SERIES],
};

export function loadSiteConfig(): SiteConfig {
  try {
    localStorage.removeItem(LEGACY_SITE_CONFIG_KEY_V1);
    const raw = localStorage.getItem(SITE_CONFIG_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SITE_CONFIG };
    const parsed = JSON.parse(raw);

    return {
      ...DEFAULT_SITE_CONFIG,
      ...parsed,
      writers:
        Array.isArray(parsed.writers) && parsed.writers.length > 0
          ? parsed.writers
          : [...WRITER_BLOGS],
      categories:
        Array.isArray(parsed.categories) && parsed.categories.length > 0
          ? parsed.categories
          : [...CATEGORIES],
      series: Array.isArray(parsed.series) ? parsed.series : [...EDITORIAL_SERIES],
    };
  } catch {
    return { ...DEFAULT_SITE_CONFIG };
  }
}

let siteConfigCloudDebounceTimer: ReturnType<typeof setTimeout> | null = null;

export function saveSiteConfig(
  config: SiteConfig,
  skipCloudSync = false,
  immediateCloudSync = false
): void {
  try {
    localStorage.setItem(SITE_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore storage errors
  }
  if (!skipCloudSync) {
    if (siteConfigCloudDebounceTimer) {
      clearTimeout(siteConfigCloudDebounceTimer);
      siteConfigCloudDebounceTimer = null;
    }
    if (immediateCloudSync) {
      saveSiteConfigToFirestore(config).catch(() => {});
    } else {
      siteConfigCloudDebounceTimer = setTimeout(() => {
        siteConfigCloudDebounceTimer = null;
        saveSiteConfigToFirestore(config).catch(() => {});
      }, 800);
    }
  }
}

export function resetSiteConfigToDefault(): SiteConfig {
  try {
    localStorage.removeItem(SITE_CONFIG_STORAGE_KEY);
    localStorage.removeItem(LEGACY_SITE_CONFIG_KEY_V1);
  } catch {
    // ignore
  }
  const defaults: SiteConfig = {
    ...DEFAULT_SITE_CONFIG,
    writers: [...WRITER_BLOGS],
    categories: [...CATEGORIES],
    series: [...EDITORIAL_SERIES],
  };
  saveSiteConfig(defaults);
  return defaults;
}

const DEFAULT_ANALYTICS: SiteAnalytics = {
  totalSiteVisits: 0,
  uniqueVisitors: 0,
  avgSessionDurationSeconds: 0,
  avgCompletionRate: 0,
  newsletterSubscribersCount: 0,
  dailyStats: [
    { dayLabel: 'السبت', dateKey: 'day-1', visits: 0, uniqueVisitors: 0 },
    { dayLabel: 'الأحد', dateKey: 'day-2', visits: 0, uniqueVisitors: 0 },
    { dayLabel: 'الإثنين', dateKey: 'day-3', visits: 0, uniqueVisitors: 0 },
    { dayLabel: 'الثلاثاء', dateKey: 'day-4', visits: 0, uniqueVisitors: 0 },
    { dayLabel: 'الأربعاء', dateKey: 'day-5', visits: 0, uniqueVisitors: 0 },
    { dayLabel: 'الخميس', dateKey: 'day-6', visits: 0, uniqueVisitors: 0 },
    { dayLabel: 'الجمعة', dateKey: 'day-7', visits: 0, uniqueVisitors: 0 },
  ],
  articleViews: {},
  articleReadsCompleted: {},
  writerVisits: {},
  categoryVisits: {},
  trafficSources: {
    direct: 0,
    search: 0,
    social: 0,
    referral: 0,
  },
  lastUpdated: new Date().toISOString(),
};

export function loadSiteAnalytics(): SiteAnalytics {
  try {
    localStorage.removeItem(LEGACY_SITE_ANALYTICS_KEY_V1);
    const raw = localStorage.getItem(SITE_ANALYTICS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SITE_ANALYTICS_STORAGE_KEY, JSON.stringify(DEFAULT_ANALYTICS));
      return { ...DEFAULT_ANALYTICS };
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_ANALYTICS,
      ...parsed,
      dailyStats:
        Array.isArray(parsed.dailyStats) && parsed.dailyStats.length > 0
          ? parsed.dailyStats
          : [...DEFAULT_ANALYTICS.dailyStats],
      articleViews: { ...(parsed.articleViews || {}) },
      articleReadsCompleted: { ...(parsed.articleReadsCompleted || {}) },
      writerVisits: { ...(parsed.writerVisits || {}) },
      categoryVisits: { ...(parsed.categoryVisits || {}) },
      trafficSources: {
        ...DEFAULT_ANALYTICS.trafficSources,
        ...(parsed.trafficSources || {}),
      },
    };
  } catch {
    return { ...DEFAULT_ANALYTICS };
  }
}

export function saveSiteAnalytics(analytics: SiteAnalytics, skipCloudSync = false): void {
  try {
    localStorage.setItem(SITE_ANALYTICS_STORAGE_KEY, JSON.stringify(analytics));
  } catch {
    // ignore
  }
  if (!skipCloudSync) {
    saveSiteAnalyticsToFirestore(analytics).catch(() => {});
  }
}

const ARABIC_DAYS_MAP: Record<number, string> = {
  0: 'الأحد',
  1: 'الإثنين',
  2: 'الثلاثاء',
  3: 'الأربعاء',
  4: 'الخميس',
  5: 'الجمعة',
  6: 'السبت',
};

export function recordSiteVisit(skipCloudSync = false): SiteAnalytics {
  const current = loadSiteAnalytics();
  let isNewSessionVisitor = false;
  try {
    if (!sessionStorage.getItem(SESSION_UNIQUE_VISITOR_KEY)) {
      sessionStorage.setItem(SESSION_UNIQUE_VISITOR_KEY, '1');
      isNewSessionVisitor = true;
    }
  } catch {
    // ignore sessionStorage errors
  }

  const todayLabel = ARABIC_DAYS_MAP[new Date().getDay()] || 'الجمعة';
  const nextDaily = [...current.dailyStats];
  if (nextDaily.length > 0) {
    const matchedIdx = nextDaily.findIndex((d) => d.dayLabel === todayLabel);
    const targetIdx = matchedIdx >= 0 ? matchedIdx : nextDaily.length - 1;
    nextDaily[targetIdx] = {
      ...nextDaily[targetIdx],
      visits: (nextDaily[targetIdx].visits || 0) + 1,
      uniqueVisitors:
        (nextDaily[targetIdx].uniqueVisitors || 0) + (isNewSessionVisitor ? 1 : 0),
    };
  }

  // تصنيف مصدر الزيارة فعلياً من document.referrer (مرة واحدة لكل جلسة)
  const nextTraffic = { ...current.trafficSources };
  if (isNewSessionVisitor) {
    let sourceKey: 'direct' | 'search' | 'social' | 'referral' = 'direct';
    try {
      const ref = document.referrer ? new URL(document.referrer) : null;
      if (ref && ref.hostname !== window.location.hostname) {
        const host = ref.hostname.toLowerCase();
        if (/(google|bing|yahoo|duckduckgo|yandex|baidu|ecosia)\./.test(host)) {
          sourceKey = 'search';
        } else if (
          /(t\.me|telegram|facebook|fb\.|instagram|twitter|x\.com|t\.co|whatsapp|youtube|linkedin|reddit|tiktok)/.test(host)
        ) {
          sourceKey = 'social';
        } else {
          sourceKey = 'referral';
        }
      }
    } catch {
      // ignore referrer parsing errors
    }
    nextTraffic[sourceKey] = (nextTraffic[sourceKey] || 0) + 1;
  }

  const updated: SiteAnalytics = {
    ...current,
    totalSiteVisits: (current.totalSiteVisits || 0) + 1,
    uniqueVisitors: (current.uniqueVisitors || 0) + (isNewSessionVisitor ? 1 : 0),
    dailyStats: nextDaily,
    trafficSources: nextTraffic,
    lastUpdated: new Date().toISOString(),
  };
  saveSiteAnalytics(updated, skipCloudSync);
  return updated;
}

export function recordArticleView(
  articleSlug: string,
  authorSlug?: string,
  categorySlug?: string
): SiteAnalytics {
  const current = loadSiteAnalytics();
  const prevArticleViews = current.articleViews[articleSlug] || 0;
  // لا نَنسب الزيارة لكاتب أو تصنيف افتراضي إن غاب المعرّف
  const writerKey = authorSlug || '';
  const catKey = categorySlug || '';

  const updated: SiteAnalytics = {
    ...current,
    totalSiteVisits: current.totalSiteVisits + 1,
    articleViews: {
      ...current.articleViews,
      [articleSlug]: prevArticleViews + 1,
    },
    writerVisits: writerKey
      ? { ...current.writerVisits, [writerKey]: (current.writerVisits[writerKey] || 0) + 1 }
      : current.writerVisits,
    categoryVisits: catKey
      ? { ...current.categoryVisits, [catKey]: (current.categoryVisits[catKey] || 0) + 1 }
      : current.categoryVisits,
    lastUpdated: new Date().toISOString(),
  };
  saveSiteAnalytics(updated);
  return updated;
}

export function recordWriterBlogVisit(writerSlug: string): SiteAnalytics {
  const current = loadSiteAnalytics();
  const prev = current.writerVisits[writerSlug] || 0;
  const updated: SiteAnalytics = {
    ...current,
    totalSiteVisits: current.totalSiteVisits + 1,
    writerVisits: {
      ...current.writerVisits,
      [writerSlug]: prev + 1,
    },
    lastUpdated: new Date().toISOString(),
  };
  saveSiteAnalytics(updated);
  return updated;
}

export function recordArticleReadCompleted(articleSlug: string): SiteAnalytics {
  const current = loadSiteAnalytics();
  const prev = current.articleReadsCompleted[articleSlug] || 0;
  const updated: SiteAnalytics = {
    ...current,
    articleReadsCompleted: {
      ...current.articleReadsCompleted,
      [articleSlug]: prev + 1,
    },
    lastUpdated: new Date().toISOString(),
  };
  saveSiteAnalytics(updated);
  return updated;
}
