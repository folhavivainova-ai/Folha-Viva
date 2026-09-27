import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Clock, Droplets, Leaf } from 'lucide-react';

export type StatusType = 'good' | 'attention' | 'critical' | 'pending' | 'water' | 'coffee' | 'pasture';

interface StatusChipProps {
  status: StatusType;
  label: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusChip: React.FC<StatusChipProps> = ({
  status,
  label,
  className = '',
  size = 'md',
}) => {
  const getStyleAndIcon = () => {
    switch (status) {
      case 'good':
        return {
          bg: 'bg-[#8BCF9B]/25 text-[#173F2A] border border-[#2F7D4A]/30',
          icon: <CheckCircle2 className="w-4 h-4 text-[#2F7D4A]" />,
        };
      case 'attention':
        return {
          bg: 'bg-[#D99A22]/15 text-[#6B4A35] border border-[#D99A22]/40',
          icon: <AlertTriangle className="w-4 h-4 text-[#D99A22]" />,
        };
      case 'critical':
        return {
          bg: 'bg-[#B7372E]/15 text-[#B7372E] border border-[#B7372E]/30',
          icon: <AlertCircle className="w-4 h-4 text-[#B7372E]" />,
        };
      case 'water':
        return {
          bg: 'bg-sky-50 text-sky-900 border border-sky-300',
          icon: <Droplets className="w-4 h-4 text-sky-600" />,
        };
      case 'coffee':
        return {
          bg: 'bg-[#173F2A]/10 text-[#173F2A] border border-[#173F2A]/20',
          icon: <Leaf className="w-4 h-4 text-[#2F7D4A]" />,
        };
      case 'pasture':
        return {
          bg: 'bg-emerald-50 text-emerald-900 border border-emerald-300',
          icon: <Leaf className="w-4 h-4 text-emerald-600" />,
        };
      case 'pending':
      default:
        return {
          bg: 'bg-stone-100 text-stone-700 border border-stone-200',
          icon: <Clock className="w-4 h-4 text-stone-500" />,
        };
    }
  };

  const { bg, icon } = getStyleAndIcon();
  const sizeClasses = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg font-medium select-none ${bg} ${sizeClasses} ${className}`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="whitespace-nowrap">{label}</span>
    </span>
  );
};
