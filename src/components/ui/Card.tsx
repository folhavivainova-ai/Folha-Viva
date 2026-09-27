import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  title?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  title,
  action,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-[#D8C4A8]/40 p-5 shadow-[0_1px_3px_rgba(23,63,42,0.04)] transition-all ${
        onClick ? 'cursor-pointer hover:border-[#2F7D4A]/50 active:scale-[0.99]' : ''
      } ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-[#D8C4A8]/20">
          {title && (
            <h3 className="font-semibold text-base text-[#173F2A] tracking-tight">
              {title}
            </h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
