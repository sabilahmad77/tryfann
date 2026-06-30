import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useEffect } from "react";
import { useLanguage } from "@/contexts/useLanguage";
import { Button } from "./button";
import { cn } from "./utils";

export interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Header options
  title?: string;
  headerIcon?: React.ElementType;
  headerActions?: React.ReactNode; // Custom buttons/actions in header
  header?: React.ReactNode; // Complete custom header override
  // Content
  children: React.ReactNode;
  footer?: React.ReactNode;
  // Configuration
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  maxHeight?: string;
  className?: string;
  contentClassName?: string;
  // Advanced
  zIndex?: number;
  preventScroll?: boolean;
}

const sizeMap = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-full",
};

export function CustomModal({
  isOpen,
  onClose,
  title,
  headerIcon: HeaderIcon,
  headerActions,
  header,
  children,
  footer,
  size = "md",
  showCloseButton = true,
  closeOnBackdropClick = true,
  maxHeight = "max-h-[90vh]",
  className,
  contentClassName,
  zIndex = 9999,
  preventScroll = true,
}: CustomModalProps) {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!preventScroll) return;

    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, preventScroll]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            style={{ zIndex: zIndex }}
          />

          {/* Modal Container */}
          <div
            className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto"
            style={{ zIndex: zIndex + 1 }}
            onClick={handleBackdropClick}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "glass rounded-2xl overflow-hidden flex flex-col w-full",
                sizeMap[size],
                maxHeight,
                className
              )}
              onClick={(e) => e.stopPropagation()}
              dir={isRTL ? "rtl" : "ltr"}
            >
              {/* Header */}
              {header ? (
                <div className="shrink-0">{header}</div>
              ) : (
                (title || HeaderIcon || headerActions || showCloseButton) && (
                  <div className="relative p-6 border-b border-[#4e4e4e78] shrink-0">
                    <div
                      className={cn(
                        "flex items-center gap-4",
                        isRTL ? "flex-row-reverse" : ""
                      )}
                    >
                      {HeaderIcon && (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C59B48] to-[#D6AE5A] flex items-center justify-center shrink-0">
                          <HeaderIcon className="w-6 h-6 text-[#121217]" />
                        </div>
                      )}
                      {title && (
                        <h2
                          className={cn(
                            "text-2xl text-[#F2F2F3] flex-1",
                            isRTL ? "text-right" : "text-left"
                          )}
                        >
                          {title}
                        </h2>
                      )}
                      {headerActions && (
                        <div
                          className={cn(
                            "flex items-center gap-2",
                            isRTL ? "flex-row-reverse" : ""
                          )}
                        >
                          {headerActions}
                        </div>
                      )}
                      {showCloseButton && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={onClose}
                          className="text-[#8A8EA0] hover:text-[#F2F2F3] hover:bg-[#191922] transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              )}

              {/* Content Area */}
              <div
                className={cn(
                  "flex-1 overflow-y-auto custom-scrollbar",
                  contentClassName
                )}
              >
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div
                  className={cn(
                    "p-6 border-t border-[#4e4e4e78] shrink-0",
                    isRTL ? "text-right" : "text-left"
                  )}
                >
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}

