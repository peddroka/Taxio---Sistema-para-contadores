import { ReactNode } from 'react';
import { motion } from 'motion/react';

interface MetricCardProps {
  label: string;
  value: string | number;
  delta?: {
    value: string;
    positive?: boolean;
  };
  delay?: number;
}

export function MetricCard({ label, value, delta, delay = 0 }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="rounded-2xl p-5 border"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border)'
      }}
    >
      <div 
        className="text-[11px] font-semibold tracking-wider uppercase mb-2"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label}
      </div>
      <div 
        className="text-3xl font-extrabold mb-1"
        style={{ color: 'var(--text-primary)' }}
      >
        {value}
      </div>
      {delta && (
        <div className="flex items-center gap-1 text-sm">
          <svg 
            className={`w-4 h-4 ${delta.positive !== false ? 'rotate-0' : 'rotate-180'}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: delta.positive !== false ? 'var(--success)' : 'var(--danger)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          <span style={{ color: delta.positive !== false ? 'var(--success)' : 'var(--danger)' }}>
            {delta.value}
          </span>
        </div>
      )}
    </motion.div>
  );
}
