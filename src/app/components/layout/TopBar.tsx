import { TaxioLogo } from '../taxio/TaxioLogo';

export function TopBar() {
  return (
    <div 
      className="sm:hidden flex items-center justify-between px-4 py-3 border-b"
      style={{ 
        backgroundColor: 'var(--bg-sidebar)',
        borderColor: 'var(--border)'
      }}
    >
      {/* Logo */}
      <TaxioLogo size="sm" showText={true} showTagline={false} />

      {/* User avatar */}
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
        style={{ backgroundColor: 'var(--accent-royal)', color: '#FFFFFF' }}
      >
        MC
      </div>
    </div>
  );
}