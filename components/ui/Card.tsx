import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: "flat" | "base" | "raised" | "lifted";
  padding?: "sm" | "md" | "lg" | "none";
  variant?: "default" | "interactive";
  hoverable?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      elevation = "base",
      padding = "md",
      variant = "default",
      hoverable = false,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    // Base styles for all cards
    const baseStyles =
      "bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)]";

    // Elevation (shadow) variants
    const elevationClasses = {
      flat: "shadow-none",
      base: "shadow-base",
      raised: "shadow-md",
      lifted: "shadow-lg",
    };

    // Padding variants
    const paddingClasses = {
      none: "p-0",
      sm: "p-[var(--card-padding-sm)]",
      md: "p-[var(--card-padding-md)]",
      lg: "p-[var(--card-padding-lg)]",
    };

    // Interactive variant (hover effect)
    const interactiveClass =
      variant === "interactive"
        ? "transition-fast cursor-pointer hover:shadow-lg hover:scale-[1.02]"
        : "";

    // Hoverable (just shadow elevation on hover)
    const hoverableClass =
      hoverable && variant !== "interactive"
        ? "transition-fast hover:shadow-lg"
        : "";

    // Combine all classes
    const cardClasses = `${baseStyles} ${elevationClasses[elevation]} ${paddingClasses[padding]} ${interactiveClass} ${hoverableClass} ${className}`;

    return (
      <div ref={ref} className={cardClasses} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
