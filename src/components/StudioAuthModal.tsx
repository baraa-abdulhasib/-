import React, { useEffect, useState } from 'react';
import {
  X,
  ArrowLeft,
  PenTool,
  FolderEdit,
  LogOut,
  Settings2,
  Cloud,
  CheckCircle2,
} from 'lucide-react';
import {
  setStudioSessionActive,
  StudioMode,
} from '../utils/studioAuth';
import {
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  isCurrentUserAdmin,
  onAuthStateChanged,
  signInAdminWithGoogle,
  signOutAdmin,
  User,
} from '../firebase';
import { CuratedStarIcon } from './Icons';

interface StudioAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: StudioMode) => void;
  totalArticlesCount?: number;
}

export const StudioAuthModal: React.FC<StudioAuthModalProps> = ({
  isOpen,
  onClose,
  onSelectMode,
  totalArticlesCount = 0,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(() => auth.currentUser);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() =>
    isCurrentUserAdmin(auth.currentUser)
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      const admin = isCurrentUserAdmin(user);
      setStudioSessionActive(admin);
      setIsUnlocked(admin);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsUnlocked(isCurrentUserAdmin(auth.currentUser));
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setChecking(true);
    setError(null);
    try {
      const user = await signInAdminWithGoogle();
      if (isCurrentUserAdmin(user)) {
        setStudioSessionActive(true);
        setIsUnlocked(true);
      } else {
        setError(
          'هذا الحساب غير مصرّح له بالدخول إلى لوحة الإدارة.'
        );
        await signOutAdmin();
      }
    } catch (err) {
      setError(
        err instanceof Error && err.message.includes('popup-closed-by-user')
          ? 'تم إغلاق نافذة تسجيل الدخول قبل إتمام العملية.'
          : 'تعذر تسجيل الدخول عبر جوجل. يرجى المحاولة مرة أخرى.'
      );
    } finally {
      setChecking(false);
    }
  };

  const handleLockSession = async () => {
    setStudioSessionActive(false);
    if (firebaseUser) {
      await signOutAdmin();
    }
    setIsUnlocked(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="studio-auth-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-[24px] border border-[#E6E2D8] dark:border-[#2A2724] bg-[#F9F7F2] dark:bg-[#161513] p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="inline-flex items-center gap-2 text-[14px] font-ui font-bold text-[#E05324] dark:text-[#F06438]">
            <CuratedStarIcon className="w-4 h-4" />
            <span>بصائر • بوابة الكاتب والإدارة السحابية</span>
          </div>
          <div className="flex items-center gap-1.5">
            {isUnlocked && (
              <button
                type="button"
                onClick={handleLockSession}
                title="تسجيل الخروج وقفل الجلسة"
                className="font-ui inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[12.5px] font-bold text-[#78736A] hover:bg-[#EFECE6] dark:hover:bg-[#23201D] hover:text-[#E05324] transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>خروج وقفل الجلسة</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق"
              className="rounded-xl p-1.5 text-[#78736A] hover:bg-[#EFECE6] dark:hover:bg-[#23201D] hover:text-[#141413] dark:hover:text-[#F5F3EF] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!isUnlocked ? (
          <>
            <h2
              id="studio-auth-title"
              className="font-display text-[24px] sm:text-[26px] font-bold text-[#141413] dark:text-[#F5F3EF]"
            >
              تسجيل الدخول بحساب جوجل المشرف
            </h2>
            <p className="font-prose mt-2 text-[15px] leading-[1.75] text-[#4A4742] dark:text-[#B8B3AA]">
              الدخول إلى محرر الكتابة ولوحة إدارة منصة «بصائر» محمي حصرياً عبر مصادقة <strong>Google (Firebase Auth)</strong> لحساب المشرف المعتمد.
            </p>

            {/* زر تسجيل الدخول عبر Google فقط */}
            <div className="mt-6">
              <button
                type="button"
                disabled={checking}
                onClick={handleGoogleSignIn}
                className="font-ui w-full flex items-center justify-center gap-3 rounded-xl bg-[#142822] hover:bg-[#1b362e] text-[#F9F7F2] border border-[#F5B800]/30 py-3.5 px-5 text-[15px] font-bold shadow-sm transition-all cursor-pointer disabled:opacity-60"
              >
                <Cloud className="w-5 h-5 text-[#F5B800]" />
                <span>
                  {checking
                    ? 'جاري الاتصال بـ Google Firebase...'
                    : 'تسجيل الدخول بحساب Google المشرف'}
                </span>
              </button>
            </div>

            {error && (
              <p className="font-ui mt-4 text-[13.5px] font-bold text-[#E05324] dark:text-[#F06438]">
                {error}
              </p>
            )}

            <div className="mt-6 flex items-center justify-end">
              <button
                type="button"
                onClick={onClose}
                className="font-ui rounded-xl px-4 py-2.5 text-[14.5px] font-bold text-[#57534E] dark:text-[#A8A29E] hover:bg-[#EFECE6] dark:hover:bg-[#23201D] transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </>
        ) : (
          <>
            <h2
              id="studio-auth-title"
              className="font-display text-[24px] sm:text-[28px] font-bold text-[#141413] dark:text-[#F5F3EF]"
            >
              مرحباً بك يا براء، اختر وجهتك
            </h2>
            <p className="font-prose mt-2 text-[15px] leading-[1.75] text-[#4A4742] dark:text-[#B8B3AA]">
              اختر الانتقال إلى محرر الكتابة، أو تحرير محتوى المقالات، أو نافذة الإدارة الشاملة للمنصة.
            </p>

            {/* شريط حالة المزامنة السحابية مع Firebase */}
            <div className="mt-4">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-[#142822] text-[#F9F7F2] px-4 py-3 text-[13px] font-ui">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#F5B800] shrink-0" />
                  <span>
                    متصل سحابياً بـ <strong>Firebase</strong> ({firebaseUser?.email}) — يُحفظ ما تنشره سحابياً ويظهر للزوار بعد نجاح المزامنة
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3.5">
              {/* الخيار الأول: محرر الكتابة */}
              <button
                type="button"
                onClick={() => onSelectMode('writer-editor')}
                className="group flex items-start gap-4 rounded-2xl border-[1.5px] border-[#E6E2D8] dark:border-[#2A2724] bg-[#F4F1EA]/70 dark:bg-[#1D1B19] p-4.5 sm:p-5 text-right hover:border-[#141413] dark:hover:border-[#F5F3EF] hover:bg-[#EFECE6] dark:hover:bg-[#23201D] transition-all cursor-pointer"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#141413] dark:bg-[#F5F3EF] text-[#F9F7F2] dark:text-[#141413] group-hover:bg-[#E05324] group-hover:text-white transition-colors">
                  <PenTool className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[19px] sm:text-[20px] font-bold text-[#141413] dark:text-[#F5F3EF] group-hover:text-[#E05324] dark:group-hover:text-[#F06438] transition-colors">
                      ١. محرر الكتابة
                    </span>
                    <ArrowLeft className="w-4 h-4 text-[#78736A] group-hover:text-[#E05324] group-hover:-translate-x-1 transition-all" />
                  </div>
                  <p className="font-prose mt-1 text-[14px] leading-[1.65] text-[#4A4742] dark:text-[#B8B3AA]">
                    كتابة مقال جديد في محرر الكتابة الهادئ (بأسلوب Substack) مع اختيار مدونة الكاتب وحفظ المسودات والنشر السحابي.
                  </p>
                </div>
              </button>

              {/* الخيار الثاني: تحرير محتوى الموقع */}
              <button
                type="button"
                onClick={() => onSelectMode('site-content')}
                className="group flex items-start gap-4 rounded-2xl border-[1.5px] border-[#E6E2D8] dark:border-[#2A2724] bg-[#F4F1EA]/70 dark:bg-[#1D1B19] p-4.5 sm:p-5 text-right hover:border-[#141413] dark:hover:border-[#F5F3EF] hover:bg-[#EFECE6] dark:hover:bg-[#23201D] transition-all cursor-pointer"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E05324]/15 text-[#E05324] dark:text-[#F06438] group-hover:bg-[#E05324] group-hover:text-white transition-colors">
                  <FolderEdit className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-[19px] sm:text-[20px] font-bold text-[#141413] dark:text-[#F5F3EF] group-hover:text-[#E05324] dark:group-hover:text-[#F06438] transition-colors">
                        ٢. تحرير محتوى الموقع
                      </span>
                      {totalArticlesCount > 0 && (
                        <span className="font-ui rounded-lg bg-[#EFECE6] dark:bg-[#2A2724] px-2 py-0.5 text-[12px] font-bold text-[#57534E] dark:text-[#B8B3AA]">
                          {totalArticlesCount} مقالاً
                        </span>
                      )}
                    </div>
                    <ArrowLeft className="w-4 h-4 text-[#78736A] group-hover:text-[#E05324] group-hover:-translate-x-1 transition-all" />
                  </div>
                  <p className="font-prose mt-1 text-[14px] leading-[1.65] text-[#4A4742] dark:text-[#B8B3AA]">
                    استعراض جميع مقالات الموقع الحالية مع إمكانية تعديل نص وعنوان وتصنيف وصورة أي مقال أو حذفه نهائياً من قاعدة البيانات.
                  </p>
                </div>
              </button>

              {/* الخيار الثالث: إدارة */}
              <button
                type="button"
                onClick={() => onSelectMode('site-admin')}
                className="group flex items-start gap-4 rounded-2xl border-[1.5px] border-[#E6E2D8] dark:border-[#2A2724] bg-[#F4F1EA]/70 dark:bg-[#1D1B19] p-4.5 sm:p-5 text-right hover:border-[#141413] dark:hover:border-[#F5F3EF] hover:bg-[#EFECE6] dark:hover:bg-[#23201D] transition-all cursor-pointer"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#142822] text-[#F5B800] group-hover:bg-[#E05324] group-hover:text-white transition-colors">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-[19px] sm:text-[20px] font-bold text-[#141413] dark:text-[#F5F3EF] group-hover:text-[#E05324] dark:group-hover:text-[#F06438] transition-colors">
                        ٣. إدارة
                      </span>
                      <span className="font-ui rounded-lg bg-[#F5B800]/20 px-2 py-0.5 text-[11.5px] font-bold text-[#9A6B00] dark:text-[#F5B800]">
                        Firebase سحابي
                      </span>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-[#78736A] group-hover:text-[#E05324] group-hover:-translate-x-1 transition-all" />
                  </div>
                  <p className="font-prose mt-1 text-[14px] leading-[1.65] text-[#4A4742] dark:text-[#B8B3AA]">
                    إحصائيات الزيارات السحابية الحية، رسائل الزوار الواردة، إدارة الكُتّاب والمدونات، التصنيفات والسلاسل، الهوية والنصوص، وحساب المشرف.
                  </p>
                </div>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
