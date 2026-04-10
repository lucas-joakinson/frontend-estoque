import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Tag, ArrowLeftRight, LogOut, UserPlus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const Sidebar = () => {
  const { logout, isAdmin } = useAuth();
  const token = localStorage.getItem('token');

  const getMatricula = () => {
    if (!token) return 'USR';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.matricula || 'USR';
    } catch {
      return 'USR';
    }
  };

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/products', label: 'Produtos', icon: Package },
    { to: '/categories', label: 'Categorias', icon: Tag },
    { to: '/stock', label: 'Movimentações', icon: ArrowLeftRight },
  ];

  return (
    <aside className="fixed top-0 left-0 z-50 h-screen w-72 bg-surface/80 backdrop-blur-xl border-r border-border-primary transition-all duration-300 overflow-y-auto no-scrollbar">
      <div className="h-20 px-8 border-b border-border-primary flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center shadow-glow-purple">
          <span className="text-white font-mono font-bold text-lg">{'>_'}</span>
        </div>
        <h1 className="text-xl font-bold font-mono tracking-tight text-primary-400">
          ESTOQUE
        </h1>
      </div>

      <nav className="p-6 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              isActive
                ? 'flex items-center px-4 py-3.5 text-sm font-medium rounded-xl text-primary-500 bg-primary-500/10 border border-primary-500/20 shadow-glow-purple transition-all duration-200'
                : 'flex items-center px-4 py-3.5 text-sm font-medium rounded-xl text-text-secondary hover:text-text-primary hover:bg-hover-bg transition-all duration-200'
            }
          >
            <link.icon className="w-5 h-5 mr-3" />
            <span>{link.label}</span>
          </NavLink>
        ))}

        {/* Link administrativo exclusivo para ADMIN */}
        {isAdmin && (
          <NavLink
            to="/register"
            className={({ isActive }) =>
              isActive
                ? 'flex items-center px-4 py-3.5 text-sm font-medium rounded-xl text-primary-500 bg-primary-500/10 border border-primary-500/20 shadow-glow-purple transition-all duration-200'
                : 'flex items-center px-4 py-3.5 text-sm font-medium rounded-xl text-text-secondary hover:text-text-primary hover:bg-hover-bg transition-all duration-200'
            }
          >
            <UserPlus className="w-5 h-5 mr-3" />
            <span>Cadastrar Usuário</span>
          </NavLink>
        )}
      </nav>

      <div className="absolute bottom-0 w-full p-6 border-t border-border-primary">
        <div className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-hover-bg border border-border-primary group transition-all duration-200">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500/20 to-primary-700/20 border border-border-primary flex items-center justify-center text-primary-400 font-bold text-sm">
            {getMatricula().substring(0, 3).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-text-primary truncate">{getMatricula()}</p>
            <p className="text-[10px] font-mono text-text-secondary uppercase tracking-widest">
              {localStorage.getItem('role') || 'Operador'}
            </p>
          </div>
          <button
            onClick={logout}
            className="text-text-secondary hover:text-red-400 transition-colors p-1"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
