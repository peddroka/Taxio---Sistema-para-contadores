import { ReactNode } from 'react';
import { motion } from 'motion/react';

interface TaxioCardProps {
  children: ReactNode;
  title?: string;
  className?: string;
  delay?: number;
  elevated?: boolean;
  accentBorder?: boolean;
}

export function TaxioCard({ 
  children, 
  title, 
  className = '', 
  delay = 0,
  elevated = false,
  accentBorder = false
}: TaxioCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`rounded-2xl p-6 border ${accentBorder ? 'border-l-4' : ''} ${className}`}
      style={{
        backgroundColor: elevated ? 'var(--bg-elevated)' : 'var(--bg-surface)',
        borderColor: accentBorder ? 'var(--accent-royal)' : 'var(--border)',
        borderLeftColor: accentBorder ? 'var(--accent-royal)' : undefined
      }}
    >
      {title && (
        <h3 
          className="font-bold text-lg mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h3>
      )}
      {children}
    </motion.div>
  );
}
