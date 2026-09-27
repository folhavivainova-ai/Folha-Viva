import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-dashed border-[#D8C4A8] bg-white/50 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-[#8BCF9B]/20 text-[#2F7D4A] flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-[#173F2A] mb-1.5">{title}</h3>
      <p className="text-sm text-[#6B4A35] max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
