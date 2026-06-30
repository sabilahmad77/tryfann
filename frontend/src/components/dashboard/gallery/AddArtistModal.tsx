import { useState } from "react";
import { Loader2, User, Briefcase, Award, Image, Mail } from "lucide-react";
import { Button } from "../../ui/button";
import { useLanguage } from "@/contexts/useLanguage";
import { InputField, SelectField } from "../../ui/custom-form-elements";
import { CustomModal } from "../../ui/CustomModal";

export interface Artist {
  name: string;
  email: string;
  initials: string;
  specialty: string;
  status: "emerging" | "established";
  artworks: number;
  exhibitions: number;
}

interface AddArtistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (artist: Omit<Artist, "initials">) => void;
  isLoading?: boolean;
}

const content = {
  en: {
    addNewArtist: "Add New Artist",
    artistName: "Artist Name",
    email: "Email",
    specialty: "Specialty",
    status: "Status",
    artworksCount: "Artworks Count",
    exhibitionsCount: "Exhibitions Count",
    cancel: "Cancel",
    save: "Save",
    placeholder: {
      name: "Enter artist name",
      email: "Enter artist email",
      specialty: "e.g. Contemporary Painting",
    },
  },
  ar: {
    addNewArtist: "إضافة فنان جديد",
    artistName: "اسم الفنان",
    email: "البريد الإلكتروني",
    specialty: "التخصص",
    status: "الحالة",
    artworksCount: "عدد الأعمال",
    exhibitionsCount: "عدد المعارض",
    cancel: "إلغاء",
    save: "حفظ",
    placeholder: {
      name: "أدخل اسم الفنان",
      email: "أدخل البريد الإلكتروني",
      specialty: "مثال: الرسم المعاصر",
    },
  },
};

export function AddArtistModal({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}: AddArtistModalProps) {
  const { language } = useLanguage();
  const t = content[language];
  const isRTL = language === "ar";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    specialty: "",
    status: "emerging" as "emerging" | "established",
    artworks: 0,
    exhibitions: 0,
  });

  const handleSave = () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.specialty.trim()) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      return; // You might want to show an error message here
    }

    onSave({
      name: formData.name,
      email: formData.email.trim(),
      specialty: formData.specialty,
      status: formData.status,
      artworks: formData.artworks,
      exhibitions: formData.exhibitions,
    });

    // Reset form
    setFormData({
      name: "",
      email: "",
      specialty: "",
      status: "emerging",
      artworks: 0,
      exhibitions: 0,
    });
  };

  const footer = (
    <div className={`flex gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
      <Button
        onClick={onClose}
        variant="outline"
        className="flex-1 transition-all duration-200 cursor-pointer"
      >
        {t.cancel}
      </Button>
      <Button
        onClick={handleSave}
        disabled={
          !formData.name.trim() || !formData.email.trim() || !formData.specialty.trim() || isLoading
        }
        className="flex-1 bg-gradient-to-r from-[#C59B48] to-[] hover:from-[#C59B48]/90 hover:to-[]/90 hover:shadow-lg hover:shadow-[#C59B48]/50 text-[#0B0B0D] disabled:bg-disabled disabled:cursor-not-allowed disabled:hover:shadow-none cursor-pointer transition-all duration-200"
      >
        {isLoading ? (
          <>
            <Loader2 className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'} animate-spin text-[#0B0B0D]`} />
            {language === "en" ? "Saving..." : "جاري الحفظ..."}
          </>
        ) : (
          t.save
        )}
      </Button>
    </div>
  );

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={t.addNewArtist}
      size="md"
      footer={footer}
    >
      <div className="p-6">
        {/* Form */}
        <div className="space-y-4">
          {/* Artist Name */}
          <InputField
            label={t.artistName}
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={t.placeholder.name}
            icon={User}
            isRTL={isRTL}
            required
          />

          {/* Email */}
          <InputField
            label={t.email}
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder={t.placeholder.email}
            icon={Mail}
            isRTL={isRTL}
            required
          />

          {/* Specialty */}
          <InputField
            label={t.specialty}
            type="text"
            value={formData.specialty}
            onChange={(e) =>
              setFormData({ ...formData, specialty: e.target.value })
            }
            placeholder={t.placeholder.specialty}
            icon={Briefcase}
            isRTL={isRTL}
            required
          />

          {/* Status */}
          <SelectField
            label={t.status}
            value={formData.status}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                status: value as "emerging" | "established",
              })
            }
            options={[
              {
                value: "emerging",
                label: language === "en" ? "Emerging" : "ناشئ",
              },
              {
                value: "established",
                label: language === "en" ? "Established" : "راسخ",
              },
            ]}
            placeholder={language === "en" ? "Select status" : "اختر الحالة"}
            icon={Award}
            isRTL={isRTL}
            contentClassName="z-[10000]"
          />

          {/* Artworks Count */}
          <InputField
            label={t.artworksCount}
            type="number"
            min="0"
            value={formData.artworks.toString()}
            onChange={(e) =>
              setFormData({
                ...formData,
                artworks: parseInt(e.target.value) || 0,
              })
            }
            placeholder="0"
            icon={Image}
            isRTL={isRTL}
          />

          {/* Exhibitions Count */}
          <InputField
            label={t.exhibitionsCount}
            type="number"
            min="0"
            value={formData.exhibitions.toString()}
            onChange={(e) =>
              setFormData({
                ...formData,
                exhibitions: parseInt(e.target.value) || 0,
              })
            }
            placeholder="0"
            icon={Award}
            isRTL={isRTL}
          />
        </div>
      </div>
    </CustomModal>
  );
}
