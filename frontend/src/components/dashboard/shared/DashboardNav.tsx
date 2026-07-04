import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Bug,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "../../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { ImageWithFallback } from "../../figma/ImageWithFallback";
import { useLanguage } from "@/contexts/useLanguage";
import { ROUTES } from "@/routes/paths";
import { persistor } from "@/store/store";
import type { RootState } from "@/store/store";
import { clearAllAuthState } from "@/utils/auth";
import fannLogo from "figma:asset/3b0b3b085f063d168ed55b6b769b2fbf5143db61.png";

interface DashboardNavProps {
  currentPage?: "dashboard" | "profile" | "settings" | "feedback" | "bugReport";
  onLogout?: () => void;
  isCollapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
}

const content = {
  en: {
    dashboard: "Dashboard",
    profile: "Profile",
    settings: "Settings",
    feedback: "Feedback",
    bugReport: "Bug Report",
    logout: "Logout",
    collapse: "Collapse",
    expand: "Expand",
    roles: {
      artist: "Artist",
      collector: "Collector",
      gallery: "Gallery",
      ambassador: "Ambassador",
      curator: "Curator",
      investor: "Investor",
    },
  },
  ar: {
    dashboard: "لوحة التحكم",
    profile: "الملف الشخصي",
    settings: "الإعدادات",
    feedback: "الملاحظات",
    bugReport: "الإبلاغ عن خلل",
    logout: "تسجيل الخروج",
    collapse: "طي",
    expand: "توسيع",
    roles: {
      artist: "فنان",
      collector: "جامع",
      gallery: "معرض",
      ambassador: "سفير",
      curator: "قيّم فني",
      investor: "مستثمر",
    },
  },
};

// Every role the product supports — the badge must always reflect the real
// role returned by the API (audit UX-02: Curator/Investor rendered "Artist").
type DisplayRole =
  | "artist"
  | "collector"
  | "gallery"
  | "ambassador"
  | "curator"
  | "investor";
const VALID_ROLES: DisplayRole[] = [
  "artist",
  "collector",
  "gallery",
  "ambassador",
  "curator",
  "investor",
];

export function DashboardNav({
  currentPage,
  onLogout,
  isCollapsed: isCollapsedProp,
  onCollapseChange,
}: DashboardNavProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const storedUser = useSelector((state: RootState) => state.auth.user);
  const persona = useSelector((state: RootState) => state.auth.persona);
  const t = content[language];
  const isRTL = language === "ar";
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get user display data
  const userName = storedUser
    ? `${storedUser.first_name || ""} ${storedUser.last_name || ""}`.trim() ||
    storedUser.title ||
    storedUser.email ||
    "User"
    : "User";

  const userInitials = storedUser
    ? `${storedUser.first_name || ""} ${storedUser.last_name || ""}`
      .trim()
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ||
    storedUser.email?.[0]?.toUpperCase() ||
    "U"
    : "U";

  // Get user role for display — bound to the real role from the API
  // (audit UX-02: never default a known role to "Artist").
  const getUserRole = () => {
    const displayRoleRaw =
      storedUser?.role?.toLowerCase() || persona?.toLowerCase() || "";

    if (VALID_ROLES.includes(displayRoleRaw as DisplayRole)) {
      return t.roles[displayRoleRaw as DisplayRole];
    }
    // Unknown/missing role: show the raw value if the API sent one rather
    // than mislabeling the user; empty string renders no badge text.
    return storedUser?.role || persona || "";
  };

  // Use controlled state if provided, otherwise use internal state
  const isCollapsed =
    isCollapsedProp !== undefined ? isCollapsedProp : internalCollapsed;
  const setIsCollapsed = (collapsed: boolean) => {
    if (onCollapseChange) {
      onCollapseChange(collapsed);
    } else {
      setInternalCollapsed(collapsed);
    }
    // Update CSS variable when collapsed state changes
    document.documentElement.style.setProperty('--sidebar-width', collapsed ? '80px' : '280px');
  };

  // Update CSS variable on mount and when collapsed state changes
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '80px' : '280px');
  }, [isCollapsed]);

  // Determine current page from location if not provided
  const activePage =
    currentPage ||
    (location.pathname === ROUTES.DASHBOARD
      ? "dashboard"
      : location.pathname === ROUTES.PROFILE
        ? "profile"
        : location.pathname === ROUTES.SETTINGS
          ? "settings"
          : location.pathname === ROUTES.FEEDBACK
            ? "feedback"
            : location.pathname === ROUTES.BUG_REPORT
              ? "bugReport"
              : "dashboard");

  // Check profile visibility from user settings
  const profileVisibility = storedUser?.profile_visibility ?? true;

  const navItems = [
    {
      id: "dashboard",
      label: t.dashboard,
      icon: Home,
      onClick: () => navigate(ROUTES.DASHBOARD),
      show: true,
    },
    {
      id: "profile",
      label: t.profile,
      icon: User,
      onClick: () => navigate(ROUTES.PROFILE),
      show: profileVisibility, // Hide profile menu if profile visibility is false
    },
    {
      id: "settings",
      label: t.settings,
      icon: Settings,
      onClick: () => navigate(ROUTES.SETTINGS),
      show: true,
    },
  ];

  const supportItems = [
    {
      id: "feedback",
      label: t.feedback,
      icon: MessageSquare,
      onClick: () => navigate(ROUTES.FEEDBACK),
      show: true,
    },
    {
      id: "bugReport",
      label: t.bugReport,
      icon: Bug,
      onClick: () => navigate(ROUTES.BUG_REPORT),
      show: true,
    },
  ];

  const handleLogout = async () => {
    await clearAllAuthState(dispatch, persistor, {
      clearExpiredPage: true,   // Clear expired page on logout
    });

    // Call custom logout handler if provided
    if (onLogout) {
      onLogout();
    } else {
      // Default logout behavior - navigate to sign in
      navigate(ROUTES.SIGN_IN);
    }
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass border-b border-[#C59B48]/20">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <ImageWithFallback
              src={fannLogo}
              alt="FANN Logo"
              className="h-10 w-auto object-contain"
            />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-[#F2F2F3] p-2 min-h-11 min-w-11 hover:text-[#C59B48] hover:bg-[#C59B48]/10 rounded-lg transition-all cursor-pointer"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-[#C59B48]/20"
            >
              <div className="flex flex-col gap-2 p-4">
                {navItems
                  .filter((item) => item.show)
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = activePage === item.id;
                    return (
                      <Button
                        key={item.id}
                        variant="ghost"
                        onClick={() => {
                          item.onClick();
                          setMobileMenuOpen(false);
                        }}
                        className={`justify-start gap-3 transition-all duration-200 cursor-pointer ${isActive
                            ? "bg-[#C59B48]/20 text-[#C59B48] border border-[#C59B48]/30"
                            : "text-[#8A8EA0] hover:text-[#C59B48] hover:bg-[#C59B48]/20"
                          }`}
                      >
                        <Icon className="w-5 h-5" />
                        {item.label}
                      </Button>
                    );
                  })}

                {/* Support Items Separator */}
                <div className="h-px bg-[#C59B48]/20 my-2" />

                {supportItems
                  .filter((item) => item.show)
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = activePage === item.id;
                    return (
                      <Button
                        key={item.id}
                        variant="ghost"
                        onClick={() => {
                          item.onClick();
                          setMobileMenuOpen(false);
                        }}
                        className={`justify-start gap-3 transition-all duration-200 cursor-pointer ${isActive
                            ? "bg-[#C59B48]/20 text-[#C59B48] border border-[#C59B48]/30"
                            : "text-[#8A8EA0] hover:text-[#C59B48] hover:bg-[#C59B48]/20"
                          }`}
                      >
                        <Icon className="w-5 h-5" />
                        {item.label}
                      </Button>
                    );
                  })}

                <div className="h-px bg-[#C59B48]/20 my-2" />
                <Button
                  variant="ghost"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="justify-start gap-3 text-[#8A8EA0] hover:text-destructive hover:bg-destructive/20 transition-all duration-200 cursor-pointer"
                >
                  <LogOut className="w-5 h-5" />
                  {t.logout}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Sidebar */}
      <div
        className={`hidden lg:flex fixed ${isRTL ? "right-0 border-l" : "left-0 border-r"
          } top-0 h-screen glass border-[#C59B48]/20 flex-col z-40 transition-all duration-300 ${isCollapsed ? 'w-[80px]' : 'w-[280px]'
          }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#C59B48]/20">
          <motion.div
            className="flex items-center justify-between"
            initial={false}
          >
            {/* Logo - only show when expanded */}
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1"
              >
                <ImageWithFallback
                  src={fannLogo}
                  alt="FANN Logo"
                  className="h-12 w-auto object-contain mx-auto"
                />
              </motion.div>
            )}

            {/* Collapse/Expand Button */}
            <motion.button
              onClick={() => setIsCollapsed(!isCollapsed)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`${isCollapsed ? 'mx-auto' : ''} p-2 rounded-lg text-[#8A8EA0]/60 hover:text-[#C59B48] hover:bg-[#C59B48]/10 transition-all cursor-pointer`}
              title={isCollapsed ? t.expand : t.collapse}
            >
              {isRTL ? (
                isCollapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />
              ) : (
                isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />
              )}
            </motion.button>
          </motion.div>
        </div>

        {/* User Profile Section */}
        <div className="p-6 border-b border-[#C59B48]/20">
          <motion.div
            className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""
              }`}
            initial={false}
          >
            <Avatar
              className="w-12 h-12 border-2 border-[#C59B48] cursor-pointer shrink-0 hover:scale-105 transition-transform"
              onClick={() => navigate(ROUTES.PROFILE)}
            >
              <AvatarImage
                src={storedUser?.profile_image || ""}
                alt={userName}
              />
              <AvatarFallback className="bg-gradient-to-br from-[#C59B48] to-[#45e3d3] text-[#0B0B0D]">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col overflow-hidden"
              >
                <span className="text-[#F2F2F3] truncate">{userName}</span>
                <span className="text-[#8A8EA0]/60 text-sm">
                  {getUserRole()}
                </span>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <motion.button
                  key={item.id}
                  onClick={item.onClick}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${isActive
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "text-[#8A8EA0] hover:text-primary hover:bg-primary/10"
                    } ${isCollapsed ? "justify-center" : ""}`}
                  style={{ pointerEvents: "auto" }}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </motion.button>
              );
            })}
        </nav>

        {/* Support Items Section */}
        <div className="p-4">
          {/* Separator */}
          {!isCollapsed && (
            <div className="h-px bg-[#C59B48]/20 mb-4" />
          )}

          <div className="space-y-2">
            {supportItems
              .filter((item) => item.show)
              .map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <motion.button
                    key={item.id}
                    onClick={item.onClick}
                    whileHover={{ scale: isActive ? 1 : 1.02 }}
                    whileTap={{ scale: isActive ? 1 : 0.98 }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${isActive
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "text-[#8A8EA0] hover:text-primary hover:bg-primary/10"
                      } ${isCollapsed ? "justify-center" : ""}`}
                    style={{ pointerEvents: "auto" }}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </motion.button>
                );
              })}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="p-4 border-t border-[#C59B48]/20 space-y-2">
          {/* Logout Button */}
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#8A8EA0] hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer ${isCollapsed ? "justify-center" : ""
              }`}
            style={{ pointerEvents: "auto" }}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {t.logout}
              </motion.span>
            )}
          </motion.button>
        </div>
      </div>
    </>
  );
}
