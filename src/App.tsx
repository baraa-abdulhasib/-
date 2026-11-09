/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Article, CATEGORIES } from './data/articles';
import { Header, PageView } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ArticlePage } from './pages/ArticlePage';
import { CategoriesPage } from './pages/CategoriesPage';
import { AboutPage } from './pages/AboutPage';
import { StudioPage } from './pages/StudioPage';
import { StudioAuthModal } from './components/StudioAuthModal';
import { ArticleCard } from './components/ArticleCard';
import { ArticlesShelfIcon } from './components/Icons';
import { Bookmark } from 'lucide-react';
import { BlogsPage } from './pages/BlogsPage';
import { PaperGrainOverlay } from './components/PaperGrainOverlay';
import { buildHashPath, parseHashRoute } from './utils/router';
import {
  loadSiteArticles,
  resetSiteArticlesToDefault,
  saveSiteArticles,
  StudioMode,
} from './utils/studioAuth';
import {
  loadSiteConfig,
  recordArticleView,
  recordSiteVisit,
  recordWriterBlogVisit,
  resetSiteConfigToDefault,
  saveSiteAnalytics,
  saveSiteConfig,
  SiteAnalytics,
  SiteConfig,
} from './utils/siteConfig';
import {
  auth,
  collection,
  db,
  deleteArticleFromFirestore,
  doc,
  handleFirestoreError,
  isCurrentUserAdmin,
  onAuthStateChanged,
  onSnapshot,
  OperationType,
  resetDefaultArticlesInFirestore,
  saveArticleToFirestore,
  saveSiteConfigToFirestore,
} from './firebase';

function getArticleTimestamp(article: Article & { updatedAt?: string }): number {
  if (article.updatedAt) {
    const parsed = Date.parse(article.updatedAt);
    if (!Number.isNaN(parsed)) return parsed;
  }
  const match = String(article.id || '').match(/(\d{10,})/);
  if (match) {
    return Number(match[1]);
  }
  return 0;
}

export default function App() {
  // 1. إدارة الوضع الفاتح والداكن مع الحفظ في localStorage
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('baraa_blog_theme');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('baraa_blog_theme', isDark ? 'dark' : 'light');
    } catch {
      // ignore storage errors
    }
  }, [isDark]);

  // 2. إدارة جميع مقالات الموقع وإعدادات المنصة الشاملة مع مزامنة سحابية فورية (Firebase Firestore)
  const [siteArticles, setSiteArticles] = useState<Article[]>(() => loadSiteArticles());
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => loadSiteConfig());
  const [isCloudArticlesLoaded, setIsCloudArticlesLoaded] = useState<boolean>(false);

  const allArticles = useMemo(() => siteArticles, [siteArticles]);

  // الاشتراك اللحظي في قاعدة بيانات Firebase Firestore (المقالات + إعدادات المنصة + الإحصائيات)
  useEffect(() => {
    let hasCloudConfig = false;
    let hasRecordedInitialVisit = false;

    const unsubArticles = onSnapshot(
      collection(db, 'articles'),
      (snap) => {
        const rawDocs = snap.docs.map((d) => d.data() as Article);
        // إذا كان المقال النموذجي المحذوف لا يزال موجوداً في السحابة والمدير مسجل الدخول، نحذفه نهائياً
        if (
          isCurrentUserAdmin(auth.currentUser) &&
          rawDocs.some(
            (a) =>
              a.id === 'art-showcase-1' ||
              a.slug === 'basair-complete-editorial-showcase'
          )
        ) {
          deleteArticleFromFirestore('art-showcase-1').catch(() => {});
        }

        const cloudArticles = rawDocs.filter(
          (a) =>
            a &&
            a.id !== 'art-showcase-1' &&
            a.slug !== 'basair-complete-editorial-showcase'
        );

        // ترتيب بحيث يكون المميز أولاً ثم الأحدث إنشاءً/تحديثاً
        cloudArticles.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return getArticleTimestamp(b) - getArticleTimestamp(a);
        });
        setSiteArticles(cloudArticles);
        saveSiteArticles(cloudArticles);
        setIsCloudArticlesLoaded(true);
      },
      (err) => {
        setIsCloudArticlesLoaded(true);
        try {
          handleFirestoreError(err, OperationType.LIST, 'articles');
        } catch {
          // fallback to local articles if offline
        }
      }
    );

    const unsubConfig = onSnapshot(
      doc(db, 'site_settings', 'main'),
      (snap) => {
        if (snap.exists()) {
          hasCloudConfig = true;
          const fallback = loadSiteConfig();
          const rawCloud = snap.data() as Partial<SiteConfig>;
          const cloudConfig: SiteConfig = {
            ...fallback,
            ...rawCloud,
            writers:
              Array.isArray(rawCloud.writers) && rawCloud.writers.length > 0
                ? rawCloud.writers
                : fallback.writers,
            categories:
              Array.isArray(rawCloud.categories) && rawCloud.categories.length > 0
                ? rawCloud.categories
                : fallback.categories,
            series: Array.isArray(rawCloud.series) ? rawCloud.series : fallback.series,
          };
          setSiteConfig(cloudConfig);
          saveSiteConfig(cloudConfig, true);
        } else if (isCurrentUserAdmin(auth.currentUser)) {
          saveSiteConfigToFirestore(loadSiteConfig()).catch(() => {});
        }
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.GET, 'site_settings/main');
        } catch {
          // fallback to local config
        }
      }
    );

    const unsubAnalytics = onSnapshot(
      doc(db, 'site_analytics', 'main'),
      (snap) => {
        if (snap.exists()) {
          saveSiteAnalytics(snap.data() as SiteAnalytics, true);
        }
        if (!hasRecordedInitialVisit) {
          hasRecordedInitialVisit = true;
          recordSiteVisit();
        }
      },
      (err) => {
        if (!hasRecordedInitialVisit) {
          hasRecordedInitialVisit = true;
          recordSiteVisit(true);
        }
        try {
          handleFirestoreError(err, OperationType.GET, 'site_analytics/main');
        } catch {
          // ignore
        }
      }
    );

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (isCurrentUserAdmin(user)) {
        deleteArticleFromFirestore('art-showcase-1').catch(() => {});
        if (!hasCloudConfig) {
          saveSiteConfigToFirestore(loadSiteConfig()).catch(() => {});
        }
      }
    });

    return () => {
      unsubArticles();
      unsubConfig();
      unsubAnalytics();
      unsubAuth();
    };
  }, []);

  const handleUpdateSiteConfig = (nextConfig: SiteConfig) => {
    setSiteConfig(nextConfig);
    saveSiteConfig(nextConfig);
  };

  const handleResetSiteConfig = () => {
    const restored = resetSiteConfigToDefault();
    setSiteConfig(restored);
  };

  // 3. إدارة التوجيه عبر Hash Routing بالكامل
  const initialRoute = useMemo(() => parseHashRoute(window.location.hash), []);
  const [currentPage, setCurrentPage] = useState<PageView>(initialRoute.page);
  const [activeArticleSlug, setActiveArticleSlug] = useState<string>(initialRoute.articleSlug);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(
    initialRoute.categorySlug
  );
  const [selectedWriterSlug, setSelectedWriterSlug] = useState<string | null>(
    initialRoute.writerSlug
  );

  // 4. إدارة بوابة الكاتب السرية والخيارات الثلاثة (محرر الكتابة | تحرير محتوى الموقع | إدارة)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isStudioOpen, setIsStudioOpen] = useState<boolean>(false);
  const [studioMode, setStudioMode] = useState<StudioMode>('writer-editor');

  const handleSecretStudioTrigger = () => {
    setIsAuthModalOpen(true);
  };

  // حفظ مقال جديد أو تحديث مقال موجود من داخل محرر الكتابة (مع الحفظ السحابي المباشر في Firebase)
  const handleSaveArticleFromStudio = (savedArticle: Article, isEditingExisting: boolean) => {
    setSiteArticles((prev) => {
      const normalizedPrev = savedArticle.isFeatured
        ? prev.map((a) => {
            if (a.id === savedArticle.id) return a;
            const unfeatured = { ...a, isFeatured: false };
            saveArticleToFirestore(unfeatured).catch(() => {});
            return unfeatured;
          })
        : prev;

      let next: Article[];
      if (isEditingExisting && normalizedPrev.some((a) => a.id === savedArticle.id)) {
        next = normalizedPrev.map((a) => (a.id === savedArticle.id ? savedArticle : a));
      } else {
        const filtered = normalizedPrev.filter((a) => a.slug !== savedArticle.slug);
        next = [savedArticle, ...filtered];
      }
      saveSiteArticles(next);
      return next;
    });

    saveArticleToFirestore(savedArticle).catch(() => {});

    setIsStudioOpen(false);
    setActiveArticleSlug(savedArticle.slug);
    setCurrentPage('article-detail');
    window.location.hash = buildHashPath('article-detail', { articleSlug: savedArticle.slug });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // تعديل سريع لمقال موجود مع البقاء داخل لوحة "تحرير محتوى الموقع"
  const handleUpdateArticleInPlace = (updatedArticle: Article) => {
    setSiteArticles((prev) => {
      const normalizedPrev = updatedArticle.isFeatured
        ? prev.map((a) => {
            if (a.id === updatedArticle.id) return a;
            const unfeatured = { ...a, isFeatured: false };
            saveArticleToFirestore(unfeatured).catch(() => {});
            return unfeatured;
          })
        : prev;
      const next = normalizedPrev.map((a) =>
        a.id === updatedArticle.id ? updatedArticle : a
      );
      saveSiteArticles(next);
      return next;
    });

    saveArticleToFirestore(updatedArticle).catch(() => {});
  };

  // حذف أي مقال من الموقع نهائياً (محلياً وفي Firebase Firestore)
  const handleDeleteSiteArticle = (articleId: string) => {
    setSiteArticles((prev) => {
      const next = prev.filter((a) => a.id !== articleId);
      saveSiteArticles(next);
      return next;
    });

    deleteArticleFromFirestore(articleId).catch(() => {});
  };

  // استعادة المقالات الافتراضية الأصلية للموقع
  const handleResetDefaultArticles = () => {
    const restored = resetSiteArticlesToDefault();
    setSiteArticles(restored);
    resetDefaultArticlesInFirestore().catch(() => {});
  };

  // الاستماع لتغيرات الـ Hash (أزرار الرجوع والتقدم في المتصفح أو فتح الروابط المباشرة)
  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, '', '#/');
    }

    const handleHashChange = () => {
      const parsed = parseHashRoute(window.location.hash);
      setCurrentPage(parsed.page);
      setActiveArticleSlug(parsed.articleSlug);
      setSelectedCategorySlug(parsed.categorySlug);
      setSelectedWriterSlug(parsed.writerSlug);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 5. إدارة البحث الفوري
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 6. إدارة المقالات المحفوظة (قائمة القراءة)
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('baraa_blog_bookmarks');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const handleToggleBookmark = (articleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedIds((prev) => {
      const next = prev.includes(articleId)
        ? prev.filter((id) => id !== articleId)
        : [...prev, articleId];
      try {
        localStorage.setItem('baraa_blog_bookmarks', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // اختيار مدونة كاتب معين والتنقل إليها
  const handleSelectWriterBlog = (writerSlug: string | null) => {
    if (writerSlug) {
      recordWriterBlogVisit(writerSlug);
    }
    const targetHash = buildHashPath({ page: 'blogs', writerSlug });
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    } else {
      setSelectedWriterSlug(writerSlug);
      setCurrentPage('blogs');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // دالة التنقل الموحدة التي تحدّث مسار الهاش (#/...) والحالة معاً
  const handleNavigate = (page: PageView, filterSlug: string | null = null) => {
    if (page === 'blogs') {
      handleSelectWriterBlog(filterSlug);
      return;
    }
    const targetHash = buildHashPath(page, { categorySlug: filterSlug });
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    } else {
      setCurrentPage(page);
      setSelectedCategorySlug(filterSlug);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectArticle = (slug: string) => {
    const matched = allArticles.find((a) => a.slug === slug);
    recordArticleView(slug, matched?.authorSlug || matched?.author.slug, matched?.categorySlug);

    const targetHash = buildHashPath('article-detail', { articleSlug: slug });
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    } else {
      setActiveArticleSlug(slug);
      setCurrentPage('article-detail');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectCategoryInPage = (slug: string | null) => {
    const targetHash = buildHashPath(currentPage === 'articles' ? 'articles' : 'categories', {
      categorySlug: slug,
    });
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    } else {
      setSelectedCategorySlug(slug);
    }
  };

  const handleScrollToNewsletter = () => {
    const el = document.getElementById('newsletter-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      handleNavigate('home', null);
      setTimeout(() => {
        document.getElementById('newsletter-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  };

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return allArticles.filter(
      (art) =>
        art.title.toLowerCase().includes(q) ||
        art.subtitle.toLowerCase().includes(q) ||
        art.excerpt.toLowerCase().includes(q) ||
        art.categoryName.toLowerCase().includes(q) ||
        art.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [searchQuery, allArticles]);

  const activeArticle = useMemo(() => {
    if (!activeArticleSlug) return allArticles[0] || null;
    return allArticles.find((a) => a.slug === activeArticleSlug) || null;
  }, [activeArticleSlug, allArticles]);

  const relatedArticles = useMemo(() => {
    if (!activeArticle) return [];
    const sameCategory = allArticles.filter(
      (a) => a.categorySlug === activeArticle.categorySlug && a.id !== activeArticle.id
    );
    if (sameCategory.length >= 2) return sameCategory.slice(0, 3);
    const others = allArticles.filter(
      (a) => a.id !== activeArticle.id && !sameCategory.some((s) => s.id === a.id)
    );
    return [...sameCategory, ...others].slice(0, 3);
  }, [activeArticle, allArticles]);

  const bookmarkedArticles = useMemo(
    () => allArticles.filter((a) => bookmarkedIds.includes(a.id)),
    [bookmarkedIds, allArticles]
  );

  const activeCategories = siteConfig.categories.length > 0 ? siteConfig.categories : CATEGORIES;

  // إذا كان استوديو الكاتب مفتوحاً، نعرض الواجهة المختارة (محرر الكتابة | تحرير محتوى الموقع | إدارة)
  if (isStudioOpen) {
    return (
      <>
        <PaperGrainOverlay />
        <StudioPage
          initialMode={studioMode}
          siteArticles={siteArticles}
          siteConfig={siteConfig}
          bookmarkedIds={bookmarkedIds}
          onSaveArticle={handleSaveArticleFromStudio}
          onUpdateArticleInPlace={handleUpdateArticleInPlace}
          onDeleteArticle={handleDeleteSiteArticle}
          onResetDefaultArticles={handleResetDefaultArticles}
          onUpdateSiteConfig={handleUpdateSiteConfig}
          onResetSiteConfig={handleResetSiteConfig}
          onPreviewArticle={(slug) => {
            setIsStudioOpen(false);
            handleSelectArticle(slug);
          }}
          onCancel={() => setIsStudioOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F7F2] text-[#141413] dark:bg-[#121110] dark:text-[#F5F3EF] transition-colors duration-200 relative overflow-x-hidden">
      <PaperGrainOverlay />

      {/* هالة ضوئية دافئة في خلفية الصفحات العليا (Soft Editorial Vignette) */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute top-0 inset-x-0 z-0 editorial-top-vignette transition-opacity duration-500 ${
          currentPage === 'home' || currentPage === 'article-detail'
            ? 'h-[620px] sm:h-[720px] opacity-100'
            : 'h-[420px] sm:h-[480px] opacity-75'
        }`}
      />

      <Header
        currentPage={currentPage}
        selectedCategorySlug={selectedCategorySlug}
        onNavigate={handleNavigate}
        onSelectArticle={handleSelectArticle}
        isDark={isDark}
        onToggleDark={() => setIsDark((d) => !d)}
        isSearchOpen={isSearchOpen}
        onToggleSearch={() => setIsSearchOpen((s) => !s)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchResults={searchResults}
        bookmarkedCount={bookmarkedIds.length}
        onScrollToNewsletter={handleScrollToNewsletter}
        siteConfig={siteConfig}
      />

      <main className="flex-1 relative z-10">
        {currentPage === 'home' && (
          <HomePage
            articles={allArticles}
            onSelectArticle={handleSelectArticle}
            onNavigate={handleNavigate}
            onSelectWriterBlog={handleSelectWriterBlog}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={handleToggleBookmark}
            siteConfig={siteConfig}
          />
        )}

        {currentPage === 'blogs' && (
          <BlogsPage
            articles={allArticles}
            selectedWriterSlug={selectedWriterSlug}
            onSelectWriter={handleSelectWriterBlog}
            onSelectArticle={handleSelectArticle}
            onSelectCategory={(catSlug) => handleNavigate('categories', catSlug)}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={handleToggleBookmark}
            siteConfig={siteConfig}
          />
        )}

        {currentPage === 'article-detail' &&
          (activeArticle ? (
            <ArticlePage
              article={activeArticle}
              relatedArticles={relatedArticles}
              onBack={() => handleNavigate('home', null)}
              onSelectArticle={handleSelectArticle}
              onSelectCategory={(catSlug) => handleNavigate('categories', catSlug)}
              onSelectWriterBlog={handleSelectWriterBlog}
              isBookmarked={bookmarkedIds.includes(activeArticle.id)}
              bookmarkedIds={bookmarkedIds}
              onToggleBookmark={handleToggleBookmark}
              siteConfig={siteConfig}
            />
          ) : !isCloudArticlesLoaded ? (
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-20 text-center">
              <p className="font-prose text-[18px] text-[#78736A] dark:text-[#8A847A]">
                جاري تحميل المقال...
              </p>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
              <div className="rounded-[24px] bg-[#EFECE6]/60 dark:bg-[#1D1B19] p-10 text-center border border-[#E6E2D8] dark:border-[#2A2724]">
                <p className="font-prose text-[20px] font-bold text-[#141413] dark:text-[#F5F3EF]">
                  المقال المطلوب غير متوفر حالياً
                </p>
                <p className="font-prose mt-2 text-[15.5px] text-[#78736A] dark:text-[#8A847A]">
                  ربما تم نقل المقال أو حذفه، أو أن الرابط غير مكتمل.
                </p>
                <a
                  href="#/"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigate('home', null);
                  }}
                  className="font-ui inline-block mt-6 rounded-xl bg-[#141413] dark:bg-[#F5F3EF] px-5 py-2.5 text-[14.5px] font-bold text-[#F9F7F2] dark:text-[#141413]"
                >
                  العودة إلى الصفحة الرئيسية
                </a>
              </div>
            </div>
          ))}

        {currentPage === 'articles' && (
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
            <div className="pb-6 border-b border-[#E6E2D8] dark:border-[#2A2724]">
              <div className="flex items-center gap-3">
                <ArticlesShelfIcon className="w-7 h-7 text-[#141413] dark:text-[#F5F3EF]" />
                <h1 className="font-display text-[28px] sm:text-[36px] font-bold text-[#141413] dark:text-[#F5F3EF]">
                  جميع المقالات
                </h1>
              </div>
              <p className="font-prose mt-2.5 text-[16.5px] text-[#4A4742] dark:text-[#B8B3AA]">
                الأرشيف الكامل لجميع مقالات وأطروحات كُتّاب منصة {siteConfig.siteName} مرتبةً من الأحدث إلى الأقدم.
              </p>

              {/* تصفية سريعة بالتصنيف داخل صفحة المقالات بروابط هاش */}
              <div className="font-ui mt-6 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                <a
                  href="#/articles"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSelectCategoryInPage(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-[14.5px] transition-colors whitespace-nowrap shrink-0 ${
                    selectedCategorySlug === null
                      ? 'bg-[#EFECE6] dark:bg-[#23201D] font-bold text-[#141413] dark:text-[#F5F3EF]'
                      : 'font-medium text-[#57534E] dark:text-[#A8A29E] hover:text-[#141413] dark:hover:text-[#F5F3EF]'
                  }`}
                >
                  الكل ({allArticles.length})
                </a>
                {activeCategories.map((cat) => (
                  <a
                    key={cat.id}
                    href={`#/articles/${cat.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleSelectCategoryInPage(cat.slug);
                    }}
                    className={`px-4 py-2 rounded-xl text-[14.5px] transition-colors whitespace-nowrap shrink-0 ${
                      selectedCategorySlug === cat.slug
                        ? 'bg-[#EFECE6] dark:bg-[#23201D] font-bold text-[#141413] dark:text-[#F5F3EF]'
                        : 'font-medium text-[#57534E] dark:text-[#A8A29E] hover:text-[#141413] dark:hover:text-[#F5F3EF]'
                    }`}
                  >
                    {cat.name}
                  </a>
                ))}
              </div>
            </div>

            <div className="divide-y divide-[#E6E2D8] dark:divide-[#2A2724] pt-4">
              {(selectedCategorySlug
                ? allArticles.filter((a) => a.categorySlug === selectedCategorySlug)
                : allArticles
              ).map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  variant="horizontal"
                  onSelectArticle={handleSelectArticle}
                  onSelectCategory={(catSlug) => handleNavigate('categories', catSlug)}
                  isBookmarked={bookmarkedIds.includes(article.id)}
                  onToggleBookmark={handleToggleBookmark}
                />
              ))}
            </div>
          </div>
        )}

        {currentPage === 'categories' && (
          <CategoriesPage
            articles={allArticles}
            selectedCategorySlug={selectedCategorySlug}
            onSelectCategory={handleSelectCategoryInPage}
            onSelectArticle={handleSelectArticle}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={handleToggleBookmark}
            siteConfig={siteConfig}
          />
        )}

        {currentPage === 'about' && (
          <AboutPage onNavigate={handleNavigate} siteConfig={siteConfig} />
        )}

        {currentPage === 'bookmarks' && (
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
            <div className="pb-6 border-b border-[#E6E2D8] dark:border-[#2A2724]">
              <div className="flex items-center gap-3">
                <Bookmark className="w-7 h-7 text-[#E05324]" />
                <h1 className="font-display text-[28px] sm:text-[36px] font-bold text-[#141413] dark:text-[#F5F3EF]">
                  قائمة القراءة المحفوظة
                </h1>
              </div>
              <p className="font-prose mt-2.5 text-[16.5px] text-[#4A4742] dark:text-[#B8B3AA]">
                المقالات التي حفظتها على جهازك للعودة إلى قراءتها ومراجعتها في وقت لاحق.
              </p>
            </div>

            {bookmarkedArticles.length > 0 ? (
              <div className="divide-y divide-[#E6E2D8] dark:divide-[#2A2724] pt-4">
                {bookmarkedArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    variant="horizontal"
                    onSelectArticle={handleSelectArticle}
                    onSelectCategory={(catSlug) => handleNavigate('categories', catSlug)}
                    isBookmarked={true}
                    onToggleBookmark={handleToggleBookmark}
                  />
                ))}
              </div>
            ) : (
              <div className="my-12 rounded-[24px] bg-[#EFECE6]/60 dark:bg-[#1D1B19] p-10 text-center">
                <p className="font-prose text-[18px] font-bold text-[#141413] dark:text-[#F5F3EF]">
                  قائمة القراءة فارغة حالياً
                </p>
                <p className="font-prose mt-2 text-[15px] text-[#78736A] dark:text-[#8A847A]">
                  اضغط على أيقونة الحفظ بجانب أي مقال لإضافته إلى قائمتك الخاصة.
                </p>
                <a
                  href="#/"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigate('home', null);
                  }}
                  className="font-ui inline-block mt-6 rounded-xl bg-[#141413] dark:bg-[#F5F3EF] px-5 py-2.5 text-[14.5px] font-bold text-[#F9F7F2] dark:text-[#141413]"
                >
                  تصفّح أحدث المقالات
                </a>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer
        onNavigate={handleNavigate}
        onSecretStudioTrigger={handleSecretStudioTrigger}
        siteConfig={siteConfig}
      />

      {/* نافذة التحقق من كلمة المرور عبر SHA-256 ثم عرض الخيارات الثلاثة (محرر الكتابة | تحرير محتوى الموقع | إدارة) */}
      <StudioAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        totalArticlesCount={siteArticles.length}
        onSelectMode={(selectedMode) => {
          setIsAuthModalOpen(false);
          setStudioMode(selectedMode);
          setIsStudioOpen(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
