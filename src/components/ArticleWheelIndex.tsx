import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { BasairSunburstTrio, CuratedStarIcon, SUNBURST_PATH_48 } from './Icons';

export interface WheelHeadingItem {
  id: string;
  text: string;
  level: 2 | 3;
}

interface ArticleWheelIndexProps {
  headings: WheelHeadingItem[];
  brandWordmark?: string;
  activeHeadingId?: string;
  readingProgress?: number;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onSelectHeading?: (id: string) => void;
}

/**
 * الثوابت الهندسية الموحدة لعجلة الفهرس (1 وحدة SVG = 1 بكسل CSS بدقة 100%)
 * - مركز الدائرة: (cx = 604.19, cy = 340)
 * - نصف قطر خط القوس: R = 500 (يلامس حافة الشاشة اليمنى x=220 عند y=20 و y=660، ويبرز في المنتصف بمقدار 115.8px)
 * - نصف قطر النص الصغير الخارجي: R_text = 512 (خارج القوس مباشرة بمقدار 12px)
 * - نصف قطر مسار عناصر الفهرس: R_headings = 532 (خارج القوس وبعد النص الصغير، يبدأ على بُعد 148px من يمين الشاشة)
 */
const WHEEL_CX = 604.19;
const WHEEL_CY = 340;
const WHEEL_ARC_RADIUS = 500;
const OUTER_TEXT_RADIUS = 511;
const HEADINGS_ARC_RADIUS = 532;

// توليد عناصر النص الصغير المحاذي للقوس من الخارج (18 دورة متناظرة حول الدائرة = 360 درجة)
// كل دورة 20 درجة تضم: Basair platform • منصة بصائر • مع مسافة واضحة بين Basair و platform
const OUTER_ARC_CYCLE_DEG = 20;
const OUTER_ARC_CYCLES = 360 / OUTER_ARC_CYCLE_DEG;

interface OuterArcToken {
  key: string;
  text: string;
  angleDeg: number;
  isArabic?: boolean;
  isDot?: boolean;
}

const OUTER_ARC_TOKENS: OuterArcToken[] = Array.from(
  { length: OUTER_ARC_CYCLES },
  (_, i) => {
    const base = i * OUTER_ARC_CYCLE_DEG - 180;
    return [
      {
        key: `b-${i}`,
        text: 'Basair',
        angleDeg: base,
      },
      {
        key: `p-${i}`,
        text: 'platform',
        angleDeg: base + 4.72,
      },
      {
        key: `d1-${i}`,
        text: '•',
        angleDeg: base + 8.64,
        isDot: true,
      },
      {
        key: `ar-${i}`,
        text: 'منصة بصائر',
        angleDeg: base + 12.73,
        isArabic: true,
      },
      {
        key: `d2-${i}`,
        text: '•',
        angleDeg: base + 16.82,
        isDot: true,
      },
    ];
  }
).flat();

export const ArticleWheelIndex: React.FC<ArticleWheelIndexProps> = ({
  headings,
  brandWordmark = 'بصائر',
  activeHeadingId,
  readingProgress = 0,
  isOpen,
  onOpen,
  onClose,
  onSelectHeading,
}) => {
  const uid = useId().replace(/:/g, '');

  // تتبع وضع الموقع (النهاري / الليلي) تلقائياً
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(() =>
    typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : false
  );
  const isDarkThemeRef = useRef<boolean>(isDarkTheme);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const syncTheme = () => {
      const dark = root.classList.contains('dark');
      isDarkThemeRef.current = dark;
      setIsDarkTheme(dark);
    };
    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // الفهرس المستقر بعد توقف القارئ (لعرض الرقم في الزر السفلي)
  const [settledIndex, setSettledIndex] = useState<number>(0);
  // حالة ظهور كلمة «بصائر» من الضبابية إلى الوضوح عند فتح العجلة
  const [wordmarkClear, setWordmarkClear] = useState<boolean>(false);
  // عداد لتشغيل حركة الثلاث نجمات التفاعلية
  const [trioWaveCount, setTrioWaveCount] = useState<number>(0);

  // مراجع الفيزياء والسحب المعتمدة على الزمن الحقيقي (Delta Time)
  const targetPosRef = useRef<number>(0);
  const currentPosRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const activeCenterIndexRef = useRef<number>(-1);
  const rafRef = useRef<number | null>(null);
  const snapTimerRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartYRef = useRef<number>(0);
  const dragLastYRef = useRef<number>(0);
  const dragLastTimeRef = useRef<number>(0);
  const dragStartPosRef = useRef<number>(0);
  const dragMovedRef = useRef<boolean>(false);
  const lastTriggeredHeadingIdRef = useRef<string | null>(null);
  const wasOpenRef = useRef<boolean>(false);

  // مراجع عناصر DOM لتحديث التحويلات والألوان مباشرة عبر GPU (بدون أي React Re-render)
  const itemElsRef = useRef<(HTMLDivElement | null)[]>([]);
  const dotCoreElsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const dotRingElsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const textElsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const itemLastBlurTierRef = useRef<number[]>([]);
  const starWheelElRef = useRef<HTMLDivElement | null>(null);
  const arcTextRingElRef = useRef<HTMLDivElement | null>(null);

  const count = headings.length;

  // تقييد الموقع ضمن حدود عناصر الفهرس مع مرونة خفيفة عند الأطراف
  const clampPos = useCallback(
    (val: number, allowRubberBand = false) => {
      if (count <= 1) return 0;
      const maxIdx = count - 1;
      if (!allowRubberBand) {
        return Math.max(0, Math.min(maxIdx, val));
      }
      if (val < 0) return val * 0.25;
      if (val > maxIdx) return maxIdx + (val - maxIdx) * 0.25;
      return val;
    },
    [count]
  );

  // تمرير المقال إلى المحور المحدد فوراً في نفس الوقت أثناء فتح الفهرس
  const scrollArticleToHeading = useCallback(
    (headingId: string, smooth = true) => {
      if (!headingId) return;
      const el = document.getElementById(headingId);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 96;
        window.scrollTo({
          top: Math.max(0, y),
          behavior: smooth ? 'smooth' : 'auto',
        });
      }
      if (onSelectHeading) {
        onSelectHeading(headingId);
      }
    },
    [onSelectHeading]
  );

  // إغلاق الفهرس مباشرة
  const handleCloseWheel = useCallback(() => {
    onClose();
  }, [onClose]);

  // تطبيق التحويلات الفيزيائية والألوان المتناغمة مع هوية بصائر مباشرة على عناصر DOM عبر GPU
  const applyWheelTransforms = useCallback(
    (pos: number) => {
      const dark = isDarkThemeRef.current;

      // 1. تدوير نجمة بصائر الجانبية عبر GPU مباشرة
      if (starWheelElRef.current) {
        const starRotationDeg = pos * 36;
        starWheelElRef.current.style.transform = `translate3d(0, 0, 0) rotate(${starRotationDeg.toFixed(2)}deg)`;
      }

      // 1-ب. تدوير حلقة النص الصغير الخارجي (Basair platform • منصة بصائر) بمحاذاة القوس من الخارج عكس اتجاه حركة العجلة دائماً
      if (arcTextRingElRef.current) {
        const counterArcDeg = -pos * 11.5;
        arcTextRingElRef.current.style.transform = `translate3d(0, 0, 0) rotate(${counterArcDeg.toFixed(2)}deg)`;
      }

      // 2. تحديد العنصر الأقرب للمركز وتحديث النقطة وحلقتها المضيئة فوراً عبر GPU (scale + opacity فقط بدون لاج)
      const nearestIdx = Math.max(0, Math.min(count - 1, Math.round(pos)));
      if (nearestIdx !== activeCenterIndexRef.current) {
        const prevIdx = activeCenterIndexRef.current;
        activeCenterIndexRef.current = nearestIdx;

        if (prevIdx >= 0) {
          const prevDot = dotCoreElsRef.current[prevIdx];
          const prevRing = dotRingElsRef.current[prevIdx];
          const prevText = textElsRef.current[prevIdx];
          if (prevDot) {
            prevDot.style.transform = 'scale3d(0.72, 0.72, 1)';
            prevDot.style.backgroundColor = dark
              ? 'rgba(249, 247, 242, 0.65)'
              : 'rgba(120, 115, 106, 0.55)';
            prevDot.style.boxShadow = 'none';
          }
          if (prevRing) {
            prevRing.style.transform = 'scale3d(0.45, 0.45, 1)';
            prevRing.style.opacity = '0';
          }
          if (prevText) {
            prevText.style.color = dark
              ? 'rgba(231, 227, 220, 0.86)'
              : '#78736A';
          }
        }

        const nextDot = dotCoreElsRef.current[nearestIdx];
        const nextRing = dotRingElsRef.current[nearestIdx];
        const nextText = textElsRef.current[nearestIdx];
        if (nextDot) {
          nextDot.style.transform = 'scale3d(1, 1, 1)';
          nextDot.style.backgroundColor = dark ? '#FFE066' : '#F05A28';
          nextDot.style.boxShadow = dark
            ? '0 0 9px rgba(255, 210, 76, 0.95), 0 0 15px rgba(255, 210, 76, 0.55)'
            : '0 0 8px rgba(224, 83, 36, 0.85), 0 0 14px rgba(245, 184, 0, 0.45)';
        }
        if (nextRing) {
          nextRing.style.transform = 'scale3d(1.15, 1.15, 1)';
          nextRing.style.opacity = '1';
        }
        if (nextText) {
          nextText.style.color = dark ? '#F9F7F2' : '#141413';
        }
      }

      // 3. تحديث مواقع وشفافية عناصر الفهرس خارج القوس وبعد النص الصغير مباشرة
      const verticalSpacing = 68;

      for (let idx = 0; idx < count; idx++) {
        const el = itemElsRef.current[idx];
        if (!el) continue;

        const delta = idx - pos;
        const absDelta = Math.abs(delta);

        // إخفاء العناصر البعيدة عن مجال الرؤية لتوفير موارد المعالج الرسومي
        if (absDelta > 3.6) {
          if (el.style.visibility !== 'hidden') {
            el.style.visibility = 'hidden';
            el.style.pointerEvents = 'none';
          }
          continue;
        }

        if (el.style.visibility !== 'visible') {
          el.style.visibility = 'visible';
          el.style.pointerEvents = 'auto';
        }

        const yOffset = delta * verticalSpacing;
        const clampedY = Math.min(HEADINGS_ARC_RADIUS - 20, Math.abs(yOffset));
        // إزاحة أفقية موازية تماماً لانحناء القوس والنص الخارجي بحيث تبقى الجمل خارج القوس وبعد النص الصغير دائماً
        const arcHorizontalShift =
          HEADINGS_ARC_RADIUS -
          Math.sqrt(HEADINGS_ARC_RADIUS * HEADINGS_ARC_RADIUS - clampedY * clampedY);

        const itemOpacity =
          absDelta < 0.14
            ? 1
            : Math.max(0.08, Math.exp(-Math.pow(absDelta, 1.36) * 0.68));

        // 3 درجات تمويه ثابتة فقط (0px, 2px, 4.5px) ليحتفظ المتصفح بنسيج التمويه في ذاكرة GPU
        const blurTier = absDelta < 0.36 ? 0 : absDelta < 1.45 ? 2 : 4.5;

        el.style.transform = `translate3d(${arcHorizontalShift.toFixed(1)}px, calc(-50% + ${yOffset.toFixed(1)}px), 0)`;
        el.style.opacity = itemOpacity.toFixed(3);

        if (itemLastBlurTierRef.current[idx] !== blurTier) {
          itemLastBlurTierRef.current[idx] = blurTier;
          el.style.filter = blurTier > 0 ? `blur(${blurTier}px)` : 'none';
        }
      }
    },
    [count]
  );

  // تحديث ألوان العناصر المباشرة فور تبديل الثيم بين الليلي والنهاري
  useEffect(() => {
    activeCenterIndexRef.current = -1;
    applyWheelTransforms(currentPosRef.current);
  }, [isDarkTheme, applyWheelTransforms]);

  // حلقة التحريك الفيزيائي السلس المعتمدة على الزمن الحقيقي (Delta-Time Smooth Physics)
  const startAnimationLoop = useCallback(() => {
    if (rafRef.current !== null) return;
    lastFrameTimeRef.current = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastFrameTimeRef.current) / 1000));
      lastFrameTimeRef.current = now;

      const diff = targetPosRef.current - currentPosRef.current;

      if (Math.abs(diff) > 0.01) {
        const speed = isDraggingRef.current ? 28 : 14.5;
        const alpha = 1 - Math.exp(-speed * dt);
        currentPosRef.current += diff * alpha;
        applyWheelTransforms(currentPosRef.current);
        rafRef.current = window.requestAnimationFrame(tick);
      } else {
        currentPosRef.current = targetPosRef.current;
        applyWheelTransforms(currentPosRef.current);
        rafRef.current = null;

        // عند استقرار العجلة على العنصر المحدد: الانتقال للمحور وتحديث العداد بدون أي إعادة رندرة ثقيلة للنقطة
        const rounded = Math.round(targetPosRef.current);
        if (Math.abs(targetPosRef.current - rounded) < 0.02 && !isDraggingRef.current) {
          setSettledIndex((prev) => (prev !== rounded ? rounded : prev));

          const settledItem = headings[rounded];
          if (settledItem && lastTriggeredHeadingIdRef.current !== settledItem.id) {
            lastTriggeredHeadingIdRef.current = settledItem.id;
            setTrioWaveCount((c) => c + 1);
            scrollArticleToHeading(settledItem.id, true);
          }
        }
      }
    };

    rafRef.current = window.requestAnimationFrame(tick);
  }, [applyWheelTransforms, headings, scrollArticleToHeading]);

  // جدولة الانجذاب الهادئ (Snap) لأقرب عنصر بعد توقف حركة عجلة الماوس
  const scheduleSnapToNearest = useCallback(
    (delayMs = 110) => {
      if (snapTimerRef.current) {
        window.clearTimeout(snapTimerRef.current);
      }
      snapTimerRef.current = window.setTimeout(() => {
        if (isDraggingRef.current) return;
        const nearest = Math.round(clampPos(targetPosRef.current, false));
        targetPosRef.current = nearest;
        startAnimationLoop();
      }, delayMs);
    },
    [clampPos, startAnimationLoop]
  );

  // مزامنة العنصر النشط عند فتح العجلة فقط
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      wasOpenRef.current = true;

      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      // تفعيل أنيميشن ظهور كلمة «بصائر» من الضبابية إلى الوضوح بتدرج هادئ وغير طويل
      setWordmarkClear(false);
      const clearTimer = window.setTimeout(() => {
        setWordmarkClear(true);
      }, 40);

      // تشغيل أنيميشن الثلاث نجمات الذهبية تحت كلمة بصائر عند الفتح
      const waveTimer = window.setTimeout(() => {
        setTrioWaveCount((c) => c + 1);
      }, 160);

      let initialIdx = currentPosRef.current;
      if (activeHeadingId) {
        const idx = headings.findIndex((h) => h.id === activeHeadingId);
        if (idx >= 0) {
          initialIdx = idx;
          targetPosRef.current = idx;
          currentPosRef.current = idx;
          activeCenterIndexRef.current = -1;
          setSettledIndex(idx);
          lastTriggeredHeadingIdRef.current = activeHeadingId;
        }
      }

      applyWheelTransforms(initialIdx);

      return () => {
        window.clearTimeout(clearTimer);
        window.clearTimeout(waveTimer);
      };
    } else if (!isOpen) {
      wasOpenRef.current = false;
      setWordmarkClear(false);
      if (activeHeadingId) {
        const idx = headings.findIndex((h) => h.id === activeHeadingId);
        if (idx >= 0) {
          targetPosRef.current = idx;
          currentPosRef.current = idx;
          activeCenterIndexRef.current = -1;
          setSettledIndex(idx);
          lastTriggeredHeadingIdRef.current = activeHeadingId;
          applyWheelTransforms(idx);
        }
      }
    }
  }, [isOpen, activeHeadingId, headings, applyWheelTransforms]);

  // ضبط المواقع الأولية عند تغير قائمة العناوين
  useEffect(() => {
    activeCenterIndexRef.current = -1;
    applyWheelTransforms(currentPosRef.current);
  }, [headings, applyWheelTransforms]);

  // تنظيف المؤقتات عند إزالة المكون
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
      if (snapTimerRef.current !== null) window.clearTimeout(snapTimerRef.current);
    };
  }, []);

  // دعم لوحة المفاتيح (السهم للأعلى، السهم للأسفل، Enter، Escape)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCloseWheel();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const next = clampPos(Math.round(targetPosRef.current) + 1, false);
        targetPosRef.current = next;
        startAnimationLoop();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
        e.preventDefault();
        const prev = clampPos(Math.round(targetPosRef.current) - 1, false);
        targetPosRef.current = prev;
        startAnimationLoop();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const currentItem = headings[settledIndex];
        if (currentItem) {
          onClose();
          scrollArticleToHeading(currentItem.id, true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, clampPos, headings, handleCloseWheel, onClose, scrollArticleToHeading, settledIndex, startAnimationLoop]);

  // منع تمرير الصفحة الخلفية بالماوس أثناء تدوير العجلة
  const wheelOverlayRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = wheelOverlayRef.current;
    if (!el || !isOpen) return;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const step = e.deltaY * 0.0044;
      targetPosRef.current = clampPos(targetPosRef.current + step, true);
      startAnimationLoop();
      scheduleSnapToNearest(115);
    };

    el.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleNativeWheel);
  }, [isOpen, clampPos, scheduleSnapToNearest, startAnimationLoop]);

  // معالجة السحب بالماوس أو اللمس (أعلى / أسفل) مع حساب السرعة الذاتية (Momentum Velocity)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-wheel-ignore-drag="true"]')) {
      return;
    }
    isDraggingRef.current = true;
    dragMovedRef.current = false;
    dragStartYRef.current = e.clientY;
    dragLastYRef.current = e.clientY;
    dragLastTimeRef.current = performance.now();
    velocityRef.current = 0;
    dragStartPosRef.current = currentPosRef.current;
    targetPosRef.current = currentPosRef.current;
    if (snapTimerRef.current) {
      window.clearTimeout(snapTimerRef.current);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const now = performance.now();
    const dyFromStart = e.clientY - dragStartYRef.current;
    if (Math.abs(dyFromStart) > 5) {
      dragMovedRef.current = true;
    }

    const sensitivity = 68;
    const dt = Math.max(1, now - dragLastTimeRef.current);
    const stepItems = -(e.clientY - dragLastYRef.current) / sensitivity;
    velocityRef.current = (stepItems / dt) * 1000;

    dragLastYRef.current = e.clientY;
    dragLastTimeRef.current = now;

    const deltaItems = -dyFromStart / sensitivity;
    targetPosRef.current = clampPos(dragStartPosRef.current + deltaItems, true);
    startAnimationLoop();
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const wasDragged = dragMovedRef.current;
    const projectedPos = targetPosRef.current + velocityRef.current * 0.12;
    const nearest = Math.round(clampPos(projectedPos, false));
    targetPosRef.current = nearest;
    velocityRef.current = 0;
    startAnimationLoop();

    // إذا ضغط المستخدم ضغطة عادية (دون سحب) في الفراغ خارج أزرار الجمل أو الهيدر، نغلق الفهرس فوراً
    if (!wasDragged) {
      const targetEl = e.target as HTMLElement;
      const clickedInteractiveItem = targetEl.closest(
        '[data-wheel-item="true"], [data-wheel-ignore-drag="true"], [data-wheel-hub="true"]'
      );
      if (!clickedInteractiveItem) {
        handleCloseWheel();
      }
    }
  };

  // عند النقر على أحد عناصر الفهرس في العجلة: الانتقال الفوري للمحور في نفس اللحظة
  const handleItemClick = (index: number, headingId: string) => {
    if (dragMovedRef.current) return;
    lastTriggeredHeadingIdRef.current = headingId;
    scrollArticleToHeading(headingId, true);

    if (Math.abs(currentPosRef.current - index) < 0.2) {
      onClose();
    } else {
      targetPosRef.current = index;
      startAnimationLoop();
    }
  };

  if (count === 0) return null;

  return (
    <>
      {/* 1. نافذة/زر فتح فهرس المقال أسفل الشاشة: متناغمة تماماً مع أسطح الموقع (#EFECE6 و #D6CEBE نهاراً) */}
      <div
        className={`fixed right-0 bottom-5 sm:bottom-6 z-40 transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen
            ? 'translate-x-full opacity-0 pointer-events-none'
            : 'translate-x-0 opacity-100'
        }`}
      >
        <button
          type="button"
          onClick={onOpen}
          aria-label="فتح عجلة فهرس المقال"
          title="فتح فهرس المقال التفاعلي"
          className="group relative flex items-center gap-1.5 sm:gap-2 pr-1.5 pl-2.5 py-1.5 sm:pr-2 sm:pl-3 sm:py-2 rounded-l-full bg-[#EFECE6]/95 dark:bg-[#0D0C0B]/92 text-[#141413] dark:text-[#F9F7F2] border-y border-l border-[#D6CEBE] dark:border-[#F9F7F2]/20 shadow-[-4px_4px_18px_rgba(20,20,19,0.08)] dark:shadow-[-4px_4px_18px_rgba(0,0,0,0.28)] backdrop-blur-md hover:pl-3.5 hover:border-[#E05324]/50 dark:hover:border-[#FFD24C]/55 transition-all duration-300 cursor-pointer"
        >
          {/* قوس داخلي رقيق يحاكي حافة العجلة */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-1 right-0 left-1 rounded-l-full border-l border-[#141413]/10 dark:border-[#F9F7F2]/12 group-hover:border-[#E05324]/35 dark:group-hover:border-[#FFD24C]/35 transition-colors"
          />

          {/* نجمة بصائر الذهبية محاطة بحلقة تقدم القراءة الدائرية (Circular Progress Ring) */}
          <span className="relative flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center shrink-0">
            <svg
              viewBox="0 0 28 28"
              fill="none"
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full -rotate-90"
            >
              <defs>
                <linearGradient id={`${uid}-btn-prog`} x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#E05324" />
                  <stop offset="100%" stopColor="#F5B800" />
                </linearGradient>
              </defs>
              {/* مسار الحلقة الخلفي */}
              <circle
                cx="14"
                cy="14"
                r="12.2"
                strokeWidth="1.8"
                className="stroke-[#D6CEBE]/85 dark:stroke-[#F9F7F2]/16"
              />
              {/* قوس تقدم القراءة الفعلي */}
              <circle
                cx="14"
                cy="14"
                r="12.2"
                stroke={`url(#${uid}-btn-prog)`}
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={76.65}
                strokeDashoffset={
                  76.65 * (1 - Math.min(100, Math.max(0, readingProgress)) / 100)
                }
                className="transition-[stroke-dashoffset] duration-150 ease-out"
              />
            </svg>
            <span className="relative flex h-[18px] w-[18px] sm:h-[21px] sm:w-[21px] items-center justify-center rounded-full bg-[#141413] dark:bg-[#1C1A17] group-hover:rotate-[22.5deg] transition-transform duration-500">
              <CuratedStarIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </span>
          </span>

          {/* نص مدمج بألوان الهوية الأصلية */}
          <div className="flex items-center gap-1.5 text-right pr-0.5">
            <span className="font-ui text-[10.5px] sm:text-[11.5px] font-bold tracking-wide text-[#141413] dark:text-[#F9F7F2] whitespace-nowrap">
              الفهرس
            </span>
            <span className="font-ui text-[9.5px] sm:text-[10px] font-extrabold text-[#E05324] dark:text-[#FFD24C]/90 tabular-nums whitespace-nowrap">
              {settledIndex + 1}/{count}
            </span>
          </div>
        </button>
      </div>

      {/* 2. واجهة العجلة الكاملة */}
      <div
        ref={wheelOverlayRef}
        role="dialog"
        aria-modal="true"
        aria-label="فهرس محاور المقال"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUpOrCancel}
        onPointerCancel={handlePointerUpOrCancel}
        className={`fixed inset-0 z-50 overflow-hidden select-none transition-opacity duration-300 ease-out ${
          isOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        style={{
          touchAction: 'none',
          contain: 'layout style paint',
        }}
      >
        {/* طبقة البلور المتدرج الموحدة (متدرجة بنعومة من لون السطح #EFECE6 إلى لون الورق #F9F7F2 نهاراً) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ transform: 'translate3d(0,0,0)' }}
        >
          <div
            className="absolute inset-0 backdrop-blur-[11px]"
            style={{
              WebkitMaskImage:
                'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 40%, rgba(0,0,0,0.48) 72%, transparent 96%)',
              maskImage:
                'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 40%, rgba(0,0,0,0.48) 72%, transparent 96%)',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: isDarkTheme
                ? 'linear-gradient(to left, rgba(12, 11, 10, 0.95) 0%, rgba(15, 14, 13, 0.86) 36%, rgba(18, 17, 15, 0.60) 66%, rgba(20, 19, 17, 0.20) 100%)'
                : 'radial-gradient(ellipse 50% 68% at 92% 50%, rgba(245, 184, 0, 0.065) 0%, rgba(224, 83, 36, 0.035) 45%, transparent 78%), linear-gradient(to left, rgba(239, 236, 230, 0.97) 0%, rgba(244, 241, 235, 0.92) 38%, rgba(249, 247, 242, 0.68) 68%, rgba(249, 247, 242, 0.14) 100%)',
            }}
          />
        </div>

        {/* الحاوية المنزلقة للعجلة: تخرج من اليمين باتجاه اليسار عند فتحها */}
        <div
          className={`relative h-full w-full will-change-transform transition-transform duration-450 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* الرأس العلوي: كلمة «بصائر» + الثلاث نجمات على يسار القوس العلوي والنص الصغير الخارجي تماماً فلا تغطي منهما شيئاً */}
          <div
            data-wheel-ignore-drag="true"
            className="absolute top-5 sm:top-6 right-[106px] sm:right-[132px] z-30 flex flex-col items-center text-center pointer-events-auto"
          >
            <span
              className="font-display block text-[30px] sm:text-[36px] font-bold tracking-tight leading-[1.25] pb-0.5 text-[#141413] dark:text-[#F9F7F2] select-none"
              style={{
                fontFamily: "'Thmanyah Serif Display', 'Thmanyah Serif Text', serif",
                filter: wordmarkClear ? 'blur(0px)' : 'blur(5px)',
                opacity: wordmarkClear ? 1 : 0,
                transform: wordmarkClear ? 'translate3d(0, 0px, 0)' : 'translate3d(0, 4px, 0)',
                transition:
                  'filter 380ms cubic-bezier(0.22, 1, 0.36, 1), opacity 340ms cubic-bezier(0.22, 1, 0.36, 1), transform 380ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              {brandWordmark}
            </span>

            <div className="mt-2 sm:mt-2.5">
              <BasairSunburstTrio
                size="xs"
                withLines={false}
                waveTrigger={trioWaveCount}
                className="!my-0"
              />
            </div>
          </div>

          {/* زر إغلاق الفهرس في أعلى اليسار */}
          <button
            type="button"
            data-wheel-ignore-drag="true"
            onClick={(e) => {
              e.stopPropagation();
              handleCloseWheel();
            }}
            aria-label="إغلاق فهرس المقال"
            style={{
              fontFamily: "'Thmanyah Sans', 'Thmanyah Serif Text', sans-serif",
            }}
            className="absolute top-6 sm:top-8 left-5 sm:left-8 z-30 inline-flex items-center gap-2 rounded-full border border-[#D6CEBE] dark:border-[#F9F7F2]/20 bg-[#EFECE6]/92 dark:bg-[#181715]/88 px-3.5 py-1.5 font-ui text-[12px] font-bold text-[#141413] dark:text-[#F9F7F2]/90 hover:bg-[#E6E2D8] dark:hover:bg-[#181715] hover:border-[#E05324]/45 dark:hover:border-[#FFD24C]/45 shadow-xs transition-colors cursor-pointer"
          >
            <span>إغلاق الفهرس</span>
            <span aria-hidden="true" className="text-[14px] leading-none text-[#78736A] dark:text-[#F9F7F2]/80">
              ×
            </span>
          </button>

          {/* جسم العجلة الزجاجية المضلّعة + النص الصغير المحاذي للقوس من الخارج (متمركز عند top-[55%] أسفل منطقة شعار بصائر العلوي) */}
          <div
            data-wheel-hub="true"
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-[55%] -translate-y-1/2 w-[220px] h-[680px] z-20 flex items-center justify-end"
          >
            <svg
              viewBox="0 0 220 680"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-[220px] h-[680px] overflow-visible"
            >
              <defs>
                {/* 1. الحجر الورقي الدافئ المضلّع (Warm Editorial Stone) للوضع النهاري */}
                <pattern
                  id={`${uid}-wheel-ribs-light`}
                  width="9"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <rect width="9" height="20" fill="#E4DFD3" />
                  <line
                    x1="2"
                    y1="0"
                    x2="2"
                    y2="20"
                    stroke="rgba(251, 249, 245, 0.90)"
                    strokeWidth="2"
                  />
                  <line
                    x1="6"
                    y1="0"
                    x2="6"
                    y2="20"
                    stroke="rgba(120, 115, 106, 0.24)"
                    strokeWidth="2"
                  />
                </pattern>

                {/* 2. نسيج الزجاج المضلّع الفحمي الداكن للوضع الليلي */}
                <pattern
                  id={`${uid}-wheel-ribs-dark`}
                  width="9"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <rect width="9" height="20" fill="#0B0A09" />
                  <line
                    x1="2"
                    y1="0"
                    x2="2"
                    y2="20"
                    stroke="rgba(249, 247, 242, 0.045)"
                    strokeWidth="2"
                  />
                  <line
                    x1="6"
                    y1="0"
                    x2="6"
                    y2="20"
                    stroke="rgba(0, 0, 0, 0.65)"
                    strokeWidth="2"
                  />
                </pattern>

                {/* تدرج حافة القوس في الوضع النهاري */}
                <linearGradient id={`${uid}-rim-stroke-light`} x1="0" y1="20" x2="0" y2="660" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="rgba(214, 206, 190, 0.25)" />
                  <stop offset="22%" stopColor="rgba(120, 115, 106, 0.45)" />
                  <stop offset="50%" stopColor="rgba(224, 83, 36, 0.85)" />
                  <stop offset="78%" stopColor="rgba(120, 115, 106, 0.45)" />
                  <stop offset="100%" stopColor="rgba(214, 206, 190, 0.25)" />
                </linearGradient>

                {/* تدرج إضاءة حافة القوس في الوضع الليلي */}
                <linearGradient id={`${uid}-rim-stroke-dark`} x1="0" y1="20" x2="0" y2="660" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="rgba(249, 247, 242, 0.06)" />
                  <stop offset="22%" stopColor="rgba(249, 247, 242, 0.42)" />
                  <stop offset="50%" stopColor="rgba(255, 210, 76, 0.80)" />
                  <stop offset="78%" stopColor="rgba(249, 247, 242, 0.42)" />
                  <stop offset="100%" stopColor="rgba(249, 247, 242, 0.06)" />
                </linearGradient>

                {/* تدرج عمق زجاجي داخلي ناعم للقوس في الوضع النهاري */}
                <linearGradient id={`${uid}-hub-sheen-light`} x1="104" y1="340" x2="220" y2="340" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="rgba(249, 247, 242, 0.45)" />
                  <stop offset="45%" stopColor="rgba(239, 236, 230, 0.12)" />
                  <stop offset="100%" stopColor="rgba(214, 206, 190, 0.48)" />
                </linearGradient>

                {/* تدرج نجمة بصائر الذهبية المركزية (نهاري دافئ / ليلي مشرق) */}
                <linearGradient id={`${uid}-hub-star-light`} x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#F7AF00" />
                  <stop offset="100%" stopColor="#DA8100" />
                </linearGradient>
                <linearGradient id={`${uid}-hub-star-dark`} x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFD859" />
                  <stop offset="100%" stopColor="#EC9A00" />
                </linearGradient>
              </defs>

              {/* ظل خارجي ناعم يفصل قوس العجلة عن الخلفية */}
              {!isDarkTheme && (
                <path
                  d={`M 220,20 A ${WHEEL_ARC_RADIUS},${WHEEL_ARC_RADIUS} 0 0,0 220,660`}
                  stroke="rgba(20, 20, 19, 0.05)"
                  strokeWidth="6"
                  fill="none"
                />
              )}

              {/* الكتلة الداخلية المضلّعة للعجلة على اليمين (تبدأ وتنتهي عند حافة الشاشة اليمنى x=220 وتبرز في الوسط حتى x=104.2) */}
              <path
                d={`M 220,20 A ${WHEEL_ARC_RADIUS},${WHEEL_ARC_RADIUS} 0 0,0 220,660 L 220,20 Z`}
                fill={`url(#${uid}-${isDarkTheme ? 'wheel-ribs-dark' : 'wheel-ribs-light'})`}
              />

              {/* لمعة/تظليل داخلي ناعم لعمق الزجاج المضلّع */}
              <path
                d={`M 220,20 A ${WHEEL_ARC_RADIUS},${WHEEL_ARC_RADIUS} 0 0,0 220,660 L 220,20 Z`}
                fill={isDarkTheme ? 'rgba(10, 9, 8, 0.45)' : `url(#${uid}-hub-sheen-light)`}
              />

              {/* خط القوس المضيء الفاصل بين العجلة والنص الخارجي */}
              <path
                d={`M 220,20 A ${WHEEL_ARC_RADIUS},${WHEEL_ARC_RADIUS} 0 0,0 220,660`}
                stroke={`url(#${uid}-${isDarkTheme ? 'rim-stroke-dark' : 'rim-stroke-light'})`}
                strokeWidth="1.6"
                fill="none"
              />
            </svg>

            {/* 1. النص الصغير بمحاذاة القوس من الخارج (Basair platform • منصة بصائر) بعناصر HTML نقية وخط ثمانية ليعمل على الآيفون وجميع الهواتف بدون انعكاس الحروف */}
            <div
              aria-hidden="true"
              dir="ltr"
              className="pointer-events-none absolute top-[22px] -left-[40px] w-[260px] h-[636px] overflow-hidden select-none"
            >
              <div
                ref={arcTextRingElRef}
                className="absolute w-0 h-0 will-change-transform"
                style={{
                  left: `${WHEEL_CX + 40}px`,
                  top: `${WHEEL_CY - 22}px`,
                  transform: 'translate3d(0, 0, 0) rotate(0deg)',
                }}
              >
                {OUTER_ARC_TOKENS.map((token) => (
                  <span
                    key={token.key}
                    dir={token.isArabic ? 'rtl' : 'ltr'}
                    className={`absolute left-0 top-0 whitespace-nowrap leading-none ${
                      token.isArabic ? 'font-prose font-bold' : 'font-prose font-semibold'
                    }`}
                    style={{
                      fontFamily: "'Thmanyah Serif Text', 'Thmanyah Sans', serif",
                      fontSize: token.isDot ? '8.5px' : token.isArabic ? '10.2px' : '9.6px',
                      letterSpacing: '0px',
                      unicodeBidi: token.isArabic ? 'isolate' : 'normal',
                      color: isDarkTheme
                        ? 'rgba(249, 247, 242, 0.44)'
                        : 'rgba(87, 83, 78, 0.72)',
                      transformOrigin: '0 0',
                      transform: `rotate(${token.angleDeg}deg) translate3d(-${OUTER_TEXT_RADIUS}px, 0, 0) rotate(-90deg) translate3d(-50%, -50%, 0)`,
                    }}
                  >
                    {token.text}
                  </span>
                ))}
              </div>
            </div>

            {/* نجمة بصائر الذهبية الجانبية داخل «محور العجلة المفرّغ» (حلقة خطية رفيعة مفرغة متطابقة في الوضعين النهاري والليلي) */}
            <div className="absolute right-5 sm:right-6 top-1/2 -translate-y-1/2 flex items-center justify-center">
              <span
                className="pointer-events-none absolute -inset-2.5 rounded-full"
                style={{
                  background: isDarkTheme
                    ? 'radial-gradient(circle, rgba(255, 210, 76, 0.20) 0%, rgba(255, 210, 76, 0) 72%)'
                    : 'radial-gradient(circle, rgba(245, 184, 0, 0.20) 0%, rgba(224, 83, 36, 0.08) 48%, transparent 74%)',
                }}
              />

              {/* الحلقة الخطية المفرّغة (شفافة غير سوداء) لمحور العجلة في الوضعين */}
              <div className="relative flex h-9.5 w-9.5 sm:h-10.5 sm:w-10.5 items-center justify-center rounded-full bg-[#F9F7F2]/65 dark:bg-[#181715]/65 border border-[#D6CEBE] dark:border-[#FFD24C]/30 shadow-[0_2px_10px_rgba(20,20,19,0.07)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.45)] backdrop-blur-[2px]">
                {/* حلقة داخلية خطية دقيقة جداً تعزز طابع المحور المفرّغ */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-[2.5px] rounded-full border border-[#E05324]/25 dark:border-[#F9F7F2]/12"
                />

                <div
                  ref={starWheelElRef}
                  className="relative w-6 h-6 sm:w-6.5 sm:h-6.5 flex items-center justify-center will-change-transform"
                  style={{
                    transform: 'translate3d(0, 0, 0) rotate(0deg)',
                  }}
                >
                  <svg
                    viewBox="0 0 48 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full overflow-visible drop-shadow-[0_1px_4px_rgba(245,168,0,0.22)] dark:drop-shadow-[0_1px_5px_rgba(255,210,76,0.25)]"
                  >
                    <path
                      d={SUNBURST_PATH_48}
                      fillRule="evenodd"
                      clipRule="evenodd"
                      fill={`url(#${uid}-${isDarkTheme ? 'hub-star-dark' : 'hub-star-light'})`}
                    />
                    {/* الثلاث نقاط المعينية في قلب نجمة الفهرس: نقطتان متلاصقتان في الأسفل ونقطة منفصلة في الأعلى */}
                    <path
                      d="M 24 12.6 L 29.2 17.8 L 24 23.0 L 18.8 17.8 Z M 19.65 22.2 L 24 26.55 L 28.35 22.2 L 33.55 27.4 L 28.35 32.6 L 24 28.25 L 19.65 32.6 L 14.45 27.4 Z"
                      className="fill-[#23211E] dark:fill-[#181715]"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* 3. قائمة محاور المقال: تقع خارج القوس وبعد النص الصغير مباشرة (right: 148px)، مع قناع علوي يمنع وصول أي عنصر لمنطقة كلمة بصائر */}
          <div
            className="relative h-full w-full flex items-center justify-end pointer-events-none"
            style={{
              WebkitMaskImage:
                'linear-gradient(to bottom, transparent 0px, transparent 132px, rgba(0,0,0,1) 185px, rgba(0,0,0,1) calc(100% - 75px), transparent calc(100% - 30px), transparent 100%)',
              maskImage:
                'linear-gradient(to bottom, transparent 0px, transparent 132px, rgba(0,0,0,1) 185px, rgba(0,0,0,1) calc(100% - 75px), transparent calc(100% - 30px), transparent 100%)',
            }}
          >
            <div className="relative w-full h-full">
              {headings.map((heading, idx) => {
                const isStrictlySettled = idx === settledIndex;

                return (
                  <div
                    key={heading.id}
                    ref={(el) => {
                      itemElsRef.current[idx] = el;
                    }}
                    style={{
                      top: '55%',
                      right: '148px',
                      transform: 'translate3d(0px, -50%, 0)',
                      opacity: isStrictlySettled ? 1 : 0.35,
                      willChange: 'transform, opacity',
                    }}
                    className="
                      pointer-events-auto absolute z-30
                      max-w-[calc(100vw-164px)] sm:max-w-[420px]
                      origin-right text-right
                    "
                  >
                    <button
                      type="button"
                      data-wheel-item="true"
                      onClick={() => handleItemClick(idx, heading.id)}
                      className="group flex items-center justify-start gap-2.5 sm:gap-3 py-1.5 px-2 text-right focus:outline-none cursor-pointer"
                    >
                      {/* النقطة المضيئة (•) بجانب الجملة: استجابة فورية 120FPS عبر GPU (scale3d + opacity فقط بدون أي لاج) */}
                      <span className="relative flex h-4 w-4 items-center justify-center shrink-0">
                        <span
                          ref={(el) => {
                            dotRingElsRef.current[idx] = el;
                          }}
                          aria-hidden="true"
                          style={{
                            transform: isStrictlySettled
                              ? 'scale3d(1.15, 1.15, 1)'
                              : 'scale3d(0.45, 0.45, 1)',
                            opacity: isStrictlySettled ? 1 : 0,
                          }}
                          className="pointer-events-none absolute inset-0 rounded-full border border-[#E05324]/65 dark:border-[#FFD24C]/70 bg-[#E05324]/12 dark:bg-[#FFD24C]/15 will-change-[transform,opacity] transition-[transform,opacity] duration-150 ease-out"
                        />
                        <span
                          ref={(el) => {
                            dotCoreElsRef.current[idx] = el;
                          }}
                          aria-hidden="true"
                          style={{
                            transform: isStrictlySettled
                              ? 'scale3d(1, 1, 1)'
                              : 'scale3d(0.72, 0.72, 1)',
                            backgroundColor: isStrictlySettled
                              ? isDarkTheme
                                ? '#FFE066'
                                : '#F05A28'
                              : isDarkTheme
                              ? 'rgba(249, 247, 242, 0.65)'
                              : 'rgba(120, 115, 106, 0.55)',
                            boxShadow: isStrictlySettled
                              ? isDarkTheme
                                ? '0 0 9px rgba(255, 210, 76, 0.95), 0 0 15px rgba(255, 210, 76, 0.55)'
                                : '0 0 8px rgba(224, 83, 36, 0.85), 0 0 14px rgba(245, 184, 0, 0.45)'
                              : 'none',
                          }}
                          className="block h-2 w-2 rounded-full will-change-transform transition-[transform,background-color] duration-150 ease-out"
                        />
                      </span>

                      {/* نص الجملة بخط ثمانية وباللون الحبري (#141413) للعنصر المستقر والرمادي الصخري (#78736A) لغيره نهاراً */}
                      <span
                        ref={(el) => {
                          textElsRef.current[idx] = el;
                        }}
                        style={{
                          fontFamily: "'Thmanyah Serif Text', 'Thmanyah Sans', serif",
                          color: isStrictlySettled
                            ? isDarkTheme
                              ? '#F9F7F2'
                              : '#141413'
                            : isDarkTheme
                            ? 'rgba(231, 227, 220, 0.86)'
                            : '#78736A',
                        }}
                        className="font-prose text-[17.5px] sm:text-[20px] font-bold tracking-tight leading-[1.45] transition-colors duration-150"
                      >
                        {heading.text}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* إرشاد سفلي هادئ للقارئ */}
          <div
            data-wheel-ignore-drag="true"
            style={{
              fontFamily: "'Thmanyah Sans', 'Thmanyah Serif Text', sans-serif",
            }}
            className="pointer-events-none absolute bottom-6 right-14 sm:right-24 z-30 flex items-center gap-2 text-[11.5px] font-ui text-[#78736A] dark:text-[#F9F7F2]/50"
          >
            <span>اسحب العجلة للأعلى والأسفل للتنقل، أو اضغط في الفراغ للإغلاق</span>
          </div>
        </div>
      </div>
    </>
  );
};
