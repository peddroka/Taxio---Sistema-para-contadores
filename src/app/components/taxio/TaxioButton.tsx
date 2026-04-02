import { ReactNode } from 'react';

interface TaxioButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'outline' | 'ghost' | 'success';
  icon?: ReactNode;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}

export function TaxioButton({ 
  children, 
  variant = 'primary', 
  icon, 
  onClick, 
  loading = false,
  disabled = false,
  type = 'button',
  className = ''
}: TaxioButtonProps) {
  const baseStyles = 'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'hover:-translate-y-0.5 active:scale-[0.97]',
    outline: 'border hover:border-opacity-25',
    ghost: 'hover:bg-opacity-10',
    success: 'hover:-translate-y-0.5 active:scale-[0.97]'
  };

  const colorStyles = {
    primary: {
      backgroundColor: loading ? 'var(--accent-hover)' : 'var(--accent-royal)',
      color: '#FFFFFF'
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--text-secondary)',
      borderColor: 'rgba(255, 255, 255, 0.12)'
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--text-secondary)'
    },
    success: {
      backgroundColor: 'var(--success)',
      color: '#FFFFFF'
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      style={colorStyles[variant]}
      onMouseEnter={(e) => {
        if (variant === 'primary' && !loading && !disabled) {
          e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
        }
        if (variant === 'outline' && !disabled) {
          e.currentTarget.style.color = 'var(--text-primary)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
        }
      }}
      onMouseLeave={(e) => {
        if (variant === 'primary' && !loading && !disabled) {
          e.currentTarget.style.backgroundColor = 'var(--accent-royal)';
        }
        if (variant === 'outline' && !disabled) {
          e.currentTarget.style.color = 'var(--text-secondary)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
        }
      }}
    >
      {loading ? (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : icon}
      {children}
    </button>
  );
}
