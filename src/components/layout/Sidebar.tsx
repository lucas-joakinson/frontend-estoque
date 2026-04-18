import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, LogOut, Users as UsersIcon, Headphones, Monitor } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAuthContext } from '../../contexts/AuthContext';
import { Avatar } from '../ui/Avatar';

export const Sidebar = () => {
  const { logout, hasPermission } = useAuth();
  const { user } = useAuthContext();

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'canViewReports' as keyof UserPermissions },
    { to: '/inventory', label: 'Gerenciar Estoque', icon: Package, permission: 'canManageAssets' as keyof UserPermissions },
    { to: '/headsets', label: 'Headsets', icon: Headphones, permission: 'canManageHeadsets' as keyof UserPermissions },
    { to: '/computers', label: 'Computadores', icon: Monitor, permission: 'canManageComputers' as keyof UserPermissions },
  ];

  return (
    <aside className="fixed top-0 left-0 z-50 h-screen w-72 bg-surface/80 backdrop-blur-xl border-r border-border-primary transition-all duration-300 overflow-y-auto no-scrollbar">
      <div className="h-20 px-8 border-b border-border-primary flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center shadow-glow-purple">
          <span className="text-white font-mono font-bold text-lg">{'>_'}</span>
        </div>
        <h1 className="text-xl font-bold font-mono tracking-tight text-primary-400">
          ATIVOS
        </h1>
      </div>

      <nav className="p-6 space-y-2">
        {links.map((link) => (
          (hasPermission(link.permission) || link.to === '/dashboard') && (
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
          )
        ))}

        {hasPermission('canManageUsers') && (
          <NavLink
            to="/users"
            className={({ isActive }) =>
              isActive
                ? 'flex items-center px-4 py-3.5 text-sm font-medium rounded-xl text-primary-500 bg-primary-500/10 border border-primary-500/20 shadow-glow-purple transition-all duration-200'
                : 'flex items-center px-4 py-3.5 text-sm font-medium rounded-xl text-text-secondary hover:text-text-primary hover:bg-hover-bg transition-all duration-200'
            }
          >
            <UsersIcon className="w-5 h-5 mr-3" />
            <span>Gestão de Acessos</span>
          </NavLink>
        )}
      </nav>

      <div className="absolute bottom-0 w-full p-6 border-t border-border-primary">
        <NavLink to="/profile" className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-hover-bg border border-border-primary group transition-all duration-200 hover:border-primary-500/30 hover:bg-primary-500/5 cursor-pointer mb-2">
          <Avatar name={user?.name || 'Usuário'} avatarUrl={user?.avatarUrl} size="md" className="group-hover:scale-110 transition-transform" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-text-primary truncate group-hover:text-primary-400 transition-colors">{user?.name || 'Usuário'}</p>
            <p className="text-[10px] font-mono text-text-secondary uppercase tracking-widest truncate">
              {user?.role || 'Operador'} • {user?.matricula || '---'}
            </p>
          </div>
        </NavLink>
        
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-text-secondary hover:text-red-400 hover:bg-red-500/5 transition-all duration-200 uppercase tracking-widest"
        >
          <LogOut size={14} /> Sair do Sistema
        </button>
      </div>
    </aside>
  );
};
