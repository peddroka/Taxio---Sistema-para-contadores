import { MessageCircle, Mail, BookOpen, HelpCircle, Check } from 'lucide-react';
import { TaxioCard } from '../components/taxio/TaxioCard';
import { TaxioButton } from '../components/taxio/TaxioButton';

const supportCards = [
  {
    icon: MessageCircle,
    iconColor: 'var(--success)',
    borderColor: 'var(--success)',
    title: 'WhatsApp',
    subtitle: 'Fale com especialista agora',
    buttonText: 'Abrir WhatsApp',
    buttonVariant: 'success' as const,
    badge: 'Resposta em até 2h'
  },
  {
    icon: Mail,
    iconColor: 'var(--accent-royal)',
    borderColor: 'var(--accent-royal)',
    title: 'E-mail',
    subtitle: 'Para demandas detalhadas',
    link: 'suporte@taxio.com.br',
    buttonText: null
  },
  {
    icon: BookOpen,
    iconColor: 'var(--warning)',
    borderColor: 'var(--warning)',
    title: 'Documentação',
    subtitle: 'Guias e tutoriais em vídeo',
    buttonText: 'Acessar docs',
    buttonVariant: 'outline' as const
  },
  {
    icon: HelpCircle,
    iconColor: '#8B5CF6',
    borderColor: '#8B5CF6',
    title: 'FAQ',
    subtitle: 'Dúvidas sobre NCM e CST',
    buttonText: 'Ver perguntas',
    buttonVariant: 'outline' as const
  }
];

const benefits = [
  'Economia real de tempo operacional',
  'Redução drástica de erros fiscais',
  'Padronização e segurança na classificação',
  'Integração fácil com qualquer ERP',
  'Aumento de produtividade e lucro'
];

export default function CentralAjuda() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Central de Ajuda
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Estamos aqui para ajudar você em qualquer momento
        </p>
      </div>

      {/* Support cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {supportCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <TaxioCard
              key={card.title}
              delay={index * 0.06}
              className="border-l-4"
              style={{ borderLeftColor: card.borderColor }}
            >
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${card.iconColor}15` }}
                >
                  <Icon className="w-6 h-6" style={{ color: card.iconColor }} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    {card.title}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {card.subtitle}
                  </p>
                  {card.badge && (
                    <span
                      className="inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: `${card.iconColor}20`,
                        color: card.iconColor
                      }}
                    >
                      {card.badge}
                    </span>
                  )}
                </div>
              </div>

              {card.link && (
                <a
                  href={`mailto:${card.link}`}
                  className="block font-semibold text-sm mb-3 transition-colors"
                  style={{ color: 'var(--accent-light)' }}
                >
                  {card.link}
                </a>
              )}

              {card.buttonText && (
                <TaxioButton
                  variant={card.buttonVariant}
                  className="w-full"
                  onClick={() => {
                    if (card.title === 'WhatsApp') {
                      window.open('https://wa.me/5511999999999', '_blank');
                    }
                  }}
                >
                  {card.buttonText}
                </TaxioButton>
              )}
            </TaxioCard>
          );
        })}
      </div>

      {/* Benefits section */}
      <TaxioCard delay={0.24}>
        <h3 className="font-bold mb-6 text-center" style={{ color: 'var(--text-primary)' }}>
          Por que escolher o Taxio?
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="p-4 rounded-xl text-center"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}
              >
                <Check className="w-5 h-5" style={{ color: 'var(--success)' }} />
              </div>
              <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
                {benefit}
              </p>
            </div>
          ))}
        </div>
      </TaxioCard>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {[
          { label: 'Empresas atendidas', value: '2.400+' },
          { label: 'Produtos classificados', value: '1.2M+' },
          { label: 'Precisão média', value: '98.7%' },
          { label: 'Suporte', value: '24/7' }
        ].map((stat, index) => (
          <div
            key={index}
            className="p-5 rounded-2xl border text-center"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border)'
            }}
          >
            <div className="text-2xl font-extrabold mb-1" style={{ color: 'var(--accent-light)' }}>
              {stat.value}
            </div>
            <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
