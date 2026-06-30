import { isValidPhoneNumber, parsePhoneNumberFromString } from 'libphonenumber-js';

/**
 * Validates a phone number using libphonenumber-js
 * Supports all international formats and country-specific validation
 * 
 * @param phone - Phone number string (can include formatting)
 * @returns true if valid, false otherwise
 */
export function validatePhoneNumber(phone: string): boolean {
  if (!phone || !phone.trim()) {
    return false;
  }
  
  try {
    return isValidPhoneNumber(phone.trim());
  } catch (error) {
    // Handle parsing errors (invalid format)
    console.error(error);
    return false;
  }
}

/**
 * Gets validation error message for a phone number
 * 
 * @param phone - Phone number string to validate
 * @param isRTL - Whether to return Arabic error message
 * @returns Error message string or null if valid
 */
export function getPhoneValidationError(phone: string, isRTL: boolean): string | null {
  if (!phone || !phone.trim()) {
    return null; // Empty is valid (if field is optional)
  }
  
  const trimmedPhone = phone.trim();
  
  if (!validatePhoneNumber(trimmedPhone)) {
    return isRTL
      ? "يرجى إدخال رقم هاتف صالح"
      : "Please enter a valid phone number";
  }
  
  return null;
}

/**
 * Formats a phone number to international format (E.164)
 * 
 * @param phone - Phone number string
 * @returns Formatted phone number or original if invalid
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone || !phone.trim()) {
    return phone;
  }
  
  try {
    const phoneNumber = parsePhoneNumberFromString(phone.trim());
    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.format('E.164'); // Returns +971501234567 format
    }
  } catch (error) {
    console.error(error);
    // Return original if parsing fails
  }
  
  return phone;
}

