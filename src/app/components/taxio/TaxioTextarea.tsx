import { TextareaHTMLAttributes } from 'react';

interface TaxioTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function TaxioTextarea({ label, className = '', ...props }: TaxioTextareaProps) {
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
      <textarea
        {...props}
        className="w-full px-4 py-3 rounded-xl border transition-all duration-150 resize-none"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
          color: 'var(--text-primary)'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--accent-royal)';
          e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
          e.target.style.boxShadow = 'none';
        }}
      />
    </div>
  );
}
