interface TaxioProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: string;
}

export function TaxioProgressBar({ 
  value, 
  max = 100, 
  label, 
  showPercentage = false,
  color = 'var(--accent-royal)'
}: TaxioProgressBarProps) {
  const percentage = Math.round((value / max) * 100);

  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {label}
          </span>
          {showPercentage && (
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {value} ({percentage}%)
            </span>
          )}
        </div>
      )}
      <div 
        className="h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--bg-elevated)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-600 ease-in-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  );
}
