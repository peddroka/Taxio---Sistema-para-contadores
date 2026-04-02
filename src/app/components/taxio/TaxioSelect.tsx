import { SelectHTMLAttributes } from 'react';

interface TaxioSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function TaxioSelect({ label, options, className = '', ...props }: TaxioSelectProps) {
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
      <select
        {...props}
        className="w-full px-4 py-3 rounded-xl border transition-all duration-150 appearance-none bg-no-repeat bg-right pr-10"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
          color: 'var(--text-primary)',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2394A3B8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          backgroundPosition: 'right 1rem center'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--accent-royal)';
          e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
          e.target.style.boxShadow = 'none';
        }}
      >
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            style={{ backgroundColor: 'var(--bg-elevated)' }}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
