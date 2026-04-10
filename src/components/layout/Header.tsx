import { Bell } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export const Header = ({ title }: HeaderProps) => {
  const getSubtitle = () => {
    switch (title) {
      case 'Dashboard':
        return 'Visão geral do sistema';
      case 'Gerenciar Produtos':
        return 'Gerenciamento de produtos';
      case 'Categorias':
        return 'Gerenciamento de categorias';
      case 'Histórico de Movimentações':
        return 'Histórico de estoque';
      default:
        return 'Gerenciamento de estoque';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-8 bg-background/80 backdrop-blur-md border-b border-border-primary">
      <div>
        <h2 className="text-xl font-bold text-text-primary leading-tight">{title}</h2>
        <p className="text-[11px] font-mono text-text-secondary uppercase tracking-widest mt-0.5">
          {getSubtitle()}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2.5 rounded-xl bg-hover-bg border border-border-primary hover:border-primary-500/30 text-text-secondary hover:text-primary-400 transition-all">
          <Bell className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
