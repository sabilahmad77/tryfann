import { ReactNode, useState, useEffect } from "react";
import { DashboardNav } from "./DashboardNav";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { useLanguage } from "@/contexts/useLanguage";
import bgImage from "figma:asset/18b1d776f4ce826bfa3453d71d5a597f3dc3dd2b.png";

// Hook to detect if we're on a desktop screen
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024); // lg breakpoint
    };

    checkIsDesktop();
    window.addEventListener("resize", checkIsDesktop);
    return () => window.removeEventListener("resize", checkIsDesktop);
  }, []);

  return isDesktop;
}

interface DashboardLayoutProps {
  children: ReactNode;
  currentPage?: "dashboard" | "profile" | "settings" | "leaderboard" | "feedback" | "bugReport";
}

/**
 * DashboardLayout Component
 *
 * Shared layout wrapper for dashboard pages that includes:
 * - Background image and gradient overlay
 * - Dashboard navigation sidebar
 * - Proper spacing for main content area that adjusts when sidebar is collapsed
 *
 * Usage:
 * ```tsx
 * <DashboardLayout currentPage="dashboard">
 *   <YourPageContent />
 * </DashboardLayout>
 * ```
 */
export function DashboardLayout({
  children,
  currentPage,
}: DashboardLayoutProps) {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const isDesktop = useIsDesktop();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);

  useEffect(() => {
    setSidebarWidth(isSidebarCollapsed ? 80 : 280);
  }, [isSidebarCollapsed]);

  return (
    <div className="tf-root fann-landing min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <ImageWithFallback
          src={bgImage}
          alt="Background"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0D]/90 via-[#0B0B0D]/95 to-[#0B0B0D]" />
      </div>

      {/* Navigation */}
      <DashboardNav
        currentPage={currentPage}
        isCollapsed={isSidebarCollapsed}
        onCollapseChange={setIsSidebarCollapsed}
      />

      {/* Main Content */}
      <div
        className="relative z-10 min-h-screen transition-all duration-300 ease-in-out"
        style={{
          marginLeft: isRTL || !isDesktop ? 0 : sidebarWidth,
          marginRight: !isRTL || !isDesktop ? 0 : sidebarWidth,
        }}
      >
        <div
          className="container mx-auto px-4 pt-20 lg:pt-12 pb-12"
          dir={isRTL ? "rtl" : "ltr"}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
