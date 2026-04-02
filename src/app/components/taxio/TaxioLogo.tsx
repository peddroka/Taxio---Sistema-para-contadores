interface TaxioLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  showTagline?: boolean;
}

export function TaxioLogo({ size = 'md', showText = true, showTagline = false }: TaxioLogoProps) {
  const sizes = {
    sm: { icon: 'w-6 h-6', text: 'text-sm', tagline: 'text-[9px]' },
    md: { icon: 'w-8 h-8', text: 'text-base', tagline: 'text-[11px]' },
    lg: { icon: 'w-12 h-12', text: 'text-xl', tagline: 'text-sm' }
  };

  const sizeClasses = sizes[size];

  return (
    <div className="flex items-center gap-3">
      <div
        className={`grid grid-cols-2 gap-0.5 ${sizeClasses.icon} p-1 rounded-lg`}
        style={{ backgroundColor: 'var(--accent-royal)' }}
      >
        <div className="rounded-sm" style={{ backgroundColor: '#FFFFFF' }}></div>
        <div className="rounded-sm -translate-y-0.5" style={{ backgroundColor: '#FFFFFF' }}></div>
        <div className="rounded-sm" style={{ backgroundColor: '#FFFFFF' }}></div>
        <div className="rounded-sm" style={{ backgroundColor: '#FFFFFF' }}></div>
      </div>
      {showText && (
        <div>
          <div className={`font-extrabold ${sizeClasses.text}`} style={{ color: 'var(--text-primary)' }}>
            Taxio
          </div>
          {showTagline && (
            <div className={sizeClasses.tagline} style={{ color: 'var(--text-secondary)' }}>
              Classificação Fiscal com IA
            </div>
          )}
        </div>
      )}
    </div>
  );
}
