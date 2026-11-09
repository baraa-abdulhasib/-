import { ARTICLES, CATEGORIES } from '../data/articles';
import { PageView } from '../components/Header';
import { loadSiteArticles } from './studioAuth';
import { loadSiteConfig } from './siteConfig';

export interface RouteState {
  page: PageView;
  articleSlug: string;
  categorySlug: string | null;
  writerSlug: string | null;
}

/**
 * بناء مسار الهاش (HashHref) لكل صفحة أو مقال أو تصنيف
 */
export function buildHashPath(
  pageOrRoute:
    | PageView
    | {
        page: PageView;
        articleSlug?: string;
        categorySlug?: string | null;
        writerSlug?: string | null;
      },
  options?: {
    articleSlug?: string;
    categorySlug?: string | null;
    writerSlug?: string | null;
  }
): string {
  const page: PageView =
    typeof pageOrRoute === 'string' ? pageOrRoute : pageOrRoute.page;
  const opts = typeof pageOrRoute === 'object' ? pageOrRoute : options;

  switch (page) {
    case 'home':
      return '#/';
    case 'blogs':
      return opts?.writerSlug ? `#/blog/${opts.writerSlug}` : '#/blogs';
    case 'article-detail': {
      const slug =
        opts?.articleSlug || loadSiteArticles()[0]?.slug || ARTICLES[0]?.slug || '';
      return slug ? `#/post/${slug}` : '#/';
    }
    case 'articles':
      return opts?.categorySlug ? `#/articles/${opts.categorySlug}` : '#/articles';
    case 'categories':
      return opts?.categorySlug ? `#/category/${opts.categorySlug}` : '#/categories';
    case 'about':
      return '#/about';
    case 'bookmarks':
      return '#/bookmarks';
    default:
      return '#/';
  }
}

/**
 * قراءة وتحليل window.location.hash وتحويله إلى حالة توجيه آمنة بدون أي صفحات فارغة أو 404
 */
export function parseHashRoute(hash: string): RouteState {
  const siteArticles = loadSiteArticles();
  const defaultSlug = siteArticles[0]?.slug || ARTICLES[0]?.slug || '';
  const cleaned = hash.replace(/^#/, '').trim();

  if (!cleaned || cleaned === '/') {
    return { page: 'home', articleSlug: defaultSlug, categorySlug: null, writerSlug: null };
  }

  const segments = cleaned.split('/').filter(Boolean);
  const first = segments[0];
  const second = segments[1] ? decodeURIComponent(segments[1]).trim() : null;

  // مسار المدونات والكُتّاب: #/blogs أو #/blog/:writerSlug
  if (first === 'blogs' || first === 'blog' || first === 'writers' || first === 'writer') {
    return {
      page: 'blogs',
      articleSlug: defaultSlug,
      categorySlug: null,
      writerSlug: second,
    };
  }

  // مسار المقال: #/post/:slug أو #/article/:slug
  // نحافظ على الـ slug المطلوب في الرابط حتى لو لم تكتمل مزامنة Firestore بعد عند أول فتح للرابط المباشر
  if (first === 'post' || first === 'article') {
    if (second) {
      return {
        page: 'article-detail',
        articleSlug: second,
        categorySlug: null,
        writerSlug: null,
      };
    }
    return { page: 'home', articleSlug: defaultSlug, categorySlug: null, writerSlug: null };
  }

  const activeCategories = loadSiteConfig().categories || CATEGORIES;

  // مسار جميع المقالات: #/articles أو #/articles/:categorySlug
  if (first === 'articles') {
    const validCategory = activeCategories.find((c) => c.slug === second);
    return {
      page: 'articles',
      articleSlug: defaultSlug,
      categorySlug: validCategory ? validCategory.slug : second || null,
      writerSlug: null,
    };
  }

  // مسار التصنيفات: #/categories أو #/category/:categorySlug
  if (first === 'categories' || first === 'category') {
    const validCategory = activeCategories.find((c) => c.slug === second);
    return {
      page: 'categories',
      articleSlug: defaultSlug,
      categorySlug: validCategory ? validCategory.slug : second || null,
    writerSlug: null,
    };
  }

  // مسار عن المنصة: #/about
  if (first === 'about') {
    return { page: 'about', articleSlug: defaultSlug, categorySlug: null, writerSlug: null };
  }

  // مسار المحفوظات: #/bookmarks
  if (first === 'bookmarks') {
    return { page: 'bookmarks', articleSlug: defaultSlug, categorySlug: null, writerSlug: null };
  }

  // أي مسار آخر غير معروف يعود بأمان إلى الصفحة الرئيسية
  return { page: 'home', articleSlug: defaultSlug, categorySlug: null, writerSlug: null };
}
