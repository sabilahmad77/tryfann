import * as React from "react";
import { LucideIcon, Eye, EyeOff, X, Upload, FileText, Calendar } from "lucide-react";
import { Input } from "./input";
import { Label } from "./label";
import { Textarea } from "./textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Switch } from "./switch";
import { cn } from "./utils";
import { getPhoneValidationError } from "@/utils/phoneValidation";
// country-state-city bundles the full world geo dataset (~8.5 MB). It is used
// ONLY by <LocationField> below, so it is loaded lazily on demand (its own
// async chunk) instead of being baked into the main bundle.
type CSCModule = typeof import("country-state-city");
let cscModulePromise: Promise<CSCModule> | null = null;
const loadCSC = (): Promise<CSCModule> => {
  if (!cscModulePromise) cscModulePromise = import("country-state-city");
  return cscModulePromise;
};

// ============================================================================
// Base Field Wrapper Props
// ============================================================================

export interface BaseFieldProps {
  /** Field label text or ReactNode */
  label?: React.ReactNode;
  /** Field label HTML element ID */
  htmlFor?: string;
  /** Error message to display */
  error?: string;
  /** Helper text to display below the field */
  helperText?: string;
  /** Whether the field is required */
  required?: boolean;
  /** RTL support - if true, shows Arabic optional text */
  isRTL?: boolean;
  /** Hide optional text even when field is not required */
  hideOptional?: boolean;
  /** Custom className for the wrapper */
  className?: string;
  /** Custom className for the label */
  labelClassName?: string;
  /** Custom className for the input/select */
  inputClassName?: string;
}

// ============================================================================
// Input Field Component
// ============================================================================

export interface InputFieldProps
  extends Omit<React.ComponentProps<"input">, "className">,
  BaseFieldProps {
  /** Optional icon to display on the left (LTR) or right (RTL) */
  icon?: LucideIcon;
  /** Icon position - 'left' for LTR, 'right' for RTL (auto-adjusted based on isRTL) */
  iconPosition?: "left" | "right";
  /** Custom icon className */
  iconClassName?: string;
  /** Disable automatic phone validation when type="tel" (default: false) */
  validatePhone?: boolean;
}

/**
 * Reusable Input Field component with icon support and RTL compatibility
 *
 * @example
 * ```tsx
 * <InputField
 *   label="Email"
 *   type="email"
 *   placeholder="your.email@example.com"
 *   icon={Mail}
 *   isRTL={false}
 *   required
 * />
 * ```
 */
export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      label,
      htmlFor,
      error,
      helperText,
      required,
      isRTL = false,
      hideOptional = false,
      icon: Icon,
      iconPosition,
      className,
      labelClassName,
      inputClassName,
      iconClassName,
      id,
      type,
      validatePhone = true,
      ...inputProps
    },
    ref
  ) => {
    const generatedId = React.useId();
    const fieldId = id || htmlFor || generatedId;
    const effectiveIconPosition = iconPosition || (isRTL ? "right" : "left");
    const hasIcon = !!Icon;
    const isDateType = type === "date";
    const isTelType = type === "tel";
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [phoneError, setPhoneError] = React.useState<string | null>(null);

    // Combine phone validation error with prop error
    const hasError = !!error || !!phoneError;
    const finalError = error || phoneError;

    // Determine optional text based on isRTL
    const optionalText = isRTL ? "(اختياري)" : "(Optional)";

    // Extract ref, onBlur, onChange, and onKeyDown from inputProps if it comes from react-hook-form register
    const { ref: registerRef, onBlur: registerOnBlur, onChange: registerOnChange, onKeyDown: registerOnKeyDown, ...restInputProps } = inputProps as {
      ref?: React.Ref<HTMLInputElement>;
      onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
      onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
      onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    } & typeof inputProps;

    // Extract onChange and onKeyDown from restInputProps if they exist (for non-register usage)
    const { onChange: restOnChange, onKeyDown: restOnKeyDown, placeholder: providedPlaceholder, ...finalRestInputProps } = restInputProps as {
      onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
      onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
      placeholder?: string;
    } & typeof restInputProps;

    // Set default placeholder for tel type if not provided
    const defaultTelPlaceholder = isRTL ? "+971 50 123 4567" : "+1 234 567 8900";
    const placeholder = isTelType && !providedPlaceholder 
      ? defaultTelPlaceholder 
      : providedPlaceholder;

    // Handle calendar icon click to open date picker
    const handleCalendarClick = () => {
      const input = inputRef.current;
      if (input && isDateType) {
        // Try showPicker() first (modern browsers)
        if (typeof input.showPicker === "function") {
          input.showPicker();
        } else {
          // Fallback: trigger click on input
          input.click();
        }
      }
    };

    // Handle phone validation on blur
    const handlePhoneBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (isTelType && validatePhone) {
        const value = e.target.value.trim();
        if (value) {
          const error = getPhoneValidationError(value, isRTL);
          setPhoneError(error);
        } else {
          setPhoneError(null);
        }
      }
    };

    // Handle keydown - restrict space when empty and restrict alphabets for tel type
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      const isEmpty = !input.value || input.value.trim().length === 0;

      // Prevent space when input is empty (for all types)
      if (e.key === " " && isEmpty) {
        e.preventDefault();
        return;
      }

      // For tel type, restrict alphabets (only allow numbers and phone formatting characters)
      if (isTelType) {
        // Allow: numbers, +, -, space, (, ), ., Backspace, Delete, Tab, Arrow keys, Home, End
        const allowedKeys = [
          "Backspace",
          "Delete",
          "Tab",
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "Home",
          "End",
        ];

        // Allow control keys (Ctrl, Alt, Meta) - for copy/paste, etc.
        if (e.ctrlKey || e.altKey || e.metaKey) {
          // Call original onKeyDown if provided
          if (registerOnKeyDown) {
            registerOnKeyDown(e);
          }
          if (restOnKeyDown) {
            restOnKeyDown(e);
          }
          return;
        }

        // Check if key is allowed navigation/editing key
        if (allowedKeys.includes(e.key)) {
          // Call original onKeyDown if provided
          if (registerOnKeyDown) {
            registerOnKeyDown(e);
          }
          if (restOnKeyDown) {
            restOnKeyDown(e);
          }
          return;
        }

        // Allow numbers (0-9)
        if (/^[0-9]$/.test(e.key)) {
          // Call original onKeyDown if provided
          if (registerOnKeyDown) {
            registerOnKeyDown(e);
          }
          if (restOnKeyDown) {
            restOnKeyDown(e);
          }
          return;
        }

        // Allow phone formatting characters: +, -, space, (, ), .
        if (/^[+\-() .]$/.test(e.key)) {
          // Call original onKeyDown if provided
          if (registerOnKeyDown) {
            registerOnKeyDown(e);
          }
          if (restOnKeyDown) {
            restOnKeyDown(e);
          }
          return;
        }

        // Block all other keys (alphabets, special characters, etc.)
        e.preventDefault();
        return;
      }

      // For non-tel types, just handle space restriction and call original handlers
      if (registerOnKeyDown) {
        registerOnKeyDown(e);
      }
      if (restOnKeyDown) {
        restOnKeyDown(e);
      }
    };

    // Handle change for tel type - filter out invalid characters on paste/input
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let finalEvent = e;

      if (isTelType) {
        // Only allow numbers and phone formatting characters
        const value = e.target.value;
        const filtered = value.replace(/[^0-9+\-() .]/g, "");
        if (value !== filtered) {
          // Update the input value
          e.target.value = filtered;
          // Create synthetic event with filtered value
          finalEvent = {
            ...e,
            target: { ...e.target, value: filtered },
          } as React.ChangeEvent<HTMLInputElement>;
        }
      }

      // Call registerOnChange if provided (from react-hook-form register)
      if (registerOnChange) {
        registerOnChange(finalEvent);
      }

      // Call restOnChange if provided (for non-register usage)
      if (restOnChange) {
        restOnChange(finalEvent);
      }
    };

    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <Label
            htmlFor={fieldId}
            className={cn(
              "text-[#F2F2F3]/80",
              hasError && "text-destructive",
              labelClassName
            )}
          >
            {label}
            {required ? (
              <span className="text-red-500">*</span>
            ) : !hideOptional ? (
              <span className="opacity-50 text-xs ml-1">{optionalText}</span>
            ) : null}
          </Label>
        )}

        <div className="relative">
          {hasIcon && effectiveIconPosition === (isRTL ? "right" : "left") && (
            <Icon
              className={cn(
                "absolute top-1/2 -translate-y-1/2 w-5 h-5 text-[#F2F2F3]/40 pointer-events-none",
                isRTL ? "right-3" : "left-3",
                iconClassName
              )}
            />
          )}

          <Input
            ref={(node) => {
              // Store in internal ref for calendar functionality
              // @ts-expect-error - inputRef is mutable, this is safe
              inputRef.current = node;

              // Handle react-hook-form ref
              if (registerRef) {
                if (typeof registerRef === "function") {
                  registerRef(node);
                } else if (registerRef && typeof registerRef === "object" && "current" in registerRef) {
                  // @ts-expect-error - registerRef from react-hook-form is typically mutable
                  registerRef.current = node;
                }
              }

              // Handle external ref (from forwardRef)
              if (typeof ref === "function") {
                ref(node);
              } else if (ref && typeof ref === "object" && "current" in ref) {
                ref.current = node;
              }
            }}
            id={fieldId}
            type={type}
            className={cn(
              "bg-background border-[#C59B48]/20 text-[#F2F2F3] placeholder:text-[#F2F2F3]/30 h-11",
              "focus:border-[#C59B48]/50 focus:ring-[#C59B48]/20",
              hasError &&
              "border-destructive focus:border-destructive focus:ring-destructive/20",
              hasIcon &&
              effectiveIconPosition === (isRTL ? "right" : "left") &&
              (isRTL ? "pr-10" : "pl-10"),
              hasIcon &&
              effectiveIconPosition === (isRTL ? "left" : "right") &&
              (isRTL ? "pl-10" : "pr-10"),
              isDateType && (isRTL ? "pl-10" : "pr-10"), // Add padding for calendar icon
              inputClassName
            )}
            aria-invalid={hasError}
            aria-describedby={
              finalError
                ? `${fieldId}-error`
                : helperText
                  ? `${fieldId}-helper`
                  : undefined
            }
            required={required}
            placeholder={placeholder}
            {...finalRestInputProps}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={(e) => {
              handlePhoneBlur(e);
              // Call original onBlur if provided (from react-hook-form register)
              if (registerOnBlur) {
                registerOnBlur(e);
              }
            }}
          />

          {hasIcon && effectiveIconPosition === (isRTL ? "left" : "right") && (
            <Icon
              className={cn(
                "absolute top-1/2 -translate-y-1/2 w-5 h-5 text-[#F2F2F3]/40 pointer-events-none",
                isDateType
                  ? isRTL
                    ? "left-10"
                    : "right-10"
                  : isRTL
                    ? "left-3"
                    : "right-3",
                iconClassName
              )}
            />
          )}

          {/* Calendar icon for date type - always at the end */}
          {isDateType && (
            <button
              type="button"
              onClick={handleCalendarClick}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 w-5 h-5 text-white hover:text-[#C59B48] transition-colors cursor-pointer z-10",
                isRTL ? "left-3" : "right-3"
              )}
              aria-label={isRTL ? "فتح التقويم" : "Open calendar"}
              tabIndex={0}
            >
              <Calendar className="w-5 h-5" />
            </button>
          )}
        </div>

        {finalError && (
          <p
            id={`${fieldId}-error`}
            className="text-sm text-destructive"
            role="alert"
          >
            {finalError}
          </p>
        )}

        {helperText && !finalError && (
          <p id={`${fieldId}-helper`} className="text-sm text-[#F2F2F3]/60">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

InputField.displayName = "InputField";

// ============================================================================
// Password Field Component
// ============================================================================

export interface PasswordFieldProps
  extends Omit<React.ComponentProps<"input">, "type" | "className">,
  BaseFieldProps {
  /** Optional icon to display on the left (LTR) or right (RTL) */
  icon?: LucideIcon;
  /** Icon position - 'left' for LTR, 'right' for RTL (auto-adjusted based on isRTL) */
  iconPosition?: "left" | "right";
  /** Custom icon className */
  iconClassName?: string;
  /** Show password toggle button */
  showToggle?: boolean;
  /** Controlled show password state (if not provided, uses internal state) */
  showPassword?: boolean;
  /** Callback when show password state changes */
  onShowPasswordChange?: (show: boolean) => void;
  /** Custom className for the toggle button */
  toggleButtonClassName?: string;
}

/**
 * Reusable Password Field component with show/hide toggle and RTL compatibility
 *
 * @example
 * ```tsx
 * <PasswordField
 *   label="Password"
 *   placeholder="Enter your password"
 *   icon={Lock}
 *   isRTL={false}
 *   showToggle
 *   required
 * />
 * ```
 */
export const PasswordField = React.forwardRef<
  HTMLInputElement,
  PasswordFieldProps
>(
  (
    {
      label,
      htmlFor,
      error,
      helperText,
      required,
      isRTL = false,
      hideOptional = false,
      icon: Icon,
      iconPosition,
      className,
      labelClassName,
      inputClassName,
      iconClassName,
      toggleButtonClassName,
      showToggle = true,
      showPassword: controlledShowPassword,
      onShowPasswordChange,
      id,
      ...inputProps
    },
    ref
  ) => {
    const generatedId = React.useId();
    const fieldId = id || htmlFor || generatedId;
    const [internalShowPassword, setInternalShowPassword] =
      React.useState(false);
    const isControlled = controlledShowPassword !== undefined;
    const showPassword = isControlled
      ? controlledShowPassword
      : internalShowPassword;
    const hasIcon = !!Icon;
    const hasError = !!error;
    const effectiveIconPosition = iconPosition || (isRTL ? "right" : "left");

    // Determine optional text based on isRTL
    const optionalText = isRTL ? "(اختياري)" : "(Optional)";

    // Extract ref and onKeyDown from inputProps if it comes from react-hook-form register
    const { ref: registerRef, onKeyDown: registerOnKeyDown, ...restInputProps } = inputProps as {
      ref?: React.Ref<HTMLInputElement>;
      onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    } & typeof inputProps;

    // Extract onKeyDown from restInputProps if it exists (for non-register usage)
    const { onKeyDown: restOnKeyDown, ...finalRestInputProps } = restInputProps as {
      onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    } & typeof restInputProps;

    const handleTogglePassword = () => {
      const newValue = !showPassword;
      if (isControlled) {
        onShowPasswordChange?.(newValue);
      } else {
        setInternalShowPassword(newValue);
      }
    };

    // Handle keydown - restrict space when empty
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      const isEmpty = !input.value || input.value.trim().length === 0;

      // Prevent space when input is empty
      if (e.key === " " && isEmpty) {
        e.preventDefault();
        return;
      }

      // Call original onKeyDown handlers if provided
      if (registerOnKeyDown) {
        registerOnKeyDown(e);
      }
      if (restOnKeyDown) {
        restOnKeyDown(e);
      }
    };

    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <Label
            htmlFor={fieldId}
            className={cn(
              "text-[#F2F2F3]/80",
              hasError && "text-destructive",
              labelClassName
            )}
          >
            {label}
            {required ? (
              <span className="text-red-500">*</span>
            ) : !hideOptional ? (
              <span className="opacity-50 text-xs ml-1">{optionalText}</span>
            ) : null}
          </Label>
        )}

        <div className="relative">
          {hasIcon && effectiveIconPosition === (isRTL ? "right" : "left") && (
            <Icon
              className={cn(
                "absolute top-1/2 -translate-y-1/2 w-5 h-5 text-[#F2F2F3]/40 pointer-events-none",
                isRTL ? "right-3" : "left-3",
                iconClassName
              )}
            />
          )}

          <Input
            ref={registerRef || ref}
            id={fieldId}
            type={showPassword ? "text" : "password"}
            className={cn(
              "bg-background border-[#C59B48]/20 text-[#F2F2F3] placeholder:text-[#F2F2F3]/30 h-11",
              "focus:border-[#C59B48]/50 focus:ring-[#C59B48]/20",
              hasError &&
              "border-destructive focus:border-destructive focus:ring-destructive/20",
              // Icon padding (left side for LTR, right side for RTL)
              hasIcon &&
              effectiveIconPosition === (isRTL ? "right" : "left") &&
              (isRTL ? "pr-10" : "pl-10"),
              // Toggle padding (right side for LTR, left side for RTL)
              showToggle && (isRTL ? "pl-10" : "pr-10"),
              inputClassName
            )}
            aria-invalid={hasError}
            aria-describedby={
              error
                ? `${fieldId}-error`
                : helperText
                  ? `${fieldId}-helper`
                  : undefined
            }
            required={required}
            {...finalRestInputProps}
            onKeyDown={handleKeyDown}
          />

          {showToggle && (
            <button
              type="button"
              onClick={handleTogglePassword}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 text-[#F2F2F3]/40 hover:text-[#F2F2F3]/60 transition-colors",
                isRTL ? "left-3" : "right-3",
                toggleButtonClassName
              )}
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={0}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}

          {hasIcon && effectiveIconPosition === (isRTL ? "left" : "right") && (
            <Icon
              className={cn(
                "absolute top-1/2 -translate-y-1/2 w-5 h-5 text-[#F2F2F3]/40 pointer-events-none",
                showToggle
                  ? isRTL
                    ? "right-10"
                    : "left-10"
                  : isRTL
                    ? "right-3"
                    : "left-3",
                iconClassName
              )}
            />
          )}
        </div>

        {error && (
          <p
            id={`${fieldId}-error`}
            className="text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={`${fieldId}-helper`} className="text-sm text-[#F2F2F3]/60">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

PasswordField.displayName = "PasswordField";

// ============================================================================
// Select Field Component
// ============================================================================

export interface SelectFieldOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps
  extends Omit<React.ComponentProps<typeof Select>, "className">,
  BaseFieldProps {
  /** Options for the select dropdown */
  options: SelectFieldOption[];
  /** Placeholder text */
  placeholder?: string;
  /** Optional icon to display on the left (LTR) or right (RTL) */
  icon?: LucideIcon;
  /** Icon position - 'left' for LTR, 'right' for RTL (auto-adjusted based on isRTL) */
  iconPosition?: "left" | "right";
  /** Custom icon className */
  iconClassName?: string;
  /** Custom className for SelectTrigger */
  triggerClassName?: string;
  /** Custom className for SelectContent */
  contentClassName?: string;
  /** Custom className for SelectItem */
  itemClassName?: string;
  /** Field ID */
  id?: string;
  /** Disable clear button (useful for required fields that cannot be null) */
  disableClear?: boolean;
}

/**
 * Reusable Select Field component with icon support and RTL compatibility
 *
 * @example
 * ```tsx
 * <SelectField
 *   label="Region"
 *   placeholder="Select your region"
 *   icon={MapPin}
 *   options={[
 *     { value: 'uae', label: 'UAE' },
 *     { value: 'saudi', label: 'Saudi Arabia' }
 *   ]}
 *   isRTL={false}
 * />
 * ```
 */
export const SelectField = React.forwardRef<
  React.ElementRef<typeof SelectTrigger>,
  SelectFieldProps
>(
  (
    {
      label,
      htmlFor,
      error,
      helperText,
      required,
      isRTL = false,
      hideOptional = false,
      icon: Icon,
      iconPosition,
      className,
      labelClassName,
      inputClassName,
      iconClassName,
      triggerClassName,
      contentClassName,
      itemClassName,
      options,
      placeholder,
      id,
      value,
      onValueChange,
      disableClear = false,
      ...selectProps
    },
    ref
  ) => {
    const generatedId = React.useId();
    const fieldId = id || htmlFor || generatedId;
    const hasIcon = !!Icon;
    const hasError = !!error;
    const effectiveIconPosition = iconPosition || (isRTL ? "right" : "left");

    // Determine optional text based on isRTL
    const optionalText = isRTL ? "(اختياري)" : "(Optional)";

    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <Label
            htmlFor={fieldId}
            className={cn(
              "text-[#F2F2F3]/80",
              hasError && "text-destructive",
              labelClassName
            )}
          >
            {label}
            {required ? (
              <span className="text-red-500">*</span>
            ) : !hideOptional ? (
              <span className="opacity-50 text-xs ml-1">{optionalText}</span>
            ) : null}
          </Label>
        )}

        <div className="relative">
          {hasIcon && effectiveIconPosition === (isRTL ? "right" : "left") && (
            <Icon
              className={cn(
                "absolute top-1/2 -translate-y-1/2 w-5 h-5 text-[#F2F2F3]/40 z-10 pointer-events-none",
                isRTL ? "right-3" : "left-3",
                iconClassName
              )}
            />
          )}

          <Select value={value} onValueChange={onValueChange} {...selectProps}>
            <SelectTrigger
              ref={ref}
              id={fieldId}
              size="default"
              className={cn(
                "bg-background border-[#C59B48]/20 text-[#F2F2F3]",
                "h-11 data-[size=default]:!h-11",
                "!py-1 px-3",
                "focus-visible:border-[#C59B48]/50 focus-visible:ring-[#C59B48]/20 focus-visible:ring-[3px]",
                "hover:bg-[#0B0B0D]/80 transition-colors",
                '[&_svg:not([class*="text-"])]:text-[#F2F2F3]/40',
                hasError &&
                "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
                hasIcon &&
                effectiveIconPosition === (isRTL ? "right" : "left") &&
                (isRTL ? "pr-10" : "pl-10"),
                value && (isRTL ? "pl-10" : "pr-10"), // Add padding for clear button when value exists
                triggerClassName,
                inputClassName
              )}
              aria-invalid={hasError}
              aria-describedby={
                error
                  ? `${fieldId}-error`
                  : helperText
                    ? `${fieldId}-helper`
                    : undefined
              }
            >
              <SelectValue
                className="text-[#F2F2F3] data-[placeholder]:text-[#F2F2F3]/30"
                placeholder={placeholder}
              />
            </SelectTrigger>
            <SelectContent
              className={cn(
                "bg-background border-white/10 shadow-none",
                contentClassName
              )}
            >
              {options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={cn(
                    "text-white focus:bg-amber-500/10 focus:text-amber-400",
                    itemClassName
                  )}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear button - shows when value exists and clear is not disabled */}
          {value && onValueChange && !disableClear && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onValueChange("");
              }}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 w-5 h-5 text-[#F2F2F3]/40 hover:text-[#F2F2F3]/60 transition-colors z-10 cursor-pointer",
                "flex items-center justify-center rounded-full hover:bg-[#F2F2F3]/10",
                isRTL ? "left-3" : "right-3"
              )}
              aria-label={isRTL ? "مسح" : "Clear"}
              tabIndex={0}
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {hasIcon && effectiveIconPosition === (isRTL ? "left" : "right") && (
            <Icon
              className={cn(
                "absolute top-1/2 -translate-y-1/2 w-5 h-5 text-[#F2F2F3]/40 z-10 pointer-events-none",
                value
                  ? isRTL
                    ? "right-10"
                    : "left-10"
                  : isRTL
                    ? "left-3"
                    : "right-3", // Adjust position if clear button exists
                iconClassName
              )}
            />
          )}
        </div>

        {error && (
          <p
            id={`${fieldId}-error`}
            className="text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={`${fieldId}-helper`} className="text-sm text-[#F2F2F3]/60">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

SelectField.displayName = "SelectField";

// ============================================================================
// Textarea Field Component
// ============================================================================

export interface TextareaFieldProps
  extends Omit<React.ComponentProps<"textarea">, "className">,
  BaseFieldProps {
  /** Optional icon to display on the left (LTR) or right (RTL) */
  icon?: LucideIcon;
  /** Icon position - 'left' for LTR, 'right' for RTL (auto-adjusted based on isRTL) */
  iconPosition?: "left" | "right";
  /** Custom icon className */
  iconClassName?: string;
}

/**
 * Reusable Textarea Field component with icon support and RTL compatibility
 *
 * @example
 * ```tsx
 * <TextareaField
 *   label="Bio"
 *   placeholder="Tell us about yourself..."
 *   icon={FileText}
 *   isRTL={false}
 *   required
 * />
 * ```
 */
export const TextareaField = React.forwardRef<
  HTMLTextAreaElement,
  TextareaFieldProps
>(
  (
    {
      label,
      htmlFor,
      error,
      helperText,
      required,
      isRTL = false,
      hideOptional = false,
      icon: Icon,
      iconPosition,
      className,
      labelClassName,
      inputClassName,
      iconClassName,
      id,
      ...textareaProps
    },
    ref
  ) => {
    const generatedId = React.useId();
    const fieldId = id || htmlFor || generatedId;
    const effectiveIconPosition = iconPosition || (isRTL ? "right" : "left");
    const hasIcon = !!Icon;
    const hasError = !!error;

    // Determine optional text based on isRTL
    const optionalText = isRTL ? "(اختياري)" : "(Optional)";

    // Extract ref and onKeyDown from textareaProps if it comes from react-hook-form register
    // react-hook-form's register returns { ref, onChange, onBlur, name }
    const { ref: registerRef, onKeyDown: registerOnKeyDown, ...restTextareaProps } = textareaProps as {
      ref?: React.Ref<HTMLTextAreaElement>;
      onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
      onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
      onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
      name?: string;
    } & typeof textareaProps;

    // Extract onKeyDown from restTextareaProps if it exists (for non-register usage)
    const { onKeyDown: restOnKeyDown, ...finalRestTextareaProps } = restTextareaProps as {
      onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    } & typeof restTextareaProps;

    // Handle keydown - restrict space when empty
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = e.currentTarget;
      const isEmpty = !textarea.value || textarea.value.trim().length === 0;

      // Prevent space when textarea is empty
      if (e.key === " " && isEmpty) {
        e.preventDefault();
        return;
      }

      // Call original onKeyDown handlers if provided
      if (registerOnKeyDown) {
        registerOnKeyDown(e);
      }
      if (restOnKeyDown) {
        restOnKeyDown(e);
      }
    };

    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <Label
            htmlFor={fieldId}
            className={cn(
              "text-[#F2F2F3]/80",
              hasError && "text-destructive",
              labelClassName
            )}
          >
            {label}
            {required ? (
              <span className="text-red-500">*</span>
            ) : !hideOptional ? (
              <span className="opacity-50 text-xs ml-1">{optionalText}</span>
            ) : null}
          </Label>
        )}

        <div className="relative">
          {hasIcon && effectiveIconPosition === (isRTL ? "right" : "left") && (
            <Icon
              className={cn(
                "absolute top-3 w-5 h-5 text-[#F2F2F3]/40 pointer-events-none",
                isRTL ? "right-3" : "left-3",
                iconClassName
              )}
            />
          )}

          <Textarea
            ref={registerRef || ref}
            id={fieldId}
            className={cn(
              "bg-background border-[#C59B48]/20 text-[#F2F2F3] placeholder:text-[#F2F2F3]/30 min-h-32",
              "focus:border-[#C59B48]/50 focus:ring-[#C59B48]/20 resize-none",
              hasError &&
              "border-destructive focus:border-destructive focus:ring-destructive/20",
              hasIcon &&
              effectiveIconPosition === (isRTL ? "right" : "left") &&
              (isRTL ? "pr-10" : "pl-10"),
              inputClassName
            )}
            aria-invalid={hasError}
            aria-describedby={
              error
                ? `${fieldId}-error`
                : helperText
                  ? `${fieldId}-helper`
                  : undefined
            }
            required={required}
            {...finalRestTextareaProps}
            onKeyDown={handleKeyDown}
          />

          {hasIcon && effectiveIconPosition === (isRTL ? "left" : "right") && (
            <Icon
              className={cn(
                "absolute top-3 w-5 h-5 text-[#F2F2F3]/40 pointer-events-none",
                isRTL ? "left-3" : "right-3",
                iconClassName
              )}
            />
          )}
        </div>

        {error && (
          <p
            id={`${fieldId}-error`}
            className="text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={`${fieldId}-helper`} className="text-sm text-[#F2F2F3]/60">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

TextareaField.displayName = "TextareaField";

// ============================================================================
// File Upload Field Component
// ============================================================================

export interface FileUploadFieldProps
  extends Omit<
    React.ComponentProps<"input">,
    "type" | "className" | "value" | "onChange"
  >,
  BaseFieldProps {
  /** Optional icon to display */
  icon?: LucideIcon;
  /** Accepted file types (e.g., "image/*", ".pdf,.png,.jpg") */
  accept?: string;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Callback when file is selected (single file mode) */
  onFileChange?: (file: File | null) => void;
  /** Callback when files are selected (multiple file mode) */
  onFilesChange?: (files: File[]) => void;
  /** Callback when preview items change */
  onPreviewChange?: (items: Array<{ id: string; url: string; name: string; file?: File | null; sourceType: "local" | "existing" }>) => void;
  /** Currently selected file (single file mode) */
  value?: File | null;
  /** Currently selected files (multiple file mode) */
  files?: File[];
  /** Whether to allow multiple file selection */
  multiple?: boolean;
  /** Maximum number of files allowed (only applies when multiple=true) */
  maxFiles?: number;
  /** Custom className for upload button */
  buttonClassName?: string;
  /** Upload button text */
  buttonText?: string;
  /** Helper text showing accepted formats */
  formatText?: string;
  /** Whether to show preview inline (default: true for single, false for multiple - use ImagePreviewList separately) */
  showPreview?: boolean;
}

/**
 * Reusable File Upload Field component with preview and RTL compatibility
 *
 * @example
 * ```tsx
 * <FileUploadField
 *   label="Profile Photo"
 *   accept="image/*"
 *   maxSize={5 * 1024 * 1024} // 5MB
 *   onFileChange={(file) => setFile(file)}
 *   isRTL={false}
 * />
 * ```
 */
export const FileUploadField = React.forwardRef<
  HTMLInputElement,
  FileUploadFieldProps
>(
  (
    {
      label,
      htmlFor,
      error,
      helperText,
      required,
      isRTL = false,
      hideOptional = false,
      icon: Icon = Upload,
      className,
      labelClassName,
      buttonClassName,
      buttonText,
      formatText,
      accept,
      maxSize,
      onFileChange,
      onFilesChange,
      onPreviewChange,
      value,
      files,
      multiple = false,
      maxFiles,
      showPreview,
      id,
      ...inputProps
    },
    ref
  ) => {
    const generatedId = React.useId();
    const fieldId = id || htmlFor || generatedId;
    const [selectedFile, setSelectedFile] = React.useState<File | null>(
      value || null
    );
    const [selectedFiles, setSelectedFiles] = React.useState<File[]>(
      files || []
    );
    const [fileError, setFileError] = React.useState<string>("");
    const hasError = !!error || !!fileError;

    // Determine if we should show preview inline
    const shouldShowPreview = showPreview !== undefined
      ? showPreview
      : !multiple; // Default: show for single, hide for multiple

    // Determine optional text based on isRTL
    const optionalText = isRTL ? "(اختياري)" : "(Optional)";

    // Default button text based on language
    const defaultButtonText =
      buttonText || (isRTL ? "انقر للتحميل" : "Click to upload");

    // Default format text
    const defaultFormatText =
      formatText ||
      (isRTL ? "PDF، PNG، JPG حتى 10 ميجابايت" : "PDF, PNG, JPG up to 10MB");

    // Sync with controlled value prop (single file mode)
    React.useEffect(() => {
      if (value !== undefined && !multiple) {
        setSelectedFile(value);
      }
    }, [value, multiple]);

    // Sync with controlled files prop (multiple file mode)
    React.useEffect(() => {
      if (files !== undefined && multiple) {
        setSelectedFiles(files);
      }
    }, [files, multiple]);

    // Validate a single file
    const validateFile = (file: File): string | null => {
      // Validate file size
      if (maxSize && file.size > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
        return isRTL
          ? `حجم الملف كبير جداً. الحد الأقصى ${maxSizeMB} ميجابايت`
          : `File size too large. Maximum size is ${maxSizeMB}MB`;
      }

      // Validate file type
      if (
        accept &&
        !accept.split(",").some((pattern) => {
          const trimmed = pattern.trim();
          if (trimmed.startsWith(".")) {
            return file.name.toLowerCase().endsWith(trimmed.toLowerCase());
          }
          if (trimmed.includes("/*")) {
            const baseType = trimmed.split("/")[0];
            return file.type.startsWith(baseType);
          }
          return file.type === trimmed;
        })
      ) {
        return isRTL
          ? "نوع الملف غير مدعوم"
          : "File type not supported";
      }

      return null;
    };

    // Create preview items from files
    const createPreviewItems = (fileList: File[]): Array<{ id: string; url: string; name: string; file: File; sourceType: "local" }> => {
      return fileList.map((file, index) => {
        const previewUrl = URL.createObjectURL(file);
        return {
          id: `file-${Date.now()}-${index}-${file.name}`,
          url: previewUrl,
          name: file.name,
          file,
          sourceType: "local" as const,
        };
      });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputFiles = Array.from(e.target.files || []);
      setFileError("");

      if (multiple) {
        // Multiple file mode
        let newFiles = [...selectedFiles];

        // Validate all new files
        for (const file of inputFiles) {
          const validationError = validateFile(file);
          if (validationError) {
            setFileError(validationError);
            e.target.value = "";
            return;
          }
        }

        // Check maxFiles limit
        if (maxFiles && newFiles.length + inputFiles.length > maxFiles) {
          const errorMsg = isRTL
            ? `يمكنك تحميل ${maxFiles} ملفات كحد أقصى`
            : `You can upload up to ${maxFiles} files`;
          setFileError(errorMsg);
          e.target.value = "";
          return;
        }

        // Add new files
        newFiles = [...newFiles, ...inputFiles];

        // Enforce maxFiles limit (take first N files)
        if (maxFiles && newFiles.length > maxFiles) {
          newFiles = newFiles.slice(0, maxFiles);
          const warningMsg = isRTL
            ? `تم تحديد ${maxFiles} ملفات فقط`
            : `Only ${maxFiles} files selected`;
          setFileError(warningMsg);
        }

        setSelectedFiles(newFiles);
        onFilesChange?.(newFiles);

        // Create preview items and notify
        const previewItems = createPreviewItems(newFiles);
        onPreviewChange?.(previewItems);
      } else {
        // Single file mode
        const file = inputFiles[0] || null;

        if (file) {
          const validationError = validateFile(file);
          if (validationError) {
            setFileError(validationError);
            e.target.value = "";
            return;
          }
        }

        setSelectedFile(file);
        onFileChange?.(file);

        // Create preview item and notify
        if (file) {
          const previewItems = createPreviewItems([file]);
          onPreviewChange?.(previewItems);
        } else {
          onPreviewChange?.([]);
        }
      }
    };

    const handleRemoveFile = (index?: number) => {
      if (multiple) {
        // Remove file at index
        const newFiles = index !== undefined
          ? selectedFiles.filter((_, i) => i !== index)
          : [];
        setSelectedFiles(newFiles);
        onFilesChange?.(newFiles);

        // Cleanup blob URLs for removed files
        if (index !== undefined) {
          const removedFile = selectedFiles[index];
          if (removedFile) {
            // Note: blob URLs are cleaned up when component unmounts or when files change
            // We rely on the cleanup in useEffect
          }
        }

        // Update preview
        const previewItems = createPreviewItems(newFiles);
        onPreviewChange?.(previewItems);
      } else {
        setSelectedFile(null);
        setFileError("");
        onFileChange?.(null);
        onPreviewChange?.([]);
      }

      // Reset the input element
      const input = document.getElementById(fieldId) as HTMLInputElement;
      if (input) {
        input.value = "";
      }
    };

    // Cleanup blob URLs on unmount or when files change
    React.useEffect(() => {
      return () => {
        if (multiple) {
          // Note: blob URLs are created in createPreviewItems, but we need to track them
          // For now, we'll rely on the browser's garbage collection
          // In a production app, you might want to track blob URLs explicitly
          // The cleanup is handled by the ImagePreviewList component when items are removed
        } else if (selectedFile) {
          // Single file cleanup is handled by the preview component
        }
      };
    }, [multiple, selectedFiles, selectedFile]);

    const currentFiles = multiple ? selectedFiles : (selectedFile ? [selectedFile] : []);
    const hasFiles = currentFiles.length > 0;

    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <Label
            htmlFor={fieldId}
            className={cn(
              "text-[#F2F2F3]/80",
              hasError && "text-destructive",
              labelClassName
            )}
          >
            {label}
            {required ? (
              <span className="text-red-500">*</span>
            ) : !hideOptional ? (
              <span className="opacity-50 text-xs ml-1">{optionalText}</span>
            ) : null}
            {multiple && maxFiles && (
              <span className="opacity-50 text-xs ml-1">
                {isRTL ? `(حد أقصى ${maxFiles})` : `(max ${maxFiles})`}
              </span>
            )}
          </Label>
        )}

        <div className="space-y-2">
          {/* Upload Button Area */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                ref={ref}
                id={fieldId}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                multiple={multiple}
                className="hidden"
                {...(hasError && { "aria-invalid": "true" })}
                aria-describedby={
                  error || fileError
                    ? `${fieldId}-error`
                    : helperText
                      ? `${fieldId}-helper`
                      : undefined
                }
                required={required && !hasFiles}
                {...inputProps}
              />
              <label
                htmlFor={fieldId}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all",
                  "bg-background border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10",
                  "text-white/70 hover:text-white",
                  hasError && "border-destructive",
                  required && !hasFiles && "cursor-not-allowed opacity-50",
                  buttonClassName
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{defaultButtonText}</span>
              </label>
            </div>
            {formatText && (
              <span className="text-xs text-white/40">{defaultFormatText}</span>
            )}
          </div>

          {/* Selected File Preview (only for single file mode or when showPreview=true) */}
          {shouldShowPreview && hasFiles && (
            <div className="space-y-2">
              {currentFiles.map((file, index) => (
                <div key={`${file.name}-${index}`} className="space-y-2">
                  {/* Image Preview for image files */}
                  {file.type.startsWith("image/") && (
                    <div className="relative w-full max-w-xs mx-auto">
                      <div className="relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-background">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(multiple ? index : undefined)}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors cursor-pointer"
                          aria-label={isRTL ? "إزالة الصورة" : "Remove image"}
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* File Info */}
                  <div className="p-3 rounded-lg bg-background border border-white/10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="w-4 h-4 text-[#B9BBC6] shrink-0" />
                      <span
                        className="text-sm text-white/80 truncate"
                        title={file.name}
                      >
                        {file.name}
                      </span>
                      <span className="text-xs text-white/40 shrink-0">
                        ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>
                    {!file.type.startsWith("image/") && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(multiple ? index : undefined)}
                        className="text-white/40 hover:text-white/70 transition-colors shrink-0 cursor-pointer"
                        aria-label={isRTL ? "إزالة الملف" : "Remove file"}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* File count indicator for multiple mode */}
          {multiple && hasFiles && !shouldShowPreview && (
            <p className="text-xs text-[#B9BBC6]">
              {isRTL
                ? `${currentFiles.length} ملف${currentFiles.length > 1 ? "ات" : ""} محدد${currentFiles.length > 1 ? "ة" : ""}`
                : `${currentFiles.length} file${currentFiles.length > 1 ? "s" : ""} selected`}
            </p>
          )}
        </div>

        {(error || fileError) && (
          <p
            id={`${fieldId}-error`}
            className="text-sm text-destructive"
            role="alert"
          >
            {error || fileError}
          </p>
        )}

        {helperText && !error && !fileError && (
          <p id={`${fieldId}-helper`} className="text-sm text-[#F2F2F3]/60">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FileUploadField.displayName = "FileUploadField";

// ============================================================================
// Switch Field Component
// ============================================================================

export interface SwitchFieldProps
  extends Omit<React.ComponentProps<typeof Switch>, "className">,
  BaseFieldProps {
  /** Optional icon to display */
  icon?: LucideIcon;
  /** Custom icon className */
  iconClassName?: string;
  /** Description text below the label */
  description?: string;
  /** Custom className for the switch wrapper */
  switchWrapperClassName?: string;
  /** Custom className for the switch component */
  switchClassName?: string;
}

/**
 * Reusable Switch Field component with label, description, and RTL compatibility
 *
 * @example
 * ```tsx
 * <SwitchField
 *   label="Email Notifications"
 *   description="Receive email notifications"
 *   icon={Mail}
 *   checked={emailNotifs}
 *   onCheckedChange={setEmailNotifs}
 *   isRTL={false}
 * />
 * ```
 */
export const SwitchField = React.forwardRef<
  React.ElementRef<typeof Switch>,
  SwitchFieldProps
>(
  (
    {
      label,
      htmlFor,
      error,
      helperText,
      isRTL = false,
      icon: Icon,
      className,
      labelClassName,
      switchWrapperClassName,
      switchClassName,
      iconClassName,
      description,
      id,
      checked,
      onCheckedChange,
      disabled,
      ...switchProps
    },
    ref
  ) => {
    const generatedId = React.useId();
    const fieldId = id || htmlFor || generatedId;
    const hasIcon = !!Icon;
    const hasError = !!error;

    return (
      <div className={cn("space-y-2", className)}>
        <div
          className={cn(
            "flex items-center justify-between p-4 bg-background/50 rounded-xl",
            isRTL ? "flex-row-reverse" : "",
            switchWrapperClassName
          )}
        >
          <div
            className={cn(
              "flex items-center gap-3 flex-1",
              isRTL ? "flex-row-reverse" : ""
            )}
          >
            {hasIcon && (
              <Icon
                className={cn("w-5 h-5 text-[#C59B48] shrink-0", iconClassName)}
              />
            )}
            <div className={cn(isRTL ? "text-right" : "text-left", "flex-1")}>
              {label && (
                <Label
                  htmlFor={fieldId}
                  className={cn(
                    "text-[#F2F2F3] cursor-pointer",
                    hasError && "text-destructive",
                    labelClassName
                  )}
                >
                  {label}
                </Label>
              )}
              {description && (
                <p className="text-sm text-[#8A8EA0] mt-1">{description}</p>
              )}
            </div>
          </div>
          <Switch
            ref={ref}
            id={fieldId}
            checked={checked}
            onCheckedChange={onCheckedChange}
            disabled={disabled}
            className={cn(switchClassName)}
            aria-invalid={hasError}
            aria-describedby={
              error
                ? `${fieldId}-error`
                : helperText
                  ? `${fieldId}-helper`
                  : undefined
            }
            {...switchProps}
          />
        </div>

        {error && (
          <p
            id={`${fieldId}-error`}
            className="text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={`${fieldId}-helper`} className="text-sm text-[#F2F2F3]/60">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

SwitchField.displayName = "SwitchField";

// ============================================================================
// Location Field Component (Country, State, City)
// ============================================================================

export interface LocationFieldValue {
  country: string;
  state: string;
  city: string;
}

export interface LocationFieldProps extends BaseFieldProps {
  /** Current value object with country, state, and city */
  value?: LocationFieldValue;
  /** Callback when location values change */
  onValueChange?: (value: LocationFieldValue) => void;
  /** Optional icon to display */
  icon?: LucideIcon;
  /** Icon position - 'left' for LTR, 'right' for RTL (auto-adjusted based on isRTL) */
  iconPosition?: "left" | "right";
  /** Custom icon className */
  iconClassName?: string;
  /** Error messages for each field */
  errors?: {
    country?: string;
    state?: string;
    city?: string;
  };
  /** Custom className for the wrapper */
  className?: string;
  /** Custom className for each select field */
  selectClassName?: string;
  /** Layout: 'grid' for 3 columns, 'vertical' for stacked */
  layout?: "grid" | "vertical";
}

/**
 * Reusable Location Field component with cascading Country, State, and City dropdowns
 * Uses country-state-city library for hierarchical location data
 *
 * @example
 * ```tsx
 * <LocationField
 *   label="Location"
 *   value={{ country: "US", state: "CA", city: "Los Angeles" }}
 *   onValueChange={(value) => setLocation(value)}
 *   isRTL={false}
 *   required
 * />
 * ```
 */
export const LocationField = React.forwardRef<
  HTMLDivElement,
  LocationFieldProps
>(
  (
    {
      label,
      htmlFor,
      error,
      helperText,
      required,
      isRTL = false,
      hideOptional = false,
      icon: Icon,
      iconPosition,
      className,
      labelClassName,
      iconClassName,
      value,
      onValueChange,
      errors,
      selectClassName,
      layout = "grid",
    },
    ref
  ) => {
    const generatedId = React.useId();
    const fieldId = htmlFor || generatedId;
    const hasIcon = !!Icon;
    const hasError = !!error || !!errors?.country || !!errors?.state || !!errors?.city;
    const effectiveIconPosition = iconPosition || (isRTL ? "right" : "left");

    // Determine optional text based on isRTL
    const optionalText = isRTL ? "(اختياري)" : "(Optional)";

    // country-state-city is loaded lazily (see loadCSC). Hierarchical options
    // are kept in state and populated by effects as the module resolves and as
    // the selected country/state change. Behaviour is identical to the previous
    // synchronous useMemo version — only the dataset is now an async chunk.
    const [csc, setCsc] = React.useState<CSCModule | null>(null);
    const [countries, setCountries] = React.useState<{ value: string; label: string }[]>([]);
    const [states, setStates] = React.useState<{ value: string; label: string }[]>([]);
    const [cities, setCities] = React.useState<{ value: string; label: string }[]>([]);

    React.useEffect(() => {
      let active = true;
      loadCSC().then((mod) => {
        if (!active) return;
        setCsc(mod);
        setCountries(
          mod.Country.getAllCountries().map((country: { isoCode: string; name: string }) => ({
            value: country.isoCode,
            label: country.name,
          }))
        );
      });
      return () => {
        active = false;
      };
    }, []);

    React.useEffect(() => {
      if (!csc || !value?.country) {
        setStates([]);
        return;
      }
      setStates(
        csc.State.getStatesOfCountry(value.country).map((state: { isoCode: string; name: string }) => ({
          value: state.isoCode,
          label: state.name,
        }))
      );
    }, [csc, value?.country]);

    React.useEffect(() => {
      if (!csc || !value?.country || !value?.state) {
        setCities([]);
        return;
      }
      setCities(
        csc.City.getCitiesOfState(value.country, value.state).map((city: { name: string }) => ({
          value: city.name,
          label: city.name,
        }))
      );
    }, [csc, value?.country, value?.state]);

    // Handle country change
    const handleCountryChange = (countryCode: string) => {
      onValueChange?.({
        country: countryCode,
        state: "",
        city: "",
      });
    };

    // Handle state change
    const handleStateChange = (stateCode: string) => {
      if (!value?.country) return;
      onValueChange?.({
        country: value.country,
        state: stateCode,
        city: "",
      });
    };

    // Handle city change
    const handleCityChange = (cityName: string) => {
      if (!value?.country || !value?.state) return;
      onValueChange?.({
        country: value.country,
        state: value.state,
        city: cityName,
      });
    };

    // Get placeholders based on language
    const countryPlaceholder = isRTL ? "اختر البلد" : "Select Country";
    const statePlaceholder = isRTL ? "اختر الولاية/المحافظة" : "Select State/Province";
    const cityPlaceholder = isRTL ? "اختر المدينة" : "Select City";

    // Get labels based on language
    const countryLabel = isRTL ? "البلد" : "Country";
    const stateLabel = isRTL ? "الولاية/المحافظة" : "State/Province";
    const cityLabel = isRTL ? "المدينة" : "City";

    const containerClass = layout === "grid" 
      ? "grid md:grid-cols-3 gap-6" 
      : "space-y-6";

    return (
      <div ref={ref} className={cn("space-y-2", className)}>
        {label && (
          <Label
            htmlFor={fieldId}
            className={cn(
              "text-[#F2F2F3]/80",
              hasError && "text-destructive",
              labelClassName
            )}
          >
            {label}
            {required ? (
              <span className="text-red-500">*</span>
            ) : !hideOptional ? (
              <span className="opacity-50 text-xs ml-1">{optionalText}</span>
            ) : null}
          </Label>
        )}

        <div className={containerClass}>
          {/* Country Field */}
          <SelectField
            label={countryLabel}
            placeholder={countryPlaceholder}
            options={countries}
            value={value?.country || ""}
            onValueChange={handleCountryChange}
            isRTL={isRTL}
            required={required}
            error={errors?.country || error}
            icon={hasIcon && effectiveIconPosition === (isRTL ? "right" : "left") ? Icon : undefined}
            iconPosition={effectiveIconPosition}
            iconClassName={iconClassName}
            className={selectClassName}
            // disableClear={required}
          />

          {/* State Field */}
          <SelectField
            label={stateLabel}
            placeholder={statePlaceholder}
            options={states}
            value={value?.state || ""}
            onValueChange={handleStateChange}
            isRTL={isRTL}
            required={required}
            error={errors?.state}
            disabled={!value?.country}
            className={selectClassName}
            // disableClear={required}
          />

          {/* City Field */}
          <SelectField
            label={cityLabel}
            placeholder={cityPlaceholder}
            options={cities}
            value={value?.city || ""}
            onValueChange={handleCityChange}
            isRTL={isRTL}
            required={required}
            error={errors?.city}
            disabled={!value?.country || !value?.state}
            className={selectClassName}
            // disableClear={required}
          />
        </div>

        {helperText && !hasError && (
          <p id={`${fieldId}-helper`} className="text-sm text-[#F2F2F3]/60">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

LocationField.displayName = "LocationField";
