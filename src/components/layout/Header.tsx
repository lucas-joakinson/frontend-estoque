import { useState, useRef, useEffect } from 'react';
import { Bell, Moon, Sun, AlertTriangle, Info, Clock, Menu } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { useNotifications } from '../../hooks/useNotifications';
import { Link } from 'react-router-dom';

interface HeaderProps {
  title: string;
}

export const Header = ({ title }: HeaderProps) => {
  const { theme, toggleTheme } = useTheme();
  const { toggleSidebar } = useSidebar();
  const { summary, activities, clearActivities, refetch, isRefetching } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggleNotifications = () => {
    if (!showNotifications) {
      refetch();
    }
    setShowNotifications(!showNotifications);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-4 md:px-8 bg-background/80 backdrop-blur-md border-b border-border-primary transition-colors duration-300">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2.5 rounded-xl bg-hover-bg border border-border-primary hover:border-primary-500/30 text-text-secondary hover:text-primary-400 transition-all"
          title="Alternar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-lg md:text-xl font-bold text-text-primary leading-tight">{title}</h2>
          <p className="hidden md:block text-[11px] font-mono text-text-secondary uppercase tracking-widest mt-0.5">
            {getSubtitle()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button 
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-hover-bg border border-border-primary hover:border-primary-500/30 text-text-secondary hover:text-primary-400 transition-all"
          title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </button>

        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={handleToggleNotifications}
            className="p-2.5 rounded-xl bg-hover-bg border border-border-primary hover:border-primary-500/30 text-text-secondary hover:text-primary-400 transition-all relative"
          >
            <Bell className={`w-5 h-5 ${isRefetching ? 'animate-pulse text-primary-400' : ''}`} />
            {summary && summary.unread_count > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background">
                {summary.unread_count}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-background border border-border-primary rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-border-primary bg-hover-bg/50">
                <h3 className="text-sm font-bold text-text-primary">Notificações</h3>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {summary?.alerts && summary.alerts.length > 0 ? (
                  <div className="p-2 space-y-1 border-b border-border-primary">
                    <p className="px-2 py-1 text-[10px] font-bold text-text-secondary uppercase tracking-wider">Alertas do Sistema</p>
                    {summary.alerts.map((alert) => (
                      <Link
                        key={alert.id}
                        to={alert.action_link}
                        onClick={() => setShowNotifications(false)}
                        className="flex items-start gap-3 p-2 rounded-xl hover:bg-hover-bg transition-colors"
                      >
                        <div className={`mt-0.5 p-1.5 rounded-lg ${
                          alert.type === 'CRITICAL' ? 'bg-red-500/10 text-red-500' : 
                          alert.type === 'WARNING' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
                        }`}>
                          {alert.type === 'CRITICAL' ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-text-primary">{alert.title}</p>
                          <p className="text-[11px] text-text-secondary leading-tight mt-0.5">{alert.message}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center border-b border-border-primary">
                    <Bell className="w-8 h-8 text-border-primary mx-auto mb-2 opacity-20" />
                    <p className="text-xs text-text-secondary">Nenhum alerta crítico</p>
                  </div>
                )}

                <div className="p-2 space-y-1">
                  <div className="flex items-center justify-between px-2 py-1">
                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Atividades Recentes</p>
                    {activities && activities.length > 0 && (
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          clearActivities();
                        }}
                        className="text-[9px] font-bold text-primary-500 hover:text-primary-400 uppercase tracking-tighter transition-colors"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                  {activities && activities.length > 0 ? (
                    activities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-2 rounded-xl">
                        <div className="mt-0.5 p-1.5 rounded-lg bg-hover-bg text-text-secondary">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-text-primary truncate">
                            <span className="font-bold">{activity.userName}</span> {activity.action}
                          </p>
                          <p className="text-[11px] text-text-secondary truncate italic">{activity.itemName}</p>
                          <p className="text-[9px] text-text-secondary mt-1">{new Date(activity.timestamp).toLocaleString('pt-BR')}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="p-4 text-center text-xs text-text-secondary">Sem atividades recentes</p>
                  )}
                </div>
              </div>

              <Link 
                to="/inventory" 
                onClick={() => setShowNotifications(false)}
                className="block p-3 text-center text-[11px] font-bold text-primary-500 hover:bg-primary-500/5 transition-colors border-t border-border-primary"
              >
                VER TODO O ESTOQUE
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
