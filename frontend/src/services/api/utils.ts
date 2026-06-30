/**
 * Utility functions for API handling
 */

/**
 * Extracts token from various API response structures
 */
export function extractToken(response: unknown): string | null {
  if (!response || typeof response !== 'object') {
    return null;
  }

  const res = response as Record<string, unknown>;
  
  // Try different possible token locations
  if (typeof res.token === 'string') return res.token;
  if (typeof res.access === 'string') return res.access;
  
  // Check nested data structure
  if (res.data && typeof res.data === 'object') {
    const data = res.data as Record<string, unknown>;
    if (typeof data.token === 'string') return data.token;
    if (typeof data.access === 'string') return data.access;
  }

  return null;
}

/**
 * Extracts error message from RTK Query error response
 */
export function extractErrorMessage(
  error: unknown,
  defaultMessage: string = 'An error occurred'
): string {
  if (!error || typeof error !== 'object') {
    return defaultMessage;
  }

  const err = error as {
    data?: {
      message?: string;
      error?: string;
      detail?: string;
      non_field_errors?: string[];
      [key: string]: unknown;
    };
    error?: string;
    status?: number;
  };

  // Check for field-specific errors
  if (err.data) {
    if (Array.isArray(err.data.non_field_errors) && err.data.non_field_errors.length > 0) {
      return err.data.non_field_errors[0];
    }
    
    // Handle nested message object with field-specific errors
    // Example: { message: { price_interset: ["This field may not be blank."] } }
    if (err.data.message && typeof err.data.message === 'object') {
      const messageObj = err.data.message as Record<string, unknown>;
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
    
    // Check for field errors directly in data (email, password, etc.)
    for (const key in err.data) {
      // Skip 'message' key as we already handled it above
      if (key === 'message') continue;
      if (Array.isArray(err.data[key]) && (err.data[key] as unknown[]).length > 0) {
        return (err.data[key] as string[])[0];
      }
    }

    // Handle message as string (fallback)
    if (typeof err.data.message === 'string') return err.data.message;
    if (err.data.error) return err.data.error;
    if (err.data.detail) return err.data.detail;
  }

  if (err.error) return err.error;

  return defaultMessage;
}

/**
 * Gets HTTP status code from error
 */
export function getErrorStatus(error: unknown): number | null {
  if (error && typeof error === 'object') {
    const err = error as { status?: number };
    return err.status || null;
  }
  return null;
}

