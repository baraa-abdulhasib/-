import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Undo2,
  Quote,
  List,
  ListOrdered,
  Link2,
  Plus,
  Image as ImageIcon,
  Video,
  Minus,
  Check,
  X,
  Sparkles,
  FileCode2,
  LogOut,
  Trash2,
  Heading2,
  Upload,
  ShieldCheck,
  PenTool,
  FolderEdit,
  Search,
  Edit3,
  Eye,
  RotateCcw,
  Star,
  Settings2,
} from 'lucide-react';
import {
  Article,
  BLOG_META,
  CATEGORIES,
  ContentBlock,
  EDITORIAL_SERIES,
  Footnote,
  WRITER_BLOGS,
} from '../data/articles';
import { ARTICLE_ARTWORKS } from '../data/artwork';
import {
  clearStudioDraft,
  loadStudioDraft,
  saveStudioDraft,
  setStudioSessionActive,
  StudioMode,
} from '../utils/studioAuth';
import { signOutAdmin } from '../firebase';
import { SiteConfig } from '../utils/siteConfig';
import { SiteAdminPanel } from '../components/SiteAdminPanel';
import {
  CuratedStarIcon,
  BasairQuoteStarBadge,
  QuranOrnateBracketIcon,
} from '../components/Icons';
import {
  buildQuranVerseHtml,
  cleanVerseText,
  enhanceQuranicVersesInHtml,
  OPEN_QURAN_BRACKET_HTML,
} from '../utils/quranVerse';

interface StudioPageProps {
  initialMode: StudioMode;
  siteArticles: Article[];
  siteConfig: SiteConfig;
  onUpdateSiteConfig: (nextConfig: SiteConfig) => void;
  onResetSiteConfig: () => void;
  bookmarkedIds: string[];
  onSaveArticle: (article: Article, isEditingExisting: boolean) => void;
  onUpdateArticleInPlace: (article: Article) => void;
  onDeleteArticle: (articleId: string) => void;
  onResetDefaultArticles: () => void;
  onPreviewArticle: (slug: string) => void;
  onCancel: () => void;
}

const PRESET_COVERS = [
  { id: 'maqasid', label: 'ميزان المقاصد والكليات', src: ARTICLE_ARTWORKS.maqasidHero },
  { id: 'silence', label: 'الخلوة والسكينة', src: ARTICLE_ARTWORKS.digitalSilence },
  { id: 'ai', label: 'فقه النوازل والخوارزميات', src: ARTICLE_ARTWORKS.fiqhAi },
  { id: 'turath', label: 'المخطوطات والتراث الأصولي', src: ARTICLE_ARTWORKS.shatibiTurath },
  { id: 'economy', label: 'العدل والاقتصاد الإسلامي', src: ARTICLE_ARTWORKS.islamicEconomy },
  { id: 'lang', label: 'البيان واللسان العربي', src: ARTICLE_ARTWORKS.languageIdentity },
  { id: 'family', label: 'الميثاق والأسرة', src: ARTICLE_ARTWORKS.familyValues },
  { id: 'usul', label: 'بوصلة أصول الفهم', src: ARTICLE_ARTWORKS.usulUnderstanding },
];

/**
 * تحويل مصفوفة ContentBlock[] الخاصة بأي مقال موجود إلى HTML غني قابل للتحرير في محرر Substack
 */
function blocksToEditorHtml(blocks: ContentBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'paragraph':
          return `<p>${enhanceQuranicVersesInHtml(block.text)}</p>`;
        case 'heading':
          return block.level === 3
            ? `<h3>${block.text}</h3>`
            : `<h2>${block.text}</h2>`;
        case 'quote': {
          const isQuranQuote =
            block.variant === 'quran' ||
            (!block.variant && (block.text.includes('﴿') || block.text.includes('﴾')));
          const quoteTypeAttr: 'quote' | 'quran' | 'hadith' =
            block.variant === 'hadith'
              ? 'hadith'
              : isQuranQuote
              ? 'quran'
              : 'quote';
          const weightAttr = block.weight ? ` data-weight="${block.weight}"` : '';
          const citePlaceholder =
            quoteTypeAttr === 'quran'
              ? 'أضف المصدر أو السورة ورقم الآية...'
              : quoteTypeAttr === 'hadith'
              ? 'أضف تخريج الحديث أو راويه (مثل: رواه البخاري ومسلم)...'
              : 'أضف المصدر أو القائل...';
          const cleanCite = block.cite ? block.cite.replace(/^[—-]\s*/, '').trim() : '';
          return `<blockquote data-quote-type="${quoteTypeAttr}"${weightAttr}><div class="basair-quote-editor-text">${enhanceQuranicVersesInHtml(
            block.text
          )}</div><cite class="basair-quote-editor-cite" data-quote-cite="true" data-placeholder="${citePlaceholder}">${cleanCite}</cite></blockquote>`;
        }
        case 'list': {
          const tag = block.style === 'ordered' ? 'ol' : 'ul';
          const items = block.items
            .map((item) => `<li>${enhanceQuranicVersesInHtml(item)}</li>`)
            .join('');
          return `<${tag}>${items}</${tag}>`;
        }
        case 'image': {
          const cap = block.caption
            ? `<figcaption class="mt-2 text-center text-[13.5px] text-[#78736A]">${block.caption}</figcaption>`
            : '';
          return `<figure data-block-type="image" contenteditable="false" class="group/media relative my-8 rounded-2xl overflow-hidden border border-[#E6E2D8] dark:border-[#2A2724] bg-[#EFECE6] dark:bg-[#1D1B19] p-2"><button type="button" data-action="delete-media" title="حذف الصورة من المقال" class="font-ui absolute top-4 left-4 z-20 inline-flex items-center gap-1.5 rounded-xl bg-[#141413]/85 hover:bg-[#DC2626] px-3 py-1.5 text-[12.5px] font-bold text-[#F9F7F2] shadow-lg backdrop-blur-sm transition-colors cursor-pointer"><span>✕</span><span>حذف الصورة</span></button><img src="${block.src}" alt="${
            block.alt || 'صورة المقال'
          }" class="w-full rounded-xl object-cover max-h-[420px]" />${cap}</figure>`;
        }
        case 'video': {
          const cap = block.caption
            ? `<figcaption class="mt-2 text-center text-[13.5px] text-[#78736A]">${block.caption}</figcaption>`
            : '';
          return `<div data-block-type="video" data-video-url="${block.url}" contenteditable="false" class="group/media relative my-8 rounded-2xl border border-[#E6E2D8] dark:border-[#2A2724] bg-[#EFECE6] dark:bg-[#1D1B19] p-5 text-center"><button type="button" data-action="delete-media" title="حذف الفيديو من المقال" class="font-ui absolute top-3.5 left-3.5 z-20 inline-flex items-center gap-1.5 rounded-xl bg-[#141413]/85 hover:bg-[#DC2626] px-3 py-1.5 text-[12px] font-bold text-[#F9F7F2] shadow-md transition-colors cursor-pointer"><span>✕</span><span>حذف الفيديو</span></button><p class="font-ui text-[14px] font-bold text-[#E05324] !mb-1">فيديو مضمّن في المقال</p><p class="font-ui text-[13px] text-[#4A4742] dark:text-[#B8B3AA] truncate !mb-0">${block.url}</p>${cap}</div>`;
        }
        case 'divider':
          return `<hr data-block-type="divider" class="my-8 border-t-2 border-[#E6E2D8] dark:border-[#2A2724] w-28 mx-auto" />`;
        case 'callout': {
          const safeTitle = block.title || 'قاعدة منهجية';
          return `<aside data-block-type="callout" class="basair-callout-box"><div class="basair-callout-title" data-callout-title="true" data-placeholder="عنوان القاعدة أو الإضاءة المنهجية...">${safeTitle}</div><div class="basair-callout-body" data-callout-body="true" data-placeholder="اكتب نص القاعدة أو الخلاصة المنهجية هنا...">${enhanceQuranicVersesInHtml(
            block.text
          )}</div></aside>`;
        }
        default:
          return '';
      }
    })
    .join('');
}

/**
 * تحويل محتوى HTML الغني من المحرر إلى مصفوفة ContentBlock[] متوافقة مع قارئ المدونة
 */
function parseEditorHtmlToBlocks(html: string): ContentBlock[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  if (!root) return [];

  const blocks: ContentBlock[] = [];
  let headingCounter = 1;
  let isFirstParagraph = true;

  const INLINE_TAGS = new Set([
    'a',
    'strong',
    'b',
    'em',
    'i',
    'u',
    'span',
    'br',
    'mark',
    'code',
    'sub',
    'sup',
    'small',
  ]);

  let pendingInlineHtml = '';
  let pendingInlinePlain = '';

  const flushPendingInline = () => {
    const cleanedHtml = pendingInlineHtml
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/&nbsp;/g, ' ')
      .trim();
    if (pendingInlinePlain.trim()) {
      blocks.push({
        type: 'paragraph',
        text: cleanedHtml,
        dropCap: isFirstParagraph,
      });
      isFirstParagraph = false;
    }
    pendingInlineHtml = '';
    pendingInlinePlain = '';
  };

  const processNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const txt = node.textContent || '';
      pendingInlineHtml += txt;
      pendingInlinePlain += txt;
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    // إذا كان العنصر وسم رابط <a> أو نص منسق مباشر على الجذر، ندمجه في الفقرة الجارية مع الحفاظ الكامل على وسم <a href="...">
    if (INLINE_TAGS.has(tag) && el.dataset.blockType !== 'image' && el.dataset.blockType !== 'video') {
      pendingInlineHtml += el.outerHTML;
      pendingInlinePlain += el.textContent || '';
      return;
    }

    flushPendingInline();

    if (tag === 'hr' || el.dataset.blockType === 'divider') {
      blocks.push({ type: 'divider' });
      return;
    }

    if (el.dataset.blockType === 'image' || tag === 'figure') {
      const img = el.querySelector('img');
      const cap = el.querySelector('figcaption');
      if (img && img.getAttribute('src')) {
        blocks.push({
          type: 'image',
          src: img.getAttribute('src') || '',
          alt: img.getAttribute('alt') || 'صورة توضيحية',
          caption: cap?.textContent?.trim() || '',
        });
        return;
      }
    }

    if (el.dataset.blockType === 'video') {
      const videoUrl = el.dataset.videoUrl || '';
      const cap = el.querySelector('figcaption');
      if (videoUrl) {
        blocks.push({
          type: 'video',
          url: videoUrl,
          caption: cap?.textContent?.trim() || '',
        });
        return;
      }
    }

    if (tag === 'aside' || el.dataset.blockType === 'callout') {
      const titleEl = el.querySelector('[data-callout-title], .basair-callout-title');
      const bodyEl = el.querySelector('[data-callout-body], .basair-callout-body');
      const rawTitle = titleEl?.textContent?.replace(/\u200B/g, '').trim() || 'قاعدة منهجية';
      const hasLinks = Boolean(bodyEl?.querySelector('a[href]'));
      const rawBody = hasLinks
        ? bodyEl?.innerHTML?.replace(/\u200B/g, '').trim() || ''
        : bodyEl?.textContent?.replace(/\u200B/g, '').trim() ||
          el.textContent?.replace(titleEl?.textContent || '', '').replace(/\u200B/g, '').trim() ||
          '';
      if (rawBody) {
        blocks.push({
          type: 'callout',
          title: rawTitle,
          text: rawBody,
        });
      }
      return;
    }

    if (tag === 'blockquote') {
      const clone = el.cloneNode(true) as HTMLElement;
      const citeEls = clone.querySelectorAll(
        'cite[data-quote-cite], .basair-quote-editor-cite, cite, small'
      );
      let cite: string | undefined;
      citeEls.forEach((cEl) => {
        const rawCite = cEl.textContent?.replace(/^[—-]\s*/, '').replace(/\u200B/g, '').trim();
        if (rawCite && !cite) {
          cite = rawCite;
        }
        cEl.remove();
      });

      const hasLinkInQuote = Boolean(clone.querySelector('a[href]'));
      const textDiv = clone.querySelector('.basair-quote-editor-text');
      const text = hasLinkInQuote
        ? (textDiv ? textDiv.innerHTML : clone.innerHTML).replace(/[\u200B«»]/g, '').trim()
        : (clone.textContent || '').replace(/[\u200B«»]/g, '').trim();
      const isQuranVariant =
        el.dataset.quoteType === 'quran' || text.includes('﴿') || text.includes('﴾');
      const resolvedVariant: 'quote' | 'quran' | 'hadith' =
        el.dataset.quoteType === 'hadith'
          ? 'hadith'
          : isQuranVariant
          ? 'quran'
          : 'quote';
      const blockWeight: 'bold' | 'regular' | undefined =
        el.dataset.weight === 'regular'
          ? 'regular'
          : el.dataset.weight === 'bold'
          ? 'bold'
          : undefined;
      if (text) {
        blocks.push({
          type: 'quote',
          text,
          variant: resolvedVariant,
          ...(blockWeight ? { weight: blockWeight } : {}),
          ...(cite ? { cite } : {}),
        });
      }
      return;
    }

    if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
      const text = el.textContent?.trim();
      if (text) {
        blocks.push({
          type: 'heading',
          level: tag === 'h3' ? 3 : 2,
          id: `sec-${headingCounter++}`,
          text,
        });
      }
      return;
    }

    if (tag === 'ul' || tag === 'ol') {
      const items = Array.from(el.querySelectorAll('li'))
        .map((li) => li.innerHTML.trim())
        .filter(Boolean);
      if (items.length > 0) {
        blocks.push({
          type: 'list',
          style: tag === 'ol' ? 'ordered' : 'unordered',
          items,
        });
      }
      return;
    }

    const innerHtml = el.innerHTML
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/&nbsp;/g, ' ')
      .trim();
    const plainText = el.textContent?.trim() || '';

    if (plainText) {
      blocks.push({
        type: 'paragraph',
        text: innerHtml,
        dropCap: isFirstParagraph,
      });
      isFirstParagraph = false;
    }
  };

  Array.from(root.childNodes).forEach(processNode);
  flushPendingInline();

  if (blocks.length === 0 && html.trim()) {
    blocks.push({
      type: 'paragraph',
      text: html.trim(),
      dropCap: true,
    });
  }

  return blocks;
}

export const StudioPage: React.FC<StudioPageProps> = ({
  initialMode,
  siteArticles,
  siteConfig,
  onUpdateSiteConfig,
  onResetSiteConfig,
  bookmarkedIds,
  onSaveArticle,
  onUpdateArticleInPlace,
  onDeleteArticle,
  onResetDefaultArticles,
  onPreviewArticle,
  onCancel,
}) => {
  // التبديل بين الخيارات الثلاثة: محرر الكتابة | تحرير محتوى الموقع | إدارة
  const [activeTab, setActiveTab] = useState<StudioMode>(initialMode);

  useEffect(() => {
    setActiveTab(initialMode);
  }, [initialMode]);

  // المقال الذي يجري تعديله حالياً في محرر الكتابة (null تعني كتابة مقال جديد)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  const existingDraft = loadStudioDraft();

  const [title, setTitle] = useState(existingDraft?.title || '');
  const [subtitle, setSubtitle] = useState(existingDraft?.subtitle || '');
  const [categorySlug, setCategorySlug] = useState(
    existingDraft?.categorySlug ||
      siteConfig.categories?.[0]?.slug ||
      CATEGORIES[0]?.slug ||
      'maqasid'
  );
  const [selectedAuthorSlug, setSelectedAuthorSlug] = useState<string>(
    siteConfig.defaultWriterSlug || 'baraa'
  );
  const [seriesName, setSeriesName] = useState(
    existingDraft?.seriesName ||
      siteConfig.series?.[0]?.title ||
      EDITORIAL_SERIES[0]?.title ||
      'مباحث عامة'
  );
  const [coverImage, setCoverImage] = useState(
    existingDraft?.coverImage || PRESET_COVERS[0]?.src || ''
  );
  const [coverCaption, setCoverCaption] = useState(existingDraft?.coverCaption || '');
  const [isFeatured, setIsFeatured] = useState(existingDraft?.isFeatured ?? false);
  const [isCuratedStar, setIsCuratedStar] = useState(existingDraft?.isCuratedStar ?? true);
  const [tagsInput, setTagsInput] = useState(
    existingDraft?.tagsInput || 'مقاصد الشريعة، فقه الواقع'
  );
  // قائمة المراجع والإحالات المرجعية في أسفل المقال (صندوق المراجع والإحالات)
  const [footnotes, setFootnotes] = useState<Footnote[]>(
    existingDraft?.footnotes || []
  );
  const [isFootnotesBoxVisible, setIsFootnotesBoxVisible] = useState<boolean>(
    Boolean(existingDraft?.footnotes && existingDraft.footnotes.length > 0)
  );
  const footnotesSectionRef = useRef<HTMLElement>(null);

  // سجل التراجع (Undo History) للمحرر
  const [history, setHistory] = useState<string[]>([
    existingDraft?.htmlBody || '',
  ]);
  const [isEditorEmpty, setIsEditorEmpty] = useState(!existingDraft?.htmlBody);
  const [savedIndicator, setSavedIndicator] = useState('محفوظ تلقائياً');

  // النوافذ المنبثقة لشريط الأدوات السفلي والشريط العلوي
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isListMenuOpen, setIsListMenuOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isPublishDrawerOpen, setIsPublishDrawerOpen] = useState(false);

  // حقول نافذة الرابط
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');

  // حقول نافذة الصورة
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageCaptionInput, setImageCaptionInput] = useState('');

  // حقول نافذة الفيديو
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoCaptionInput, setVideoCaptionInput] = useState('');

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedAllSiteCode, setCopiedAllSiteCode] = useState(false);

  // =========================================================================
  // حالات قسم "٢. تحرير محتوى الموقع" (تعديل وحذف أي مقال في الموقع)
  // =========================================================================
  const [managerSearch, setManagerSearch] = useState('');
  const [managerCategoryFilter, setManagerCategoryFilter] = useState<string>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmResetDefaults, setConfirmResetDefaults] = useState(false);
  const [quickEditArticle, setQuickEditArticle] = useState<Article | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const subtitleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const showNotice = (msg: string) => {
    setStatusBanner(msg);
    setTimeout(() => {
      setStatusBanner((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // تهيئة المحتوى الأولي للمحرر عند التبديل إلى تبويب محرر الكتابة
  useEffect(() => {
    if (activeTab === 'writer-editor' && editorRef.current) {
      if (editingArticle) {
        const html = blocksToEditorHtml(editingArticle.content);
        editorRef.current.innerHTML = html;
        setIsEditorEmpty(editorRef.current.innerText.trim().length === 0);
      } else {
        const currentDraft = loadStudioDraft();
        if (currentDraft?.htmlBody && !editorRef.current.innerHTML) {
          editorRef.current.innerHTML = enhanceQuranicVersesInHtml(currentDraft.htmlBody);
          setIsEditorEmpty(editorRef.current.innerText.trim().length === 0);
        }
      }
    }
  }, [activeTab, editingArticle]);

  // ضبط ارتفاع حقول العنوان والعنوان الفرعي تلقائياً
  const autoResizeTextarea = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    if (activeTab === 'writer-editor') {
      autoResizeTextarea(titleTextareaRef.current);
      autoResizeTextarea(subtitleTextareaRef.current);
    }
  }, [title, subtitle, activeTab]);

  // الحفظ التلقائي للمسودة في localStorage (فقط عند كتابة مقال جديد)
  const persistCurrentDraft = (currentHtml?: string, customFootnotes?: Footnote[]) => {
    if (editingArticle) {
      setSavedIndicator('وضع تعديل مقال حالي');
      return;
    }
    const htmlBody = currentHtml !== undefined ? currentHtml : editorRef.current?.innerHTML || '';
    const activeFootnotes = customFootnotes !== undefined ? customFootnotes : footnotes;
    saveStudioDraft({
      title,
      subtitle,
      categorySlug,
      seriesName,
      coverImage,
      coverCaption,
      isFeatured,
      isCuratedStar,
      tagsInput,
      htmlBody,
      footnotes: activeFootnotes,
      updatedAt: new Date().toISOString(),
    });
    setSavedIndicator('تم الحفظ في المسودات');
  };

  useEffect(() => {
    if (!editingArticle) {
      persistCurrentDraft();
    }
  }, [title, subtitle, categorySlug, seriesName, coverImage, coverCaption, isFeatured, isCuratedStar, tagsInput, footnotes]);

  // فتح أي مقال من الموقع داخل محرر الكتابة لتعديل محتواه بالكامل
  const handleLoadArticleIntoEditor = (article: Article) => {
    setEditingArticle(article);
    setTitle(article.title);
    setSubtitle(article.subtitle);
    setCategorySlug(article.categorySlug);
    setSelectedAuthorSlug(article.authorSlug || siteConfig.defaultWriterSlug || 'baraa');
    setSeriesName(
      article.seriesName ||
        siteConfig.series?.[0]?.title ||
        EDITORIAL_SERIES[0]?.title ||
        'مباحث عامة'
    );
    setCoverImage(article.coverImage);
    setCoverCaption(article.coverCaption || '');
    setIsFeatured(Boolean(article.isFeatured));
    setIsCuratedStar(Boolean(article.isCuratedStar));
    setTagsInput((article.tags || []).join('، '));
    const articleFootnotes = article.footnotes ? [...article.footnotes] : [];
    setFootnotes(articleFootnotes);
    setIsFootnotesBoxVisible(articleFootnotes.length > 0);
    const convertedHtml = blocksToEditorHtml(article.content);
    setHistory([convertedHtml]);
    setIsEditorEmpty(false);
    setSavedIndicator(`تعديل: ${article.title.slice(0, 28)}...`);
    setActiveTab('writer-editor');
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = convertedHtml;
      }
      autoResizeTextarea(titleTextareaRef.current);
      autoResizeTextarea(subtitleTextareaRef.current);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 30);
  };

  // بدء مقال جديد فارغ
  const handleStartFreshNewArticle = () => {
    setEditingArticle(null);
    const draft = loadStudioDraft();
    setTitle(draft?.title || '');
    setSubtitle(draft?.subtitle || '');
    setCategorySlug(
      draft?.categorySlug ||
        siteConfig.categories?.[0]?.slug ||
        CATEGORIES[0]?.slug ||
        'maqasid'
    );
    setSelectedAuthorSlug(siteConfig.defaultWriterSlug || 'baraa');
    setSeriesName(
      draft?.seriesName ||
        siteConfig.series?.[0]?.title ||
        EDITORIAL_SERIES[0]?.title ||
        'مباحث عامة'
    );
    setCoverImage(draft?.coverImage || PRESET_COVERS[0]?.src || '');
    setCoverCaption(draft?.coverCaption || '');
    setIsFeatured(draft?.isFeatured ?? false);
    setIsCuratedStar(draft?.isCuratedStar ?? true);
    setTagsInput(draft?.tagsInput || 'مقاصد الشريعة، فقه الواقع');
    const draftFootnotes = draft?.footnotes || [];
    setFootnotes(draftFootnotes);
    setIsFootnotesBoxVisible(draftFootnotes.length > 0);
    const initialHtml = draft?.htmlBody || '';
    setHistory([initialHtml]);
    setIsEditorEmpty(!initialHtml);
    setSavedIndicator('مقال جديد');
    setActiveTab('writer-editor');
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = initialHtml;
      }
      autoResizeTextarea(titleTextareaRef.current);
      autoResizeTextarea(subtitleTextareaRef.current);
    }, 30);
  };

  // حفظ موضع المؤشر في المحرر قبل فتح أي نافذة منبثقة
  const saveSelectionRange = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelectionRange = () => {
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    } else if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const recordEditorSnapshot = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const text = editorRef.current.innerText.trim();
    setIsEditorEmpty(text.length === 0 && !html.includes('<img') && !html.includes('<hr'));
    setHistory((prev) => {
      if (prev[prev.length - 1] === html) return prev;
      return [...prev.slice(-30), html];
    });
    persistCurrentDraft(html);
  };

  const focusEditorIfNeeded = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
  };

  // 1. زر التراجع (Undo)
  const handleUndo = () => {
    if (!editorRef.current) return;
    document.execCommand('undo');
    if (history.length > 1) {
      const previous = history[history.length - 2];
      editorRef.current.innerHTML = previous;
      setHistory((prev) => prev.slice(0, -1));
      setIsEditorEmpty(editorRef.current.innerText.trim().length === 0);
      persistCurrentDraft(previous);
    }
  };

  // 2. اختيار القالب الموحّد: إما قالب «اقتباس» (بنجمة التنصيص) أو قالب «آية» (بنجمة مخطوطة القرآن الكريم + فتح قوس الآية ﴿) أو قالب «حديث» (بنجمة مخطوطة الحديث النبوي)
  // مع إدراج سطر المصدر السفلي التلقائي (الطريقة أ) بخط ثمانية الرمادي الخفيف
  const handleSelectQuoteTemplate = (variant: 'quote' | 'quran' | 'hadith') => {
    if (!editorRef.current) return;

    let sel = window.getSelection();
    if (!sel || !sel.rangeCount || !editorRef.current.contains(sel.anchorNode)) {
      restoreSelectionRange();
      sel = window.getSelection();
    }
    focusEditorIfNeeded();
    sel = window.getSelection();

    const anchorEl =
      sel?.anchorNode?.nodeType === Node.ELEMENT_NODE
        ? (sel.anchorNode as HTMLElement)
        : sel?.anchorNode?.parentElement;
    let parentQuote = anchorEl?.closest('blockquote') as HTMLElement | null;

    if (parentQuote && editorRef.current.contains(parentQuote)) {
      const currentType = parentQuote.getAttribute('data-quote-type') || 'quote';
      if (currentType === variant && variant === 'quote') {
        // إذا كان القالب نفسه مفعلاً في وضع الاقتباس وضغط عليه مجدداً، نعيده لفقرة عادية ونزيل سطر المصدر الفارغ
        parentQuote
          .querySelectorAll('cite[data-quote-cite], .basair-quote-editor-cite')
          .forEach((cEl) => {
            if (!cEl.textContent?.trim()) cEl.remove();
          });
        const textDiv = parentQuote.querySelector('.basair-quote-editor-text');
        if (textDiv) {
          parentQuote.innerHTML = textDiv.innerHTML;
        }
        document.execCommand('formatBlock', false, 'p');
        setIsTemplateMenuOpen(false);
        recordEditorSnapshot();
        setSavedIndicator('تم إلغاء قالب الاقتباس');
        return;
      }
      parentQuote.setAttribute('data-quote-type', variant);
    } else {
      document.execCommand('formatBlock', false, 'blockquote');
      const updatedSel = window.getSelection();
      const updatedAnchor =
        updatedSel?.anchorNode?.nodeType === Node.ELEMENT_NODE
          ? (updatedSel.anchorNode as HTMLElement)
          : updatedSel?.anchorNode?.parentElement;
      parentQuote = updatedAnchor?.closest('blockquote') as HTMLElement | null;

      if (!parentQuote && editorRef.current) {
        // إذا كان المحرر فارغاً تماماً ننشئ قالب الاقتباس/الآية/الحديث مباشرة
        const bq = document.createElement('blockquote');
        bq.setAttribute('data-quote-type', variant);
        editorRef.current.appendChild(bq);
        parentQuote = bq;
      } else if (parentQuote) {
        parentQuote.setAttribute('data-quote-type', variant);
      }
    }

    if (parentQuote) {
      const citePlaceholder =
        variant === 'quran'
          ? 'أضف المصدر أو السورة ورقم الآية...'
          : variant === 'hadith'
          ? 'أضف تخريج الحديث أو راويه (مثل: رواه البخاري ومسلم)...'
          : 'أضف المصدر أو القائل...';

      // استخراج أي مصدر مكتوب مسبقاً قبل إعادة بناء هيكل القالب
      let existingCiteText = '';
      parentQuote
        .querySelectorAll('cite[data-quote-cite], .basair-quote-editor-cite, cite, small')
        .forEach((cEl) => {
          const t = cEl.textContent?.replace(/^[—-]\s*/, '').replace(/\u200B/g, '').trim();
          if (t && !existingCiteText) existingCiteText = t;
          cEl.remove();
        });

      let textDiv = parentQuote.querySelector(
        '.basair-quote-editor-text'
      ) as HTMLElement | null;
      if (!textDiv) {
        const rawInner = parentQuote.innerHTML;
        parentQuote.innerHTML = '';
        textDiv = document.createElement('div');
        textDiv.className = 'basair-quote-editor-text';
        textDiv.innerHTML = rawInner;
        parentQuote.appendChild(textDiv);
      }

      if (variant === 'quran') {
        const currentText = textDiv.textContent || '';
        if (!currentText.includes('﴿')) {
          const cleanExisting = currentText.trim();
          if (cleanExisting.length > 0) {
            textDiv.innerHTML = `${OPEN_QURAN_BRACKET_HTML}${cleanExisting}`;
          } else {
            textDiv.innerHTML = `${OPEN_QURAN_BRACKET_HTML}&#8203;`;
          }
        } else {
          textDiv.innerHTML = enhanceQuranicVersesInHtml(textDiv.innerHTML);
        }
      } else if (!textDiv.textContent?.trim()) {
        textDiv.innerHTML = '&#8203;';
      }

      // إضافة سطر المصدر السفلي التلقائي (الطريقة أ)
      const citeEl = document.createElement('cite');
      citeEl.className = 'basair-quote-editor-cite';
      citeEl.setAttribute('data-quote-cite', 'true');
      citeEl.setAttribute('data-placeholder', citePlaceholder);
      if (existingCiteText) {
        citeEl.textContent = existingCiteText;
      }
      parentQuote.appendChild(citeEl);

      // وضع مؤشر الكتابة داخل حاوية النص الرئيسي للقالب
      const range = document.createRange();
      range.selectNodeContents(textDiv);
      range.collapse(false);
      const activeSel = window.getSelection();
      if (activeSel) {
        activeSel.removeAllRanges();
        activeSel.addRange(range);
        savedRangeRef.current = range.cloneRange();
      }
    }

    setSavedIndicator(
      variant === 'quran'
        ? 'تم تفعيل قالب الآية وفتح القوس المزخرف ﴿'
        : variant === 'hadith'
        ? 'تم تفعيل قالب الحديث النبوي الشريف'
        : 'تم تفعيل قالب الاقتباس'
    );
    setIsTemplateMenuOpen(false);
    recordEditorSnapshot();
  };

  // 2.1. اختيار قالب «قاعدة / إضاءة منهجية» (Callout Box) من دوائر زر القالب
  const handleSelectCalloutTemplate = () => {
    if (!editorRef.current) return;

    let sel = window.getSelection();
    if (!sel || !sel.rangeCount || !editorRef.current.contains(sel.anchorNode)) {
      restoreSelectionRange();
      sel = window.getSelection();
    }
    focusEditorIfNeeded();
    sel = window.getSelection();

    const anchorEl =
      sel?.anchorNode?.nodeType === Node.ELEMENT_NODE
        ? (sel.anchorNode as HTMLElement)
        : sel?.anchorNode?.parentElement;

    const existingCallout = anchorEl?.closest(
      'aside[data-block-type="callout"], .basair-callout-box'
    ) as HTMLElement | null;

    // إذا كان المؤشر داخل صندوق إضاءة وضغط عليه مجدداً، نعيده لفقرة نص عادية
    if (existingCallout && editorRef.current.contains(existingCallout)) {
      const bodyEl = existingCallout.querySelector('.basair-callout-body');
      const p = document.createElement('p');
      p.innerHTML = bodyEl?.innerHTML?.trim() || '<br>';
      existingCallout.replaceWith(p);

      const range = document.createRange();
      range.selectNodeContents(p);
      range.collapse(false);
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
        savedRangeRef.current = range.cloneRange();
      }
      setIsTemplateMenuOpen(false);
      recordEditorSnapshot();
      setSavedIndicator('تم تحويل صندوق الإضاءة إلى فقرة عادية');
      return;
    }

    const currentBlock = anchorEl?.closest('p, blockquote, h2, h3') as HTMLElement | null;
    const existingText =
      currentBlock && editorRef.current.contains(currentBlock)
        ? currentBlock.textContent?.replace(/\u200B/g, '').trim() || ''
        : '';

    const aside = document.createElement('aside');
    aside.setAttribute('data-block-type', 'callout');
    aside.className = 'basair-callout-box';

    const titleDiv = document.createElement('div');
    titleDiv.className = 'basair-callout-title';
    titleDiv.setAttribute('data-callout-title', 'true');
    titleDiv.setAttribute('data-placeholder', 'عنوان القاعدة أو الإضاءة المنهجية...');
    titleDiv.textContent = 'قاعدة منهجية';

    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'basair-callout-body';
    bodyDiv.setAttribute('data-callout-body', 'true');
    bodyDiv.setAttribute('data-placeholder', 'اكتب نص القاعدة أو الخلاصة المنهجية هنا...');
    if (existingText.length > 0) {
      bodyDiv.innerHTML = enhanceQuranicVersesInHtml(existingText);
    }

    aside.appendChild(titleDiv);
    aside.appendChild(bodyDiv);

    if (currentBlock && editorRef.current.contains(currentBlock) && currentBlock !== editorRef.current) {
      currentBlock.replaceWith(aside);
    } else {
      editorRef.current.appendChild(aside);
    }

    // وضع المؤشر داخل متن القاعدة مباشرة ليبدأ الكاتب بالكتابة، مع إمكانية النقر على العنوان العلوي لتعديله في أي وقت
    const range = document.createRange();
    range.selectNodeContents(bodyDiv);
    range.collapse(false);
    const activeSel = window.getSelection();
    if (activeSel) {
      activeSel.removeAllRanges();
      activeSel.addRange(range);
      savedRangeRef.current = range.cloneRange();
    }

    setIsTemplateMenuOpen(false);
    recordEditorSnapshot();
    setSavedIndicator('تم إدراج قالب القاعدة / الإضاءة المنهجية');
  };

  // 2.2. أزرار إدراج قوس فتح الآية المزخرف ﴿ وقوس إغلاق الآية المزخرف ﴾ في موضع المؤشر مباشرة كعناصر DOM
  const handleInsertQuranBracket = (side: 'open' | 'close') => {
    if (!editorRef.current) return;

    let sel = window.getSelection();
    if (!sel || !sel.rangeCount || !editorRef.current.contains(sel.anchorNode)) {
      restoreSelectionRange();
      sel = window.getSelection();
    }
    focusEditorIfNeeded();
    sel = window.getSelection();

    const bracketChar = side === 'open' ? '﴿' : '﴾';

    // إنشاء وسم القوس المزخرف كعنصر DOM صريح حتى لا يقوم المتصفح بحذف خصائصه داخل contentEditable
    const bracketSpan = document.createElement('span');
    bracketSpan.className =
      side === 'open'
        ? 'quran-bracket quran-bracket-open'
        : 'quran-bracket quran-bracket-close';
    bracketSpan.setAttribute('data-quran-bracket', side);
    bracketSpan.setAttribute('contenteditable', 'false');
    bracketSpan.setAttribute('aria-hidden', 'true');
    bracketSpan.textContent = bracketChar;

    const trailingText = document.createTextNode(side === 'close' ? ' ' : '\u200B');

    let range: Range;
    if (sel && sel.rangeCount > 0 && editorRef.current.contains(sel.anchorNode)) {
      range = sel.getRangeAt(0);
      const anchorEl =
        range.startContainer.nodeType === Node.ELEMENT_NODE
          ? (range.startContainer as HTMLElement)
          : range.startContainer.parentElement;

      // إذا كان المؤشر داخل سطر المصدر وضغط المستخدم على قوس الآية، ننقل الإدراج إلى نص القالب الرئيسي
      const insideCite = anchorEl?.closest('cite[data-quote-cite], .basair-quote-editor-cite');
      if (insideCite) {
        const parentBq = insideCite.closest('blockquote');
        const textContainer = parentBq?.querySelector('.basair-quote-editor-text');
        if (textContainer) {
          range = document.createRange();
          range.selectNodeContents(textContainer);
          range.collapse(false);
        }
      } else {
        // إذا كان المؤشر داخل وسم قوس سابق نخرج بعده أولاً
        const insideBracket = anchorEl?.closest('.quran-bracket');
        if (insideBracket && insideBracket.parentNode) {
          range.setStartAfter(insideBracket);
          range.collapse(true);
        } else {
          range.deleteContents();
        }
      }
    } else {
      let lastBlock = editorRef.current.lastElementChild as HTMLElement | null;
      if (!lastBlock || (lastBlock.tagName !== 'P' && lastBlock.tagName !== 'BLOCKQUOTE')) {
        const p = document.createElement('p');
        editorRef.current.appendChild(p);
        lastBlock = p;
      }
      const targetNode =
        (lastBlock.querySelector?.('.basair-quote-editor-text') as HTMLElement | null) ||
        lastBlock;
      range = document.createRange();
      range.selectNodeContents(targetNode);
      range.collapse(false);
    }

    const frag = document.createDocumentFragment();
    frag.appendChild(bracketSpan);
    frag.appendChild(trailingText);
    range.insertNode(frag);

    if (sel) {
      // إذا أُغلق القوس ﴾ داخل فقرة أو قالب يحتوي على ﴿، نرقّي النص بينهما لخط الآيات تلقائياً مع الحفاظ على سطر المصدر
      const blockParent = trailingText.parentElement?.closest('p, li, blockquote');
      const targetContainer =
        (blockParent?.querySelector('.basair-quote-editor-text') as HTMLElement | null) ||
        blockParent;

      if (
        side === 'close' &&
        targetContainer &&
        targetContainer.innerHTML.includes('﴿') &&
        targetContainer.innerHTML.includes('﴾')
      ) {
        targetContainer.innerHTML = enhanceQuranicVersesInHtml(targetContainer.innerHTML);
        const endRange = document.createRange();
        endRange.selectNodeContents(targetContainer);
        endRange.collapse(false);
        sel.removeAllRanges();
        sel.addRange(endRange);
        savedRangeRef.current = endRange.cloneRange();
      } else {
        const nextRange = document.createRange();
        nextRange.setStartAfter(trailingText);
        nextRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(nextRange);
        savedRangeRef.current = nextRange.cloneRange();
      }
    }

    setIsTemplateMenuOpen(false);
    recordEditorSnapshot();
    setSavedIndicator(`أُدرج قوس الآية المزخرف ${bracketChar}`);
  };

  // 2.3. خيار جعل المكتوب ثخيناً (Bold) أو رفيعاً (Regular) داخل القالب أو الآية أو الفقرة
  const handleSetTextWeight = (weight: 'bold' | 'regular') => {
    if (!editorRef.current) return;

    let sel = window.getSelection();
    if (!sel || !sel.rangeCount || !editorRef.current.contains(sel.anchorNode)) {
      restoreSelectionRange();
      sel = window.getSelection();
    }
    focusEditorIfNeeded();
    sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;

    const anchorEl =
      sel.anchorNode?.nodeType === Node.ELEMENT_NODE
        ? (sel.anchorNode as HTMLElement)
        : sel.anchorNode?.parentElement;

    const parentQuote = anchorEl?.closest('blockquote') as HTMLElement | null;
    const parentVerse = anchorEl?.closest('.quran-verse') as HTMLElement | null;
    const parentBlock = anchorEl?.closest('p, li, h2, h3') as HTMLElement | null;

    // إذا كان المؤشر داخل قالب الآية أو الاقتباس (بدون تحديد جزئي خارج القالب) نضبط سماكة القالب والآية بداخله
    if (parentQuote && editorRef.current.contains(parentQuote)) {
      parentQuote.setAttribute('data-weight', weight);
      parentQuote.querySelectorAll('.quran-verse').forEach((v) => {
        v.setAttribute('data-weight', weight);
      });
      recordEditorSnapshot();
      setSavedIndicator(weight === 'bold' ? 'تم جعل النص ثخيناً' : 'تم جعل النص رفيعاً');
      return;
    }

    // إذا كان المؤشر داخل آية قرآنية مضمنة في فقرة
    if (parentVerse && editorRef.current.contains(parentVerse) && sel.isCollapsed) {
      parentVerse.setAttribute('data-weight', weight);
      recordEditorSnapshot();
      setSavedIndicator(weight === 'bold' ? 'تم جعل الآية ثخينة' : 'تم جعل الآية رفيعة');
      return;
    }

    // إذا كان هناك نص محدد في فقرة عادية
    if (!sel.isCollapsed && sel.toString().trim().length > 0) {
      const isCurrentlyBold = document.queryCommandState('bold');
      if ((weight === 'bold' && !isCurrentlyBold) || (weight === 'regular' && isCurrentlyBold)) {
        document.execCommand('bold');
      }
      if (parentVerse) {
        parentVerse.setAttribute('data-weight', weight);
      }
      recordEditorSnapshot();
      setSavedIndicator(weight === 'bold' ? 'تم جعل المحدد ثخيناً' : 'تم جعل المحدد رفيعاً');
      return;
    }

    // إذا لم يكن هناك نص محدد داخل فقرة عادية نطبق السماكة على الفقرة الحالية
    if (parentBlock && editorRef.current.contains(parentBlock)) {
      parentBlock.setAttribute('data-weight', weight);
      parentBlock.querySelectorAll('.quran-verse').forEach((v) => {
        v.setAttribute('data-weight', weight);
      });
      recordEditorSnapshot();
      setSavedIndicator(weight === 'bold' ? 'تم جعل النص ثخيناً' : 'تم جعل النص رفيعاً');
    }
  };

  // 2.5. أداة تنسيق الآيات القرآنية ﴿ ﴾ مع الخط المخصص (للاختصار السريع Alt + Q)
  const handleFormatQuranVerse = () => {
    if (!editorRef.current) return;

    let sel = window.getSelection();
    if (!sel || !sel.rangeCount || !editorRef.current.contains(sel.anchorNode)) {
      restoreSelectionRange();
      sel = window.getSelection();
    }

    if (!sel) return;

    const anchorElement =
      sel.anchorNode?.nodeType === Node.ELEMENT_NODE
        ? (sel.anchorNode as HTMLElement)
        : sel.anchorNode?.parentElement;
    const existingVerseEl = anchorElement?.closest('.quran-verse') as HTMLElement | null;

    if (existingVerseEl && editorRef.current.contains(existingVerseEl)) {
      const plainVerseText = cleanVerseText(existingVerseEl.textContent || '');
      const textNode = document.createTextNode(plainVerseText);
      existingVerseEl.replaceWith(textNode);

      const newRange = document.createRange();
      newRange.selectNodeContents(textNode);
      sel.removeAllRanges();
      sel.addRange(newRange);
      savedRangeRef.current = newRange.cloneRange();

      setIsPlusMenuOpen(false);
      recordEditorSnapshot();
      setSavedIndicator('تم إزالة تنسيق الآية');
      return;
    }

    const selectedText = sel.toString().trim();
    if (selectedText.length > 0 && editorRef.current.contains(sel.anchorNode)) {
      const verseHtml = `${buildQuranVerseHtml(selectedText)}&nbsp;`;
      document.execCommand('insertHTML', false, verseHtml);
      setIsPlusMenuOpen(false);
      recordEditorSnapshot();
      setSavedIndicator('تم تنسيق الآية ﴿ ﴾');
      return;
    }

    handleSelectQuoteTemplate('quran');
  };

  // 3. أزرار القوائم (منقطة / مرقمة) والعناوين الفرعية
  const handleInsertList = (ordered: boolean) => {
    focusEditorIfNeeded();
    document.execCommand(ordered ? 'insertOrderedList' : 'insertUnorderedList');
    setIsListMenuOpen(false);
    recordEditorSnapshot();
  };

  const handleInsertSubheading = () => {
    focusEditorIfNeeded();
    document.execCommand('formatBlock', false, 'h2');
    setIsPlusMenuOpen(false);
    recordEditorSnapshot();
  };

  // 4. إضافة رابط (URL + تسمية اختيارية) كعنصر DOM صريح يضمن بقاء وسم <a href="..."> بعد الحفظ والنشر
  const handleOpenLinkModal = () => {
    saveSelectionRange();
    const sel = window.getSelection();
    const selectedText = sel ? sel.toString().trim() : '';
    setLinkLabel(selectedText);
    setLinkUrl('');
    setIsLinkModalOpen(true);
    setIsPlusMenuOpen(false);
    setIsListMenuOpen(false);
    setIsTemplateMenuOpen(false);
  };

  const handleConfirmInsertLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim() || !editorRef.current) return;
    const rawTrimmed = linkUrl.trim();
    const normalizedUrl =
      rawTrimmed.startsWith('http://') ||
      rawTrimmed.startsWith('https://') ||
      rawTrimmed.startsWith('mailto:') ||
      rawTrimmed.startsWith('#/')
        ? rawTrimmed
        : `https://${rawTrimmed}`;

    const displayLabel = linkLabel.trim() || normalizedUrl;

    // إنشاء عنصر الرابط كعقدة DOM صريحة حتى لا يفقد المتصفح خصائص href و target
    const linkEl = document.createElement('a');
    linkEl.setAttribute('href', normalizedUrl);
    linkEl.setAttribute('target', '_blank');
    linkEl.setAttribute('rel', 'noopener noreferrer');
    linkEl.className =
      'text-[#E05324] dark:text-[#F06438] underline underline-offset-4 font-bold';
    linkEl.textContent = displayLabel;

    const trailingSpace = document.createTextNode(' ');

    const savedRange = savedRangeRef.current;
    let targetRange: Range | null = null;

    if (
      savedRange &&
      editorRef.current.contains(savedRange.commonAncestorContainer)
    ) {
      targetRange = savedRange.cloneRange();
      targetRange.deleteContents();

      // إذا كان المؤشر على جذر المحرر مباشرة بدون فقرة، ننشئ فقرة <p> لاحتواء الرابط
      if (targetRange.startContainer === editorRef.current) {
        const p = document.createElement('p');
        p.appendChild(linkEl);
        p.appendChild(trailingSpace);
        targetRange.insertNode(p);
      } else {
        const frag = document.createDocumentFragment();
        frag.appendChild(linkEl);
        frag.appendChild(trailingSpace);
        targetRange.insertNode(frag);
      }
    } else {
      // إذا لم يكن هناك مؤشر محفوظ داخل المحرر، ندرج الرابط في نهاية آخر فقرة أو ننشئ فقرة جديدة
      let lastBlock = editorRef.current.lastElementChild as HTMLElement | null;
      if (
        !lastBlock ||
        (lastBlock.tagName !== 'P' &&
          lastBlock.tagName !== 'BLOCKQUOTE' &&
          lastBlock.tagName !== 'LI')
      ) {
        const p = document.createElement('p');
        editorRef.current.appendChild(p);
        lastBlock = p;
      }
      lastBlock.appendChild(linkEl);
      lastBlock.appendChild(trailingSpace);
    }

    // وضع المؤشر بعد الرابط مباشرة
    editorRef.current.focus();
    const sel = window.getSelection();
    if (sel && trailingSpace.parentNode) {
      const nextRange = document.createRange();
      nextRange.setStartAfter(trailingSpace);
      nextRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(nextRange);
      savedRangeRef.current = nextRange.cloneRange();
    }

    setIsLinkModalOpen(false);
    setLinkUrl('');
    setLinkLabel('');
    recordEditorSnapshot();
    setSavedIndicator('تم إدراج الرابط بنجاح');
  };

  // 4.5. إدارة صندوق المراجع والإحالات المرجعية أسفل المقال
  const handleOpenFootnotesBox = () => {
    setIsFootnotesBoxVisible(true);
    setFootnotes((prev) => {
      if (prev.length === 0) {
        return [{ id: 1, text: '' }];
      }
      return prev;
    });
    setIsTemplateMenuOpen(false);
    setIsPlusMenuOpen(false);
    setSavedIndicator('تم تفعيل صندوق المراجع والإحالات');
    setTimeout(() => {
      footnotesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  };

  const handleAddFootnoteItem = () => {
    setIsFootnotesBoxVisible(true);
    setFootnotes((prev) => [
      ...prev,
      { id: prev.length + 1, text: '' },
    ]);
  };

  const handleUpdateFootnoteText = (index: number, newText: string) => {
    setFootnotes((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, text: newText } : item))
    );
  };

  const handleRemoveFootnoteItem = (index: number) => {
    setFootnotes((prev) => {
      const filtered = prev
        .filter((_, idx) => idx !== index)
        .map((item, idx) => ({ ...item, id: idx + 1 }));
      if (filtered.length === 0) {
        setIsFootnotesBoxVisible(false);
      }
      return filtered;
    });
    setSavedIndicator('تم حذف الإحالة المرجعية');
  };

  const handleInsertFootnoteMarkerInText = (footnoteNumber: number) => {
    if (!editorRef.current) return;
    restoreSelectionRange();
    focusEditorIfNeeded();
    const sel = window.getSelection();
    const markerText = document.createTextNode(` [${footnoteNumber}] `);
    if (sel && sel.rangeCount > 0 && editorRef.current.contains(sel.anchorNode)) {
      const r = sel.getRangeAt(0);
      r.deleteContents();
      r.insertNode(markerText);
      r.setStartAfter(markerText);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);
      savedRangeRef.current = r.cloneRange();
    } else {
      let lastP = editorRef.current.lastElementChild as HTMLElement | null;
      if (!lastP || lastP.tagName !== 'P') {
        lastP = document.createElement('p');
        editorRef.current.appendChild(lastP);
      }
      lastP.appendChild(markerText);
    }
    recordEditorSnapshot();
    setSavedIndicator(`أُدرجت الإشارة المرجعية [${footnoteNumber}] في المتن`);
  };

  // 5. قائمة الإضافة المتقدمة (+): صورة، فيديو، فاصل
  const handleInsertDivider = () => {
    focusEditorIfNeeded();
    const dividerHtml = `<hr data-block-type="divider" class="my-8 border-t-2 border-[#E6E2D8] dark:border-[#2A2724] w-28 mx-auto" /><p><br></p>`;
    document.execCommand('insertHTML', false, dividerHtml);
    setIsPlusMenuOpen(false);
    recordEditorSnapshot();
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrlInput(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmInsertImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;
    restoreSelectionRange();
    focusEditorIfNeeded();

    const captionHtml = imageCaptionInput.trim()
      ? `<figcaption class="mt-2 text-center text-[13.5px] text-[#78736A]">${imageCaptionInput.trim()}</figcaption>`
      : '';
    const figureHtml = `<figure data-block-type="image" contenteditable="false" class="group/media relative my-8 rounded-2xl overflow-hidden border border-[#E6E2D8] dark:border-[#2A2724] bg-[#EFECE6] dark:bg-[#1D1B19] p-2"><button type="button" data-action="delete-media" title="حذف الصورة من المقال" class="font-ui absolute top-4 left-4 z-20 inline-flex items-center gap-1.5 rounded-xl bg-[#141413]/85 hover:bg-[#DC2626] px-3 py-1.5 text-[12.5px] font-bold text-[#F9F7F2] shadow-lg backdrop-blur-sm transition-colors cursor-pointer"><span>✕</span><span>حذف الصورة</span></button><img src="${imageUrlInput.trim()}" alt="${
      imageCaptionInput.trim() || 'صورة المقال'
    }" class="w-full rounded-xl object-cover max-h-[420px]" />${captionHtml}</figure><p><br></p>`;

    document.execCommand('insertHTML', false, figureHtml);
    setIsImageModalOpen(false);
    setImageUrlInput('');
    setImageCaptionInput('');
    recordEditorSnapshot();
    setSavedIndicator('تم إدراج الصورة في المقال');
  };

  const handleConfirmInsertVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrlInput.trim()) return;
    restoreSelectionRange();
    focusEditorIfNeeded();

    const captionHtml = videoCaptionInput.trim()
      ? `<figcaption class="mt-2 text-center text-[13.5px] text-[#78736A]">${videoCaptionInput.trim()}</figcaption>`
      : '';
    const videoBlockHtml = `<div data-block-type="video" data-video-url="${videoUrlInput.trim()}" contenteditable="false" class="group/media relative my-8 rounded-2xl border border-[#E6E2D8] dark:border-[#2A2724] bg-[#EFECE6] dark:bg-[#1D1B19] p-5 text-center"><button type="button" data-action="delete-media" title="حذف الفيديو من المقال" class="font-ui absolute top-3.5 left-3.5 z-20 inline-flex items-center gap-1.5 rounded-xl bg-[#141413]/85 hover:bg-[#DC2626] px-3 py-1.5 text-[12px] font-bold text-[#F9F7F2] shadow-md transition-colors cursor-pointer"><span>✕</span><span>حذف الفيديو</span></button><p class="font-ui text-[14px] font-bold text-[#E05324] !mb-1">فيديو مضمّن في المقال</p><p class="font-ui text-[13px] text-[#4A4742] dark:text-[#B8B3AA] truncate !mb-0">${videoUrlInput.trim()}</p>${captionHtml}</div><p><br></p>`;

    document.execCommand('insertHTML', false, videoBlockHtml);
    setIsVideoModalOpen(false);
    setVideoUrlInput('');
    setVideoCaptionInput('');
    recordEditorSnapshot();
    setSavedIndicator('تم إدراج الفيديو في المقال');
  };

  // بناء كائن المقال الكامل للنشر أو لحفظ تعديلات مقال موجود
  const buildArticleObject = (): Article => {
    const selectedCategory =
      CATEGORIES.find((c) => c.slug === categorySlug) || CATEGORIES[0];
    const rawHtml = editorRef.current?.innerHTML || '';
    const parsedBlocks = parseEditorHtmlToBlocks(rawHtml);
    const plainText = editorRef.current?.innerText.trim() || '';
    const wordCount = plainText.split(/\s+/).filter(Boolean).length;
    const readingTimeMinutes = Math.max(2, Math.ceil(wordCount / 180));

    const slugBase =
      title
        .trim()
        .toLowerCase()
        .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 45) || 'post';

    const monthsAr = [
      'يناير',
      'فبراير',
      'مارس',
      'أبريل',
      'مايو',
      'يونيو',
      'يوليو',
      'أغسطس',
      'سبتمبر',
      'أكتوبر',
      'نوفمبر',
      'ديسمبر',
    ];
    const now = new Date();
    const publishedAt =
      editingArticle?.publishedAt ||
      `${now.getDate()} ${monthsAr[now.getMonth()]} ${now.getFullYear()}`;

    const cleanedFootnotes: Footnote[] = footnotes
      .map((fn) => ({ ...fn, text: fn.text.trim() }))
      .filter((fn) => fn.text.length > 0)
      .map((fn, idx) => ({ id: idx + 1, text: fn.text }));

    return {
      id: editingArticle?.id || `custom-${Date.now()}`,
      slug: editingArticle?.slug || `${slugBase}-${Date.now().toString().slice(-4)}`,
      title: title.trim() || 'مقال جديد بدون عنوان',
      subtitle:
        subtitle.trim() ||
        plainText.slice(0, 140) ||
        'مبحث جديد في الشريعة والحياة.',
      excerpt:
        subtitle.trim() ||
        plainText.slice(0, 165) + (plainText.length > 165 ? '...' : ''),
      categorySlug: selectedCategory.slug,
      categoryName: selectedCategory.name,
      seriesName: seriesName.trim() || 'مباحث عامة',
      authorSlug: selectedAuthorSlug,
      blogTitle:
        siteConfig.writers.find((w) => w.slug === selectedAuthorSlug)?.blogTitle ||
        editingArticle?.blogTitle ||
        'مدونة براء العامري',
      author: (() => {
        const matched = siteConfig.writers.find((w) => w.slug === selectedAuthorSlug);
        if (matched) {
          return {
            name: matched.name,
            role: matched.role,
            avatar: matched.avatar,
            bio: matched.bio,
            slug: matched.slug,
            blogTitle: matched.blogTitle,
          };
        }
        return editingArticle?.author || BLOG_META.author;
      })(),
      publishedAt,
      hijriDate: editingArticle?.hijriDate || '1448 هـ',
      readingTimeMinutes,
      isFeatured,
      isCuratedStar,
      coverImage,
      coverCaption: coverCaption.trim(),
      tags: tagsInput
        .split(/[،,]/)
        .map((t) => t.trim())
        .filter(Boolean),
      content:
        parsedBlocks.length > 0
          ? parsedBlocks
          : [
              {
                type: 'paragraph',
                text: subtitle.trim() || 'نص المقال...',
                dropCap: true,
              },
            ],
      ...(cleanedFootnotes.length > 0 ? { footnotes: cleanedFootnotes } : {}),
    };
  };

  const handlePublishConfirm = () => {
    const article = buildArticleObject();
    if (!editingArticle) {
      clearStudioDraft();
    }
    onSaveArticle(article, Boolean(editingArticle));
  };

  const handleCopyArticleCode = async () => {
    const article = buildArticleObject();
    const codeSnippet = JSON.stringify(article, null, 2);
    try {
      await navigator.clipboard.writeText(codeSnippet);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleCopyAllSiteArticlesJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(siteArticles, null, 2));
      setCopiedAllSiteCode(true);
      setTimeout(() => setCopiedAllSiteCode(false), 2500);
    } catch {
      // ignore
    }
  };

  // تصفية المقالات في قسم "تحرير محتوى الموقع"
  const filteredSiteArticles = useMemo(() => {
    const q = managerSearch.trim().toLowerCase();
    return siteArticles.filter((art) => {
      const matchesCat =
        managerCategoryFilter === 'all' || art.categorySlug === managerCategoryFilter;
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        art.title.toLowerCase().includes(q) ||
        art.subtitle.toLowerCase().includes(q) ||
        art.excerpt.toLowerCase().includes(q) ||
        art.categoryName.toLowerCase().includes(q)
      );
    });
  }, [siteArticles, managerSearch, managerCategoryFilter]);

  return (
    <div className="min-h-screen bg-[#F9F7F2] dark:bg-[#121110] text-[#141413] dark:text-[#F5F3EF] pb-32">
      {/* ==========================================================================
          1. الشريط العلوي (Substack-Style Top Bar + التبديل بين الخيارين)
         ========================================================================== */}
      <header className="sticky top-0 z-30 border-b border-[#E6E2D8] dark:border-[#2A2724] bg-[#F9F7F2]/95 dark:bg-[#121110]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5">
          {/* يمين: زر إلغاء للخروج إلى الموقع + مبدّل الخيارين */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="font-ui rounded-xl px-3.5 py-2 text-[14.5px] font-bold text-[#57534E] dark:text-[#A8A29E] hover:bg-[#EFECE6] dark:hover:bg-[#23201D] hover:text-[#141413] dark:hover:text-[#F5F3EF] transition-colors cursor-pointer"
            >
              إلغاء
            </button>

            {/* مبدّل الخيارات الثلاثة: ١. محرر الكتابة | ٢. تحرير محتوى الموقع | ٣. إدارة */}
            <div className="font-ui inline-flex items-center rounded-xl bg-[#EFECE6] dark:bg-[#1D1B19] p-1">
              <button
                type="button"
                onClick={() => setActiveTab('writer-editor')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13.5px] font-bold transition-all cursor-pointer ${
                  activeTab === 'writer-editor'
                    ? 'bg-[#141413] dark:bg-[#F5F3EF] text-[#F9F7F2] dark:text-[#141413] shadow-xs'
                    : 'text-[#57534E] dark:text-[#A8A29E] hover:text-[#141413] dark:hover:text-[#F5F3EF]'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>محرر الكتابة</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('site-content')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13.5px] font-bold transition-all cursor-pointer ${
                  activeTab === 'site-content'
                    ? 'bg-[#141413] dark:bg-[#F5F3EF] text-[#F9F7F2] dark:text-[#141413] shadow-xs'
                    : 'text-[#57534E] dark:text-[#A8A29E] hover:text-[#141413] dark:hover:text-[#F5F3EF]'
                }`}
              >
                <FolderEdit className="w-3.5 h-3.5" />
                <span>تحرير المحتوى ({siteArticles.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('site-admin')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13.5px] font-bold transition-all cursor-pointer ${
                  activeTab === 'site-admin'
                    ? 'bg-[#E05324] text-white shadow-xs'
                    : 'text-[#57534E] dark:text-[#A8A29E] hover:text-[#141413] dark:hover:text-[#F5F3EF]'
                }`}
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>إدارة</span>
              </button>
            </div>
          </div>

          {/* يسار: اسم الكاتب وصورته الرمزية + إعدادات الأمان + مؤشر زر "نشر / حفظ" */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="hidden md:flex items-center gap-2 rounded-full bg-[#EFECE6] dark:bg-[#1D1B19] py-1 pr-1.5 pl-3">
              <img
                src={BLOG_META.author.avatar}
                alt={BLOG_META.author.name}
                className="h-6 w-6 rounded-full object-cover"
              />
              <span className="font-ui text-[13px] font-bold text-[#141413] dark:text-[#F5F3EF]">
                {BLOG_META.author.name}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setStudioSessionActive(false);
                signOutAdmin().catch(() => {});
                onCancel();
              }}
              aria-label="تسجيل خروج من الاستوديو"
              title="تسجيل الخروج وقفل جلسة الاستوديو"
              className="font-ui rounded-xl p-2 text-[#78736A] hover:bg-[#EFECE6] dark:hover:bg-[#23201D] hover:text-[#E05324] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {activeTab === 'writer-editor' && (
              <button
                type="button"
                onClick={() => setIsPublishDrawerOpen(true)}
                disabled={!title.trim() && isEditorEmpty}
                className={`font-ui inline-flex items-center gap-2 rounded-xl px-4 sm:px-5 py-2 text-[14.5px] font-bold transition-all ${
                  title.trim() || !isEditorEmpty
                    ? 'bg-[#E05324] text-white hover:bg-[#c94519] shadow-xs cursor-pointer'
                    : 'bg-[#EFECE6] dark:bg-[#23201D] text-[#78736A] cursor-not-allowed'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-white" />
                <span>{editingArticle ? 'حفظ التعديلات' : 'نشر'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* إشعار علوي سريع عند الحفظ أو الحذف */}
      {statusBanner && (
        <div className="mx-auto max-w-4xl px-4 pt-4">
          <div className="font-ui flex items-center justify-between rounded-2xl bg-[#141413] dark:bg-[#F5F3EF] px-4 py-3 text-[14px] font-bold text-[#F9F7F2] dark:text-[#141413] shadow-md">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#E05324]" />
              <span>{statusBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              className="opacity-70 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==========================================================================
          الخيار الأول: محرر الكتابة (Substack-Style Editor)
         ========================================================================== */}
      {activeTab === 'writer-editor' && (
        <>
          <main className="mx-auto max-w-[700px] px-4 sm:px-6 pt-8 sm:pt-12">
            {/* شريط تنبيه إذا كان الكاتب يعدّل مقالاً موجوداً من مقالات الموقع */}
            {editingArticle && (
              <div className="font-ui mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E05324]/40 bg-[#E05324]/10 px-4 py-3">
                <div className="flex items-center gap-2 text-[13.5px] font-bold text-[#E05324] dark:text-[#F06438]">
                  <Edit3 className="w-4 h-4 shrink-0" />
                  <span>أنت الآن تعدّل مقال: «{editingArticle.title}»</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('site-content')}
                    className="rounded-xl bg-[#EFECE6] dark:bg-[#23201D] px-3 py-1.5 text-[12.5px] font-bold text-[#141413] dark:text-[#F5F3EF] hover:opacity-90 cursor-pointer"
                  >
                    العودة لقائمة المقالات
                  </button>
                  <button
                    type="button"
                    onClick={handleStartFreshNewArticle}
                    className="rounded-xl bg-[#141413] dark:bg-[#F5F3EF] px-3 py-1.5 text-[12.5px] font-bold text-[#F9F7F2] dark:text-[#141413] hover:opacity-90 cursor-pointer"
                  >
                    + مقال جديد فارغ
                  </button>
                </div>
              </div>
            )}

            {/* حقل "العنوان" بخط العناوين الكبرى (--font-display: Thmanyah Serif Display Bold) */}
            <textarea
              ref={titleTextareaRef}
              rows={1}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="العنوان"
              className="font-display w-full resize-none overflow-hidden bg-transparent text-[32px] sm:text-[42px] font-bold leading-[1.32] tracking-tight text-[#141413] dark:text-[#F5F3EF] placeholder:text-[#A8A29E] dark:placeholder:text-[#57534E] focus:outline-none"
            />

            {/* حقل "أضف عنواناً فرعياً..." بخط المتن المتوسط (--font-prose: Thmanyah Serif Text Medium) */}
            <textarea
              ref={subtitleTextareaRef}
              rows={1}
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="أضف عنواناً فرعياً..."
              className="font-prose font-medium mt-3 w-full resize-none overflow-hidden bg-transparent text-[19px] sm:text-[22px] leading-[1.65] text-[#4A4742] dark:text-[#B8B3AA] placeholder:text-[#A8A29E] dark:placeholder:text-[#57534E] focus:outline-none"
            />

            {/* شريحة الكاتب وصورته الرمزية وتصنيف المقال */}
            <div className="font-ui my-6 flex flex-wrap items-center justify-between gap-3 border-y border-[#E6E2D8]/80 dark:border-[#2A2724] py-3.5">
              <div className="flex items-center gap-2.5">
                <img
                  src={BLOG_META.author.avatar}
                  alt={BLOG_META.author.name}
                  className="h-8 w-8 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/10"
                />
                <span className="text-[14.5px] font-bold text-[#E05324] dark:text-[#F06438]">
                  {BLOG_META.author.name}
                </span>
                <span className="text-[12.5px] text-[#78736A]">• {savedIndicator}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[13px] text-[#78736A]">التصنيف:</span>
                <select
                  value={categorySlug}
                  onChange={(e) => setCategorySlug(e.target.value)}
                  aria-label="تصنيف المقال"
                  className="rounded-xl bg-[#EFECE6] dark:bg-[#1D1B19] px-3 py-1.5 text-[13.5px] font-bold text-[#141413] dark:text-[#F5F3EF] focus:outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* مساحة "ابدأ كتابة مقال..." بخط القراءة (--font-prose: Thmanyah Serif Text Regular) */}
            <div className="relative mt-6 min-h-[420px]">
              {isEditorEmpty && (
                <div
                  onClick={() => editorRef.current?.focus()}
                  className="font-prose pointer-events-none absolute top-0 right-0 text-[18.5px] leading-[1.92] text-[#A8A29E] dark:text-[#57534E]"
                >
                  ابدأ كتابة مقال...
                </div>
              )}

              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={recordEditorSnapshot}
                onBlur={recordEditorSnapshot}
                onMouseUp={saveSelectionRange}
                onKeyUp={saveSelectionRange}
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  // خيار حذف الصورة أو الفيديو المدرج داخل المقال بنقرة واحدة
                  const deleteMediaBtn = target.closest('[data-action="delete-media"]');
                  if (deleteMediaBtn && editorRef.current?.contains(deleteMediaBtn)) {
                    e.preventDefault();
                    e.stopPropagation();
                    const mediaBlock = deleteMediaBtn.closest(
                      'figure[data-block-type="image"], div[data-block-type="video"], figure'
                    );
                    if (mediaBlock) {
                      mediaBlock.remove();
                      recordEditorSnapshot();
                      setSavedIndicator('تم حذف العنصر من المقال');
                    }
                  }
                }}
                onKeyDown={(e) => {
                  // اختصار لوحة المفاتيح Alt + Q لتنسيق النص المحدد كآية قرآنية ﴿ ﴾
                  if (e.altKey && (e.key === 'q' || e.key === 'Q' || e.key === 'ض')) {
                    e.preventDefault();
                    handleFormatQuranVerse();
                    return;
                  }

                  // عند الضغط على Enter داخل قالب الاقتباس أو الآية أو صندوق الإضاءة المنهجية:
                  if (e.key === 'Enter' && !e.shiftKey) {
                    const sel = window.getSelection();
                    if (sel && sel.rangeCount > 0) {
                      const anchorEl =
                        sel.anchorNode?.nodeType === Node.ELEMENT_NODE
                          ? (sel.anchorNode as HTMLElement)
                          : sel.anchorNode?.parentElement;

                      // 1. إذا كان المؤشر في عنوان صندوق الإضاءة: ينتقل بضغطة Enter إلى متن القاعدة تحته مباشرة
                      const calloutTitle = anchorEl?.closest(
                        '[data-callout-title], .basair-callout-title'
                      ) as HTMLElement | null;
                      if (calloutTitle && editorRef.current?.contains(calloutTitle)) {
                        e.preventDefault();
                        const parentCallout = calloutTitle.closest('aside');
                        const bodyEl = parentCallout?.querySelector(
                          '[data-callout-body], .basair-callout-body'
                        );
                        if (bodyEl) {
                          const bodyRange = document.createRange();
                          bodyRange.selectNodeContents(bodyEl);
                          bodyRange.collapse(false);
                          sel.removeAllRanges();
                          sel.addRange(bodyRange);
                          savedRangeRef.current = bodyRange.cloneRange();
                        }
                        return;
                      }

                      // 2. إذا كان المؤشر داخل قالب الاقتباس/الآية أو داخل متن صندوق الإضاءة: يخرج فوراً إلى فقرة كتابة عادية أسفله
                      const parentTemplate = anchorEl?.closest(
                        'blockquote, aside[data-block-type="callout"], .basair-callout-box'
                      ) as HTMLElement | null;

                      if (parentTemplate && editorRef.current?.contains(parentTemplate)) {
                        e.preventDefault();
                        const nextParagraph = document.createElement('p');
                        nextParagraph.innerHTML = '<br>';
                        parentTemplate.after(nextParagraph);

                        const newRange = document.createRange();
                        newRange.setStart(nextParagraph, 0);
                        newRange.collapse(true);
                        sel.removeAllRanges();
                        sel.addRange(newRange);
                        savedRangeRef.current = newRange.cloneRange();

                        recordEditorSnapshot();
                        setSavedIndicator('تم الخروج من القالب لمتابعة كتابة المقال');
                      }
                    }
                  }
                }}
                className="article-prose font-prose min-h-[420px] w-full text-[18.5px] leading-[1.92] text-[#141413] dark:text-[#F5F3EF] focus:outline-none [&_ul]:list-disc [&_ul]:pr-6 [&_ul]:my-4 [&_ol]:list-decimal [&_ol]:pr-6 [&_ol]:my-4 [&_h2]:text-[25px] [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3"
              />
            </div>

            {/* ==========================================================================
                صندوق المراجع والإحالات المرجعية داخل محرر الكتابة (متوافق مع الوضعين النهاري والليلي)
               ========================================================================== */}
            {isFootnotesBoxVisible ? (
              <section
                ref={footnotesSectionRef}
                aria-label="صندوق المراجع والإحالات"
                className="basair-callout-box mt-10 rounded-[20px] p-5 sm:p-7"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 font-prose text-[16px] font-bold text-[#E05324] dark:text-[#F06438]">
                    <CuratedStarIcon className="w-4.5 h-4.5 shrink-0" />
                    <span>الإحالات والمصادر المرجعية</span>
                  </div>

                  <div className="font-ui flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddFootnoteItem}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#E05324] px-3 py-1.5 text-[12.5px] font-bold text-white hover:bg-[#c94519] transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة مرجع</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFootnotes([]);
                        setIsFootnotesBoxVisible(false);
                        setSavedIndicator('تم إغلاق صندوق المراجع والإحالات');
                      }}
                      title="حذف صندوق المراجع بالكامل"
                      className="inline-flex items-center gap-1 rounded-xl border border-[#D5CCB8] dark:border-[#2E2A26] px-2.5 py-1.5 text-[12px] font-bold text-[#78736A] hover:text-[#DC2626] hover:border-[#DC2626]/40 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>إزالة الصندوق</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {footnotes.map((fn, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 rounded-xl border border-[#D5CCB8]/80 dark:border-[#2E2A26] bg-[#F9F7F2]/80 dark:bg-[#141311]/70 p-2.5"
                    >
                      <div className="font-ui flex items-center justify-between sm:justify-start gap-2 shrink-0">
                        <span className="inline-flex h-7 min-w-[32px] items-center justify-center rounded-lg bg-[#E05324]/12 dark:bg-[#F06438]/15 px-2 text-[13px] font-bold text-[#E05324] dark:text-[#F06438] tabular-nums">
                          [{idx + 1}]
                        </span>

                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleInsertFootnoteMarkerInText(idx + 1)}
                          title={`إدراج الرقم [${idx + 1}] عند موضع المؤشر في نص المقال`}
                          className="rounded-lg border border-[#D5CCB8] dark:border-[#2E2A26] bg-[#EFECE6] dark:bg-[#23201D] px-2.5 py-1 text-[11.5px] font-bold text-[#4A4742] dark:text-[#B8B3AA] hover:text-[#E05324] dark:hover:text-[#F06438] transition-colors cursor-pointer whitespace-nowrap"
                        >
                          + أدرج [{idx + 1}] بالمتن
                        </button>
                      </div>

                      <input
                        type="text"
                        value={fn.text}
                        onChange={(e) => handleUpdateFootnoteText(idx, e.target.value)}
                        placeholder={`اكتب المرجع أو المصدر للإحالة [${idx + 1}] (مثال: الموافقات للشاطبي، ج٢، ص١٤٥)...`}
                        className="font-prose flex-1 bg-transparent px-2 py-1 text-[14.5px] text-[#141413] dark:text-[#F5F3EF] placeholder:text-[#78736A]/70 focus:outline-none"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveFootnoteItem(idx)}
                        title="حذف هذا المرجع"
                        className="font-ui self-end sm:self-center inline-flex items-center justify-center rounded-lg p-1.5 text-[#78736A] hover:bg-[#DC2626]/10 hover:text-[#DC2626] transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <div className="mt-8 flex justify-start">
                <button
                  type="button"
                  onClick={handleOpenFootnotesBox}
                  className="font-ui inline-flex items-center gap-2 rounded-2xl border border-dashed border-[#CFC6B4] dark:border-[#332F2B] bg-[#EFECE6]/45 dark:bg-[#181614]/60 px-4 py-2.5 text-[13px] font-bold text-[#57534E] dark:text-[#A8A29E] hover:border-[#E05324] dark:hover:border-[#F06438] hover:text-[#E05324] dark:hover:text-[#F06438] transition-colors cursor-pointer"
                >
                  <CuratedStarIcon className="w-4 h-4 shrink-0" />
                  <span>+ إضافة صندوق المراجع والإحالات المرجعية</span>
                </button>
              </div>
            )}
          </main>

          {/* شريط الأدوات السفلي العائم (Substack Floating Bottom Toolbar) */}
          <div className="fixed bottom-5 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
            <div className="pointer-events-auto relative flex items-center gap-1 sm:gap-2 rounded-2xl border border-[#D6CEBE] dark:border-[#332F2B] bg-[#F9F7F2]/95 dark:bg-[#1C1A17]/95 px-3 py-2 shadow-xl backdrop-blur-md">
              {/* 1. زر التراجع (Undo) */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleUndo}
                title="تراجع عن آخر خطوة"
                aria-label="تراجع"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[#141413] dark:text-[#F5F3EF] hover:bg-[#EFECE6] dark:hover:bg-[#2A2724] transition-colors cursor-pointer"
              >
                <Undo2 className="h-5 w-5" />
              </button>

              <span className="h-5 w-[1px] bg-[#E6E2D8] dark:bg-[#2E2A26]" />

              {/* 2. زر اختيار القالب الموحّد (تنبثق منه دوائر الخيارات: اقتباس | آية | حديث | قاعدة وإضاءة | مراجع وإحالات) */}
              <div className="relative">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    saveSelectionRange();
                  }}
                  onClick={() => {
                    setIsTemplateMenuOpen((v) => !v);
                    setIsListMenuOpen(false);
                    setIsPlusMenuOpen(false);
                  }}
                  title="اختيار قالب (اقتباس، آية، حديث، قاعدة، أو صندوق المراجع)"
                  aria-label="اختيار قالب"
                  className={`flex h-10 items-center gap-1.5 rounded-xl border px-2.5 transition-all cursor-pointer ${
                    isTemplateMenuOpen
                      ? 'border-[#E05324] bg-[#E05324]/12 text-[#E05324] dark:border-[#FFD24C] dark:bg-[#FFD24C]/15 dark:text-[#FFD24C]'
                      : 'border-[#E5A93C]/45 dark:border-[#F5B800]/30 bg-[#F5B800]/10 dark:bg-[#F5B800]/12 text-[#141413] dark:text-[#F5F3EF] hover:bg-[#F5B800]/22 dark:hover:bg-[#F5B800]/22'
                  }`}
                >
                  <CuratedStarIcon className="h-4 w-4 shrink-0" />
                  <span className="font-ui text-[12.5px] font-bold">القالب</span>
                </button>

                {/* الدوائر المنبثقة لاختيار نوع القالب (اقتباس / آية / حديث / قاعدة وإضاءة / المراجع والإحالات) */}
                {isTemplateMenuOpen && (
                  <div className="font-ui absolute bottom-14 left-1/2 -translate-x-1/2 z-50 flex items-end gap-2.5 sm:gap-3.5 pb-1">
                    {/* 1. دائرة خيار: اقتباس (النجمة بداخلها علامة التنصيص 99) */}
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectQuoteTemplate('quote')}
                      title="قالب اقتباس بنجمة علامة التنصيص"
                      className="group/opt flex flex-col items-center gap-1.5 cursor-pointer transition-transform duration-200 hover:-translate-y-1"
                    >
                      <span className="flex h-15 w-15 sm:h-16 sm:w-16 items-center justify-center rounded-full border-2 border-[#D6CEBE] dark:border-[#FFD24C]/40 bg-[#F9F7F2] dark:bg-[#181715] shadow-[0_10px_25px_rgba(20,20,19,0.18)] dark:shadow-[0_12px_28px_rgba(0,0,0,0.75)] group-hover/opt:border-[#E05324] dark:group-hover/opt:border-[#FFD24C] transition-colors">
                        <BasairQuoteStarBadge variant="quote" className="w-10 h-10 sm:w-11 sm:h-11" />
                      </span>
                      <span className="rounded-full bg-[#141413] dark:bg-[#F9F7F2] px-2.5 py-0.5 text-[11px] font-bold text-[#F9F7F2] dark:text-[#141413] shadow-sm whitespace-nowrap">
                        اقتباس
                      </span>
                    </button>

                    {/* 2. دائرة خيار: آية (النجمة بداخلها مخطوطة القرآن الكريم + فتح قوس الآية ﴿) */}
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectQuoteTemplate('quran')}
                      title="قالب آية بنجمة مخطوطة القرآن الكريم وفتح القوس ﴿"
                      className="group/opt flex flex-col items-center gap-1.5 cursor-pointer transition-transform duration-200 hover:-translate-y-1"
                    >
                      <span className="flex h-15 w-15 sm:h-16 sm:w-16 items-center justify-center rounded-full border-2 border-[#D6CEBE] dark:border-[#FFD24C]/40 bg-[#F9F7F2] dark:bg-[#181715] shadow-[0_10px_25px_rgba(20,20,19,0.18)] dark:shadow-[0_12px_28px_rgba(0,0,0,0.75)] group-hover/opt:border-[#E05324] dark:group-hover/opt:border-[#FFD24C] transition-colors">
                        <BasairQuoteStarBadge variant="quran" className="w-10 h-10 sm:w-11 sm:h-11" />
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#141413] dark:bg-[#F9F7F2] px-2.5 py-0.5 text-[11px] font-bold text-[#F9F7F2] dark:text-[#141413] shadow-sm whitespace-nowrap">
                        <span>آية</span>
                        <QuranOrnateBracketIcon side="open" className="w-2.5 h-3.5 text-[#FFD24C] dark:text-[#C47A00]" />
                      </span>
                    </button>

                    {/* 3. دائرة خيار: حديث (النجمة بداخلها مخطوطة الحديث النبوي) */}
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectQuoteTemplate('hadith')}
                      title="قالب حديث بنجمة مخطوطة الحديث النبوي الشريف"
                      className="group/opt flex flex-col items-center gap-1.5 cursor-pointer transition-transform duration-200 hover:-translate-y-1"
                    >
                      <span className="flex h-15 w-15 sm:h-16 sm:w-16 items-center justify-center rounded-full border-2 border-[#D6CEBE] dark:border-[#FFD24C]/40 bg-[#F9F7F2] dark:bg-[#181715] shadow-[0_10px_25px_rgba(20,20,19,0.18)] dark:shadow-[0_12px_28px_rgba(0,0,0,0.75)] group-hover/opt:border-[#E05324] dark:group-hover/opt:border-[#FFD24C] transition-colors">
                        <BasairQuoteStarBadge variant="hadith" className="w-10 h-10 sm:w-11 sm:h-11" />
                      </span>
                      <span className="rounded-full bg-[#141413] dark:bg-[#F9F7F2] px-2.5 py-0.5 text-[11px] font-bold text-[#F9F7F2] dark:text-[#141413] shadow-sm whitespace-nowrap">
                        حديث
                      </span>
                    </button>

                    {/* 4. دائرة خيار: صندوق قاعدة منهجية / إضاءة (تصميم مصغّر للصندوق النهاري والليلي مع نجمة بصائر والعنوان البرتقالي) */}
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleSelectCalloutTemplate}
                      title="صندوق قاعدة منهجية / إضاءة (عنوان برتقالي مع نجمة بصائر + متن القاعدة)"
                      className="group/opt flex flex-col items-center gap-1.5 cursor-pointer transition-transform duration-200 hover:-translate-y-1"
                    >
                      <span className="flex h-15 w-15 sm:h-16 sm:w-16 items-center justify-center rounded-full border-2 border-[#D6CEBE] dark:border-[#FFD24C]/40 bg-[#F9F7F2] dark:bg-[#181715] shadow-[0_10px_25px_rgba(20,20,19,0.18)] dark:shadow-[0_12px_28px_rgba(0,0,0,0.75)] group-hover/opt:border-[#E05324] dark:group-hover/opt:border-[#FFD24C] transition-colors p-2.5">
                        {/* معاينة مصغّرة لصندوق القاعدة بالوضعين النهاري والليلي */}
                        <span className="flex w-full flex-col gap-1.5 rounded-lg border border-[#D5CCB8] dark:border-[#2E2A26] bg-[#ECE6DA] dark:bg-[#1D1B19] px-1.5 py-1.5 shadow-inner">
                          <span className="flex items-center gap-1" dir="rtl">
                            <CuratedStarIcon className="h-2.5 w-2.5 shrink-0" />
                            <span className="h-1.5 w-6 rounded-full bg-[#E05324] dark:bg-[#F06438]" />
                          </span>
                          <span className="h-1 w-full rounded-full bg-[#141413]/45 dark:bg-[#F5F3EF]/55" />
                          <span className="h-1 w-4/5 self-start rounded-full bg-[#141413]/30 dark:bg-[#F5F3EF]/35" />
                        </span>
                      </span>
                      <span className="rounded-full bg-[#141413] dark:bg-[#F9F7F2] px-2.5 py-0.5 text-[11px] font-bold text-[#F9F7F2] dark:text-[#141413] shadow-sm whitespace-nowrap">
                        قاعدة / إضاءة
                      </span>
                    </button>

                    {/* 5. دائرة خيار: صندوق المراجع والإحالات المرجعية */}
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleOpenFootnotesBox}
                      title="إضافة صندوق المراجع والإحالات المرجعية [1] [2] أسفل المقال"
                      className="group/opt flex flex-col items-center gap-1.5 cursor-pointer transition-transform duration-200 hover:-translate-y-1"
                    >
                      <span className="flex h-15 w-15 sm:h-16 sm:w-16 items-center justify-center rounded-full border-2 border-[#D6CEBE] dark:border-[#FFD24C]/40 bg-[#F9F7F2] dark:bg-[#181715] shadow-[0_10px_25px_rgba(20,20,19,0.18)] dark:shadow-[0_12px_28px_rgba(0,0,0,0.75)] group-hover/opt:border-[#E05324] dark:group-hover/opt:border-[#FFD24C] transition-colors p-2.5">
                        <span className="flex w-full flex-col gap-1 rounded-lg border border-[#D5CCB8] dark:border-[#2E2A26] bg-[#ECE6DA] dark:bg-[#1D1B19] px-1.5 py-1.5 shadow-inner" dir="rtl">
                          <span className="flex items-center gap-1">
                            <span className="text-[7px] font-extrabold text-[#E05324] dark:text-[#F06438] leading-none">[١]</span>
                            <span className="h-1 flex-1 rounded-full bg-[#141413]/45 dark:bg-[#F5F3EF]/55" />
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="text-[7px] font-extrabold text-[#E05324] dark:text-[#F06438] leading-none">[٢]</span>
                            <span className="h-1 w-3/4 rounded-full bg-[#141413]/35 dark:bg-[#F5F3EF]/40" />
                          </span>
                        </span>
                      </span>
                      <span className="rounded-full bg-[#141413] dark:bg-[#F9F7F2] px-2.5 py-0.5 text-[11px] font-bold text-[#F9F7F2] dark:text-[#141413] shadow-sm whitespace-nowrap">
                        المراجع والإحالات
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* 2.5. زرّا إضافة قوس فتح الآية المزخرف ﴿ وقوس إغلاق الآية المزخرف ﴾ */}
              <div className="inline-flex items-center rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-[#EFECE6]/70 dark:bg-[#23201D] p-0.5">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    saveSelectionRange();
                  }}
                  onClick={() => handleInsertQuranBracket('open')}
                  title="إدراج قوس فتح الآية المزخرف ﴿"
                  aria-label="إدراج قوس فتح الآية"
                  className="flex h-8.5 w-8.5 items-center justify-center rounded-lg text-[#C47A00] dark:text-[#FFD24C] hover:bg-[#F9F7F2] dark:hover:bg-[#2E2A25] transition-colors cursor-pointer"
                >
                  <QuranOrnateBracketIcon side="open" className="w-3.5 h-5" />
                </button>
                <span className="h-4 w-[1px] bg-[#D6CEBE] dark:bg-[#332F2B]" />
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    saveSelectionRange();
                  }}
                  onClick={() => handleInsertQuranBracket('close')}
                  title="إدراج قوس إغلاق الآية المزخرف ﴾"
                  aria-label="إدراج قوس إغلاق الآية"
                  className="flex h-8.5 w-8.5 items-center justify-center rounded-lg text-[#C47A00] dark:text-[#FFD24C] hover:bg-[#F9F7F2] dark:hover:bg-[#2E2A25] transition-colors cursor-pointer"
                >
                  <QuranOrnateBracketIcon side="close" className="w-3.5 h-5" />
                </button>
              </div>

              {/* 2.6. خيار جعل المكتوب ثخيناً (Bold) أو رفيعاً (Regular) */}
              <div className="inline-flex items-center rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-[#EFECE6]/70 dark:bg-[#23201D] p-0.5">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    saveSelectionRange();
                  }}
                  onClick={() => handleSetTextWeight('bold')}
                  title="جعل المكتوب ثخيناً (عريض)"
                  aria-label="جعل المكتوب ثخيناً"
                  className="font-ui flex h-8.5 items-center justify-center rounded-lg px-2 text-[12px] font-extrabold text-[#141413] dark:text-[#F5F3EF] hover:bg-[#F9F7F2] dark:hover:bg-[#2E2A25] transition-colors cursor-pointer"
                >
                  ثخين
                </button>
                <span className="h-4 w-[1px] bg-[#D6CEBE] dark:bg-[#332F2B]" />
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    saveSelectionRange();
                  }}
                  onClick={() => handleSetTextWeight('regular')}
                  title="جعل المكتوب رفيعاً (عادي)"
                  aria-label="جعل المكتوب رفيعاً"
                  className="font-ui flex h-8.5 items-center justify-center rounded-lg px-2 text-[12px] font-normal text-[#4A4742] dark:text-[#B8B3AA] hover:bg-[#F9F7F2] dark:hover:bg-[#2E2A25] transition-colors cursor-pointer"
                >
                  رفيع
                </button>
              </div>

              {/* 3. زر القوائم (منقطة / مرقمة) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsListMenuOpen((v) => !v);
                    setIsPlusMenuOpen(false);
                    setIsTemplateMenuOpen(false);
                  }}
                  title="إدراج قائمة منقطة أو مرقمة"
                  aria-label="القوائم"
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors cursor-pointer ${
                    isListMenuOpen
                      ? 'bg-[#EFECE6] dark:bg-[#2A2724] text-[#E05324]'
                      : 'text-[#141413] dark:text-[#F5F3EF] hover:bg-[#EFECE6] dark:hover:bg-[#2A2724]'
                  }`}
                >
                  <List className="h-5 w-5" />
                </button>

                {isListMenuOpen && (
                  <div className="font-ui absolute bottom-14 right-0 w-44 rounded-2xl border border-[#D6CEBE] dark:border-[#332F2B] bg-[#F9F7F2] dark:bg-[#1C1A17] p-1.5 shadow-xl">
                    <button
                      type="button"
                      onClick={() => handleInsertList(false)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-right text-[14px] font-bold text-[#141413] dark:text-[#F5F3EF] hover:bg-[#EFECE6] dark:hover:bg-[#2A2724]"
                    >
                      <List className="h-4 w-4 text-[#E05324]" />
                      <span>قائمة منقطة</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertList(true)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-right text-[14px] font-bold text-[#141413] dark:text-[#F5F3EF] hover:bg-[#EFECE6] dark:hover:bg-[#2A2724]"
                    >
                      <ListOrdered className="h-4 w-4 text-[#E05324]" />
                      <span>قائمة مرقمة</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 4. زر إضافة روابط (Link) */}
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  saveSelectionRange();
                }}
                onClick={handleOpenLinkModal}
                title="إضافة رابط"
                aria-label="إضافة رابط"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[#141413] dark:text-[#F5F3EF] hover:bg-[#EFECE6] dark:hover:bg-[#2A2724] transition-colors cursor-pointer"
              >
                <Link2 className="h-5 w-5" />
              </button>

              <span className="h-5 w-[1px] bg-[#E6E2D8] dark:bg-[#2E2A26]" />

              {/* 5. زر الإضافة المتقدم (+) لإدراج (صورة، فيديو، فاصل، عنوان فرعي، صندوق المراجع) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    saveSelectionRange();
                    setIsPlusMenuOpen((v) => !v);
                    setIsListMenuOpen(false);
                    setIsTemplateMenuOpen(false);
                  }}
                  title="إدراج صورة، فيديو، فاصل، أو صندوق المراجع"
                  aria-label="إدراج عنصر متقدم"
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors cursor-pointer ${
                    isPlusMenuOpen
                      ? 'bg-[#E05324] text-white'
                      : 'bg-[#141413] dark:bg-[#F5F3EF] text-[#F9F7F2] dark:text-[#141413] hover:opacity-90'
                  }`}
                >
                  <Plus
                    className={`h-5 w-5 transition-transform duration-150 ${
                      isPlusMenuOpen ? 'rotate-45' : ''
                    }`}
                  />
                </button>

                {isPlusMenuOpen && (
                  <div className="font-ui absolute bottom-14 left-0 w-56 rounded-2xl border border-[#D6CEBE] dark:border-[#332F2B] bg-[#F9F7F2] dark:bg-[#1C1A17] p-1.5 shadow-2xl">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPlusMenuOpen(false);
                        setIsImageModalOpen(true);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-right text-[14.5px] font-bold text-[#141413] dark:text-[#F5F3EF] hover:bg-[#EFECE6] dark:hover:bg-[#2A2724]"
                    >
                      <ImageIcon className="h-4 w-4 text-[#E05324]" />
                      <span>صورة</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsPlusMenuOpen(false);
                        setIsVideoModalOpen(true);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-right text-[14.5px] font-bold text-[#141413] dark:text-[#F5F3EF] hover:bg-[#EFECE6] dark:hover:bg-[#2A2724]"
                    >
                      <Video className="h-4 w-4 text-[#E05324]" />
                      <span>فيديو</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleInsertDivider}
                      className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-right text-[14.5px] font-bold text-[#141413] dark:text-[#F5F3EF] hover:bg-[#EFECE6] dark:hover:bg-[#2A2724]"
                    >
                      <Minus className="h-4 w-4 text-[#E05324]" />
                      <span>فاصل</span>
                    </button>

                    <div className="my-1 border-t border-[#E6E2D8] dark:border-[#2A2724]" />

                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleFormatQuranVerse}
                      className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-right text-[14.5px] font-bold text-[#141413] dark:text-[#F5F3EF] hover:bg-[#EFECE6] dark:hover:bg-[#2A2724]"
                    >
                      <span className="font-quran text-[16px] font-bold leading-none text-[#C47A00] dark:text-[#F5B800]">
                        ﴿﴾
                      </span>
                      <span>آية قرآنية</span>
                    </button>

                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleInsertSubheading}
                      className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-right text-[14.5px] font-bold text-[#141413] dark:text-[#F5F3EF] hover:bg-[#EFECE6] dark:hover:bg-[#2A2724]"
                    >
                      <Heading2 className="h-4 w-4 text-[#E05324]" />
                      <span>عنوان فرعي</span>
                    </button>

                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleOpenFootnotesBox}
                      className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-right text-[14.5px] font-bold text-[#141413] dark:text-[#F5F3EF] hover:bg-[#EFECE6] dark:hover:bg-[#2A2724]"
                    >
                      <CuratedStarIcon className="h-4 w-4 shrink-0" />
                      <span>صندوق المراجع والإحالات</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ==========================================================================
          الخيار الثاني: تحرير محتوى الموقع (تعديل وحذف أي مقال في الموقع)
         ========================================================================== */}
      {activeTab === 'site-content' && (
        <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
          {/* رأس قسم إدارة وتحرير محتوى الموقع */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E6E2D8] dark:border-[#2A2724]">
            <div>
              <div className="inline-flex items-center gap-2 text-[13.5px] font-ui font-bold text-[#E05324] dark:text-[#F06438] mb-1">
                <FolderEdit className="w-4 h-4" />
                <span>إدارة المقالات والمحتوى</span>
              </div>
              <h1 className="font-display text-[28px] sm:text-[34px] font-bold text-[#141413] dark:text-[#F5F3EF]">
                تحرير محتوى الموقع
              </h1>
              <p className="font-prose mt-1.5 text-[15.5px] text-[#4A4742] dark:text-[#B8B3AA]">
                يمكنك من هنا تعديل نص وعنوان وتصنيف وصورة أي مقال في الموقع، أو حذفه نهائياً، أو إضافة مقال جديد.
              </p>
            </div>

            <div className="font-ui flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleStartFreshNewArticle}
                className="inline-flex items-center gap-2 rounded-xl bg-[#E05324] px-4 py-2.5 text-[14px] font-bold text-white hover:bg-[#c94519] transition-colors cursor-pointer"
              >
                <PenTool className="w-4 h-4" />
                <span>+ كتابة مقال جديد</span>
              </button>

              <button
                type="button"
                onClick={handleCopyAllSiteArticlesJson}
                className="inline-flex items-center gap-2 rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-[#EFECE6]/60 dark:bg-[#1D1B19] px-3.5 py-2.5 text-[13.5px] font-bold text-[#141413] dark:text-[#F5F3EF] hover:bg-[#EFECE6] dark:hover:bg-[#25221F] transition-colors cursor-pointer"
              >
                {copiedAllSiteCode ? (
                  <>
                    <Check className="w-4 h-4 text-[#E05324]" />
                    <span>تم نسخ JSON الكامل</span>
                  </>
                ) : (
                  <>
                    <FileCode2 className="w-4 h-4 text-[#E05324]" />
                    <span>نسخ JSON الموقع</span>
                  </>
                )}
              </button>

              {!confirmResetDefaults ? (
                <button
                  type="button"
                  onClick={() => setConfirmResetDefaults(true)}
                  title="استعادة المقالات الافتراضية الأصلية"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] px-3 py-2.5 text-[13px] font-bold text-[#78736A] hover:text-[#141413] dark:hover:text-[#F5F3EF] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>استعادة الافتراضي</span>
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5 rounded-xl border border-[#E05324] bg-[#E05324]/10 px-2.5 py-1.5">
                  <span className="text-[12.5px] font-bold text-[#E05324]">تأكيد الاستعادة؟</span>
                  <button
                    type="button"
                    onClick={() => {
                      onResetDefaultArticles();
                      setConfirmResetDefaults(false);
                      showNotice('تمت استعادة مقالات الموقع الافتراضية بنجاح');
                    }}
                    className="rounded-lg bg-[#E05324] px-2.5 py-1 text-[12px] font-bold text-white cursor-pointer"
                  >
                    نعم
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmResetDefaults(false)}
                    className="rounded-lg px-2 py-1 text-[12px] font-bold text-[#78736A] cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* شريط البحث والتصفية بالتصنيف */}
          <div className="font-ui mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78736A]" />
              <input
                type="text"
                value={managerSearch}
                onChange={(e) => setManagerSearch(e.target.value)}
                placeholder="ابحث في مقالات الموقع بالعنوان أو الكلمات..."
                className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-white dark:bg-[#181614] py-2.5 pr-10 pl-4 text-[14.5px] text-[#141413] dark:text-[#F5F3EF] placeholder:text-[#78736A] focus:border-[#141413] dark:focus:border-[#F5F3EF] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <button
                type="button"
                onClick={() => setManagerCategoryFilter('all')}
                className={`rounded-xl px-3.5 py-2 text-[13.5px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  managerCategoryFilter === 'all'
                    ? 'bg-[#141413] dark:bg-[#F5F3EF] text-[#F9F7F2] dark:text-[#141413]'
                    : 'bg-[#EFECE6] dark:bg-[#1D1B19] text-[#57534E] dark:text-[#A8A29E]'
                }`}
              >
                الكل ({siteArticles.length})
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setManagerCategoryFilter(cat.slug)}
                  className={`rounded-xl px-3.5 py-2 text-[13.5px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    managerCategoryFilter === cat.slug
                      ? 'bg-[#141413] dark:bg-[#F5F3EF] text-[#F9F7F2] dark:text-[#141413]'
                      : 'bg-[#EFECE6] dark:bg-[#1D1B19] text-[#57534E] dark:text-[#A8A29E]'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* قائمة جميع المقالات مع أزرار التعديل الكامل والتعديل السريع والحذف */}
          <div className="mt-6 space-y-4">
            {filteredSiteArticles.length === 0 ? (
              <div className="rounded-[24px] border border-[#E6E2D8] dark:border-[#2A2724] bg-[#EFECE6]/40 dark:bg-[#181614] p-12 text-center">
                <p className="font-display text-[20px] font-bold text-[#141413] dark:text-[#F5F3EF]">
                  لا توجد مقالات مطابقة لبحثك
                </p>
                <p className="font-prose mt-2 text-[15px] text-[#78736A]">
                  جرب تغيير كلمات البحث أو اختيار تصنيف آخر.
                </p>
              </div>
            ) : (
              filteredSiteArticles.map((article) => {
                const isDeletingThis = confirmDeleteId === article.id;

                return (
                  <div
                    key={article.id}
                    className="rounded-[22px] border border-[#E6E2D8] dark:border-[#2A2724] bg-white/80 dark:bg-[#181614] p-5 sm:p-6 transition-all hover:border-[#D6CEBE] dark:hover:border-[#3A3530]"
                  >
                    <div className="flex flex-col md:flex-row items-start justify-between gap-5">
                      {/* معلومات المقال وصورته المصغرة */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <img
                          src={article.coverImage}
                          alt={article.title}
                          className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-2xl object-cover border border-[#E6E2D8] dark:border-[#2A2724]"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="font-ui flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="rounded-lg bg-[#EFECE6] dark:bg-[#25221F] px-2.5 py-0.5 text-[12px] font-bold text-[#141413] dark:text-[#F5F3EF]">
                              {article.categoryName}
                            </span>

                            {article.isFeatured && (
                              <span className="rounded-lg bg-[#E05324]/15 px-2.5 py-0.5 text-[12px] font-bold text-[#E05324] dark:text-[#F06438]">
                                المقال الرئيسي بالواجهة
                              </span>
                            )}

                            {article.isCuratedStar && (
                              <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[#78736A]">
                                <CuratedStarIcon className="w-3.5 h-3.5" />
                                <span>مميز بنجمة</span>
                              </span>
                            )}

                            <span className="text-[12.5px] text-[#78736A]">
                              • {article.publishedAt} • {article.readingTimeMinutes} دقائق قراءة
                            </span>
                          </div>

                          <h2 className="font-display text-[20px] sm:text-[22px] font-bold text-[#141413] dark:text-[#F5F3EF] leading-snug">
                            {article.title}
                          </h2>

                          <p className="font-prose mt-1 text-[14.5px] text-[#4A4742] dark:text-[#B8B3AA] line-clamp-2">
                            {article.subtitle}
                          </p>
                        </div>
                      </div>

                      {/* أزرار التحكم: تعديل في محرر الكتابة | تعديل سريع | معاينة | حذف */}
                      <div className="font-ui flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-[#E6E2D8] dark:border-[#2A2724]">
                        <button
                          type="button"
                          onClick={() => handleLoadArticleIntoEditor(article)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#141413] dark:bg-[#F5F3EF] px-3.5 py-2 text-[13.5px] font-bold text-[#F9F7F2] dark:text-[#141413] hover:opacity-90 transition-opacity cursor-pointer"
                        >
                          <PenTool className="w-3.5 h-3.5" />
                          <span>تعديل النص والمحتوى</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setQuickEditArticle({ ...article })}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-[#F9F7F2] dark:bg-[#211E1B] px-3 py-2 text-[13.5px] font-bold text-[#141413] dark:text-[#F5F3EF] hover:bg-[#EFECE6] dark:hover:bg-[#2A2724] transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#E05324]" />
                          <span>تعديل سريع</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onPreviewArticle(article.slug)}
                          title="معاينة المقال في الموقع"
                          className="inline-flex items-center gap-1 rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] p-2 text-[#78736A] hover:text-[#141413] dark:hover:text-[#F5F3EF] transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {!isDeletingThis ? (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(article.id)}
                            title="حذف المقال نهائياً"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[13.5px] font-bold text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 rounded-xl border border-red-500 bg-red-500/15 px-2.5 py-1.5">
                            <span className="text-[12.5px] font-bold text-red-600 dark:text-red-400">
                              تأكيد الحذف؟
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteArticle(article.id);
                                setConfirmDeleteId(null);
                                showNotice(`تم حذف مقال «${article.title}» من الموقع`);
                              }}
                              className="rounded-lg bg-red-600 px-2.5 py-1 text-[12px] font-bold text-white hover:bg-red-700 cursor-pointer"
                            >
                              نعم، احذف
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded-lg px-2 py-1 text-[12px] font-bold text-[#57534E] dark:text-[#A8A29E] cursor-pointer"
                            >
                              تراجع
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>
      )}

      {/* ==========================================================================
          الخيار الثالث: إدارة (التحكم الكامل في الموقع والإحصائيات الشاملة)
         ========================================================================== */}
      {activeTab === 'site-admin' && (
        <SiteAdminPanel
          siteConfig={siteConfig}
          onUpdateSiteConfig={onUpdateSiteConfig}
          onResetSiteConfig={onResetSiteConfig}
          articles={siteArticles}
          onUpdateArticle={onUpdateArticleInPlace}
          onEditArticleInStudio={handleLoadArticleIntoEditor}
          onPreviewArticle={onPreviewArticle}
          bookmarkedIds={bookmarkedIds}
          onCloseStudio={onCancel}
        />
      )}

      {/* ==========================================================================
          نافذة التعديل السريع لبيانات وفقرات المقال مباشرة داخل "تحرير محتوى الموقع"
         ========================================================================== */}
      {quickEditArticle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4 py-6 overflow-y-auto"
          onClick={() => setQuickEditArticle(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="font-ui w-full max-w-2xl rounded-[26px] border border-[#E6E2D8] dark:border-[#2A2724] bg-[#F9F7F2] dark:bg-[#181614] p-6 sm:p-8 shadow-2xl my-auto max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#E6E2D8] dark:border-[#2A2724]">
              <div>
                <span className="text-[13px] font-bold text-[#E05324]">تعديل سريع للمقال</span>
                <h3 className="font-display text-[22px] font-bold text-[#141413] dark:text-[#F5F3EF]">
                  {quickEditArticle.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setQuickEditArticle(null)}
                className="rounded-xl p-1.5 text-[#78736A] hover:text-[#141413] dark:hover:text-[#F5F3EF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const cat =
                  CATEGORIES.find((c) => c.slug === quickEditArticle.categorySlug) ||
                  CATEGORIES[0];
                const updated: Article = {
                  ...quickEditArticle,
                  categoryName: cat.name,
                };
                onUpdateArticleInPlace(updated);
                setQuickEditArticle(null);
                showNotice(`تم حفظ تعديلات مقال «${updated.title}» بنجاح`);
              }}
              className="mt-5 space-y-4"
            >
              <div>
                <label className="block text-[13.5px] font-bold mb-1.5">عنوان المقال</label>
                <input
                  type="text"
                  required
                  value={quickEditArticle.title}
                  onChange={(e) =>
                    setQuickEditArticle({ ...quickEditArticle, title: e.target.value })
                  }
                  className="font-display w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-white dark:bg-[#121110] px-4 py-2.5 text-[18px] font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[13.5px] font-bold mb-1.5">العنوان الفرعي</label>
                <textarea
                  rows={2}
                  value={quickEditArticle.subtitle}
                  onChange={(e) =>
                    setQuickEditArticle({
                      ...quickEditArticle,
                      subtitle: e.target.value,
                      excerpt: e.target.value,
                    })
                  }
                  className="font-prose w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-white dark:bg-[#121110] px-4 py-2.5 text-[15.5px] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[13.5px] font-bold mb-1.5">التصنيف</label>
                  <select
                    value={quickEditArticle.categorySlug}
                    onChange={(e) =>
                      setQuickEditArticle({
                        ...quickEditArticle,
                        categorySlug: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-white dark:bg-[#121110] px-3 py-2.5 text-[14px] font-bold focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.slug}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[13.5px] font-bold mb-1.5">تاريخ النشر</label>
                  <input
                    type="text"
                    value={quickEditArticle.publishedAt}
                    onChange={(e) =>
                      setQuickEditArticle({
                        ...quickEditArticle,
                        publishedAt: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-white dark:bg-[#121110] px-3.5 py-2.5 text-[14px] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[13.5px] font-bold mb-1.5">السلسلة</label>
                  <input
                    type="text"
                    value={quickEditArticle.seriesName || ''}
                    onChange={(e) =>
                      setQuickEditArticle({
                        ...quickEditArticle,
                        seriesName: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-white dark:bg-[#121110] px-3.5 py-2.5 text-[14px] focus:outline-none"
                  />
                </div>
              </div>

              {/* اختيار صورة الغلاف */}
              <div>
                <label className="block text-[13.5px] font-bold mb-2">لوحة الغلاف</label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {PRESET_COVERS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        setQuickEditArticle({ ...quickEditArticle, coverImage: preset.src })
                      }
                      className={`overflow-hidden rounded-xl border-2 transition-all cursor-pointer ${
                        quickEditArticle.coverImage === preset.src
                          ? 'border-[#E05324] scale-105'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={preset.src}
                        alt={preset.label}
                        className="aspect-square w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer text-[14px] font-bold">
                  <input
                    type="checkbox"
                    checked={Boolean(quickEditArticle.isFeatured)}
                    onChange={(e) =>
                      setQuickEditArticle({
                        ...quickEditArticle,
                        isFeatured: e.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-[#E05324]"
                  />
                  <span>جعله المقال الرئيسي في صدارة الصفحة الرئيسية</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer text-[14px] font-bold">
                  <input
                    type="checkbox"
                    checked={Boolean(quickEditArticle.isCuratedStar)}
                    onChange={(e) =>
                      setQuickEditArticle({
                        ...quickEditArticle,
                        isCuratedStar: e.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-[#E05324]"
                  />
                  <Star className="w-4 h-4 text-[#E05324]" />
                  <span>نجمة المختارات</span>
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#E6E2D8] dark:border-[#2A2724]">
                <button
                  type="button"
                  onClick={() => {
                    const target = quickEditArticle;
                    setQuickEditArticle(null);
                    handleLoadArticleIntoEditor(target);
                  }}
                  className="inline-flex items-center gap-1.5 text-[13.5px] font-bold text-[#E05324] hover:underline cursor-pointer"
                >
                  <PenTool className="w-4 h-4" />
                  <span>فتح النص الكامل في محرر الكتابة...</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickEditArticle(null)}
                    className="rounded-xl px-4 py-2 text-[14px] font-bold text-[#78736A]"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#141413] dark:bg-[#F5F3EF] px-5 py-2.5 text-[14px] font-bold text-[#F9F7F2] dark:text-[#141413] cursor-pointer"
                  >
                    حفظ التعديلات
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================================
          نافذة إدراج الرابط (URL + التسمية الاختيارية)
         ========================================================================== */}
      {isLinkModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4"
          onClick={() => setIsLinkModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="font-ui w-full max-w-md rounded-[22px] border border-[#E6E2D8] dark:border-[#2A2724] bg-[#F9F7F2] dark:bg-[#181614] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] font-bold text-[#141413] dark:text-[#F5F3EF]">
                إضافة رابط
              </h3>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="text-[#78736A] hover:text-[#141413] dark:hover:text-[#F5F3EF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmInsertLink} className="space-y-4">
              <div>
                <label className="block text-[13.5px] font-bold mb-1.5">
                  عنوان الرابط (URL)
                </label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  autoFocus
                  className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-white dark:bg-[#121110] px-3.5 py-2.5 text-[14.5px] focus:border-[#141413] dark:focus:border-[#F5F3EF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[13.5px] font-bold mb-1.5">
                  التسمية النصية (اختياري)
                </label>
                <input
                  type="text"
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                  placeholder="النص الذي يظهر للقارئ..."
                  className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-white dark:bg-[#121110] px-3.5 py-2.5 text-[14.5px] focus:border-[#141413] dark:focus:border-[#F5F3EF] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-[14px] font-bold text-[#78736A]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#141413] dark:bg-[#F5F3EF] px-5 py-2 text-[14px] font-bold text-[#F9F7F2] dark:text-[#141413]"
                >
                  إدراج الرابط
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================================
          نافذة إدراج صورة داخل المقال
         ========================================================================== */}
      {isImageModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="font-ui w-full max-w-lg rounded-[22px] border border-[#E6E2D8] dark:border-[#2A2724] bg-[#F9F7F2] dark:bg-[#181614] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] font-bold text-[#141413] dark:text-[#F5F3EF]">
                إدراج صورة في المقال
              </h3>
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="text-[#78736A] hover:text-[#141413] dark:hover:text-[#F5F3EF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmInsertImage} className="space-y-4">
              <div>
                <label className="block text-[13.5px] font-bold mb-1.5">
                  رفع صورة من جهازك (تُدمج مباشرة لتعمل على Arweave)
                </label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#141413]/40 dark:border-[#F5F3EF]/40 py-3 px-4 text-[14px] font-bold hover:bg-[#EFECE6] dark:hover:bg-[#23201D] transition-colors">
                  <Upload className="w-4 h-4 text-[#E05324]" />
                  <span>اختر ملف صورة...</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-[13.5px] font-bold mb-1.5">
                  أو اختر من اللوحات التحريرية الجاهزة:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_COVERS.slice(0, 4).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setImageUrlInput(preset.src)}
                      className={`overflow-hidden rounded-xl border-2 transition-all ${
                        imageUrlInput === preset.src
                          ? 'border-[#E05324]'
                          : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={preset.src}
                        alt={preset.label}
                        className="aspect-square w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[13.5px] font-bold mb-1.5">
                  أو الصق رابط الصورة مباشرة (URL / Data URI)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="https://... أو ./assets/..."
                  className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-white dark:bg-[#121110] px-3.5 py-2.5 text-[14px] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[13.5px] font-bold mb-1.5">
                  التعليق التوضيحي أسفل الصورة (اختياري)
                </label>
                <input
                  type="text"
                  value={imageCaptionInput}
                  onChange={(e) => setImageCaptionInput(e.target.value)}
                  placeholder="وصف موجز للصورة..."
                  className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-white dark:bg-[#121110] px-3.5 py-2.5 text-[14px] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-[14px] font-bold text-[#78736A]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#141413] dark:bg-[#F5F3EF] px-5 py-2 text-[14px] font-bold text-[#F9F7F2] dark:text-[#141413]"
                >
                  إدراج الصورة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================================
          نافذة إدراج فيديو داخل المقال
         ========================================================================== */}
      {isVideoModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4"
          onClick={() => setIsVideoModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="font-ui w-full max-w-md rounded-[22px] border border-[#E6E2D8] dark:border-[#2A2724] bg-[#F9F7F2] dark:bg-[#181614] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] font-bold text-[#141413] dark:text-[#F5F3EF]">
                إدراج فيديو
              </h3>
              <button
                type="button"
                onClick={() => setIsVideoModalOpen(false)}
                className="text-[#78736A] hover:text-[#141413] dark:hover:text-[#F5F3EF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmInsertVideo} className="space-y-4">
              <div>
                <label className="block text-[13.5px] font-bold mb-1.5">
                  رابط الفيديو (YouTube أو ملف فيديو مباشر)
                </label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  value={videoUrlInput}
                  onChange={(e) => setVideoUrlInput(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  autoFocus
                  className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-white dark:bg-[#121110] px-3.5 py-2.5 text-[14px] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[13.5px] font-bold mb-1.5">
                  عنوان توضيحي للفيديو (اختياري)
                </label>
                <input
                  type="text"
                  value={videoCaptionInput}
                  onChange={(e) => setVideoCaptionInput(e.target.value)}
                  placeholder="وصف الفيديو..."
                  className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-white dark:bg-[#121110] px-3.5 py-2.5 text-[14px] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-[14px] font-bold text-[#78736A]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#141413] dark:bg-[#F5F3EF] px-5 py-2 text-[14px] font-bold text-[#F9F7F2] dark:text-[#141413]"
                >
                  إدراج الفيديو
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================================
          نافذة تأكيد النشر / حفظ التعديلات وإعدادات الغلاف وتصدير الكود
         ========================================================================== */}
      {isPublishDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs px-4 py-6 overflow-y-auto"
          onClick={() => setIsPublishDrawerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="font-ui w-full max-w-xl rounded-[26px] border border-[#E6E2D8] dark:border-[#2A2724] bg-[#F9F7F2] dark:bg-[#181614] p-6 sm:p-8 shadow-2xl my-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-[#E05324] font-bold text-[14px]">
                <CuratedStarIcon className="w-4 h-4" />
                <span>
                  {editingArticle
                    ? `حفظ التعديلات على: ${editingArticle.title.slice(0, 32)}`
                    : 'اللمسات الأخيرة قبل النشر'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPublishDrawerOpen(false)}
                className="text-[#78736A] hover:text-[#141413] dark:hover:text-[#F5F3EF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* اختيار اللوحة الفنية للغلاف */}
              <div>
                <label className="block text-[14px] font-bold mb-2">
                  لوحة غلاف المقال
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-4 gap-2.5">
                  {PRESET_COVERS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setCoverImage(preset.src)}
                      className={`group relative overflow-hidden rounded-xl border-2 transition-all cursor-pointer ${
                        coverImage === preset.src
                          ? 'border-[#E05324] ring-2 ring-[#E05324]/30'
                          : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={preset.src}
                        alt={preset.label}
                        className="aspect-[16/10] w-full object-cover"
                      />
                      <span className="block truncate bg-black/70 px-1.5 py-1 text-[10.5px] text-white">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13.5px] font-bold mb-1.5">
                    مدوّنة الكاتب (النشر باسم)
                  </label>
                  <select
                    value={selectedAuthorSlug}
                    onChange={(e) => setSelectedAuthorSlug(e.target.value)}
                    className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-white dark:bg-[#121110] px-3.5 py-2.5 text-[14px] font-bold focus:outline-none"
                  >
                    {siteConfig.writers.map((w) => (
                      <option key={w.id} value={w.slug}>
                        {w.blogTitle} — {w.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13.5px] font-bold mb-1.5">
                    السلسلة المعرفية
                  </label>
                  <input
                    type="text"
                    value={seriesName}
                    onChange={(e) => setSeriesName(e.target.value)}
                    className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-white dark:bg-[#121110] px-3.5 py-2.5 text-[14px] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <div>
                  <label className="block text-[13.5px] font-bold mb-1.5">
                    الوسوم (مفصولة بفاصلة)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] bg-white dark:bg-[#121110] px-3.5 py-2.5 text-[14px] focus:outline-none"
                  />
                </div>
              </div>

              {/* خيارات التمييز */}
              <div className="flex flex-wrap items-center gap-6 pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer text-[14px] font-bold">
                  <input
                    type="checkbox"
                    checked={isCuratedStar}
                    onChange={(e) => setIsCuratedStar(e.target.checked)}
                    className="h-4 w-4 accent-[#E05324]"
                  />
                  <span>إضافة نجمة التميّز الذهبية</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer text-[14px] font-bold">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="h-4 w-4 accent-[#E05324]"
                  />
                  <span>جعله المقال الرئيسي المميز في صدارة المدونة</span>
                </label>
              </div>

              {/* أزرار النشر وتصدير كود Arweave */}
              <div className="mt-6 pt-5 border-t border-[#E6E2D8] dark:border-[#2A2724] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleCopyArticleCode}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D6CEBE] dark:border-[#332F2B] px-4 py-2.5 text-[13.5px] font-bold text-[#141413] dark:text-[#F5F3EF] hover:bg-[#EFECE6] dark:hover:bg-[#23201D] transition-colors cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-4 h-4 text-[#E05324]" />
                      <span>تم نسخ كود JSON للمقال</span>
                    </>
                  ) : (
                    <>
                      <FileCode2 className="w-4 h-4 text-[#E05324]" />
                      <span>نسخ كود المقال لملف البيانات</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsPublishDrawerOpen(false)}
                    className="rounded-xl px-4 py-2.5 text-[14.5px] font-bold text-[#78736A]"
                  >
                    العودة للمحرر
                  </button>
                  <button
                    type="button"
                    onClick={handlePublishConfirm}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E05324] px-6 py-2.5 text-[15px] font-bold text-white hover:bg-[#c94519] transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{editingArticle ? 'حفظ تعديلات المقال' : 'نشر المقال الآن'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
