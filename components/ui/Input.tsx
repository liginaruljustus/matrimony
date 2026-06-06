import React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      icon,
      iconPosition = "left",
      fullWidth = false,
      className = "",
      ...props
    },
    ref
  ) => {
    const widthClass = fullWidth ? "w-full" : "";

    const baseInputStyles =
      "w-full h-[var(--input-height)] px-[var(--input-padding-x)] py-[var(--input-padding-y)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-lg text-sm transition-fast";

    const focusStyles =
      "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";

    const errorStyles = error
      ? "border-error focus:border-error focus:ring-error/10"
      : "";

    const inputClasses = `${baseInputStyles} ${focusStyles} ${errorStyles} ${className}`;

    return (
      <div className={`${widthClass}`}>
        {label && (
          <label className="label text-[var(--color-text-secondary)]">
            {label}
            {props.required && <span className="text-error ml-1">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {icon && iconPosition === "left" && (
            <div className="absolute left-3 flex items-center justify-center text-[var(--color-text-tertiary)]">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            className={`${inputClasses} ${icon && iconPosition === "left" ? "pl-10" : ""} ${icon && iconPosition === "right" ? "pr-10" : ""}`}
            {...props}
          />

          {icon && iconPosition === "right" && (
            <div className="absolute right-3 flex items-center justify-center text-[var(--color-text-tertiary)]">
              {icon}
            </div>
          )}
        </div>

        {error && <p className="mt-1 text-xs text-error">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
