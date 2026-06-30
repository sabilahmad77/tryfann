"use client";

import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/contexts/useLanguage";
import { useTokenExpired } from "@/contexts/useTokenExpired";
import { ROUTES } from "@/routes/paths";
import { persistor } from "@/store/store";
import type { AppDispatch } from "@/store/store";
import { clearAllAuthState } from "@/utils/auth";
import { LogIn, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { useDispatch } from "react-redux";

interface TokenExpiredDialogProps {
  open: boolean;
  onClose: () => void;
}

const content = {
  en: {
    title: "Session Expired",
    description:
      "Your session has expired for security reasons. Please sign in again to continue using the platform.",
    action: "Sign In",
    subtext:
      "Your work has been saved and you can continue where you left off after signing in.",
  },
  ar: {
    title: "انتهت الجلسة",
    description:
      "انتهت جلستك لأسباب أمنية. يرجى تسجيل الدخول مرة أخرى للاستمرار في استخدام المنصة.",
    action: "تسجيل الدخول",
    subtext: "تم حفظ عملك ويمكنك المتابعة من حيث توقفت بعد تسجيل الدخول.",
  },
};

export function TokenExpiredDialog({ open, onClose }: TokenExpiredDialogProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const isRTL = language === "ar";
  const t = content[language];
  const { setHandlingTokenExpiration } = useTokenExpired();

  const handleSignIn = async () => {
    // Clear all auth state before navigating
    await clearAllAuthState(dispatch, persistor, {
      clearExpiredPage: true,   // Clear expired page
    });

    if (typeof window !== "undefined") {
      // Clear the window flag so PrivateRoute can redirect if needed
      window.__tryfann_handling_token_expiration__ = false;
    }
    // Reset the flag before navigating so PrivateRoute can handle the redirect
    setHandlingTokenExpiration(false);
    // Navigate to sign in page
    navigate(ROUTES.SIGN_IN);
    onClose();
  };

  // Prevent closing the dialog by clicking outside or pressing ESC
  // User must click the Sign In button
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Don't allow closing without signing in
      return;
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent
        className="sm:max-w-md"
        dir={isRTL ? "rtl" : "ltr"}
        style={{
          background: "rgba(15, 2, 28, 0.98)",
          border: "1px solid rgba(251, 191, 36, 0.3)",
          backdropFilter: "blur(10px)",
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <AlertDialogHeader
            className="text-center sm:text-left"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div
              className="flex items-center justify-center sm:justify-start gap-3 mb-2"
              dir={isRTL ? "rtl" : "ltr"}
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="p-2 rounded-full bg-amber-500/20"
              >
                <AlertCircle className="w-6 h-6 text-amber-500" />
              </motion.div>
              <AlertDialogTitle className="text-xl font-semibold text-white">
                {t.title}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-gray-300 mt-4 leading-relaxed">
              {t.description}
            </AlertDialogDescription>
            <p className="text-sm text-gray-400 mt-3 leading-relaxed">
              {t.subtext}
            </p>
          </AlertDialogHeader>

          <AlertDialogFooter
            className="flex-col sm:flex-row gap-2 mt-6"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <AlertDialogAction
              onClick={handleSignIn}
              className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium shadow-lg shadow-amber-500/25 transition-all duration-200 flex items-center justify-center cursor-pointer"
            >
              <LogIn className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
              {t.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </motion.div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
