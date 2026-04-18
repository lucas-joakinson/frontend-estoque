import { 
  ShieldCheck, 
  Package, 
  BarChart3, 
  ArrowRight,
  Info,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

export const Home = () => {
  const { user } = useAuth();

  const features = [
    {
      title: 'Controle de Inventário',
      description: 'Gestão completa de ativos, incluindo computadores e headsets com histórico detalhado.',
      icon: Package,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10'
    },
    {
      title: 'RBAC Dinâmico',
      description: 'Gerenciamento de permissões flexível por cargo, garantindo segurança granular.',
      icon: ShieldCheck,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10'
    },
    {
      title: 'Relatórios & Dashboards',
      description: 'Visualização estatística em tempo real da saúde do estoque e movimentações.',
      icon: BarChart3,
      color: 'text-primary-400',
      bg: 'bg-primary-500/10'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700 pb-12">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-surface border border-border-primary p-8 md:p-16 shadow-sm">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-primary-500/10 rounded-full blur-[100px]" />
        <div className="relative z-10 space-y-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-[10px] font-mono font-bold uppercase tracking-widest">
            <Info size={12} /> Sistema de Gestão Interna
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-text-primary leading-tight tracking-tight">
            Bem-vindo ao nosso <span className="text-primary-400">Gerenciador de Estoque</span>
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed font-medium">
            Olá, <span className="text-text-primary font-bold">{user?.name}</span>. 
            Esta é a plataforma central para controle de patrimônio e ativos da Plansul.
            Navegue pelas abas laterais para gerenciar equipamentos e usuários de acordo com seu nível de acesso.
          </p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((item, i) => (
          <div key={i} className="group bg-surface border border-border-primary rounded-3xl p-8 hover:border-primary-500/30 transition-all duration-300">
            <div className={`w-14 h-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
              <item.icon size={28} />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-3">{item.title}</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              {item.description}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-surface/50 border border-border-primary rounded-[2rem] p-8 md:p-12">
        <div className="flex flex-col md:flex-row gap-12">
          <div className="flex-1 space-y-6">
            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-3">
              <BookOpen className="text-primary-400" size={24} /> Guia Rápido
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-hover-bg border border-border-primary flex items-center justify-center shrink-0 text-xs font-mono font-bold text-primary-400">01</div>
                <div>
                  <h4 className="text-sm font-bold text-text-primary">Acesso Lateral</h4>
                  <p className="text-xs text-text-secondary mt-1">Use a barra lateral para navegar entre Estoque, Headsets, Computadores e Usuários.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-hover-bg border border-border-primary flex items-center justify-center shrink-0 text-xs font-mono font-bold text-primary-400">02</div>
                <div>
                  <h4 className="text-sm font-bold text-text-primary">Permissões</h4>
                  <p className="text-xs text-text-secondary mt-1">Algumas funcionalidades podem estar ocultas dependendo do seu cargo. Caso precise de mais acesso, contate o administrador.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-hover-bg border border-border-primary flex items-center justify-center shrink-0 text-xs font-mono font-bold text-primary-400">03</div>
                <div>
                  <h4 className="text-sm font-bold text-text-primary">Exportação</h4>
                  <p className="text-xs text-text-secondary mt-1">Relatórios em Excel podem ser gerados nas telas de listagem para usuários autorizados.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
;
