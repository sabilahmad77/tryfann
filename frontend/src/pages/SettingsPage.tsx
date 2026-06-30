import { DashboardLayout } from "@/components/dashboard/shared/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  PasswordField,
  SelectField,
  SwitchField,
} from "@/components/ui/custom-form-elements";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/useLanguage";
import {
  useChangePasswordMutation,
  useGetUserSettingsQuery,
  useSaveUserSettingsMutation,
  type UserSettingsRequest,
} from "@/services/api/settingsApi";
import { updateUser } from "@/store/authSlice";
import { extractErrorMessage } from "@/utils/errorMessages";
import {
  Bell,
  Eye,
  Globe,
  Languages,
  Loader2,
  Lock,
  Mail,
  Moon,
  Settings as SettingsIcon,
  Smartphone,
  User
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

const content = {
  en: {
    settings: "Settings",
    account: "Account",
    notifications: "Notifications",
    privacy: "Privacy & Security",
    preferences: "Preferences",
    // Account
    accountInfo: "Account Information",
    fullName: "Full Name",
    email: "Email Address",
    phone: "Phone Number",
    username: "Username",
    changePassword: "Change Password",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    updateAccount: "Update Account",
    deleteAccount: "Delete Account",
    deleteWarning: "This action cannot be undone",
    // Notifications
    emailNotifications: "Email Notifications",
    pushNotifications: "Push Notifications",
    notifyReferrals: "Referral Updates",
    notifyReferralsDesc: "Get notified when someone uses your referral link",
    notifyRewards: "Reward Milestones",
    notifyRewardsDesc: "Receive updates on points and tier progression",
    notifyArtwork: "New Artwork Alerts",
    notifyArtworkDesc: "Be informed about new artworks from followed artists",
    notifyMessages: "Messages & Comments",
    notifyMessagesDesc: "Notifications for direct messages and comments",
    // Privacy
    privacySettings: "Privacy Settings",
    profileVisibility: "Profile Visibility",
    publicProfile: "Public Profile",
    privateProfile: "Private Profile",
    showEmail: "Show Email on Profile",
    showPhone: "Show Phone on Profile",
    showLocation: "Show Location on Profile",
    twoFactor: "Two-Factor Authentication",
    twoFactorDesc: "Add an extra layer of security to your account",
    enable2FA: "Enable 2FA",
    sessions: "Active Sessions",
    viewSessions: "View All Sessions",
    // Preferences
    language: "Language",
    english: "English",
    arabic: "العربية",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    auto: "Auto",
    timezone: "Timezone",
    currency: "Preferred Currency",
    // Messages
    saveSuccess: "Settings saved successfully!",
    passwordChanged: "Password changed successfully!",
    error: "Something went wrong. Please try again.",
  },
  ar: {
    settings: "الإعدادات",
    account: "الحساب",
    notifications: "الإشعارات",
    privacy: "الخصوصية والأمان",
    preferences: "التفضيلات",
    // Account
    accountInfo: "معلومات الحساب",
    fullName: "الاسم الكامل",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    username: "اسم المستخدم",
    changePassword: "تغيير كلمة المرور",
    currentPassword: "كلمة المرور الحالية",
    newPassword: "كلمة المرور الجديدة",
    confirmPassword: "تأكيد كلمة المرور",
    updateAccount: "تحديث الحساب",
    deleteAccount: "حذف الحساب",
    deleteWarning: "لا يمكن التراجع عن هذا الإجراء",
    // Notifications
    emailNotifications: "إشعارات البريد الإلكتروني",
    pushNotifications: "الإشعارات الفورية",
    notifyReferrals: "تحديثات الإحالة",
    notifyReferralsDesc:
      "احصل على إشعار عندما يستخدم شخص ما رابط الإحالة الخاص بك",
    notifyRewards: "معالم المكافآت",
    notifyRewardsDesc: "تلقي تحديثات حول النقاط وتقدم المستوى",
    notifyArtwork: "تنبيهات الأعمال الفنية الجديدة",
    notifyArtworkDesc:
      "كن على اطلاع بالأعمال الفنية الجديدة من الفنانين المتابعين",
    notifyMessages: "الرسائل والتعليقات",
    notifyMessagesDesc: "إشعارات للرسائل المباشرة والتعليقات",
    // Privacy
    privacySettings: "إعدادات الخصوصية",
    profileVisibility: "رؤية الملف الشخصي",
    publicProfile: "ملف عام",
    privateProfile: "ملف خاص",
    showEmail: "إظهار البريد الإلكتروني في الملف الشخصي",
    showPhone: "إظهار الهاتف في الملف الشخصي",
    showLocation: "إظهار الموقع في الملف الشخصي",
    twoFactor: "المصادقة الثنائية",
    twoFactorDesc: "أضف طبقة أمان إضافية لحسابك",
    enable2FA: "تفعيل المصادقة الثنائية",
    sessions: "الجلسات النشطة",
    viewSessions: "عرض جميع الجلسات",
    // Preferences
    language: "اللغة",
    english: "English",
    arabic: "العربية",
    theme: "المظهر",
    light: "فاتح",
    dark: "داكن",
    auto: "تلقائي",
    timezone: "المنطقة الزمنية",
    currency: "العملة المفضلة",
    // Messages
    saveSuccess: "تم حفظ الإعدادات بنجاح!",
    passwordChanged: "تم تغيير كلمة المرور بنجاح!",
    error: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
  },
};

export function SettingsPage() {
  const { language, setLanguage } = useLanguage();
  const t = content[language];
  const isRTL = language === "ar";
  const dispatch = useDispatch();

  // API hooks
  const {
    data: settingsData,
    isLoading: isLoadingSettings,
    isError: isSettingsError,
    refetch: refetchSettings,
  } = useGetUserSettingsQuery();
  const [saveSettings, { isLoading: isSavingSettings }] =
    useSaveUserSettingsMutation();
  const [changePassword, { isLoading: isChangingPassword }] =
    useChangePasswordMutation();

  // State for password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // State for toggles
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [notifyReferrals, setNotifyReferrals] = useState(true);
  const [notifyRewards, setNotifyRewards] = useState(true);
  const [notifyArtwork, setNotifyArtwork] = useState(false);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [profilePublic, setProfilePublic] = useState(true);
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [showLocation, setShowLocation] = useState(true);
  // const [twoFactor, setTwoFactor] = useState(false);

  // State for preferences
  const [theme, setTheme] = useState("dark");
  const [timezone, setTimezone] = useState("dubai");
  const [currency, setCurrency] = useState("aed");
  const [localLanguage, setLocalLanguage] = useState<"en" | "ar">(language);

  // Load settings from API
  useEffect(() => {
    if (settingsData?.data) {
      const settings = settingsData.data;
      setEmailNotifs(settings.email_notification ?? true);
      setPushNotifs(settings.push_notification ?? true);
      setNotifyReferrals(settings.referral_update ?? true);
      setNotifyRewards(settings.reward_milestone ?? true);
      setNotifyArtwork(settings.artwork_alert ?? false);
      setNotifyMessages(settings.msg_comment ?? true);
      setProfilePublic(settings.profile_visibility ?? true);
      setShowEmail(settings.show_email ?? false);
      setShowPhone(settings.show_phone ?? false);
      setShowLocation(settings.show_location ?? true);
      setTheme(settings.theme || "dark");
      setTimezone(settings.profile_timezone || "dubai");
      setCurrency(settings.preferred_currency || "aed");

      // Update Redux store with privacy settings
      dispatch(
        updateUser({
          profile_visibility: settings.profile_visibility ?? true,
          show_email: settings.show_email ?? false,
          show_phone: settings.show_phone ?? false,
          show_location: settings.show_location ?? true,
        })
      );

      // Update local language state from API only on initial load
      // If API returns null, use current system language as default
      if (settings.language) {
        if (settings.language === "en" || settings.language === "ar") {
          setLocalLanguage(settings.language);
        }
      } else {
        // If API returns null, default to current system language
        setLocalLanguage(language);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsData]);

  // Handle switch changes - call API immediately
  const handleSwitchChange = async (field: string, value: boolean) => {
    try {
      const updateData: Record<string, boolean> = {
        [field]: value,
      };
      await saveSettings(updateData as UserSettingsRequest).unwrap();
      // Update local state
      switch (field) {
        case "email_notification":
          setEmailNotifs(value);
          break;
        case "push_notification":
          setPushNotifs(value);
          break;
        case "referral_update":
          setNotifyReferrals(value);
          break;
        case "reward_milestone":
          setNotifyRewards(value);
          break;
        case "artwork_alert":
          setNotifyArtwork(value);
          break;
        case "msg_comment":
          setNotifyMessages(value);
          break;
        case "profile_visibility":
          setProfilePublic(value);
          // Update Redux store
          dispatch(updateUser({ profile_visibility: value }));
          break;
        case "show_email":
          setShowEmail(value);
          // Update Redux store
          dispatch(updateUser({ show_email: value }));
          break;
        case "show_phone":
          setShowPhone(value);
          // Update Redux store
          dispatch(updateUser({ show_phone: value }));
          break;
        case "show_location":
          setShowLocation(value);
          // Update Redux store
          dispatch(updateUser({ show_location: value }));
          break;
      }
      // Show success toast
      toast.success(t.saveSuccess);
    } catch (error) {
      const errorMessage = extractErrorMessage(error, language);
      toast.error(errorMessage || t.error);
      // Revert the switch on error
      switch (field) {
        case "email_notification":
          setEmailNotifs(!value);
          break;
        case "push_notification":
          setPushNotifs(!value);
          break;
        case "referral_update":
          setNotifyReferrals(!value);
          break;
        case "reward_milestone":
          setNotifyRewards(!value);
          break;
        case "artwork_alert":
          setNotifyArtwork(!value);
          break;
        case "msg_comment":
          setNotifyMessages(!value);
          break;
        case "profile_visibility":
          setProfilePublic(!value);
          break;
        case "show_email":
          setShowEmail(!value);
          break;
        case "show_phone":
          setShowPhone(!value);
          break;
        case "show_location":
          setShowLocation(!value);
          break;
      }
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(
        language === "en"
          ? "Please fill in all password fields"
          : "يرجى ملء جميع حقول كلمة المرور"
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(
        language === "en"
          ? "New password and confirm password do not match"
          : "كلمة المرور الجديدة وتأكيد كلمة المرور غير متطابقين"
      );
      return;
    }

    if (newPassword.length < 8) {
      toast.error(
        language === "en"
          ? "Password must be at least 8 characters long"
          : "يجب أن تكون كلمة المرور 8 أحرف على الأقل"
      );
      return;
    }

    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }).unwrap();
      toast.success(t.passwordChanged);
      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      const errorMessage = extractErrorMessage(error, language);
      toast.error(errorMessage || t.error);
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    // Only update local state, don't change system language until save
    if (newLanguage === "en" || newLanguage === "ar") {
      setLocalLanguage(newLanguage as "en" | "ar");
    }
  };

  const handleSavePreferences = async () => {
    try {
      await saveSettings({
        language: localLanguage,
        theme: theme,
        profile_timezone: timezone,
        preferred_currency: currency,
      }).unwrap();
      // Update system language only after successful save
      setLanguage(localLanguage);
      toast.success(t.saveSuccess);
    } catch (error) {
      const errorMessage = extractErrorMessage(error, language);
      toast.error(errorMessage || t.error);
    }
  };

  // Show loading state
  if (isLoadingSettings) {
    return (
      <DashboardLayout currentPage="settings">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#C59B48]" />
        </div>
      </DashboardLayout>
    );
  }

  // Show error state
  if (isSettingsError) {
    return (
      <DashboardLayout currentPage="settings">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <p className="text-[#8A8EA0]">
            {language === "en"
              ? "Failed to load settings. Please try again."
              : "فشل تحميل الإعدادات. يرجى المحاولة مرة أخرى."}
          </p>
          <Button
            onClick={() => refetchSettings()}
          >
            {language === "en" ? "Retry" : "إعادة المحاولة"}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="settings">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mb-8 ${isRTL ? "text-right" : "text-left"}`}
      >
        <div
          className={`flex items-center gap-3 mb-2 ${
            isRTL ? "flex-row-reverse" : ""
          }`}
        >
          <div className="w-12 h-12 bg-gradient-to-br from-[#C59B48] to-[#45e3d3] rounded-xl flex items-center justify-center">
            <SettingsIcon className="w-6 h-6 text-[#0B0B0D]" />
          </div>
          <h1 className="text-4xl text-[#F2F2F3]">{t.settings}</h1>
        </div>
        <p className="text-[#8A8EA0]">
          {language === "en"
            ? "Manage your account settings and preferences"
            : "إدارة إعدادات حسابك وتفضيلاتك"}
        </p>
      </motion.div>

      {/* Settings Tabs */}
      <Tabs
        defaultValue="account"
        className="w-full"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <TabsList className="glass border border-[#4e4e4e78] mb-6">
          <TabsTrigger value="account">
            <User className="w-4 h-4 mr-2" />
            {t.account}
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            {t.notifications}
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Lock className="w-4 h-4 mr-2" />
            {t.privacy}
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Globe className="w-4 h-4 mr-2" />
            {t.preferences}
          </TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6"
          >
            {/* Change Password Section */}
            <h3
              className={`text-xl text-[#F2F2F3] mb-6 ${
                isRTL ? "text-right" : "text-left"
              }`}
            >
              {t.changePassword}
            </h3>

            <div className="space-y-4">
              <PasswordField
                label={t.currentPassword}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isChangingPassword}
                isRTL={isRTL}
                showToggle
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PasswordField
                  label={t.newPassword}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isChangingPassword}
                  isRTL={isRTL}
                  showToggle
                  required
                />

                <PasswordField
                  label={t.confirmPassword}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isChangingPassword}
                  isRTL={isRTL}
                  showToggle
                  required
                />
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="disabled:bg-disabled disabled:cursor-not-allowed"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {language === "en" ? "Changing..." : "جاري التغيير..."}
                  </>
                ) : (
                  t.changePassword
                )}
              </Button>
            </div>

            {/* <Separator className="my-8 bg-[#4e4e4e78]" /> */}

            {/* Delete Account */}
            {/* <div
              className={`p-4 bg-destructive/10 border border-destructive/30 rounded-xl ${
                isRTL ? "text-right" : "text-left"
              }`}
            >
              <h4 className="text-destructive mb-2">{t.deleteAccount}</h4>
              <p className="text-sm text-[#8A8EA0] mb-4">{t.deleteWarning}</p>
              <Button variant="destructive" size="sm">
                {t.deleteAccount}
              </Button>
            </div> */}
          </motion.div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6"
          >
            <div className="space-y-6">
              <h2
                className={`text-2xl text-[#F2F2F3] mb-6 ${
                  isRTL ? "text-right" : "text-left"
                }`}
              >
                {t.notifications}
              </h2>

              {/* Email Notifications */}
              <SwitchField
                label={t.emailNotifications}
                icon={Mail}
                checked={emailNotifs}
                onCheckedChange={(checked) =>
                  handleSwitchChange("email_notification", checked)
                }
                disabled={isSavingSettings}
                isRTL={isRTL}
                switchWrapperClassName="bg-background/50"
              />

              {/* Push Notifications */}
              <SwitchField
                label={t.pushNotifications}
                icon={Smartphone}
                checked={pushNotifs}
                onCheckedChange={(checked) =>
                  handleSwitchChange("push_notification", checked)
                }
                disabled={isSavingSettings}
                isRTL={isRTL}
                switchWrapperClassName="bg-background/50"
              />

              <Separator className="bg-[#4e4e4e78]" />

              {/* Specific Notification Settings */}
              <SwitchField
                label={t.notifyReferrals}
                description={t.notifyReferralsDesc}
                checked={notifyReferrals}
                onCheckedChange={(checked) =>
                  handleSwitchChange("referral_update", checked)
                }
                disabled={isSavingSettings}
                isRTL={isRTL}
                switchWrapperClassName="bg-background/30"
              />

              <SwitchField
                label={t.notifyRewards}
                description={t.notifyRewardsDesc}
                checked={notifyRewards}
                onCheckedChange={(checked) =>
                  handleSwitchChange("reward_milestone", checked)
                }
                disabled={isSavingSettings}
                isRTL={isRTL}
                switchWrapperClassName="bg-background/30"
              />

              <SwitchField
                label={t.notifyArtwork}
                description={t.notifyArtworkDesc}
                checked={notifyArtwork}
                onCheckedChange={(checked) =>
                  handleSwitchChange("artwork_alert", checked)
                }
                disabled={isSavingSettings}
                isRTL={isRTL}
                switchWrapperClassName="bg-background/30"
              />

              <SwitchField
                label={t.notifyMessages}
                description={t.notifyMessagesDesc}
                checked={notifyMessages}
                onCheckedChange={(checked) =>
                  handleSwitchChange("msg_comment", checked)
                }
                disabled={isSavingSettings}
                isRTL={isRTL}
                switchWrapperClassName="bg-background/30"
              />
            </div>
          </motion.div>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6"
          >
            <h2
              className={`text-2xl text-[#F2F2F3] mb-6 ${
                isRTL ? "text-right" : "text-left"
              }`}
            >
              {t.privacySettings}
            </h2>

            <div className="space-y-6">
              {/* Profile Visibility */}
              <SwitchField
                label={t.profileVisibility}
                description={profilePublic ? t.publicProfile : t.privateProfile}
                icon={Eye}
                checked={profilePublic}
                onCheckedChange={(checked) =>
                  handleSwitchChange("profile_visibility", checked)
                }
                disabled={isSavingSettings}
                isRTL={isRTL}
                switchWrapperClassName="bg-background/50"
              />

              <Separator className="bg-[#4e4e4e78]" />

              {/* Privacy Toggles */}
              <SwitchField
                label={t.showEmail}
                checked={showEmail}
                onCheckedChange={(checked) =>
                  handleSwitchChange("show_email", checked)
                }
                disabled={isSavingSettings}
                isRTL={isRTL}
                switchWrapperClassName="bg-background/30"
              />

              <SwitchField
                label={t.showPhone}
                checked={showPhone}
                onCheckedChange={(checked) =>
                  handleSwitchChange("show_phone", checked)
                }
                disabled={isSavingSettings}
                isRTL={isRTL}
                switchWrapperClassName="bg-background/30"
              />

              <SwitchField
                label={t.showLocation}
                checked={showLocation}
                onCheckedChange={(checked) =>
                  handleSwitchChange("show_location", checked)
                }
                disabled={isSavingSettings}
                isRTL={isRTL}
                switchWrapperClassName="bg-background/30"
              />

              {/* <Separator className="bg-[#4e4e4e78]" /> */}

              {/* Two-Factor Authentication */}
              {/* <div
                className={`p-4 bg-gradient-to-br from-[#45e3d3]/20 to-[#4de3ed]/20 border border-[#45e3d3]/30 rounded-xl ${
                  isRTL ? "text-right" : "text-left"
                }`}
              >
                <div
                  className={`flex items-center gap-3 mb-3 ${
                    isRTL ? "flex-row-reverse" : ""
                  }`}
                >
                  <Shield className="w-6 h-6 text-[#45e3d3]" />
                  <div>
                    <h3 className="text-[#F2F2F3]">{t.twoFactor}</h3>
                    <p className="text-sm text-[#8A8EA0]">{t.twoFactorDesc}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setTwoFactor(!twoFactor)}
                >
                  {twoFactor ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      {language === "en" ? "Enabled" : "مفعّل"}
                    </>
                  ) : (
                    <>{t.enable2FA}</>
                  )}
                </Button>
              </div> */}

              {/* Active Sessions */}
              {/* <div
                className={`p-4 bg-[#191922]/50 rounded-xl ${
                  isRTL ? "text-right" : "text-left"
                }`}
              >
                <h3 className="text-[#F2F2F3] mb-2">{t.sessions}</h3>
                <p className="text-sm text-[#8A8EA0] mb-4">
                  {language === "en"
                    ? "Manage devices where you're logged in"
                    : "إدارة الأجهزة التي قمت بتسجيل الدخول منها"}
                </p>
                <Button
                  variant="outline"
                >
                  {t.viewSessions}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div> */}
            </div>
          </motion.div>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6"
          >
            <div className="space-y-6">
              {/* Language */}
              <SelectField
                label={t.language}
                icon={Languages}
                value={localLanguage}
                onValueChange={handleLanguageChange}
                options={[
                  { value: "en", label: "English" },
                  { value: "ar", label: "العربية" },
                ]}
                isRTL={isRTL}
                disableClear
              />

              {/* Theme */}
              <SelectField
                label={t.theme}
                icon={Moon}
                value={theme}
                onValueChange={setTheme}
                options={[
                  { value: "light", label: t.light },
                  { value: "dark", label: t.dark },
                  { value: "auto", label: t.auto },
                ]}
                isRTL={isRTL}
              />

              {/* Timezone */}
              <SelectField
                label={t.timezone}
                icon={Globe}
                value={timezone}
                onValueChange={setTimezone}
                options={[
                  { value: "dubai", label: "Dubai (UTC+4)" },
                  { value: "riyadh", label: "Riyadh (UTC+3)" },
                  { value: "cairo", label: "Cairo (UTC+2)" },
                  { value: "london", label: "London (UTC+0)" },
                ]}
                isRTL={isRTL}
              />

              {/* Currency */}
              <SelectField
                label={t.currency}
                value={currency}
                onValueChange={setCurrency}
                options={[
                  { value: "aed", label: "AED (د.إ)" },
                  { value: "sar", label: "SAR (ر.س)" },
                  { value: "usd", label: "USD ($)" },
                  { value: "eur", label: "EUR (€)" },
                ]}
                isRTL={isRTL}
              />

              <Button
                onClick={handleSavePreferences}
                disabled={isSavingSettings}
                className="w-full md:w-auto disabled:bg-disabled disabled:cursor-not-allowed"
              >
                {isSavingSettings ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {language === "en" ? "Saving..." : "جاري الحفظ..."}
                  </>
                ) : language === "en" ? (
                  "Save Preferences"
                ) : (
                  "حفظ التفضيلات"
                )}
              </Button>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
