interface TaxioBadgeProps {
  variant: 'success' | 'warning' | 'info' | 'lote' | 'processing';
  children: React.ReactNode;
  pulse?: boolean;
}

export function TaxioBadge({ variant, children, pulse = false }: TaxioBadgeProps) {
  const styles = {
    success: {
      backgroundColor: '#064E3B',
      color: 'var(--success)'
    },
    warning: {
      backgroundColor: '#451A03',
      color: 'var(--warning)'
    },
    info: {
      backgroundColor: '#1E3A5F',
      color: 'var(--info)'
    },
    lote: {
      backgroundColor: 'var(--bg-elevated)',
      color: 'var(--text-secondary)'
    },
    processing: {
      backgroundColor: 'rgba(26, 78, 216, 0.2)',
      color: 'var(--accent-light)'
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
        pulse ? 'animate-pulse' : ''
      }`}
      style={styles[variant]}
    >
      {pulse && (
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'currentColor' }} />
      )}
      {children}
    </span>
  );
}
