import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import type { Article } from './data/articles';
import { ARTICLES } from './data/articles';
import type { SiteAnalytics, SiteConfig } from './utils/siteConfig';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const BOOTSTRAPPED_ADMIN_EMAIL = 'baraaabdulhasib0@gmail.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function isCurrentUserAdmin(user: User | null = auth.currentUser): boolean {
  if (!user) return false;
  return (
    user.emailVerified === true &&
    user.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()
  );
}

export async function signInAdminWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutAdmin(): Promise<void> {
  await signOut(auth);
}

export { onAuthStateChanged };
export type { User };

/**
 * ضغط صور Base64 الكبيرة تلقائياً بدلاً من قصّ النص وإتلاف الصورة
 */
export async function compressDataUrlIfNeeded(
  src: string,
  maxLength = 650000
): Promise<string> {
  if (!src || src.length <= maxLength || !src.startsWith('data:image/')) {
    return src.length <= 900000 ? src : '';
  }
  if (typeof document === 'undefined') {
    return src.length <= 900000 ? src : '';
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const maxDim = 1280;
        let width = img.width || 1200;
        let height = img.height || 675;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src.length <= 900000 ? src : '');
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        let compressed = canvas.toDataURL('image/jpeg', 0.8);
        if (compressed.length > maxLength) {
          compressed = canvas.toDataURL('image/jpeg', 0.6);
        }
        resolve(compressed.length <= 900000 ? compressed : '');
      } catch {
        resolve(src.length <= 900000 ? src : '');
      }
    };
    img.onerror = () => resolve(src.length <= 900000 ? src : '');
    img.src = src;
  });
}

/**
 * Strip undefined values recursively and enforce schema boundaries for Article
 */
export function sanitizeArticleForFirestore(article: Article): Record<string, unknown> {
  const safeId = (article.id || `art-${Date.now()}`)
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .slice(0, 128);

  const rawCover = String(article.coverImage || '');
  const safeCover =
    rawCover.startsWith('data:image/') && rawCover.length > 900000
      ? ''
      : rawCover.slice(0, 900000);

  const sanitized: Record<string, unknown> = {
    id: safeId,
    slug: String(article.slug || safeId).slice(0, 200),
    title: String(article.title || 'مقال بدون عنوان').slice(0, 500),
    subtitle: String(article.subtitle || '').slice(0, 1000),
    excerpt: String(article.excerpt || '').slice(0, 2000),
    categorySlug: String(article.categorySlug || 'maqasid').slice(0, 128),
    categoryName: String(article.categoryName || 'مقاصد الشريعة').slice(0, 200),
    seriesName: String(article.seriesName || '').slice(0, 200),
    author: JSON.parse(JSON.stringify(article.author || {})),
    authorSlug: String(article.authorSlug || article.author?.slug || 'baraa').slice(0, 128),
    blogTitle: String(article.blogTitle || article.author?.blogTitle || 'مدونة براء العامري').slice(
      0,
      200
    ),
    publishedAt: String(article.publishedAt || new Date().toLocaleDateString('ar-SA')).slice(
      0,
      100
    ),
    hijriDate: String(article.hijriDate || '').slice(0, 100),
    readingTimeMinutes: Math.min(300, Math.max(1, Number(article.readingTimeMinutes) || 5)),
    isFeatured: Boolean(article.isFeatured),
    isCuratedStar: Boolean(article.isCuratedStar),
    coverImage: safeCover,
    coverCaption: String(article.coverCaption || '').slice(0, 600),
    tags: Array.isArray(article.tags)
      ? article.tags.slice(0, 30).map((t) => String(t).slice(0, 100))
      : [],
    content: Array.isArray(article.content)
      ? JSON.parse(JSON.stringify(article.content.slice(0, 300)))
      : [],
    footnotes: Array.isArray(article.footnotes)
      ? JSON.parse(JSON.stringify(article.footnotes.slice(0, 150)))
      : [],
    updatedAt: new Date().toISOString().slice(0, 64),
  };

  return sanitized;
}

export async function saveArticleToFirestore(article: Article): Promise<void> {
  if (!isCurrentUserAdmin()) return;
  const compressedCover = await compressDataUrlIfNeeded(String(article.coverImage || ''));
  const payload = sanitizeArticleForFirestore({
    ...article,
    coverImage: compressedCover,
  });
  const docId = String(payload.id);
  const path = `articles/${docId}`;
  try {
    await setDoc(doc(db, 'articles', docId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteArticleFromFirestore(articleId: string): Promise<void> {
  if (!isCurrentUserAdmin()) return;
  const safeId = articleId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
  const path = `articles/${safeId}`;
  try {
    await deleteDoc(doc(db, 'articles', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function resetDefaultArticlesInFirestore(): Promise<void> {
  if (!isCurrentUserAdmin()) return;
  const path = 'articles';
  try {
    const existingSnap = await getDocs(collection(db, 'articles'));
    const batch = writeBatch(db);
    existingSnap.docs.forEach((d) => {
      batch.delete(d.ref);
    });
    ARTICLES.forEach((art) => {
      const payload = sanitizeArticleForFirestore(art);
      const docId = String(payload.id);
      batch.set(doc(db, 'articles', docId), payload);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function sanitizeSiteConfigForFirestore(config: SiteConfig): Record<string, unknown> {
  return {
    siteName: String(config.siteName || 'بصائر').slice(0, 200),
    brandWordmark: String(config.brandWordmark || 'بصائر').slice(0, 200),
    tagline: String(config.tagline || '').slice(0, 300),
    subtitle: String(config.subtitle || '').slice(0, 1000),
    footerNote: String(config.footerNote || '').slice(0, 300),
    supervisorName: String(config.supervisorName || 'براء العامري').slice(0, 200),
    newsletterBadge: String(config.newsletterBadge || '').slice(0, 200),
    newsletterHeading: String(config.newsletterHeading || '').slice(0, 500),
    newsletterDescription: String(config.newsletterDescription || '').slice(0, 1000),
    telegramUrl: String(config.telegramUrl || '').slice(0, 500),
    telegramButtonText: String(config.telegramButtonText || '').slice(0, 200),
    xUrl: String(config.xUrl || '').slice(0, 500),
    xEnabled: Boolean(config.xEnabled),
    facebookUrl: String(config.facebookUrl || '').slice(0, 500),
    facebookEnabled: Boolean(config.facebookEnabled),
    whatsappUrl: String(config.whatsappUrl || '').slice(0, 500),
    whatsappEnabled: Boolean(config.whatsappEnabled),
    youtubeUrl: String(config.youtubeUrl || '').slice(0, 500),
    youtubeEnabled: Boolean(config.youtubeEnabled),
    aboutBadge: String(config.aboutBadge || '').slice(0, 300),
    aboutHeading: String(config.aboutHeading || '').slice(0, 300),
    aboutIntro: String(config.aboutIntro || '').slice(0, 3000),
    aboutMissionHeading: String(config.aboutMissionHeading || '').slice(0, 300),
    aboutMissionText: String(config.aboutMissionText || '').slice(0, 3000),
    aboutQuote: String(config.aboutQuote || '').slice(0, 1000),
    showHeroSection: Boolean(config.showHeroSection),
    showWritersShelf: Boolean(config.showWritersShelf),
    showSeriesSection: Boolean(config.showSeriesSection),
    showNewsletterSection: Boolean(config.showNewsletterSection),
    defaultArticlesViewMode: config.defaultArticlesViewMode === 'grid' ? 'grid' : 'horizontal',
    defaultWriterSlug: String(config.defaultWriterSlug || 'baraa').slice(0, 128),
    writers: JSON.parse(JSON.stringify((config.writers || []).slice(0, 50))),
    categories: JSON.parse(JSON.stringify((config.categories || []).slice(0, 50))),
    series: JSON.parse(JSON.stringify((config.series || []).slice(0, 50))),
    updatedAt: new Date().toISOString().slice(0, 64),
  };
}

export async function saveSiteConfigToFirestore(config: SiteConfig): Promise<void> {
  if (!isCurrentUserAdmin()) return;
  const path = 'site_settings/main';
  try {
    await setDoc(doc(db, 'site_settings', 'main'), sanitizeSiteConfigForFirestore(config));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function sanitizeAnalyticsForFirestore(analytics: SiteAnalytics): Record<string, unknown> {
  return {
    totalSiteVisits: Math.max(0, Number(analytics.totalSiteVisits) || 0),
    uniqueVisitors: Math.max(0, Number(analytics.uniqueVisitors) || 0),
    avgSessionDurationSeconds: Math.max(0, Number(analytics.avgSessionDurationSeconds) || 0),
    avgCompletionRate: Math.max(0, Number(analytics.avgCompletionRate) || 0),
    newsletterSubscribersCount: Math.max(0, Number(analytics.newsletterSubscribersCount) || 0),
    dailyStats: JSON.parse(JSON.stringify((analytics.dailyStats || []).slice(0, 31))),
    articleViews: JSON.parse(JSON.stringify(analytics.articleViews || {})),
    articleReadsCompleted: JSON.parse(JSON.stringify(analytics.articleReadsCompleted || {})),
    writerVisits: JSON.parse(JSON.stringify(analytics.writerVisits || {})),
    categoryVisits: JSON.parse(JSON.stringify(analytics.categoryVisits || {})),
    trafficSources: JSON.parse(
      JSON.stringify(
        analytics.trafficSources || { direct: 0, search: 0, social: 0, referral: 0 }
      )
    ),
    lastUpdated: new Date().toISOString().slice(0, 64),
  };
}

export async function saveSiteAnalyticsToFirestore(analytics: SiteAnalytics): Promise<void> {
  const path = 'site_analytics/main';
  try {
    await setDoc(doc(db, 'site_analytics', 'main'), sanitizeAnalyticsForFirestore(analytics));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export interface ContactMessageItem {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export async function submitContactMessageToFirestore(
  name: string,
  email: string,
  message: string
): Promise<void> {
  const cleanName = name.trim().slice(0, 200);
  const cleanEmail = email.trim().slice(0, 320);
  const cleanMessage = message.trim().slice(0, 5000);

  if (!cleanName || cleanEmail.length < 3 || !cleanMessage) {
    throw new Error('يرجى التأكد من إدخال الاسم والبريد الإلكتروني ونص الرسالة بشكل صحيح.');
  }

  const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const path = `contact_messages/${id}`;
  const payload: ContactMessageItem = {
    id,
    name: cleanName,
    email: cleanEmail,
    message: cleanMessage,
    createdAt: new Date().toISOString().slice(0, 64),
    read: false,
  };
  try {
    await setDoc(doc(db, 'contact_messages', id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function markContactMessageReadInFirestore(
  id: string,
  _currentMsg: ContactMessageItem,
  read: boolean
): Promise<void> {
  if (!isCurrentUserAdmin()) return;
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
  const path = `contact_messages/${safeId}`;
  try {
    await updateDoc(doc(db, 'contact_messages', safeId), {
      read: Boolean(read),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteContactMessageFromFirestore(id: string): Promise<void> {
  if (!isCurrentUserAdmin()) return;
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
  const path = `contact_messages/${safeId}`;
  try {
    await deleteDoc(doc(db, 'contact_messages', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export { collection, doc, onSnapshot };
