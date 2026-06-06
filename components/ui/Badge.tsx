import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "success" | "warning" | "error" | "info" | "neutral";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = "primary",
      size = "md",
      icon,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    // Base styles for all badges
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-full transition-fast";

    // Size variants
    const sizeClasses = {
      sm: "text-xs px-2.5 py-1",
      md: "text-sm px-3 py-1.5",
      lg: "text-base px-4 py-2",
    };

    // Variant (color) styles
    const variantClasses = {
      primary:
        "bg-primary/10 text-primary border border-primary/20",
      success:
        "bg-success/10 text-success border border-success/20",
      warning:
        "bg-warning/10 text-warning border border-warning/20",
      error:
        "bg-error/10 text-error border border-error/20",
      info:
        "bg-info/10 text-info border border-info/20",
      neutral:
        "bg-neutral-100 text-text-primary border border-neutral-200",
    };

    const badgeClasses = `${baseStyles} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

    return (
      <span ref={ref} className={badgeClasses} {...props}>
        {icon && <span className="mr-1.5 flex items-center justify-center">{icon}</span>}
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";
