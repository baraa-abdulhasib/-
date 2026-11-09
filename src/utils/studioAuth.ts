import { Article, ARTICLES } from '../data/articles';

export type StudioMode = 'writer-editor' | 'site-content' | 'site-admin';

const SESSION_AUTH_KEY = 'baraa_studio_session_auth_v1';
const LEGACY_CUSTOM_HASH_KEY = 'baraa_studio_custom_sha256_v1';
const CUSTOM_ARTICLES_STORAGE_KEY = 'baraa_blog_custom_articles_v1';
const LEGACY_SITE_ARTICLES_KEY_V3 = 'baraa_blog_site_articles_v3';
const LEGACY_SITE_ARTICLES_KEY_V4 = 'baraa_blog_site_articles_v4';
const SITE_ARTICLES_STORAGE_KEY = 'baraa_blog_site_articles_v5';
const STUDIO_DRAFT_STORAGE_KEY = 'baraa_studio_active_draft_v1';

/**
 * التحقق مما إذا كانت جلسة الكاتب نشطة في sessionStorage
 */
export function isStudioSessionActive(): boolean {
  try {
    localStorage.removeItem(LEGACY_CUSTOM_HASH_KEY);
    return sessionStorage.getItem(SESSION_AUTH_KEY) === 'authenticated';
  } catch {
    return false;
  }
}

export function setStudioSessionActive(active: boolean): void {
  try {
    localStorage.removeItem(LEGACY_CUSTOM_HASH_KEY);
    if (active) {
      sessionStorage.setItem(SESSION_AUTH_KEY, 'authenticated');
    } else {
      sessionStorage.removeItem(SESSION_AUTH_KEY);
    }
  } catch {
    // ignore
  }
}

/**
 * إدارة جميع مقالات الموقع بدون أي مقال نموذجي أو تجريبي
 */
export function loadSiteArticles(): Article[] {
  try {
    // تنظيف النسخ التجريبية القديمة تلقائياً
    localStorage.removeItem(LEGACY_SITE_ARTICLES_KEY_V3);
    localStorage.removeItem(CUSTOM_ARTICLES_STORAGE_KEY);

    // ترحيل أي مقالات حقيقية كتبها المستخدم في v4 مع استبعاد المقال النموذجي art-showcase-1
    const rawV4 = localStorage.getItem(LEGACY_SITE_ARTICLES_KEY_V4);
    if (rawV4) {
      localStorage.removeItem(LEGACY_SITE_ARTICLES_KEY_V4);
      const parsedV4 = JSON.parse(rawV4);
      if (Array.isArray(parsedV4)) {
        const cleaned = parsedV4.filter(
          (a: Article) =>
            a &&
            a.id !== 'art-showcase-1' &&
            a.slug !== 'basair-complete-editorial-showcase'
        );
        localStorage.setItem(SITE_ARTICLES_STORAGE_KEY, JSON.stringify(cleaned));
        return cleaned;
      }
    }

    const raw = localStorage.getItem(SITE_ARTICLES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (a: Article) =>
            a &&
            a.id !== 'art-showcase-1' &&
            a.slug !== 'basair-complete-editorial-showcase'
        );
      }
    }
    const initial = [...ARTICLES];
    localStorage.setItem(SITE_ARTICLES_STORAGE_KEY, JSON.stringify(initial));
    return initial;
  } catch {
    return [...ARTICLES];
  }
}

export function saveSiteArticles(articles: Article[]): void {
  try {
    const cleaned = articles.filter(
      (a) =>
        a &&
        a.id !== 'art-showcase-1' &&
        a.slug !== 'basair-complete-editorial-showcase'
    );
    localStorage.setItem(SITE_ARTICLES_STORAGE_KEY, JSON.stringify(cleaned));
  } catch {
    // ignore
  }
}

export function resetSiteArticlesToDefault(): Article[] {
  try {
    localStorage.setItem(SITE_ARTICLES_STORAGE_KEY, JSON.stringify(ARTICLES));
    localStorage.removeItem(LEGACY_SITE_ARTICLES_KEY_V3);
    localStorage.removeItem(LEGACY_SITE_ARTICLES_KEY_V4);
    localStorage.removeItem(CUSTOM_ARTICLES_STORAGE_KEY);
  } catch {
    // ignore
  }
  return [...ARTICLES];
}

// دوال التوافق الخلفي
export function loadCustomArticles(): Article[] {
  return loadSiteArticles();
}

export function saveCustomArticles(articles: Article[]): void {
  saveSiteArticles(articles);
}

export interface StudioDraft {
  title: string;
  subtitle: string;
  categorySlug: string;
  seriesName: string;
  coverImage: string;
  coverCaption: string;
  isFeatured: boolean;
  isCuratedStar: boolean;
  tagsInput: string;
  htmlBody: string;
  footnotes?: { id: number; text: string }[];
  updatedAt: string;
}

export function loadStudioDraft(): StudioDraft | null {
  try {
    const raw = localStorage.getItem(STUDIO_DRAFT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStudioDraft(draft: StudioDraft): void {
  try {
    localStorage.setItem(STUDIO_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // ignore
  }
}

export function clearStudioDraft(): void {
  try {
    localStorage.removeItem(STUDIO_DRAFT_STORAGE_KEY);
  } catch {
    // ignore
  }
}
