import React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      icon,
      iconPosition = "left",
      className = "",
      disabled = false,
      children,
      ...props
    },
    ref
  ) => {
    // Base styles for all buttons
    const baseStyles =
      "inline-flex items-center justify-center font-semibold uppercase letter-spacing-uppercase transition-fast cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

    // Size variants
    const sizeClasses = {
      sm: "h-[var(--button-height-sm)] px-3 py-2 text-xs",
      md: "h-[var(--button-height-md)] px-4 py-2.5 text-sm",
      lg: "h-[var(--button-height-lg)] px-6 py-3 text-base",
    };

    // Variant styles
    const variantClasses = {
      primary:
        "bg-primary text-white hover:bg-primary-dark active:scale-[0.98] shadow-sm hover:shadow-md",
      secondary:
        "bg-transparent text-primary border border-primary hover:bg-primary/5 active:scale-[0.98]",
      tertiary:
        "bg-neutral-100 text-text-primary hover:bg-neutral-200 active:scale-[0.98]",
      danger:
        "bg-error text-white hover:bg-red-700 active:scale-[0.98] shadow-sm hover:shadow-md",
      success:
        "bg-success text-white hover:bg-green-700 active:scale-[0.98] shadow-sm hover:shadow-md",
    };

    // Border radius
    const radiusClass = "rounded-lg";

    // Full width
    const widthClass = fullWidth ? "w-full" : "";

    // Loading state
    const opacity = loading ? "opacity-75" : "";

    // Combine all classes
    const buttonClasses = `${baseStyles} ${sizeClasses[size]} ${variantClasses[variant]} ${radiusClass} ${widthClass} ${opacity} ${className}`;

    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={disabled || loading}
        {...props}
      >
        {icon && iconPosition === "left" && (
          <span className="mr-2 flex items-center justify-center">{icon}</span>
        )}

        {loading ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {children && <span>{children}</span>}
          </div>
        ) : (
          children
        )}

        {icon && iconPosition === "right" && (
          <span className="ml-2 flex items-center justify-center">{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
