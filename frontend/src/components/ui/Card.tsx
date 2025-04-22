import React from "react";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  compact?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = "",
  title,
  description,
  compact = false,
  hoverable = false,
  bordered = true,
}) => {
  const padding = compact ? "p-4" : "p-6";

  const cardClasses = [
    "rounded-2xl",
    "transition-all",
    "duration-200",
    "shadow-sm",
    "dark:text-gray-100",
    "text-gray-800",
    "dark:text-gray-100",
    padding,
    hoverable ? "hover:shadow-md hover:-translate-y-1" : "",
    bordered ? "border border-gray-200 dark:border-gray-700" : "",
    className,
  ].join(" ");

  return (
    <div className={cardClasses}>
      {(title || description) && (
        <div className={children ? "mb-4" : ""}>
          {title && (
            <h3 className="text-lg font-semibold mb-1 text-gray-800 dark:text-white">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
