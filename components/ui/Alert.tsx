import React from "react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "success" | "error" | "warning" | "info";
  icon?: React.ReactNode;
  title?: string;
  onClose?: () => void;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      type = "info",
      icon,
      title,
      onClose,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles =
      "rounded-lg border p-4 flex gap-3 transition-fast";

    // Type (color) variants
    const typeClasses = {
      success: "bg-success/10 border-success/30 text-success",
      error: "bg-error/10 border-error/30 text-error",
      warning: "bg-warning/10 border-warning/30 text-warning",
      info: "bg-info/10 border-info/30 text-info",
    };

    const alertClasses = `${baseStyles} ${typeClasses[type]} ${className}`;

    return (
      <div ref={ref} className={alertClasses} {...props}>
        {/* Icon Section */}
        {icon && (
          <div className="mt-0.5 flex flex-shrink-0 items-center justify-center">
            {icon}
          </div>
        )}

        {/* Content Section */}
        <div className="flex-1">
          {title && <h4 className="font-semibold text-sm mb-1">{title}</h4>}
          <p className="text-sm opacity-90">{children}</p>
        </div>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="mt-0.5 flex flex-shrink-0 items-center justify-center rounded hover:opacity-70 transition-fast"
            aria-label="Close alert"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = "Alert";
