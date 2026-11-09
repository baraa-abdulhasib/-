import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Users,
  FolderKanban,
  Palette,
  ShieldCheck,
  TrendingUp,
  Eye,
  BookOpen,
  Award,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Upload,
  RotateCcw,
  Layout,
  Sparkles,
  LogOut,
  Globe,
  Mail,
  Cloud,
} from 'lucide-react';
import { Article, Category, SeriesItem, WriterBlog } from '../data/articles';
import { ARTICLE_ARTWORKS, WRITER_AVATARS } from '../data/artwork';
import {
  SiteAnalytics,
  SiteConfig,
  loadSiteAnalytics,
  saveSiteConfig,
} from '../utils/siteConfig';
import { setStudioSessionActive } from '../utils/studioAuth';
import {
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  collection,
  ContactMessageItem,
  db,
  deleteContactMessageFromFirestore,
  doc,
  handleFirestoreError,
  isCurrentUserAdmin,
  markContactMessageReadInFirestore,
  onAuthStateChanged,
  onSnapshot,
  OperationType,
  signInAdminWithGoogle,
  signOutAdmin,
  User,
} from '../firebase';

interface SiteAdminPanelProps {
  siteConfig: SiteConfig;
  onUpdateSiteConfig: (nextConfig: SiteConfig) => void;
  onResetSiteConfig: () => void;
  articles: Article[];
  onUpdateArticle: (article: Article) => void;
  onEditArticleInStudio: (article: Article) => void;
  onPreviewArticle: (slug: string) => void;
  bookmarkedIds: string[];
  onCloseStudio: () => void;
}

type AdminSubTab =
  | 'analytics'
  | 'writers'
  | 'categories-series'
  | 'branding-layout'
  | 'security';

const AVATAR_PRESETS = [
  { id: 'baraa', label: 'هوية الكاتب ١ (برتقالي دافئ)', src: WRITER_AVATARS.baraa },
  { id: 'emerald', label: 'هوية الكاتب ٢ (أخضر زمردي)', src: WRITER_AVATARS.emerald },
  { id: 'navy', label: 'هوية الكاتب ٣ (كحلي معرفي)', src: WRITER_AVATARS.navy },
  { id: 'gold', label: 'هوية الكاتب ٤ (ذهبي تقني)', src: WRITER_AVATARS.gold },
];

const ARTWORK_PRESETS = [
  { id: 'maqasid', label: 'ميزان المقاصد والكليات', src: ARTICLE_ARTWORKS.maqasidHero },
  { id: 'silence', label: 'الخلوة والسكينة', src: ARTICLE_ARTWORKS.digitalSilence },
  { id: 'ai', label: 'فقه النوازل والخوارزميات', src: ARTICLE_ARTWORKS.fiqhAi },
  { id: 'turath', label: 'المخطوطات والتراث الأصولي', src: ARTICLE_ARTWORKS.shatibiTurath },
  { id: 'economy', label: 'العدل والاقتصاد الإسلامي', src: ARTICLE_ARTWORKS.islamicEconomy },
  { id: 'lang', label: 'البيان واللسان العربي', src: ARTICLE_ARTWORKS.languageIdentity },
  { id: 'family', label: 'الميثاق والأسرة', src: ARTICLE_ARTWORKS.familyValues },
  { id: 'usul', label: 'بوصلة أصول الفهم', src: ARTICLE_ARTWORKS.usulUnderstanding },
];

export const SiteAdminPanel: React.FC<SiteAdminPanelProps> = ({
  siteConfig,
  onUpdateSiteConfig,
  onResetSiteConfig,
  articles,
  onUpdateArticle,
  onEditArticleInStudio,
  onPreviewArticle,
  bookmarkedIds,
  onCloseStudio,
}) => {
  const [subTab, setSubTab] = useState<AdminSubTab>('analytics');
  const [analytics, setAnalytics] = useState<SiteAnalytics>(() => loadSiteAnalytics());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(() => auth.currentUser);
  const [contactMessages, setContactMessages] = useState<ContactMessageItem[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
    });

    const unsubAnalytics = onSnapshot(
      doc(db, 'site_analytics', 'main'),
      (snap) => {
        if (snap.exists()) {
          const rawData = snap.data() as Partial<SiteAnalytics>;
          setAnalytics((prev) => ({
            ...prev,
            ...rawData,
            dailyStats: Array.isArray(rawData.dailyStats) ? rawData.dailyStats : prev.dailyStats,
            articleViews: rawData.articleViews || {},
            articleReadsCompleted: rawData.articleReadsCompleted || {},
            writerVisits: rawData.writerVisits || {},
            categoryVisits: rawData.categoryVisits || {},
            trafficSources: rawData.trafficSources || prev.trafficSources,
          }));
        }
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.GET, 'site_analytics/main');
        } catch {
          // ignore
        }
      }
    );

    return () => {
      unsubAuth();
      unsubAnalytics();
    };
  }, []);

  useEffect(() => {
    if (!isCurrentUserAdmin(firebaseUser)) {
      setContactMessages([]);
      return;
    }
    const unsubMessages = onSnapshot(
      collection(db, 'contact_messages'),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as ContactMessageItem);
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setContactMessages(list);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'contact_messages');
        } catch {
          // ignore
        }
      }
    );
    return () => unsubMessages();
  }, [firebaseUser]);

  // ==================== 1. حسابات الإحصائيات والنظرة العامة ====================
  const totalWordsCount = useMemo(() => {
    return articles.reduce((sum, art) => {
      const blocksText = art.content
        .map((b) => {
          if (b.type === 'paragraph' || b.type === 'heading' || b.type === 'quote') return b.text;
          if (b.type === 'list') return b.items.join(' ');
          return '';
        })
        .join(' ');
      const words = blocksText.trim().split(/\s+/).filter(Boolean).length;
      return sum + words;
    }, 0);
  }, [articles]);

  const avgReadingMinutes = useMemo(() => {
    if (articles.length === 0) return 0;
    const sum = articles.reduce((acc, a) => acc + (a.readingTimeMinutes || 5), 0);
    return Math.round((sum / articles.length) * 10) / 10;
  }, [articles]);

  // ترتيب الكُتّاب حسب عدد الزيارات والقراءات
  const rankedWriters = useMemo(() => {
    return siteConfig.writers
      .map((writer) => {
        const writerArticles = articles.filter(
          (a) => a.authorSlug === writer.slug || a.author.name === writer.name
        );
        const articleReadsSum = writerArticles.reduce(
          (sum, a) => sum + (analytics.articleViews[a.slug] || 0),
          0
        );
        const directBlogVisits = analytics.writerVisits[writer.slug] || 0;
        const combinedVisits = Math.max(directBlogVisits, articleReadsSum);

        return {
          writer,
          articlesCount: writerArticles.length,
          visits: combinedVisits,
          articleReadsSum,
        };
      })
      .sort((a, b) => b.visits - a.visits);
  }, [siteConfig.writers, articles, analytics]);

  // ترتيب المقالات الأكثر قراءةً
  const rankedArticles = useMemo(() => {
    return [...articles]
      .map((art) => {
        const views = analytics.articleViews[art.slug] || 0;
        const rawCompleted = analytics.articleReadsCompleted[art.slug] || 0;
        const completion = views > 0 ? Math.min(100, Math.round((rawCompleted / views) * 100)) : Math.min(100, rawCompleted);
        return {
          article: art,
          views,
          completion,
          isBookmarked: bookmarkedIds.includes(art.id),
        };
      })
      .sort((a, b) => b.views - a.views);
  }, [articles, analytics, bookmarkedIds]);

  const totalArticleReads = useMemo(
    () => rankedArticles.reduce((sum, item) => sum + item.views, 0),
    [rankedArticles]
  );

  // إحصائيات التصنيفات
  const rankedCategories = useMemo(() => {
    return siteConfig.categories
      .map((cat) => {
        const catArticles = articles.filter((a) => a.categorySlug === cat.slug);
        const views =
          analytics.categoryVisits[cat.slug] ||
          catArticles.reduce((s, a) => s + (analytics.articleViews[a.slug] || 0), 0);
        return {
          category: cat,
          articlesCount: catArticles.length,
          views,
        };
      })
      .sort((a, b) => b.views - a.views);
  }, [siteConfig.categories, articles, analytics]);

  // مؤشرات محسوبة فعلياً من بيانات الزيارات (بدون أرقام ثابتة أو تقديرية)
  const todayVisits = useMemo(() => {
    const labels = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const todayLabel = labels[new Date().getDay()];
    return analytics.dailyStats.find((d) => d.dayLabel === todayLabel)?.visits || 0;
  }, [analytics.dailyStats]);

  const totalCompletedReads = useMemo(
    () =>
      Object.values(analytics.articleReadsCompleted || {}).reduce(
        (sum, n) => sum + (Number(n) || 0),
        0
      ),
    [analytics.articleReadsCompleted]
  );

  const trafficPct = useMemo(() => {
    const src = analytics.trafficSources || { direct: 0, search: 0, social: 0, referral: 0 };
    const total = (src.direct || 0) + (src.search || 0) + (src.social || 0) + (src.referral || 0);
    const pct = (n: number) => (total > 0 ? Math.round(((n || 0) / total) * 100) : 0);
    return {
      total,
      direct: pct(src.direct),
      search: pct(src.search),
      socialReferral: pct((src.social || 0) + (src.referral || 0)),
    };
  }, [analytics.trafficSources]);

  // ==================== 2. حالة إدارة الكُتّاب والمدونات ====================
  const [editingWriter, setEditingWriter] = useState<WriterBlog | null>(null);
  const [isAddingWriter, setIsAddingWriter] = useState(false);
  const [writerForm, setWriterForm] = useState<{
    name: string;
    slug: string;
    blogTitle: string;
    blogTopic: string;
    role: string;
    bio: string;
    topicsText: string;
    location: string;
    avatar: string;
  }>({
    name: '',
    slug: '',
    blogTitle: '',
    blogTopic: '',
    role: '',
    bio: '',
    topicsText: '',
    location: '',
    avatar: WRITER_AVATARS.baraa,
  });

  const openAddWriterModal = () => {
    setEditingWriter(null);
    setWriterForm({
      name: '',
      slug: '',
      blogTitle: '',
      blogTopic: '',
      role: '',
      bio: '',
      topicsText: '',
      location: '',
      avatar: WRITER_AVATARS.emerald,
    });
    setIsAddingWriter(true);
  };

  const openEditWriterModal = (w: WriterBlog) => {
    setIsAddingWriter(false);
    setEditingWriter(w);
    setWriterForm({
      name: w.name,
      slug: w.slug,
      blogTitle: w.blogTitle,
      blogTopic: w.blogTopic,
      role: w.role,
      bio: w.bio,
      topicsText: w.topics.join('، '),
      location: w.location || '',
      avatar: w.avatar,
    });
  };

  const handleWriterAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setWriterForm((prev) => ({ ...prev, avatar: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveWriterForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!writerForm.name.trim() || !writerForm.blogTitle.trim()) return;

    const cleanSlug =
      writerForm.slug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF-_]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '') || `writer-${Date.now().toString().slice(-4)}`;

    if (
      siteConfig.writers.some(
        (w) => w.slug === cleanSlug && (!editingWriter || w.id !== editingWriter.id)
      )
    ) {
      showToast('هذا المعرّف (slug) مستخدم بالفعل لكاتب آخر');
      return;
    }

    const topics = writerForm.topicsText
      .split(/[،,]/)
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingWriter) {
      const updatedWriter: WriterBlog = {
        ...editingWriter,
        name: writerForm.name.trim(),
        slug: cleanSlug,
        blogTitle: writerForm.blogTitle.trim(),
        blogTopic: writerForm.blogTopic.trim() || writerForm.role.trim(),
        role: writerForm.role.trim(),
        bio: writerForm.bio.trim(),
        topics: topics.length > 0 ? topics : ['الشريعة والحياة'],
        location: writerForm.location.trim(),
        avatar: writerForm.avatar,
      };

      const nextWriters = siteConfig.writers.map((w) =>
        w.id === editingWriter.id ? updatedWriter : w
      );
      const nextDefaultWriterSlug =
        siteConfig.defaultWriterSlug === editingWriter.slug
          ? updatedWriter.slug
          : siteConfig.defaultWriterSlug;
      onUpdateSiteConfig({
        ...siteConfig,
        writers: nextWriters,
        defaultWriterSlug: nextDefaultWriterSlug,
      });
      articles.forEach((art) => {
        const artWriterSlug = art.authorSlug || art.author.slug;
        if (artWriterSlug === editingWriter.slug) {
          onUpdateArticle({
            ...art,
            authorSlug: updatedWriter.slug,
            blogTitle: updatedWriter.blogTitle,
            author: {
              ...art.author,
              slug: updatedWriter.slug,
              name: updatedWriter.name,
              role: updatedWriter.role,
              bio: updatedWriter.bio,
              avatar: updatedWriter.avatar,
            },
          });
        }
      });
      setEditingWriter(null);
      showToast(`تم تحديث بيانات «${updatedWriter.blogTitle}» بنجاح`);
    } else {
      const newWriter: WriterBlog = {
        id: `writer-${Date.now()}`,
        slug: cleanSlug,
        name: writerForm.name.trim(),
        blogTitle: writerForm.blogTitle.trim(),
        blogTopic: writerForm.blogTopic.trim() || writerForm.role.trim(),
        role: writerForm.role.trim() || 'كاتب وباحث في منصة بصائر',
        bio: writerForm.bio.trim() || 'كاتب وباحث مشارك في منصة بصائر.',
        topics: topics.length > 0 ? topics : ['الفكر الإسلامي', 'الشريعة والحياة'],
        location: writerForm.location.trim(),
        avatar: writerForm.avatar,
        verified: false,
      };

      onUpdateSiteConfig({
        ...siteConfig,
        writers: [...siteConfig.writers, newWriter],
      });
      setIsAddingWriter(false);
      showToast(`تمت إضافة «${newWriter.blogTitle}» إلى منصة بصائر`);
    }
  };

  const handleMoveWriter = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= siteConfig.writers.length) return;
    const copy = [...siteConfig.writers];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    onUpdateSiteConfig({ ...siteConfig, writers: copy });
  };

  const handleDeleteWriter = (writerId: string) => {
    if (siteConfig.writers.length <= 1) {
      showToast('يجب بقاء كاتب واحد على الأقل في المنصة');
      return;
    }
    const next = siteConfig.writers.filter((w) => w.id !== writerId);
    onUpdateSiteConfig({ ...siteConfig, writers: next });
    showToast('تم حذف المدونة من قائمة الكُتّاب');
  };

  // ==================== 3. حالة إدارة التصنيفات والسلاسل ====================
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [catForm, setCatForm] = useState({
    name: '',
    slug: '',
    shortDesc: '',
    description: '',
    accentColor: '#E05324',
  });

  const openAddCategory = () => {
    setEditingCategory(null);
    setCatForm({
      name: '',
      slug: '',
      shortDesc: '',
      description: '',
      accentColor: '#E05324',
    });
    setIsAddingCategory(true);
  };

  const openEditCategory = (cat: Category) => {
    setIsAddingCategory(false);
    setEditingCategory(cat);
    setCatForm({
      name: cat.name,
      slug: cat.slug,
      shortDesc: cat.shortDesc,
      description: cat.description,
      accentColor: cat.accentColor || '#E05324',
    });
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name.trim()) return;
    const cleanSlug =
      catForm.slug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF-_]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '') || `cat-${Date.now().toString().slice(-4)}`;

    if (
      siteConfig.categories.some(
        (c) => c.slug === cleanSlug && (!editingCategory || c.id !== editingCategory.id)
      )
    ) {
      showToast('هذا المعرّف (slug) مستخدم بالفعل لتصنيف آخر');
      return;
    }

    if (editingCategory) {
      const nextCats = siteConfig.categories.map((c) =>
        c.id === editingCategory.id
          ? {
              ...editingCategory,
              name: catForm.name.trim(),
              slug: cleanSlug,
              shortDesc: catForm.shortDesc.trim(),
              description: catForm.description.trim(),
              accentColor: catForm.accentColor,
            }
          : c
      );
      const nextSeries = siteConfig.series.map((s) =>
        s.categorySlug === editingCategory.slug ? { ...s, categorySlug: cleanSlug } : s
      );
      onUpdateSiteConfig({ ...siteConfig, categories: nextCats, series: nextSeries });
      articles.forEach((art) => {
        if (art.categorySlug === editingCategory.slug) {
          onUpdateArticle({
            ...art,
            categorySlug: cleanSlug,
            categoryName: catForm.name.trim(),
          });
        }
      });
      setEditingCategory(null);
      showToast('تم تحديث التصنيف الموضوعي');
    } else {
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        slug: cleanSlug,
        name: catForm.name.trim(),
        shortDesc: catForm.shortDesc.trim() || 'مباحث ومقالات متخصصة',
        description:
          catForm.description.trim() ||
          'باب موضوعي يُعنى بالمقالات الرصينة والدراسات المتأنية في هذا المجال.',
        accentColor: catForm.accentColor,
      };
      onUpdateSiteConfig({
        ...siteConfig,
        categories: [...siteConfig.categories, newCat],
      });
      setIsAddingCategory(false);
      showToast('تمت إضافة التصنيف الجديد بنجاح');
    }
  };

  const handleDeleteCategory = (catId: string) => {
    if (siteConfig.categories.length <= 1) return;
    onUpdateSiteConfig({
      ...siteConfig,
      categories: siteConfig.categories.filter((c) => c.id !== catId),
    });
    showToast('تم حذف التصنيف');
  };

  // إدارة السلاسل المعرفية
  const [editingSeries, setEditingSeries] = useState<SeriesItem | null>(null);
  const [isAddingSeries, setIsAddingSeries] = useState(false);
  const [seriesForm, setSeriesForm] = useState({
    title: '',
    subtitle: '',
    categorySlug: siteConfig.categories[0]?.slug || 'maqasid',
    countLabel: '',
    badgeText: '',
    coverArt: ARTICLE_ARTWORKS.maqasidHero,
  });

  const openAddSeries = () => {
    setEditingSeries(null);
    setSeriesForm({
      title: '',
      subtitle: '',
      categorySlug: siteConfig.categories[0]?.slug || 'maqasid',
      countLabel: '',
      badgeText: '',
      coverArt: ARTICLE_ARTWORKS.shatibiTurath,
    });
    setIsAddingSeries(true);
  };

  const openEditSeries = (s: SeriesItem) => {
    setIsAddingSeries(false);
    setEditingSeries(s);
    setSeriesForm({
      title: s.title,
      subtitle: s.subtitle,
      categorySlug: s.categorySlug,
      countLabel: s.countLabel,
      badgeText: s.badgeText || '',
      coverArt: s.coverArt,
    });
  };

  const handleSaveSeries = (e: React.FormEvent) => {
    e.preventDefault();
    if (!seriesForm.title.trim()) return;
    if (editingSeries) {
      const next = siteConfig.series.map((s) =>
        s.id === editingSeries.id
          ? {
              ...editingSeries,
              title: seriesForm.title.trim(),
              subtitle: seriesForm.subtitle.trim(),
              categorySlug: seriesForm.categorySlug,
              countLabel: seriesForm.countLabel.trim(),
              badgeText: seriesForm.badgeText.trim() || undefined,
              coverArt: seriesForm.coverArt,
            }
          : s
      );
      onUpdateSiteConfig({ ...siteConfig, series: next });
      setEditingSeries(null);
      showToast('تم تحديث السلسلة المعرفية');
    } else {
      const newSeries: SeriesItem = {
        id: `series-${Date.now()}`,
        title: seriesForm.title.trim(),
        subtitle: seriesForm.subtitle.trim(),
        categorySlug: seriesForm.categorySlug,
        countLabel: seriesForm.countLabel.trim() || 'سلسلة معرفية',
        badgeText: seriesForm.badgeText.trim() || undefined,
        coverArt: seriesForm.coverArt,
      };
      onUpdateSiteConfig({
        ...siteConfig,
        series: [...siteConfig.series, newSeries],
      });
      setIsAddingSeries(false);
      showToast('تمت إضافة السلسلة المعرفية إلى الرئيسية');
    }
  };

  const handleDeleteSeries = (id: string) => {
    onUpdateSiteConfig({
      ...siteConfig,
      series: siteConfig.series.filter((s) => s.id !== id),
    });
    showToast('تم حذف السلسلة المعرفية');
  };

  const navTabs: { id: AdminSubTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'analytics',
      label: 'النظرة العامة والإحصائيات',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'writers',
      label: `الكُتّاب والمدوّنات (${siteConfig.writers.length})`,
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'categories-series',
      label: 'التصنيفات والسلاسل',
      icon: <FolderKanban className="w-4 h-4" />,
    },
    {
      id: 'branding-layout',
      label: 'الهوية والواجهة والنصوص',
      icon: <Palette className="w-4 h-4" />,
    },
    {
      id: 'security',
      label: 'الأمان وحساب المشرف',
      icon: <ShieldCheck className="w-4 h-4" />,
    },
  ];

  const maxDailyVisit = Math.max(
    ...analytics.dailyStats.map((d) => d.visits),
    100
  );

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-8 pb-24">
      {/* إشعار عائم */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2.5 rounded-2xl bg-[#142822] text-[#F9F7F2] px-5 py-3.5 text-[14px] font-ui font-bold shadow-xl border border-[#F5B800]/30 animate-fadeIn">
          <Check className="w-4 h-4 text-[#F5B800]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* رأس لوحة الإدارة */}
      <div className="rounded-[26px] border border-[#E6E2D8] dark:border-[#2A2724] bg-white dark:bg-[#191816] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E6E2D8] dark:border-[#2A2724]">
          <div>
            <div className="font-ui inline-flex items-center gap-2 rounded-full bg-[#E05324]/10 px-3 py-1 text-[12px] font-bold text-[#E05324] dark:text-[#F06438] mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>لوحة الإدارة المركزية • منصة {siteConfig.brandWordmark}</span>
            </div>
            <h1 className="font-display text-[26px] sm:text-[34px] font-bold text-[#141413] dark:text-[#F5F3EF]">
              إدارة الموقع والإحصائيات الشاملة
            </h1>
            <p className="font-prose mt-1 text-[15.5px] text-[#4A4742] dark:text-[#B8B3AA]">
              تحكم كامل في مدونات الكُتّاب، الأبواب الموضوعية، هوية الموقع، ومتابعة دقيقة لزيارات القراء وأكثر المقالات قراءةً.
            </p>
          </div>

          <div className="font-ui flex flex-wrap items-center gap-2.5 shrink-0">
            {isCurrentUserAdmin(firebaseUser) ? (
              <span className="inline-flex items-center gap-2 rounded-xl bg-[#142822] text-[#F5B800] px-3.5 py-2.5 text-[12.5px] font-bold">
                <Cloud className="w-4 h-4" />
                <span>متصل سحابياً بـ Firebase ({firebaseUser?.email})</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  try {
                    const user = await signInAdminWithGoogle();
                    if (isCurrentUserAdmin(user)) {
                      showToast('تم الاتصال سحابياً بـ Firebase بنجاح');
                    } else {
                      await signOutAdmin();
                      showToast('هذا الحساب غير مصرح له كمشرف');
                    }
                  } catch {
                    showToast('تعذر تسجيل الدخول عبر جوجل');
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#E05324] px-4 py-2.5 text-[13px] font-bold text-white hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Cloud className="w-4 h-4" />
                <span>ربط حساب Google لتفعيل المزامنة السحابية</span>
              </button>
            )}
            <button
              type="button"
              onClick={onCloseStudio}
              className="inline-flex items-center gap-2 rounded-xl bg-[#141413] dark:bg-[#F5F3EF] px-4 py-2.5 text-[13.5px] font-bold text-[#F9F7F2] dark:text-[#141413] hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>معاينة الموقع الحي</span>
            </button>
          </div>
        </div>

        {/* شريط التبويبات الفرعية للإدارة */}
        <div className="font-ui mt-6 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {navTabs.map((tab) => {
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[14px] font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#E05324] text-white shadow-xs'
                    : 'bg-[#F4F1EA] dark:bg-[#22201D] text-[#57534E] dark:text-[#A8A29E] hover:text-[#141413] dark:hover:text-[#F5F3EF]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================== محتوى التبويب الأول: النظرة العامة وإحصائيات المحتوى والزيارات ==================== */}
      {subTab === 'analytics' && (
        <div className="mt-8 space-y-8">
          {/* 1. بطاقات المؤشرات الكبرى (6 بطاقات) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* إجمالي الزيارات */}
            <div className="rounded-[22px] border border-[#E6E2D8] dark:border-[#2A2724] bg-white dark:bg-[#191816] p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <span className="font-ui text-[13.5px] font-bold text-[#78736A] dark:text-[#8A847A]">
                  إجمالي زيارات الموقع
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E05324]/10 text-[#E05324]">
                  <Globe className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="font-ui text-[30px] sm:text-[34px] font-extrabold text-[#141413] dark:text-[#F5F3EF] tabular-nums">
                  {analytics.totalSiteVisits.toLocaleString('ar-EG')}
                </span>
                <span className="font-ui inline-flex items-center gap-1 rounded-lg bg-[#142822]/10 dark:bg-[#F5B800]/15 px-2 py-0.5 text-[12px] font-bold text-[#1E6B4E] dark:text-[#F5B800]">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {todayVisits.toLocaleString('ar-EG')} زيارة اليوم
                </span>
              </div>
              <p className="font-ui mt-2 text-[12.5px] text-[#78736A]">
                الجلسات الفريدة: {analytics.uniqueVisitors.toLocaleString('ar-EG')} جلسة
              </p>
            </div>

            {/* إجمالي قراءات المقالات */}
            <div className="rounded-[22px] border border-[#E6E2D8] dark:border-[#2A2724] bg-white dark:bg-[#191816] p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <span className="font-ui text-[13.5px] font-bold text-[#78736A] dark:text-[#8A847A]">
                  إجمالي قراءات المقالات
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5B800]/15 text-[#B88600] dark:text-[#F5B800]">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="font-ui text-[30px] sm:text-[34px] font-extrabold text-[#141413] dark:text-[#F5F3EF] tabular-nums">
                  {totalArticleReads.toLocaleString('ar-EG')}
                </span>
                <span className="font-ui text-[12.5px] font-bold text-[#E05324]">
                  {totalArticleReads > 0 ? Math.min(100, Math.round((totalCompletedReads / totalArticleReads) * 100)) : 0}٪ معدل إتمام القراءة
                </span>
              </div>
              <p className="font-ui mt-2 text-[12.5px] text-[#78736A]">
                قراءات مكتملة (بلغت ٩٠٪ من المقال): {totalCompletedReads.toLocaleString('ar-EG')}
              </p>
            </div>

            {/* حجم المحتوى والمدونات */}
            <div className="rounded-[22px] border border-[#E6E2D8] dark:border-[#2A2724] bg-white dark:bg-[#191816] p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <span className="font-ui text-[13.5px] font-bold text-[#78736A] dark:text-[#8A847A]">
                  رصيد المحتوى والمدوّنات
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#141413]/10 dark:bg-white/10 text-[#141413] dark:text-[#F5F3EF]">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="font-ui text-[30px] sm:text-[34px] font-extrabold text-[#141413] dark:text-[#F5F3EF] tabular-nums">
                  {articles.length} مقالاً
                </span>
                <span className="font-ui text-[13px] font-bold text-[#78736A]">
                  في {siteConfig.writers.length} مدوّنات
                </span>
              </div>
              <p className="font-ui mt-2 text-[12.5px] text-[#78736A]">
                إجمالي الكلمات: {totalWordsCount.toLocaleString('ar-EG')} كلمة • متوسط {avgReadingMinutes} د/مقال
              </p>
            </div>
          </div>

          {/* 2. أكثر الكُتّاب والمدونات زيارةً + مخطط حركة الزيارات الأسبوعية */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* أكثر الكُتّاب زيارةً */}
            <div className="lg:col-span-7 rounded-[24px] border border-[#E6E2D8] dark:border-[#2A2724] bg-white dark:bg-[#191816] p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-display text-[20px] sm:text-[22px] font-bold text-[#141413] dark:text-[#F5F3EF]">
                    أكثر الكُتّاب والمدوّنات زيارةً
                  </h2>
                  <p className="font-ui text-[13px] text-[#78736A] mt-0.5">
                    ترتيب مدونات بصائر حسب إجمالي زيارات القراء وتفاعلهم مع مقالات كل كاتب
                  </p>
                </div>
                <Users className="w-5 h-5 text-[#E05324]" />
              </div>

              <div className="space-y-4">
                {rankedWriters.map((item, idx) => {
                  const topVisits = rankedWriters[0]?.visits || 1;
                  const barWidth = Math.max(12, Math.round((item.visits / topVisits) * 100));

                  return (
                    <div
                      key={item.writer.id}
                      className="rounded-2xl border border-[#E6E2D8]/80 dark:border-[#2A2724] bg-[#FAF9F5] dark:bg-[#141311] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`font-ui flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12.5px] font-extrabold tabular-nums ${
                              idx === 0
                                ? 'bg-[#F5B800] text-[#141413]'
                                : idx === 1
                                ? 'bg-[#E05324] text-white'
                                : 'bg-[#EFECE6] dark:bg-[#252320] text-[#57534E] dark:text-[#A8A29E]'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <img
                            src={item.writer.avatar}
                            alt={item.writer.name}
                            className="h-11 w-11 rounded-full object-cover ring-2 ring-black/5 dark:ring-white/10 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-display text-[16.5px] font-bold text-[#141413] dark:text-[#F5F3EF] truncate">
                                {item.writer.blogTitle}
                              </h3>
                              {idx === 0 && (
                                <span className="font-ui rounded-md bg-[#F5B800]/20 px-2 py-0.5 text-[10.5px] font-bold text-[#9A6B00] dark:text-[#F5B800]">
                                  الأعلى زيارةً
                                </span>
                              )}
                            </div>
                            <p className="font-ui text-[12.5px] text-[#E05324] dark:text-[#F06438] font-bold truncate">
                              {item.writer.name} • {item.articlesCount} مقالات منشورة
                            </p>
                          </div>
                        </div>

                        <div className="text-left shrink-0 font-ui">
                          <div className="text-[17px] font-extrabold text-[#141413] dark:text-[#F5F3EF] tabular-nums">
                            {item.visits.toLocaleString('ar-EG')}
                          </div>
                          <div className="text-[11.5px] text-[#78736A]">زيارة وقراءة</div>
                        </div>
                      </div>

                      {/* شريط النسبة */}
                      <div className="mt-3 flex items-center gap-3">
                        <div className="h-2 flex-1 rounded-full bg-[#E6E2D8] dark:bg-[#2A2724] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-l from-[#E05324] to-[#F5B800]"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* حركة الزيارات اليومية ومصادر الزيارات */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* الرسم البياني لحركة الزيارات خلال 7 أيام */}
              <div className="rounded-[24px] border border-[#E6E2D8] dark:border-[#2A2724] bg-white dark:bg-[#191816] p-6 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-display text-[19px] font-bold text-[#141413] dark:text-[#F5F3EF]">
                      حركة الزيارات خلال الأسبوع
                    </h2>
                    <p className="font-ui text-[12.5px] text-[#78736A]">
                      معدل الزيارات اليومية (تتحدث تلقائياً مع تصفح الموقع)
                    </p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-[#1E6B4E] dark:text-[#F5B800]" />
                </div>

                <div className="mt-6 grid grid-cols-7 gap-2 items-end h-40 pt-4 px-1 border-b border-[#E6E2D8] dark:border-[#2A2724]">
                  {analytics.dailyStats.map((day) => {
                    const heightPct = Math.max(
                      18,
                      Math.round((day.visits / maxDailyVisit) * 100)
                    );
                    return (
                      <div
                        key={day.dateKey}
                        className="flex flex-col items-center justify-end h-full group"
                      >
                        <span className="font-ui text-[10.5px] font-bold text-[#78736A] group-hover:text-[#E05324] mb-1 tabular-nums">
                          {day.visits}
                        </span>
                        <div
                          className="w-full max-w-[28px] rounded-t-lg bg-[#141413] dark:bg-[#F5F3EF] group-hover:bg-[#E05324] transition-all"
                          style={{ height: `${heightPct}%` }}
                          title={`${day.dayLabel}: ${day.visits} زيارة`}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-7 gap-2 pt-2 text-center">
                  {analytics.dailyStats.map((day) => (
                    <span
                      key={day.dateKey}
                      className="font-ui text-[11px] font-bold text-[#78736A] truncate"
                    >
                      {day.dayLabel}
                    </span>
                  ))}
                </div>
              </div>

              {/* مصادر الزيارات والاشتراكات */}
              <div className="rounded-[24px] border border-[#E6E2D8] dark:border-[#2A2724] bg-white dark:bg-[#191816] p-6">
                <h3 className="font-display text-[18px] font-bold text-[#141413] dark:text-[#F5F3EF] mb-3">
                  مصادر وصول القراء إلى بصائر
                </h3>
                <div className="space-y-3 font-ui text-[13px]">
                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span>الوصول المباشر والمرجعيات المحفوظة</span>
                      <span className="tabular-nums">{trafficPct.direct}٪</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#EFECE6] dark:bg-[#2A2724]">
                      <div
                        className="h-full rounded-full bg-[#141413] dark:bg-[#F5F3EF]"
                        style={{ width: `${trafficPct.direct}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span>محركات البحث (Google & الباحث العلمي)</span>
                      <span className="tabular-nums">{trafficPct.search}٪</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#EFECE6] dark:bg-[#2A2724]">
                      <div
                        className="h-full rounded-full bg-[#E05324]"
                        style={{ width: `${trafficPct.search}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span>منصات التواصل والنشرات البريدية</span>
                      <span className="tabular-nums">
                        {trafficPct.socialReferral}٪
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#EFECE6] dark:bg-[#2A2724]">
                      <div
                        className="h-full rounded-full bg-[#F5B800]"
                        style={{
                          width: `${trafficPct.socialReferral}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. جدول أكثر المقالات قراءةً وتفاعلاً في الموقع */}
          <div className="rounded-[24px] border border-[#E6E2D8] dark:border-[#2A2724] bg-white dark:bg-[#191816] p-6 sm:p-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="font-display text-[22px] sm:text-[24px] font-bold text-[#141413] dark:text-[#F5F3EF]">
                  أكثر المقالات قراءةً في بصائر
                </h2>
                <p className="font-ui text-[13.5px] text-[#78736A] mt-0.5">
                  قائمة بجميع مقالات الموقع مرتبةً حسب عدد القراءات الفعلي ومعدل إتمام القراءة
                </p>
              </div>
              <div className="font-ui text-[13px] font-bold text-[#E05324]">
                إجمالي المقالات النشطة: {rankedArticles.length}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-[#E6E2D8] dark:border-[#2A2724] font-ui text-[12.5px] font-bold text-[#78736A]">
                    <th className="py-3 pr-2 pl-3">#</th>
                    <th className="py-3 px-3">المقال</th>
                    <th className="py-3 px-3">المدونة والكاتب</th>
                    <th className="py-3 px-3">الباب الموضوعي</th>
                    <th className="py-3 px-3">عدد القراءات</th>
                    <th className="py-3 px-3">إتمام القراءة</th>
                    <th className="py-3 pl-2 pr-3">إجراءات سريعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E2D8]/70 dark:divide-[#2A2724] font-ui text-[14px]">
                  {rankedArticles.map((item, idx) => (
                    <tr
                      key={item.article.id}
                      className="hover:bg-[#FAF9F5] dark:hover:bg-[#141311] transition-colors"
                    >
                      <td className="py-4 pr-2 pl-3 font-extrabold tabular-nums text-[#78736A]">
                        {idx + 1}
                      </td>
                      <td className="py-4 px-3 max-w-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.article.coverImage}
                            alt={item.article.title}
                            className="h-10 w-12 rounded-lg object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-prose font-bold text-[15px] text-[#141413] dark:text-[#F5F3EF] line-clamp-1">
                              {item.article.title}
                            </p>
                            <span className="text-[12px] text-[#78736A]">
                              {item.article.publishedAt} • {item.article.readingTimeMinutes} د للقراءة
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <div className="font-bold text-[#141413] dark:text-[#F5F3EF]">
                          {item.article.blogTitle || `مدونة ${item.article.author.name}`}
                        </div>
                        <div className="text-[12px] text-[#E05324]">{item.article.author.name}</div>
                      </td>
                      <td className="py-4 px-3">
                        <span className="inline-block rounded-lg bg-[#EFECE6] dark:bg-[#252320] px-2.5 py-1 text-[12px] font-bold">
                          {item.article.categoryName}
                        </span>
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[15.5px] text-[#141413] dark:text-[#F5F3EF] tabular-nums">
                            {item.views.toLocaleString('ar-EG')}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 rounded-full bg-[#EFECE6] dark:bg-[#2A2724] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#1E6B4E] dark:bg-[#F5B800]"
                              style={{ width: `${item.completion}%` }}
                            />
                          </div>
                          <span className="text-[12.5px] font-bold tabular-nums">
                            {item.completion}٪
                          </span>
                        </div>
                      </td>
                      <td className="py-4 pl-2 pr-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEditArticleInStudio(item.article)}
                            className="rounded-lg bg-[#EFECE6] dark:bg-[#252320] px-2.5 py-1.5 text-[12px] font-bold text-[#141413] dark:text-[#F5F3EF] hover:bg-[#E05324] hover:text-white transition-colors cursor-pointer"
                          >
                            تحرير
                          </button>
                          <button
                            type="button"
                            onClick={() => onPreviewArticle(item.article.slug)}
                            className="rounded-lg border border-[#E6E2D8] dark:border-[#2A2724] px-2.5 py-1.5 text-[12px] font-bold text-[#78736A] hover:text-[#141413] dark:hover:text-[#F5F3EF] transition-colors cursor-pointer"
                          >
                            عرض
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. توزيع القراءات حسب الأبواب الموضوعية */}
          <div className="rounded-[24px] border border-[#E6E2D8] dark:border-[#2A2724] bg-white dark:bg-[#191816] p-6">
            <h2 className="font-display text-[20px] font-bold text-[#141413] dark:text-[#F5F3EF] mb-4">
              توزيع الزيارات والمقالات حسب الأبواب الموضوعية
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {rankedCategories.map((item) => (
                <div
                  key={item.category.id}
                  className="rounded-2xl border border-[#E6E2D8] dark:border-[#2A2724] bg-[#FAF9F5] dark:bg-[#141311] p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[16px] font-bold text-[#141413] dark:text-[#F5F3EF]">
                      {item.category.name}
                    </span>
                    <span className="font-ui rounded-full bg-[#E05324]/10 px-2 py-0.5 text-[11.5px] font-bold text-[#E05324]">
                      {item.articlesCount} مقال
                    </span>
                  </div>
                  <div className="font-ui mt-3 text-[20px] font-extrabold text-[#141413] dark:text-[#F5F3EF] tabular-nums">
                    {item.views.toLocaleString('ar-EG')}
                  </div>
                  <div className="font-ui text-[12px] text-[#78736A]">قراءة وزيارة للباب</div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. المراسلات والمداخلات العلمية الواردة من صفحة «عن بصائر» (Firebase Firestore) */}
          <div className="rounded-[24px] border border-[#E6E2D8] dark:border-[#2A2724] bg-white dark:bg-[#191816] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Mail className="w-5 h-5 text-[#E05324]" />
                <h2 className="font-display text-[20px] font-bold text-[#141413] dark:text-[#F5F3EF]">
                  المراسلات والمداخلات العلمية الواردة ({contactMessages.length})
                </h2>
              </div>
              <span className="font-ui text-[12px] text-[#78736A]">
                تصل مباشرة من نموذج صفحة «عن بصائر» عبر Firebase
              </span>
            </div>

            {!isCurrentUserAdmin(firebaseUser) ? (
              <div className="rounded-2xl bg-[#FAF9F5] dark:bg-[#141311] p-6 text-center font-ui text-[14px] text-[#78736A]">
                يرجى الضغط على زر «ربط حساب Google لتفعيل المزامنة السحابية» أعلى اللوحة لعرض رسائل الزوار المشفرة والخاصة بالمشرف.
              </div>
            ) : contactMessages.length === 0 ? (
              <div className="rounded-2xl bg-[#FAF9F5] dark:bg-[#141311] p-6 text-center font-ui text-[14px] text-[#78736A]">
                لا توجد رسائل واردة حالياً.
              </div>
            ) : (
              <div className="space-y-3">
                {contactMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-2xl border p-4 transition-colors ${
                      msg.read
                        ? 'border-[#E6E2D8] dark:border-[#2A2724] bg-[#FAF9F5]/60 dark:bg-[#141311]'
                        : 'border-[#E05324]/40 bg-[#E05324]/5 dark:bg-[#E05324]/10'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2 font-ui">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[15px] text-[#141413] dark:text-[#F5F3EF]">
                          {msg.name}
                        </span>
                        <span dir="ltr" className="text-[12.5px] text-[#E05324]">
                          ({msg.email})
                        </span>
                        {!msg.read && (
                          <span className="rounded-full bg-[#E05324] px-2 py-0.5 text-[10.5px] font-bold text-white">
                            جديد
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            markContactMessageReadInFirestore(msg.id, msg, !msg.read).catch(
                              () => {}
                            )
                          }
                          className="rounded-lg border border-[#E6E2D8] dark:border-[#2A2724] px-2.5 py-1 text-[12px] font-bold text-[#78736A] hover:text-[#141413] dark:hover:text-[#F5F3EF] cursor-pointer"
                        >
                          {msg.read ? 'تحديد كغير مقروء' : 'تحديد كمقروء'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            deleteContactMessageFromFirestore(msg.id).catch(() => {})
                          }
                          className="rounded-lg border border-red-500/30 px-2.5 py-1 text-[12px] font-bold text-red-600 hover:bg-red-500/10 cursor-pointer"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                    <p className="font-prose text-[15px] leading-[1.75] text-[#141413] dark:text-[#F5F3EF] whitespace-pre-wrap">
                      {msg.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== محتوى التبويب الثاني: إدارة الكُتّاب والمدوّنات ==================== */}
      {subTab === 'writers' && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[22px] border border-[#E6E2D8] dark:border-[#2A2724] bg-white dark:bg-[#191816] p-6">
            <div>
              <h2 className="font-display text-[22px] font-bold text-[#141413] dark:text-[#F5F3EF]">
                إدارة كُتّاب بصائر ومدوّناتهم المستقلة
              </h2>
              <p className="font-prose mt-1 text-[15px] text-[#4A4742] dark:text-[#B8B3AA]">
                أضف كُتّاباً جدداً، أو عدّل اسم أي مدونة وصورتها ونبذتها، أو رتّب ظهورهم في الصفحة الرئيسية.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddWriterModal}
              className="font-ui inline-flex items-center gap-2 rounded-xl bg-[#E05324] px-5 py-3 text-[14px] font-bold text-white hover:bg-[#c94519] transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة كاتب ومدونة جديدة</span>
            </button>
          </div>

          {/* نموذج إضافة / تعديل كاتب */}
          {(isAddingWriter || editingWriter) && (
            <form
              onSubmit={handleSaveWriterForm}
              className="rounded-[24px] border-2 border-[#E05324] bg-white dark:bg-[#191816] p-6 sm:p-8 shadow-lg space-y-5"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#E6E2D8] dark:border-[#2A2724]">
                <h3 className="font-display text-[20px] font-bold text-[#141413] dark:text-[#F5F3EF]">
                  {editingWriter
                    ? `تعديل مدونة: ${editingWriter.blogTitle}`
                    : 'إضافة كاتب ومدونة جديدة في بصائر'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingWriter(false);
                    setEditingWriter(null);
                  }}
                  className="rounded-lg p-1.5 text-[#78736A] hover:bg-[#EFECE6]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-ui">
                <div>
                  <label className="block text-[13px] font-bold mb-1.5">اسم الكاتب *</label>
                  <input
                    type="text"
                    required
                    value={writerForm.name}
                    onChange={(e) => setWriterForm({ ...writerForm, name: e.target.value })}
                    placeholder="مثال: د. محمد الشنقيطي"
                    className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-[#F9F7F2] dark:bg-[#121110] px-4 py-2.5 text-[14.5px]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold mb-1.5">اسم المدونة الخاصة به *</label>
                  <input
                    type="text"
                    required
                    value={writerForm.blogTitle}
                    onChange={(e) => setWriterForm({ ...writerForm, blogTitle: e.target.value })}
                    placeholder="مثال: مدونة آفاق العمران"
                    className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-[#F9F7F2] dark:bg-[#121110] px-4 py-2.5 text-[14.5px]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold mb-1.5">المسمى العلمي / التخصص</label>
                  <input
                    type="text"
                    value={writerForm.role}
                    onChange={(e) => setWriterForm({ ...writerForm, role: e.target.value })}
                    placeholder="مثال: باحث في أصول الفقه ومقاصد الشريعة"
                    className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-[#F9F7F2] dark:bg-[#121110] px-4 py-2.5 text-[14.5px]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold mb-1.5">
                    المعرّف في الرابط (Slug بالإنجليزية)
                  </label>
                  <input
                    type="text"
                    value={writerForm.slug}
                    onChange={(e) => setWriterForm({ ...writerForm, slug: e.target.value })}
                    placeholder="مثال: shanqiti"
                    dir="ltr"
                    className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-[#F9F7F2] dark:bg-[#121110] px-4 py-2.5 text-[14.5px] text-left"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold mb-1.5">
                    الموضوعات والوسوم (مفصولة بفاصلة)
                  </label>
                  <input
                    type="text"
                    value={writerForm.topicsText}
                    onChange={(e) => setWriterForm({ ...writerForm, topicsText: e.target.value })}
                    placeholder="مقاصد الشريعة، فقه الواقع، التزكية"
                    className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-[#F9F7F2] dark:bg-[#121110] px-4 py-2.5 text-[14.5px]"
                  />
                </div>
              </div>

              <div className="font-ui">
                <label className="block text-[13px] font-bold mb-1.5">النبذة التعريفية بالكاتب ومدونته</label>
                <textarea
                  rows={3}
                  value={writerForm.bio}
                  onChange={(e) => setWriterForm({ ...writerForm, bio: e.target.value })}
                  placeholder="نبذة موجزة تظهر في صفحة المدونة وأسفل مقالات الكاتب..."
                  className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-[#F9F7F2] dark:bg-[#121110] px-4 py-2.5 text-[14.5px]"
                />
              </div>

              {/* اختيار الصورة الرمزية للكاتب */}
              <div className="font-ui">
                <label className="block text-[13px] font-bold mb-2">الصورة الرمزية للكاتب</label>
                <div className="flex flex-wrap items-center gap-4">
                  <img
                    src={writerForm.avatar}
                    alt="معاينة"
                    className="h-16 w-16 rounded-full object-cover ring-2 ring-[#E05324]"
                  />
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setWriterForm({ ...writerForm, avatar: preset.src })}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[12.5px] font-bold transition-all ${
                          writerForm.avatar === preset.src
                            ? 'border-[#E05324] bg-[#E05324]/10 text-[#E05324]'
                            : 'border-[#D6CEBE] dark:border-[#332F2B]'
                        }`}
                      >
                        <img src={preset.src} alt="" className="w-5 h-5 rounded-full" />
                        <span>{preset.label}</span>
                      </button>
                    ))}
                    <label className="inline-flex items-center gap-1.5 rounded-xl bg-[#EFECE6] dark:bg-[#252320] px-3 py-1.5 text-[12.5px] font-bold cursor-pointer hover:bg-[#E05324] hover:text-white transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>رفع صورة من جهازك</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleWriterAvatarUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 font-ui">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingWriter(false);
                    setEditingWriter(null);
                  }}
                  className="rounded-xl px-4 py-2.5 text-[14px] font-bold text-[#78736A] hover:bg-[#EFECE6]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#141413] dark:bg-[#F5F3EF] px-6 py-2.5 text-[14px] font-bold text-[#F9F7F2] dark:text-[#141413] hover:opacity-90 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingWriter ? 'حفظ التعديلات' : 'إضافة الكاتب والمدونة'}</span>
                </button>
              </div>
            </form>
          )}

          {/* قائمة الكُتّاب والمدونات الحالية */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {siteConfig.writers.map((writer, idx) => {
              const count = articles.filter(
                (a) => a.authorSlug === writer.slug || a.author.name === writer.name
              ).length;
              const isDefault = siteConfig.defaultWriterSlug === writer.slug;

              return (
                <div
                  key={writer.id}
                  className="rounded-[24px] border border-[#E6E2D8] dark:border-[#2A2724] bg-white dark:bg-[#191816] p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={writer.avatar}
                          alt={writer.name}
                          className="h-14 w-14 rounded-full object-cover ring-2 ring-[#E05324]/30"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display text-[19px] font-bold text-[#141413] dark:text-[#F5F3EF]">
                              {writer.blogTitle}
                            </h3>
                            {isDefault && (
                              <span className="font-ui rounded-md bg-[#F5B800]/20 px-2 py-0.5 text-[11px] font-bold text-[#9A6B00] dark:text-[#F5B800]">
                                الكاتب الافتراضي
                              </span>
                            )}
                          </div>
                          <p className="font-ui text-[13.5px] font-bold text-[#E05324]">
                            {writer.name} • <span className="text-[#78736A]">#/{writer.slug}</span>
                          </p>
                          <p className="font-ui text-[12px] text-[#78736A]">{writer.role}</p>
                        </div>
                      </div>

                      {/* أزرار الترتيب */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveWriter(idx, 'up')}
                          disabled={idx === 0}
                          title="تحريك للأعلى"
                          className="rounded-lg p-1.5 text-[#78736A] hover:bg-[#EFECE6] disabled:opacity-30"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveWriter(idx, 'down')}
                          disabled={idx === siteConfig.writers.length - 1}
                          title="تحريك للأسفل"
                          className="rounded-lg p-1.5 text-[#78736A] hover:bg-[#EFECE6] disabled:opacity-30"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="font-prose mt-3.5 text-[14.5px] leading-[1.7] text-[#4A4742] dark:text-[#B8B3AA] line-clamp-2">
                      {writer.bio}
                    </p>
                  </div>

                  <div className="font-ui mt-5 pt-4 border-t border-[#E6E2D8] dark:border-[#2A2724] flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[12.5px] font-bold text-[#78736A]">
                      {count} مقالات منشورة
                    </span>

                    <div className="flex items-center gap-2">
                      {!isDefault && (
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateSiteConfig({
                              ...siteConfig,
                              defaultWriterSlug: writer.slug,
                            });
                            showToast(`تم تعيين «${writer.name}» كاتباً افتراضياً في المحرر`);
                          }}
                          className="rounded-lg bg-[#EFECE6] dark:bg-[#252320] px-2.5 py-1.5 text-[12px] font-bold text-[#57534E] dark:text-[#A8A29E] hover:text-[#141413]"
                        >
                          تعيين افتراضياً
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openEditWriterModal(writer)}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#141413] dark:bg-[#F5F3EF] px-3 py-1.5 text-[12px] font-bold text-[#F9F7F2] dark:text-[#141413] cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>تعديل</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteWriter(writer.id)}
                        className="rounded-lg p-1.5 text-[#78736A] hover:bg-[#E05324]/10 hover:text-[#E05324]"
                        title="حذف المدونة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== محتوى التبويب الثالث: إدارة التصنيفات والسلاسل المعرفية ==================== */}
      {subTab === 'categories-series' && (
        <div className="mt-8 space-y-10">
          {/* أ. التصنيفات الموضوعية */}
          <div className="rounded-[24px] border border-[#E6E2D8] dark:border-[#2A2724] bg-white dark:bg-[#191816] p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-display text-[22px] font-bold text-[#141413] dark:text-[#F5F3EF]">
                  الأبواب والتصنيفات الموضوعية ({siteConfig.categories.length})
                </h2>
                <p className="font-prose text-[14.5px] text-[#78736A] mt-0.5">
                  تظهر هذه الأبواب في شريط التصفح، وفي صفحة التصنيفات، وفي التذييل.
                </p>
              </div>
              <button
                type="button"
                onClick={openAddCategory}
                className="font-ui inline-flex items-center gap-2 rounded-xl bg-[#E05324] px-4 py-2.5 text-[13.5px] font-bold text-white hover:bg-[#c94519] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة باب موضوعي جديد</span>
              </button>
            </div>

            {(isAddingCategory || editingCategory) && (
              <form
                onSubmit={handleSaveCategory}
                className="mb-6 rounded-2xl border-2 border-[#E05324] bg-[#FAF9F5] dark:bg-[#141311] p-5 space-y-4 font-ui"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-bold mb-1">اسم التصنيف *</label>
                    <input
                      type="text"
                      required
                      value={catForm.name}
                      onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                      placeholder="مثال: السيرة والتاريخ"
                      className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-white dark:bg-[#191816] px-3.5 py-2 text-[14px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold mb-1">المعرّف (Slug)</label>
                    <input
                      type="text"
                      value={catForm.slug}
                      onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
                      placeholder="history"
                      dir="ltr"
                      className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-white dark:bg-[#191816] px-3.5 py-2 text-[14px] text-left"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-bold mb-1">الوصف المختصر</label>
                  <input
                    type="text"
                    value={catForm.shortDesc}
                    onChange={(e) => setCatForm({ ...catForm, shortDesc: e.target.value })}
                    placeholder="وصف من سطر واحد يظهر في البطاقات..."
                    className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-white dark:bg-[#191816] px-3.5 py-2 text-[14px]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold mb-1">الوصف التفصيلي للباب</label>
                  <textarea
                    rows={2}
                    value={catForm.description}
                    onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                    className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-white dark:bg-[#191816] px-3.5 py-2 text-[14px]"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCategory(false);
                      setEditingCategory(null);
                    }}
                    className="rounded-xl px-4 py-2 text-[13.5px] font-bold text-[#78736A]"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#141413] dark:bg-[#F5F3EF] px-5 py-2 text-[13.5px] font-bold text-[#F9F7F2] dark:text-[#141413]"
                  >
                    حفظ التصنيف
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {siteConfig.categories.map((cat) => (
                <div
                  key={cat.id}
                  className="rounded-2xl border border-[#E6E2D8] dark:border-[#2A2724] bg-[#FAF9F5] dark:bg-[#141311] p-4 flex items-start justify-between gap-3"
                >
                  <div>
                    <h3 className="font-display text-[17px] font-bold text-[#141413] dark:text-[#F5F3EF]">
                      {cat.name}
                    </h3>
                    <p className="font-prose text-[13.5px] text-[#78736A] mt-1">{cat.shortDesc}</p>
                  </div>
                  <div className="font-ui flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditCategory(cat)}
                      className="rounded-lg bg-[#EFECE6] dark:bg-[#252320] px-2.5 py-1.5 text-[12px] font-bold hover:bg-[#E05324] hover:text-white transition-colors"
                    >
                      تعديل
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="rounded-lg p-1.5 text-[#78736A] hover:text-[#E05324]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ب. السلاسل المعرفية المميزة */}
          <div className="rounded-[24px] border border-[#E6E2D8] dark:border-[#2A2724] bg-white dark:bg-[#191816] p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-display text-[22px] font-bold text-[#141413] dark:text-[#F5F3EF]">
                  السلاسل المعرفية المميزة ({siteConfig.series.length})
                </h2>
                <p className="font-prose text-[14.5px] text-[#78736A] mt-0.5">
                  البطاقات الفنية المربعة التي تظهر في قسم «سلاسل معرفية مميزة» بالصفحة الرئيسية.
                </p>
              </div>
              <button
                type="button"
                onClick={openAddSeries}
                className="font-ui inline-flex items-center gap-2 rounded-xl bg-[#141413] dark:bg-[#F5F3EF] px-4 py-2.5 text-[13.5px] font-bold text-[#F9F7F2] dark:text-[#141413] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة سلسلة جديدة</span>
              </button>
            </div>

            {(isAddingSeries || editingSeries) && (
              <form
                onSubmit={handleSaveSeries}
                className="mb-6 rounded-2xl border-2 border-[#E05324] bg-[#FAF9F5] dark:bg-[#141311] p-5 space-y-4 font-ui"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-bold mb-1">عنوان السلسلة *</label>
                    <input
                      type="text"
                      required
                      value={seriesForm.title}
                      onChange={(e) => setSeriesForm({ ...seriesForm, title: e.target.value })}
                      className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-white dark:bg-[#191816] px-3.5 py-2 text-[14px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold mb-1">التصنيف المرتبط</label>
                    <select
                      value={seriesForm.categorySlug}
                      onChange={(e) =>
                        setSeriesForm({ ...seriesForm, categorySlug: e.target.value })
                      }
                      className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-white dark:bg-[#191816] px-3.5 py-2 text-[14px]"
                    >
                      {siteConfig.categories.map((c) => (
                        <option key={c.id} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold mb-1">وسم العدد (يُستبدل تلقائياً بعدد المقالات المنشورة في السلسلة)</label>
                    <input
                      type="text"
                      value={seriesForm.countLabel}
                      onChange={(e) => setSeriesForm({ ...seriesForm, countLabel: e.target.value })}
                      placeholder="سلسلة من ٦ أجزاء"
                      className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-white dark:bg-[#191816] px-3.5 py-2 text-[14px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold mb-1">الشارة الصفراء (اختياري)</label>
                    <input
                      type="text"
                      value={seriesForm.badgeText}
                      onChange={(e) => setSeriesForm({ ...seriesForm, badgeText: e.target.value })}
                      placeholder="مثال: زاوية خاصة"
                      className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-white dark:bg-[#191816] px-3.5 py-2 text-[14px]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-bold mb-1">الوصف المختصر للسلسلة</label>
                  <input
                    type="text"
                    value={seriesForm.subtitle}
                    onChange={(e) => setSeriesForm({ ...seriesForm, subtitle: e.target.value })}
                    className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-white dark:bg-[#191816] px-3.5 py-2 text-[14px]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold mb-2">اللوحة الفنية للسلسلة</label>
                  <div className="flex flex-wrap gap-2">
                    {ARTWORK_PRESETS.map((art) => (
                      <button
                        key={art.id}
                        type="button"
                        onClick={() => setSeriesForm({ ...seriesForm, coverArt: art.src })}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[12px] font-bold ${
                          seriesForm.coverArt === art.src
                            ? 'border-[#E05324] bg-[#E05324]/10 text-[#E05324]'
                            : 'border-[#D6CEBE] dark:border-[#332F2B]'
                        }`}
                      >
                        <img src={art.src} alt="" className="w-6 h-6 rounded-md object-cover" />
                        <span>{art.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingSeries(false);
                      setEditingSeries(null);
                    }}
                    className="rounded-xl px-4 py-2 text-[13.5px] font-bold text-[#78736A]"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#E05324] px-5 py-2 text-[13.5px] font-bold text-white"
                  >
                    حفظ السلسلة
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {siteConfig.series.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-[#E6E2D8] dark:border-[#2A2724] overflow-hidden bg-[#141413] text-white flex flex-col justify-between"
                >
                  <div className="relative h-36">
                    <img
                      src={s.coverArt}
                      alt={s.title}
                      className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                    <div className="absolute bottom-3 right-3 left-3">
                      <span className="font-ui text-[11px] font-bold text-[#F5B800]">
                        {(() => {
                          const n = articles.filter(
                            (a) => (a.seriesName || '').trim() === s.title.trim()
                          ).length;
                          return n > 0 ? `${n.toLocaleString('ar-EG')} مقالات منشورة` : s.countLabel;
                        })()}
                      </span>
                      <h4 className="font-display text-[17px] font-bold">{s.title}</h4>
                    </div>
                  </div>
                  <div className="p-3 bg-[#1D1B19] flex items-center justify-between font-ui text-[12px]">
                    <button
                      type="button"
                      onClick={() => openEditSeries(s)}
                      className="font-bold text-[#F5B800] hover:underline"
                    >
                      تعديل السلسلة
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSeries(s.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== محتوى التبويب الرابع: الهوية والنصوص والواجهة ==================== */}
      {subTab === 'branding-layout' && (
        <div className="mt-8 space-y-8">
          {/* 1. التحكم في أقسام الصفحة الرئيسية والمقال المثبت */}
          <div className="rounded-[24px] border border-[#E6E2D8] dark:border-[#2A2724] bg-white dark:bg-[#191816] p-6 sm:p-8">
            <div className="flex items-center gap-2.5 mb-5">
              <Layout className="w-5 h-5 text-[#E05324]" />
              <h2 className="font-display text-[22px] font-bold text-[#141413] dark:text-[#F5F3EF]">
                تخصيص الواجهة الرئيسية وترتيب الأقسام
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-ui">
              <div>
                <label className="block text-[13.5px] font-bold mb-2">
                  المقال الرئيسي المثبّت في أعلى الصفحة (Hero Featured)
                </label>
                <select
                  value={(articles.find((a) => a.isFeatured) || articles[0])?.id || ''}
                  onChange={(e) => {
                    const target = articles.find((a) => a.id === e.target.value);
                    if (target) {
                      onUpdateArticle({ ...target, isFeatured: true });
                      showToast(`تم تثبيت «${target.title}» كمقال رئيسي في الأعلى`);
                    }
                  }}
                  className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-[#F9F7F2] dark:bg-[#121110] px-4 py-3 text-[14px] font-bold"
                >
                  {articles.map((art) => (
                    <option key={art.id} value={art.id}>
                      {art.title} ({art.author.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[13.5px] font-bold mb-2">
                  نمط العرض الافتراضي لقائمة المقالات الجديدة
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateSiteConfig({
                        ...siteConfig,
                        defaultArticlesViewMode: 'horizontal',
                      });
                      showToast('تم اعتماد العرض الأفقي كوضع افتراضي');
                    }}
                    className={`rounded-xl border py-3 px-4 text-[13.5px] font-bold transition-all cursor-pointer ${
                      siteConfig.defaultArticlesViewMode === 'horizontal'
                        ? 'border-[#E05324] bg-[#E05324]/10 text-[#E05324]'
                        : 'border-[#D6CEBE] dark:border-[#332F2B]'
                    }`}
                  >
                    عرض القائمة الأفقية
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateSiteConfig({
                        ...siteConfig,
                        defaultArticlesViewMode: 'grid',
                      });
                      showToast('تم اعتماد عرض الشبكة كوضع افتراضي');
                    }}
                    className={`rounded-xl border py-3 px-4 text-[13.5px] font-bold transition-all cursor-pointer ${
                      siteConfig.defaultArticlesViewMode === 'grid'
                        ? 'border-[#E05324] bg-[#E05324]/10 text-[#E05324]'
                        : 'border-[#D6CEBE] dark:border-[#332F2B]'
                    }`}
                  >
                    عرض البطاقات الشبكية
                  </button>
                </div>
              </div>
            </div>

            {/* مفاتيح إظهار وإخفاء أقسام الصفحة الرئيسية */}
            <div className="mt-6 pt-6 border-t border-[#E6E2D8] dark:border-[#2A2724] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-ui">
              {[
                {
                  key: 'showHeroSection' as const,
                  label: 'قسم المقال المميز (Hero)',
                },
                {
                  key: 'showWritersShelf' as const,
                  label: 'رف كُتّاب بصائر ومدوناتهم',
                },
                {
                  key: 'showSeriesSection' as const,
                  label: 'قسم السلاسل المعرفية',
                },
                {
                  key: 'showNewsletterSection' as const,
                  label: 'قسم مجتمع بصائر (تليجرام)',
                },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center justify-between rounded-2xl border border-[#E6E2D8] dark:border-[#2A2724] bg-[#FAF9F5] dark:bg-[#141311] p-4 cursor-pointer"
                >
                  <span className="text-[13.5px] font-bold">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={siteConfig[item.key]}
                    onChange={(e) => {
                      onUpdateSiteConfig({
                        ...siteConfig,
                        [item.key]: e.target.checked,
                      });
                    }}
                    className="h-5 w-5 accent-[#E05324] rounded cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* 2. الهوية النصية للمنصة والترويسة والتذييل */}
          <div className="rounded-[24px] border border-[#E6E2D8] dark:border-[#2A2724] bg-white dark:bg-[#191816] p-6 sm:p-8 space-y-5 font-ui">
            <h2 className="font-display text-[22px] font-bold text-[#141413] dark:text-[#F5F3EF]">
              هوية المنصة ونصوص الترويسة والتذييل
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-bold mb-1.5">
                  الاسم والشعار النصي في الأعلى (Brand Wordmark)
                </label>
                <input
                  type="text"
                  value={siteConfig.brandWordmark}
                  onChange={(e) =>
                    onUpdateSiteConfig({
                      ...siteConfig,
                      brandWordmark: e.target.value,
                      siteName: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-[#F9F7F2] dark:bg-[#121110] px-4 py-2.5 text-[15px] font-bold"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold mb-1.5">
                  الوصف الفرعي بجانب الشعار (Tagline)
                </label>
                <input
                  type="text"
                  value={siteConfig.tagline}
                  onChange={(e) =>
                    onUpdateSiteConfig({ ...siteConfig, tagline: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-[#F9F7F2] dark:bg-[#121110] px-4 py-2.5 text-[14.5px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-bold mb-1.5">
                الوصف التعريفي العام للمنصة (يظهر في التذييل)
              </label>
              <textarea
                rows={2}
                value={siteConfig.subtitle}
                onChange={(e) =>
                  onUpdateSiteConfig({ ...siteConfig, subtitle: e.target.value })
                }
                className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-[#F9F7F2] dark:bg-[#121110] px-4 py-2.5 text-[14.5px]"
              />
            </div>

            {/* نصوص وروابط قسم مجتمع بصائر (قناة تليجرام والمنصات المستقبلية) */}
            <div className="pt-5 border-t border-[#E6E2D8] dark:border-[#2A2724] space-y-4">
              <div>
                <h3 className="font-display text-[19px] font-bold text-[#141413] dark:text-[#F5F3EF]">
                  قسم «مجتمع بصائر» وقنوات المتابعة (تليجرام والمنصات)
                </h3>
                <p className="font-prose text-[13.5px] text-[#78736A] mt-0.5">
                  تظهر هذه البطاقة أسفل الصفحة وعند النقر على زر «اشتراك» في الأعلى.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold mb-1.5">
                    الشارة العلوية الذهبية
                  </label>
                  <input
                    type="text"
                    value={siteConfig.newsletterBadge}
                    onChange={(e) =>
                      onUpdateSiteConfig({ ...siteConfig, newsletterBadge: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-[#F9F7F2] dark:bg-[#121110] px-4 py-2.5 text-[14px]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold mb-1.5">
                    العنوان الرئيسي للبطاقة
                  </label>
                  <input
                    type="text"
                    value={siteConfig.newsletterHeading}
                    onChange={(e) =>
                      onUpdateSiteConfig({ ...siteConfig, newsletterHeading: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-[#F9F7F2] dark:bg-[#121110] px-4 py-2.5 text-[14px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold mb-1.5">
                  الوصف التعريفي أسفل العنوان
                </label>
                <textarea
                  rows={2}
                  value={siteConfig.newsletterDescription}
                  onChange={(e) =>
                    onUpdateSiteConfig({ ...siteConfig, newsletterDescription: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-[#F9F7F2] dark:bg-[#121110] px-4 py-2.5 text-[14px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold mb-1.5">
                    رابط قناة التليجرام الرسمية (Telegram URL)
                  </label>
                  <input
                    type="url"
                    dir="ltr"
                    value={siteConfig.telegramUrl ?? ''}
                    onChange={(e) =>
                      onUpdateSiteConfig({ ...siteConfig, telegramUrl: e.target.value })
                    }
                    placeholder="https://t.me/اسم_قناتك (اتركه فارغاً لإخفاء زر تليجرام)"
                    className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-[#F9F7F2] dark:bg-[#121110] px-4 py-2.5 text-[14px] text-left"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold mb-1.5">
                    نص زر الانضمام إلى تليجرام
                  </label>
                  <input
                    type="text"
                    value={siteConfig.telegramButtonText || 'انضم إلى قناة بصائر على تليجرام'}
                    onChange={(e) =>
                      onUpdateSiteConfig({ ...siteConfig, telegramButtonText: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-[#F9F7F2] dark:bg-[#121110] px-4 py-2.5 text-[14px]"
                  />
                </div>
              </div>

              {/* المنصات الإضافية المستقبلية */}
              <div className="rounded-2xl border border-[#E6E2D8] dark:border-[#2A2724] bg-[#FAF9F5] dark:bg-[#141311] p-4 space-y-3">
                <p className="text-[13px] font-bold text-[#141413] dark:text-[#F5F3EF]">
                  منصات التواصل الإضافية (اختيارية — لا تظهر في الموقع إلا عند تفعيلها ووضع الرابط):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* منصة X */}
                  <div className="rounded-xl border border-[#E6E2D8] dark:border-[#2A2724] bg-white dark:bg-[#191816] p-3 space-y-2">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-[13px] font-bold">منصة X (تويتر)</span>
                      <input
                        type="checkbox"
                        checked={Boolean(siteConfig.xEnabled)}
                        onChange={(e) =>
                          onUpdateSiteConfig({ ...siteConfig, xEnabled: e.target.checked })
                        }
                        className="h-4 w-4 accent-[#E05324] rounded cursor-pointer"
                      />
                    </label>
                    <input
                      type="url"
                      dir="ltr"
                      value={siteConfig.xUrl || ''}
                      onChange={(e) =>
                        onUpdateSiteConfig({ ...siteConfig, xUrl: e.target.value })
                      }
                      placeholder="https://x.com/BasairPlatform"
                      className="w-full rounded-lg border border-[#D6CEBE] dark:border-[#332F2B] bg-[#F9F7F2] dark:bg-[#121110] px-3 py-1.5 text-[13px] text-left"
                    />
                  </div>

                  {/* فيسبوك */}
                  <div className="rounded-xl border border-[#E6E2D8] dark:border-[#2A2724] bg-white dark:bg-[#191816] p-3 space-y-2">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-[13px] font-bold">صفحة فيسبوك</span>
                      <input
                        type="checkbox"
                        checked={Boolean(siteConfig.facebookEnabled)}
                        onChange={(e) =>
                          onUpdateSiteConfig({ ...siteConfig, facebookEnabled: e.target.checked })
                        }
                        className="h-4 w-4 accent-[#E05324] rounded cursor-pointer"
                      />
                    </label>
                    <input
                      type="url"
                      dir="ltr"
                      value={siteConfig.facebookUrl || ''}
                      onChange={(e) =>
                        onUpdateSiteConfig({ ...siteConfig, facebookUrl: e.target.value })
                      }
                      placeholder="https://facebook.com/BasairPlatform"
                      className="w-full rounded-lg border border-[#D6CEBE] dark:border-[#332F2B] bg-[#F9F7F2] dark:bg-[#121110] px-3 py-1.5 text-[13px] text-left"
                    />
                  </div>

                  {/* قناة واتساب */}
                  <div className="rounded-xl border border-[#E6E2D8] dark:border-[#2A2724] bg-white dark:bg-[#191816] p-3 space-y-2">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-[13px] font-bold">قناة واتساب</span>
                      <input
                        type="checkbox"
                        checked={Boolean(siteConfig.whatsappEnabled)}
                        onChange={(e) =>
                          onUpdateSiteConfig({ ...siteConfig, whatsappEnabled: e.target.checked })
                        }
                        className="h-4 w-4 accent-[#E05324] rounded cursor-pointer"
                      />
                    </label>
                    <input
                      type="url"
                      dir="ltr"
                      value={siteConfig.whatsappUrl || ''}
                      onChange={(e) =>
                        onUpdateSiteConfig({ ...siteConfig, whatsappUrl: e.target.value })
                      }
                      placeholder="https://whatsapp.com/channel/..."
                      className="w-full rounded-lg border border-[#D6CEBE] dark:border-[#332F2B] bg-[#F9F7F2] dark:bg-[#121110] px-3 py-1.5 text-[13px] text-left"
                    />
                  </div>

                  {/* يوتيوب */}
                  <div className="rounded-xl border border-[#E6E2D8] dark:border-[#2A2724] bg-white dark:bg-[#191816] p-3 space-y-2">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-[13px] font-bold">قناة يوتيوب</span>
                      <input
                        type="checkbox"
                        checked={Boolean(siteConfig.youtubeEnabled)}
                        onChange={(e) =>
                          onUpdateSiteConfig({ ...siteConfig, youtubeEnabled: e.target.checked })
                        }
                        className="h-4 w-4 accent-[#E05324] rounded cursor-pointer"
                      />
                    </label>
                    <input
                      type="url"
                      dir="ltr"
                      value={siteConfig.youtubeUrl || ''}
                      onChange={(e) =>
                        onUpdateSiteConfig({ ...siteConfig, youtubeUrl: e.target.value })
                      }
                      placeholder="https://youtube.com/@BasairPlatform"
                      className="w-full rounded-lg border border-[#D6CEBE] dark:border-[#332F2B] bg-[#F9F7F2] dark:bg-[#121110] px-3 py-1.5 text-[13px] text-left"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* نصوص صفحة عن بصائر */}
            <div className="pt-4 border-t border-[#E6E2D8] dark:border-[#2A2724] space-y-4">
              <h3 className="font-display text-[18px] font-bold">نصوص صفحة «عن بصائر»</h3>
              <div>
                <label className="block text-[13px] font-bold mb-1.5">الفقرة التعريفية الأولى</label>
                <textarea
                  rows={3}
                  value={siteConfig.aboutIntro}
                  onChange={(e) =>
                    onUpdateSiteConfig({ ...siteConfig, aboutIntro: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-[#F9F7F2] dark:bg-[#121110] px-4 py-2.5 text-[14.5px]"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold mb-1.5">الاقتباس المنهجي البارز</label>
                <input
                  type="text"
                  value={siteConfig.aboutQuote}
                  onChange={(e) =>
                    onUpdateSiteConfig({ ...siteConfig, aboutQuote: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-[#F9F7F2] dark:bg-[#121110] px-4 py-2.5 text-[14.5px]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#E6E2D8] dark:border-[#2A2724] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  onResetSiteConfig();
                  showToast('تمت استعادة الإعدادات الافتراضية للمنصة');
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-[#E05324]/40 px-4 py-2.5 text-[13.5px] font-bold text-[#E05324] hover:bg-[#E05324]/10 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>استعادة الإعدادات الافتراضية للهوية</span>
              </button>

              <span className="text-[13px] font-bold text-[#1E6B4E] dark:text-[#F5B800]">
                ✓ يُحفظ تلقائياً مع تأخير ذكي (Debounce)
              </span>
              <button
                type="button"
                onClick={() => {
                  saveSiteConfig(siteConfig, false, true);
                  showToast('تم حفظ إعدادات الهوية سحابياً بنجاح');
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#141413] dark:bg-[#F5F3EF] px-4 py-2 text-[13px] font-bold text-[#F9F7F2] dark:text-[#141413] hover:opacity-90 cursor-pointer"
              >
                <Check className="w-4 h-4 text-[#F5B800] dark:text-[#E05324]" />
                <span>حفظ الآن</span>
              </button>
              <span className="hidden">
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ==================== محتوى التبويب الخامس: الأمان وحساب المشرف ==================== */}
      {subTab === 'security' && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-[24px] border border-[#E6E2D8] dark:border-[#2A2724] bg-white dark:bg-[#191816] p-6 sm:p-8">
            <div className="flex items-center gap-2.5 mb-3">
              <ShieldCheck className="w-6 h-6 text-[#E05324]" />
              <h2 className="font-display text-[22px] font-bold text-[#141413] dark:text-[#F5F3EF]">
                المصادقة السحابية عبر حساب Google المشرف
              </h2>
            </div>
            <p className="font-prose text-[15px] leading-[1.75] text-[#4A4742] dark:text-[#B8B3AA]">
              تم إلغاء كلمة المرور التقليدية بالكامل؛ يعتمد الدخول إلى استوديو الكتابة ولوحة الإدارة وحفظ البيانات في <strong>Firebase Firestore</strong> حصرياً على تسجيل الدخول بحساب Google المعتمد للمشرف.
            </p>

            <div className="mt-6 rounded-2xl bg-[#FAF9F5] dark:bg-[#141311] p-5 border border-[#E6E2D8] dark:border-[#2A2724] font-ui space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-[#78736A]">
                  البريد الإلكتروني المعتمد للمشرف:
                </span>
                <code
                  dir="ltr"
                  className="rounded-lg bg-[#EFECE6] dark:bg-[#23201D] px-3 py-1 text-[13px] font-bold text-[#141413] dark:text-[#F5F3EF]"
                >
                  {isCurrentUserAdmin(firebaseUser)
                    ? BOOTSTRAPPED_ADMIN_EMAIL
                    : 'محمي (يظهر للمشرف الموثّق فقط)'}
                </code>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#E6E2D8] dark:border-[#2A2724]">
                <span className="text-[13px] font-bold text-[#78736A]">
                  حالة الاتصال الحالية:
                </span>
                {isCurrentUserAdmin(firebaseUser) ? (
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#1E6B4E] dark:text-[#F5B800]">
                    <Check className="w-4 h-4" />
                    <span>متصل وموثّق عبر Google ({firebaseUser?.email})</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      signInAdminWithGoogle()
                        .then(async (user) => {
                          if (isCurrentUserAdmin(user)) {
                            showToast('تم تسجيل الدخول بحساب المشرف بنجاح');
                          } else {
                            await signOutAdmin();
                            showToast('هذا الحساب غير مصرح له كمشرف');
                          }
                        })
                        .catch(() => showToast('تعذر تسجيل الدخول عبر جوجل'));
                    }}
                    className="rounded-xl bg-[#142822] text-[#F9F7F2] px-3.5 py-1.5 text-[12.5px] font-bold cursor-pointer"
                  >
                    تسجيل الدخول بحساب Google
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-[24px] border border-[#E6E2D8] dark:border-[#2A2724] bg-white dark:bg-[#191816] p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <h3 className="font-display text-[20px] font-bold text-[#141413] dark:text-[#F5F3EF]">
                حالة الجلسة والمفتاح السري
              </h3>
              <p className="font-prose mt-2 text-[14.5px] leading-[1.75] text-[#4A4742] dark:text-[#B8B3AA]">
                المفتاح السري للوصول إلى بوابة المشرف مخفي عن الزوار، ويعمل عند النقر على اسم <strong>«{siteConfig.supervisorName}»</strong> في تذييل الموقع مع التحقق من حساب جوجل المشرف.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setStudioSessionActive(false);
                signOutAdmin().catch(() => {});
                onCloseStudio();
              }}
              className="font-ui mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#E05324] px-5 py-3 text-[14.5px] font-bold text-white hover:bg-[#c94519] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج وقفل الجلسة</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
