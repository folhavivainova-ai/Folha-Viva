import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'normal' | 'large';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'normal',
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 active:scale-[0.98] select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

  // Tamanho mínimo de toque 48px para mobile conforme Manual Mestre Seção 8
  const sizeClasses =
    size === 'large'
      ? 'min-h-[52px] px-6 py-3.5 text-base gap-3'
      : 'min-h-[48px] px-4 py-2.5 text-sm gap-2';

  const variantClasses = {
    primary:
      'bg-[#2F7D4A] hover:bg-[#173F2A] text-white shadow-sm hover:shadow active:bg-[#173F2A]',
    secondary:
      'bg-[#8BCF9B]/20 text-[#173F2A] hover:bg-[#8BCF9B]/35 border border-[#8BCF9B]/40',
    outline:
      'border border-[#D8C4A8] text-[#173F2A] bg-white/70 hover:bg-[#D8C4A8]/20',
    danger:
      'bg-[#B7372E] text-white hover:bg-[#8e2922] shadow-sm',
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
};
