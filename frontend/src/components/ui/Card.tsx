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
    "duration-300",
    hoverable
      ? "shadow-[0_0_10px_rgba(0,0,0,0.08)] dark:shadow-[0_0_15px_rgba(0,0,0,0.3)]"
      : "shadow-sm",
    "bg-white/90 dark:bg-gray-900/80",
    "backdrop-blur-md",
    "dark:text-gray-100",
    padding,
    hoverable
      ? "hover:shadow-[0_10px_20px_rgba(59,130,246,0.15)] dark:hover:shadow-[0_5px_20px_rgba(59,130,246,0.25)] hover:-translate-y-1"
      : "",
    bordered ? "border border-gray-200/80 dark:border-gray-700/80" : "",
    className,
  ].join(" ");

  return (
    <div className={cardClasses}>
      {(title || description) && (
        <div className={children ? "mb-4" : ""}>
          {title && (
            <h3 className="text-lg font-semibold mb-1 text-gray-800 dark:text-blue-50 tracking-wide">
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
