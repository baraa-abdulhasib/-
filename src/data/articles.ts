import { WRITER_AVATARS } from './artwork';

export type ContentBlock =
  | { type: 'paragraph'; text: string; dropCap?: boolean }
  | { type: 'heading'; level: 2 | 3; id: string; text: string }
  | {
      type: 'quote';
      text: string;
      cite?: string;
      variant?: 'quote' | 'quran' | 'hadith';
      weight?: 'bold' | 'regular';
    }
  | { type: 'list'; style: 'unordered' | 'ordered'; title?: string; items: string[] }
  | { type: 'callout'; title: string; text: string }
  | { type: 'image'; src: string; alt: string; caption: string }
  | { type: 'video'; url: string; caption?: string }
  | { type: 'divider' };

export interface Footnote {
  id: number;
  text: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  shortDesc: string;
  description: string;
  accentColor: string;
}

export interface SeriesItem {
  id: string;
  title: string;
  subtitle: string;
  categorySlug: string;
  countLabel: string;
  coverArt: string;
  badgeText?: string;
}

export interface WriterBlog {
  id: string;
  slug: string;
  name: string;
  blogTitle: string;
  blogTopic: string;
  role: string;
  avatar: string;
  bio: string;
  topics: string[];
  location?: string;
  verified?: boolean;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  categorySlug: string;
  categoryName: string;
  seriesName: string;
  author: {
    name: string;
    role: string;
    avatar: string;
    bio: string;
    slug?: string;
    blogTitle?: string;
  };
  authorSlug?: string;
  blogTitle?: string;
  publishedAt: string;
  hijriDate: string;
  readingTimeMinutes: number;
  isFeatured?: boolean;
  isCuratedStar?: boolean;
  coverImage: string;
  coverCaption: string;
  tags: string[];
  content: ContentBlock[];
  footnotes?: Footnote[];
}

export const WRITER_BLOGS: WriterBlog[] = [
  {
    id: 'writer-baraa',
    slug: 'baraa',
    name: 'براء العامري',
    blogTitle: 'مدونة براء العامري',
    blogTopic: 'الشريعة والحياة • المقاصد وفقه الواقع',
    role: 'باحث وكاتب في الفكر الشرعي ومقاصد الشريعة',
    avatar: WRITER_AVATARS.baraa,
    bio: 'باحث مهتم بربط الكليات الشرعية وأصول الفقه بأسئلة الإنسان المعاصر وتحولات الاجتماع والتقنية، الساعي إلى الجمع بين رسوخ التأصيل وبصيرة التنزيل.',
    topics: ['مقاصد الشريعة', 'فقه الواقع', 'التزكية الأخلاقية', 'الفكر الإسلامي'],
    location: '',
    verified: true,
  },
];

export const BLOG_META = {
  name: 'بصائر',
  brandWordmark: 'بصائر',
  tagline: 'منصة التدوين الفكري والشرعي',
  subtitle:
    'منصة عربية مستقلة تجمع مدونات نخبة من الكُتّاب والباحثين، حيث يمتلك كل كاتبٍ مدونته المتخصصة في الشريعة، الفكر، وفقه الواقع المعاصر.',
  author: {
    name: 'براء العامري',
    role: 'باحث وكاتب في الفكر الشرعي ومقاصد الشريعة',
    avatar: WRITER_AVATARS.baraa,
    bio: 'باحث مهتم بربط الكليات الشرعية وأصول الفقه بأسئلة الإنسان المعاصر وتحولات الاجتماع والتقنية، الساعي إلى الجمع بين رسوخ التأصيل وبصيرة التنزيل.',
    location: '',
    blogTitle: 'مدونة براء العامري',
    slug: 'baraa',
  },
};

export const CATEGORIES: Category[] = [
  {
    id: 'cat-maqasid',
    slug: 'maqasid',
    name: 'مقاصد الشريعة',
    shortDesc: 'فلسفة التشريع، الكليات الكبرى، وميزان المصالح والمفاسد',
    description:
      'مباحث تتناول الغايات الكلية التي جاءت الشريعة لحفظها، وكيف تمنحنا الرؤية المقاصدية بوصلة راشدة لفهم علل الأحكام وحكمها البالغة.',
    accentColor: '#E05324',
  },
  {
    id: 'cat-waqi',
    slug: 'fiqh-alwaqi',
    name: 'فقه الواقع',
    shortDesc: 'تنزيل الأحكام الشرعية على النوازل والتحولات المعاصرة',
    description:
      'قراءات فقهية تأصيلية في مستجدات العصر، سعياً نحو فقهٍ يجمع بين فقه النص وفقه المحل الذي ينزل عليه.',
    accentColor: '#142822',
  },
  {
    id: 'cat-tazkiyah',
    slug: 'tazkiyah',
    name: 'التزكية والأخلاق',
    shortDesc: 'عمارة القلب، فقه النفس، ومقاومة الاغتراب الروحي',
    description:
      'مقالات تفتش عن أثر العبادات والأخلاق الشرعية في طمأنينة النفس وتخليص الإنسان المعاصر من ضجيج الاستهلاك وتشتت الانتباه.',
    accentColor: '#B45309',
  },
  {
    id: 'cat-turath',
    slug: 'turath',
    name: 'قراءات في التراث',
    shortDesc: 'إضاءات منهجية في أمهات الكتب الأصولية والفقهية',
    description:
      'رحلات معرفية في عيون التراث الإسلامي؛ نستنطق فيها مناهج الأئمة الكبار بلغة عربية رصينة قريبة من القارئ المعاصر.',
    accentColor: '#78350F',
  },
  {
    id: 'cat-fikr',
    slug: 'fikr',
    name: 'الفكر والمنهج',
    shortDesc: 'أصول الفهم، بناء الملكة النقدية، وتفكيك الإشكالات المعاصرة',
    description:
      'تأملات في مناهج النظر والاستدلال، وبناء العقل الفقهي المركب القادر على التمييز بين الثوابت القطعية والمتغيرات الاجتهادية.',
    accentColor: '#1E3A8A',
  },
];

export const EDITORIAL_SERIES: SeriesItem[] = [];

export const ARTICLES: Article[] = [];

