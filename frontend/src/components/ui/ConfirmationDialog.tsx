import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./button";
import { useLanguage } from "@/contexts/useLanguage";

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

const defaultContent = {
  en: {
    defaultTitle: "Confirm Action",
    defaultMessage: "Are you sure you want to proceed?",
    confirm: "Confirm",
    cancel: "Cancel",
    deleteTitle: "Delete Item",
    deleteMessage: "Are you sure you want to delete this item? This action cannot be undone.",
    deleteConfirm: "Delete",
  },
  ar: {
    defaultTitle: "تأكيد الإجراء",
    defaultMessage: "هل أنت متأكد من المتابعة؟",
    confirm: "تأكيد",
    cancel: "إلغاء",
    deleteTitle: "حذف العنصر",
    deleteMessage: "هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.",
    deleteConfirm: "حذف",
  },
};

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = "warning",
  isLoading = false,
}: ConfirmationDialogProps) {
  const { language } = useLanguage();
  const t = defaultContent[language];
  const isRTL = language === "ar";

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          iconColor: "text-red-400",
          iconBg: "bg-red-500/20",
          buttonColor:
            "bg-red-500 hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/50 text-white border-0 cursor-pointer transition-all duration-200",
        };
      case "warning":
        return {
          iconColor: "text-primary",
          iconBg: "bg-primary/20",
          buttonColor:
            "hover:shadow-lg hover:shadow-primary/50 border-0 cursor-pointer transition-all duration-200",
        };
      default:
        return {
          iconColor: "text-primary",
          iconBg: "bg-primary/20",
          buttonColor:
            "hover:shadow-lg hover:shadow-primary/50 border-0 cursor-pointer transition-all duration-200",
        };
    }
  };

  const styles = getVariantStyles();

  // Auto-detect delete variant if title/message contains delete keywords
  const isDeleteAction =
    variant === "danger" ||
    title?.toLowerCase().includes("delete") ||
    message?.toLowerCase().includes("delete");

  const finalTitle = title || (isDeleteAction ? t.deleteTitle : t.defaultTitle);
  const finalMessage =
    message || (isDeleteAction ? t.deleteMessage : t.defaultMessage);
  const finalConfirmText =
    confirmText || (isDeleteAction ? t.deleteConfirm : t.confirm);
  const finalCancelText = cancelText || t.cancel;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gradient-to-br from-[#191922] to-[#0B0B0D] rounded-2xl p-6 max-w-md w-full border border-[#4e4e4e78] shadow-2xl"
      >
        {/* Header */}
        <div
          className={`flex items-start gap-4 mb-4 ${
            isRTL ? "flex-row-reverse" : ""
          }`}
        >
          <div
            className={`${styles.iconBg} rounded-full p-3 shrink-0`}
          >
            <AlertTriangle className={`w-6 h-6 ${styles.iconColor}`} />
          </div>
          <div className={`flex-1 ${isRTL ? "text-right" : "text-left"}`}>
            <h3 className="text-xl text-[#F2F2F3] mb-2">{finalTitle}</h3>
            <p className="text-sm text-[#8A8EA0]">{finalMessage}</p>
          </div>
        </div>

        {/* Actions */}
        <div
          className={`flex gap-3 mt-6 ${isRTL ? "flex-row-reverse" : ""}`}
        >
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isLoading}
            className="flex-1 transition-all duration-200 cursor-pointer disabled:bg-disabled disabled:cursor-not-allowed"
          >
            {finalCancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 ${styles.buttonColor} disabled:bg-disabled disabled:cursor-not-allowed`}
          >
            {isLoading
              ? language === "en"
                ? "Processing..."
                : "جاري المعالجة..."
              : finalConfirmText}
          </Button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

