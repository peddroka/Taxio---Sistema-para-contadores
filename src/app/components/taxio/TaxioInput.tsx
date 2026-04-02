import { InputHTMLAttributes, ReactNode } from 'react';

interface TaxioInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  error?: string;
}

export function TaxioInput({ label, icon, error, className = '', ...props }: TaxioInputProps) {
  return (
    <div className={className}>
      {label && (
        <label 
          className="block text-sm font-semibold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`w-full px-4 py-3 rounded-xl border transition-all duration-150 ${
            icon ? 'pl-11' : ''
          } ${error ? 'border-red-500' : ''}`}
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: error ? 'var(--danger)' : 'rgba(255, 255, 255, 0.08)',
            color: 'var(--text-primary)'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--accent-royal)';
            e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? 'var(--danger)' : 'rgba(255, 255, 255, 0.08)';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-xs font-medium" style={{ color: 'var(--danger)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
