import React, { useEffect, useState } from 'react';

/**
 * طبقة ملمس الورق الطبيعي الخفي (Subtle Paper Grain Texture)
 * ---------------------------------------------------------------------------
 * مُحسّنة بالكامل للأداء العالي (Zero-Lag GPU Tiling):
 * بدلاً من استخدام فلتر SVG <feTurbulence> مع mix-blend-mode على كامل الشاشة
 * (والذي يسبب هبوط الإطارات عند تحريك العجلة أو التمرير)، نقوم بتوليد بلاطة حبيبات
 * ورقية دقيقة (128×128 بكسل) مرة واحدة فقط في الذاكرة وتكرارها عتادياً عبر GPU
 * بدون أي تكلفة معالجة أثناء الأنيميشن.
 */

let cachedLightGrainUrl: string | null = null;
let cachedDarkGrainUrl: string | null = null;

function buildGrainDataUrl(mode: 'light' | 'dark'): string {
  if (mode === 'light' && cachedLightGrainUrl) return cachedLightGrainUrl;
  if (mode === 'dark' && cachedDarkGrainUrl) return cachedDarkGrainUrl;

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  // مولد أرقام شبه عشوائية ثابت البذرة لضمان تجانس ملمس الورق
  let seed = mode === 'light' ? 19037 : 47291;
  const nextRand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  for (let i = 0; i < data.length; i += 4) {
    const r = nextRand();
    if (mode === 'light') {
      // حبيبات الورق القطني الدافئ في الوضع النهاري
      if (r > 0.55) {
        data[i] = 92;     // R
        data[i + 1] = 76; // G
        data[i + 2] = 54; // B
        data[i + 3] = Math.round((r - 0.55) * 28); // Alpha خفيف جداً (0-12)
      } else if (r < 0.25) {
        data[i] = 255;
        data[i + 1] = 252;
        data[i + 2] = 244;
        data[i + 3] = Math.round((0.25 - r) * 24);
      } else {
        data[i + 3] = 0;
      }
    } else {
      // حبيبات الحجر الفحمي المخملي في الوضع الليلي
      if (r > 0.58) {
        data[i] = 245;
        data[i + 1] = 238;
        data[i + 2] = 225;
        data[i + 3] = Math.round((r - 0.58) * 18); // Alpha ناعم (0-8)
      } else if (r < 0.28) {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = Math.round((0.28 - r) * 32);
      } else {
        data[i + 3] = 0;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const url = canvas.toDataURL('image/png');
  if (mode === 'light') {
    cachedLightGrainUrl = url;
  } else {
    cachedDarkGrainUrl = url;
  }
  return url;
}

export const PaperGrainOverlay: React.FC = () => {
  const [tiles, setTiles] = useState<{ light: string; dark: string }>({
    light: cachedLightGrainUrl || '',
    dark: cachedDarkGrainUrl || '',
  });

  useEffect(() => {
    setTiles({
      light: buildGrainDataUrl('light'),
      dark: buildGrainDataUrl('dark'),
    });
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden select-none"
    >
      {/* الوضع النهاري: ملمس الورق القطني الفاخر بدون فلاتر SVG ثقيلة */}
      {tiles.light && (
        <div
          className="absolute inset-0 block dark:hidden"
          style={{
            backgroundImage: `url(${tiles.light})`,
            backgroundRepeat: 'repeat',
            backgroundSize: '128px 128px',
          }}
        />
      )}

      {/* الوضع الليلي: ملمس الحجر الفحمي المخملي بدون فلاتر SVG ثقيلة */}
      {tiles.dark && (
        <div
          className="absolute inset-0 hidden dark:block"
          style={{
            backgroundImage: `url(${tiles.dark})`,
            backgroundRepeat: 'repeat',
            backgroundSize: '128px 128px',
          }}
        />
      )}
    </div>
  );
};
