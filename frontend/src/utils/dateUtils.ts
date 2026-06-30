/**
 * Format date string for display
 * Converts YYYY-MM-DD format to a readable localized format
 * 
 * @param dateString - Date string in YYYY-MM-DD format or ISO format
 * @param language - Language code ('en' or 'ar') for localization
 * @returns Formatted date string or original string if invalid
 */
export const formatDateForDisplay = (
  dateString: string,
  language: "en" | "ar" = "en"
): string => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // Return original if invalid date
      return dateString;
    }

    return date.toLocaleDateString(language === "en" ? "en-US" : "ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    // Return original if parsing fails
    return dateString;
  }
};

/**
 * Format date string for input field (YYYY-MM-DD)
 * Converts various date formats to YYYY-MM-DD for HTML date inputs
 * 
 * @param dateString - Date string in any format
 * @returns Date string in YYYY-MM-DD format or empty string
 */
export const formatDateForInput = (dateString: string): string => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "";
    }

    // Format as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
};

/**
 * Format date with time for display
 * 
 * @param dateString - Date string in any format
 * @param language - Language code ('en' or 'ar') for localization
 * @returns Formatted date with time string
 */
export const formatDateTimeForDisplay = (
  dateString: string,
  language: "en" | "ar" = "en"
): string => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleString(language === "en" ? "en-US" : "ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

