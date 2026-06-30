/**
 * Generic error message utility
 * Provides user-friendly error messages for HTTP status codes
 * Supports English and Arabic languages
 */

export type Language = 'en' | 'ar';

export interface ErrorMessages {
  [key: number]: {
    en: string;
    ar: string;
  };
}

/**
 * HTTP status code error messages
 * Add more status codes as needed
 */
export const HTTP_ERROR_MESSAGES: ErrorMessages = {
  400: {
    en: 'Invalid request. Please check your input.',
    ar: 'طلب غير صالح. يرجى التحقق من المدخلات.',
  },
  401: {
    en: 'Invalid email or password',
    ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
  },
  403: {
    en: 'Access forbidden',
    ar: 'الوصول محظور',
  },
  404: {
    en: 'Service not found',
    ar: 'الخدمة غير موجودة',
  },
  409: {
    en: 'Conflict. This resource already exists.',
    ar: 'تعارض. هذا المورد موجود بالفعل.',
  },
  422: {
    en: 'Validation error. Please check your input.',
    ar: 'خطأ في التحقق. يرجى التحقق من المدخلات.',
  },
  429: {
    en: 'Too many requests. Please try again later.',
    ar: 'طلبات كثيرة جداً. يرجى المحاولة لاحقاً.',
  },
  500: {
    en: 'Server error. Please try again later',
    ar: 'خطأ في الخادم. يرجى المحاولة لاحقاً',
  },
  502: {
    en: 'Bad gateway. Please try again later',
    ar: 'خطأ في البوابة. يرجى المحاولة لاحقاً',
  },
  503: {
    en: 'Service unavailable. Please try again later',
    ar: 'الخدمة غير متاحة. يرجى المحاولة لاحقاً',
  },
};

/**
 * Get error message for HTTP status code
 */
export const getHttpErrorMessage = (
  statusCode: number,
  language: Language = 'en'
): string => {
  const errorMessage = HTTP_ERROR_MESSAGES[statusCode];
  if (errorMessage) {
    return errorMessage[language];
  }
  
  // Default message for unknown status codes
  return language === 'en'
    ? `Request failed with status ${statusCode}`
    : `فشل الطلب برمز الحالة ${statusCode}`;
};

/**
 * Extract error message from RTK Query error response
 * Handles Django REST Framework error formats
 */
export const extractErrorMessage = (
  error: unknown,
  language: Language = 'en'
): string => {
  if (!error || typeof error !== 'object') {
    return language === 'en'
      ? 'An unexpected error occurred'
      : 'حدث خطأ غير متوقع';
  }

  const rtkError = error as {
    data?: {
      // Standard API response structure
      success?: boolean;
      status_code?: number;
      message?: {
        error?: string | string[];
        [key: string]: unknown;
      } | string;
      data?: unknown;
      // Django REST Framework formats
      detail?: string;
      non_field_errors?: string[];
      email?: string[];
      password?: string[];
      // Generic error formats
      error?: string | string[];
      [key: string]: unknown;
    };
    error?: string;
    status?: number;
  };

  // Try to extract error message from various possible structures
  if (rtkError.data) {
    // Handle custom API response structure: { message: { field_name: ["message"] } }
    // Example: { message: { price_interset: ["This field may not be blank."] } }
    if (rtkError.data.message && typeof rtkError.data.message === 'object') {
      const messageObj = rtkError.data.message as Record<string, unknown>;
      
      // First, check for the 'error' key (backward compatibility)
      if (messageObj.error) {
        if (Array.isArray(messageObj.error) && messageObj.error.length > 0) {
          return String(messageObj.error[0]);
        }
        if (typeof messageObj.error === 'string') {
          return messageObj.error;
        }
      }
      
      // Iterate through all keys in the message object to find field-specific errors
      for (const key in messageObj) {
        const value = messageObj[key];
        // If the value is an array of strings, return the first error message
        if (Array.isArray(value) && value.length > 0) {
          const firstError = value[0];
          if (typeof firstError === 'string' && firstError.trim()) {
            return firstError;
          }
        }
        // If the value is a string, return it directly
        if (typeof value === 'string' && value.trim()) {
          return value;
        }
      }
    }

    // Handle message as string
    if (typeof rtkError.data.message === 'string') {
      return rtkError.data.message;
    }

    // Check for field-specific errors (DRF format)
    if (rtkError.data.non_field_errors && Array.isArray(rtkError.data.non_field_errors)) {
      return rtkError.data.non_field_errors[0];
    }
    if (rtkError.data.email && Array.isArray(rtkError.data.email)) {
      return rtkError.data.email[0];
    }
    if (rtkError.data.password && Array.isArray(rtkError.data.password)) {
      return rtkError.data.password[0];
    }
    if (rtkError.data.detail) {
      return String(rtkError.data.detail);
    }
    if (rtkError.data.error) {
      if (Array.isArray(rtkError.data.error) && rtkError.data.error.length > 0) {
        return String(rtkError.data.error[0]);
      }
      return String(rtkError.data.error);
    }
  }

  // Check top-level error
  if (rtkError.error) {
    return String(rtkError.error);
  }

  // Handle HTTP status codes (check both status and status_code)
  const statusCode = rtkError.status || (rtkError.data?.status_code as number | undefined);
  if (statusCode) {
    return getHttpErrorMessage(statusCode, language);
  }

  // Fallback
  return language === 'en'
    ? 'An error occurred. Please try again.'
    : 'حدث خطأ. يرجى المحاولة مرة أخرى.';
};

