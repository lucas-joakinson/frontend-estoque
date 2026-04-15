import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUsers } from '../hooks/useUsers';
import { useDebounce } from '../hooks/useDebounce';
import { 
  Search, Trash2, UserPlus, ChevronLeft, ChevronRight, SlidersHorizontal, 
  Edit2, Shield, Users as UsersIcon, Save, RotateCcw, Package, Tag, 
  ClipboardList, BarChart3, AlertTriangle, Plus 
} from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import { Avatar } from '../components/ui/Avatar';
import { toast } from 'sonner';
import { permissionService } from '../services/permission.service';
import type { User, UserPermissions, Role } from '../types';
import { createUserSchema, updateUserSchema, type CreateUserInput, type UpdateUserInput } from '../schemas/user.schema';

interface PermissionConfig {
  id: keyof UserPermissions;
  label: string;
  description: string;
  icon: any;
}

const PERMISSION_METADATA: PermissionConfig[] = [
  { 
    id: 'canManageUsers', 
    label: 'Gerenciar Usuários', 
    description: 'Criar, editar e excluir usuários do sistema',
    icon: UsersIcon 
  },
  { 
    id: 'canManageProducts', 
    label: 'Gerenciar Produtos', 
    description: 'Adicionar e editar modelos de produtos e marcas',
    icon: Package 
  },
  { 
    id: 'canManageCategories', 
    label: 'Gerenciar Categorias', 
    description: 'Criar e editar categorias de produtos',
    icon: Tag 
  },
  { 
    id: 'canManageAssets', 
    label: 'Gerenciar Ativos', 
    description: 'Controlar o inventário de patrimônios e movimentações',
    icon: ClipboardList 
  },
  { 
    id: 'canDeleteItems', 
    label: 'Exclusão de Itens', 
    description: 'Permitir a exclusão definitiva de registros do estoque',
    icon: Trash2 
  },
  { 
    id: 'canViewReports', 
    label: 'Visualizar Relatórios', 
    description: 'Acesso a dashboards detalhados e exportação de dados',
    icon: BarChart3 
  },
];

type TabType = 'users' | 'permissions';

export const Users = () => {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const debouncedSearch = useDebounce(search, 500);
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // States para Permissões e Roles
  const [roles, setRoles] = useState<Role[]>([]);
  const [activeRole, setActiveRole] = useState<string>('OPERATOR');
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [isPermissionsLoading, setIsPermissionsLoading] = useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  
  const [isNewRoleModalOpen, setIsNewRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  const { usersData, isLoading: isUsersLoading, deleteUser, createUser, isCreating, updateUser, isUpdating } = useUsers(
    page, 
    limit, 
    debouncedSearch, 
    roleFilter,
    sortBy, 
    order
  );

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    formState: { errors: createErrors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: 'OPERATOR',
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
  });

  const loadRoles = async () => {
    try {
      const data = await permissionService.listRoles();
      setRoles(data);
      if (data.length > 0 && !activeRole) {
        setActiveRole(data[0].name);
      }
    } catch (error) {
      toast.error('Erro ao carregar cargos.');
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      resetEdit({
        name: selectedUser.name,
        role: selectedUser.role,
        password: '',
      });
    }
  }, [selectedUser, resetEdit]);

  useEffect(() => {
    if (activeTab === 'permissions' && activeRole) {
      loadPermissions(activeRole);
    }
  }, [activeTab, activeRole]);

  const loadPermissions = async (role: string) => {
    setIsPermissionsLoading(true);
    try {
      const data = await permissionService.getRolePermissions(role);
      setPermissions(data);
    } catch (error) {
      toast.error('Erro ao carregar permissões do cargo.');
    } finally {
      setIsPermissionsLoading(false);
    }
  };

  const handleTogglePermission = (id: keyof UserPermissions) => {
    if (!permissions) return;
    setPermissions({
      ...permissions,
      [id]: !permissions[id]
    });
  };

  const handleSavePermissions = async () => {
    if (!permissions) return;
    setIsSavingPermissions(true);
    try {
      await permissionService.updateRolePermissions(activeRole, permissions);
      toast.success(`Permissões do cargo ${activeRole} atualizadas!`);
    } catch (error) {
      toast.error('Erro ao salvar permissões.');
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      toast.error('O nome do cargo é obrigatório.');
      return;
    }
    setIsCreatingRole(true);
    try {
      await permissionService.createRole(newRoleName.toUpperCase());
      toast.success('Cargo criado com sucesso!');
      setNewRoleName('');
      setIsNewRoleModalOpen(false);
      loadRoles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao criar cargo.');
    } finally {
      setIsCreatingRole(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setPage(1);
  };

  const handleLimitChange = (value: number) => {
    setLimit(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setRoleFilter('');
    setPage(1);
  };

  const onSubmitCreate = (data: CreateUserInput) => {
    createUser(data, {
      onSuccess: () => {
        setIsNewUserModalOpen(false);
        resetCreate();
      }
    });
  };

  const onSubmitEdit = (data: UpdateUserInput) => {
    if (!selectedUser) return;

    const payload: any = {
      name: data.name,
      role: data.role
    };

    if (data.password) {
      payload.password = data.password;
    }

    updateUser({ id: selectedUser.id, data: payload }, {
      onSuccess: () => {
        setIsEditUserModalOpen(false);
        resetEdit();
        setSelectedUser(null);
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-text-primary leading-tight">
            Gestão de Acessos
          </h2>
          <p className="text-text-secondary mt-1 font-mono text-xs uppercase tracking-widest">
            {activeTab === 'users' ? 'Administração de contas de usuários' : 'Configuração de permissões por cargo'}
          </p>
        </div>

        <div className="flex p-1 bg-surface border border-border-primary rounded-2xl">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-mono font-bold transition-all ${activeTab === 'users' ? 'bg-primary-500 text-white shadow-glow-purple' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <UsersIcon size={14} />
            USUÁRIOS
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-mono font-bold transition-all ${activeTab === 'permissions' ? 'bg-primary-500 text-white shadow-glow-purple' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <Shield size={14} />
            PERMISSÕES
          </button>
        </div>
      </div>

      {activeTab === 'users' ? (
        <>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative group w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary-400 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Buscar matrícula ou nome..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-hover-bg border border-border-primary text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-mono text-sm"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <button 
              onClick={() => {
                resetCreate();
                setIsNewUserModalOpen(true);
              }} 
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold text-sm uppercase tracking-wider shadow-glow-purple transition-all w-full md:w-auto justify-center"
            >
              <UserPlus size={18} /> Novo Usuário
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-surface p-4 rounded-2xl border border-border-primary shadow-sm">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-4 border-r border-border-primary pr-6">
                <div className="flex items-center gap-2 text-text-secondary">
                  <SlidersHorizontal size={16} />
                  <span className="text-xs font-mono uppercase tracking-widest">Exibir:</span>
                </div>
                <div className="flex gap-2">
                  {[10, 20, 50].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleLimitChange(num)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                        limit === num 
                          ? 'bg-primary-500 text-white shadow-glow-purple' 
                          : 'bg-hover-bg text-text-secondary hover:text-text-primary border border-border-primary'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-text-secondary">
                  <span className="text-xs font-mono uppercase tracking-widest">Cargo:</span>
                </div>
                <select
                  className="bg-hover-bg border border-border-primary rounded-xl px-4 py-2 text-xs font-mono font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/50 cursor-pointer uppercase"
                  value={roleFilter}
                  onChange={(e) => handleRoleFilterChange(e.target.value)}
                >
                  <option value="">Todos</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
                </select>
              </div>

              {(search || roleFilter) && (
                <button
                  onClick={clearFilters}
                  className="text-[10px] font-mono font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest pl-2 border-l border-border-primary ml-2"
                >
                  Limpar Filtros
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-text-secondary">
                <span className="text-xs font-mono uppercase tracking-widest">Ordenar:</span>
              </div>
              <select
                className="bg-hover-bg border border-border-primary rounded-xl px-4 py-2 text-xs font-mono font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                value={`${sortBy}-${order}`}
                onChange={(e) => {
                  const [s, o] = e.target.value.split('-');
                  setSortBy(s);
                  setOrder(o);
                }}
              >
                <option value="createdAt-desc">Mais Recentes</option>
                <option value="createdAt-asc">Mais Antigos</option>
                <option value="name-asc">Nome (A-Z)</option>
                <option value="name-desc">Nome (Z-A)</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-border-primary overflow-hidden bg-surface shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-hover-bg">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Usuário</th>
                    <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Matrícula</th>
                    <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Cargo</th>
                    <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Criado em</th>
                    <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-primary">
                  {isUsersLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4 flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-4 w-32" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                        <td className="px-6 py-4 flex justify-end gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></td>
                      </tr>
                    ))
                  ) : usersData?.users && usersData.users.length > 0 ? (
                    usersData.users.map((user: User) => (
                      <tr key={user.id} className="hover:bg-hover-bg transition-colors border-b border-border-primary last:border-0 group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />
                            <span className="text-sm font-bold text-text-primary">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-text-secondary font-mono tracking-tight">{user.matricula}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold border uppercase ${
                            user.role === 'ADMIN' 
                              ? 'bg-primary-500/10 text-primary-400 border-primary-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-text-secondary">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setIsEditUserModalOpen(true);
                              }}
                              className="p-2 rounded-lg bg-hover-bg border border-border-primary text-text-secondary hover:text-primary-400 transition-all"
                              title="Editar Usuário"
                            >
                              <Edit2 size={14} />
                            </button>
                            {user.matricula !== 'admin' && (
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsConfirmOpen(true);
                                }}
                                className="p-2 rounded-lg bg-hover-bg border border-border-primary text-text-secondary hover:text-red-400 transition-all"
                                title="Remover Usuário"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-text-secondary font-mono text-sm italic">
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {usersData && usersData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between bg-surface p-4 rounded-2xl border border-border-primary shadow-sm">
              <span className="text-xs font-mono text-text-secondary uppercase tracking-widest">
                Página {page} de {usersData.pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="p-2 rounded-xl bg-hover-bg border border-border-primary text-text-secondary hover:text-primary-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  disabled={page === usersData.pagination.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="p-2 rounded-xl bg-hover-bg border border-border-primary text-text-secondary hover:text-primary-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in slide-in-from-bottom-4 duration-500">
          {/* Menu Lateral de Cargos (Dinâmico) */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-surface border border-border-primary rounded-3xl p-6 space-y-4 shadow-sm">
              <h3 className="text-[10px] font-mono text-text-secondary uppercase tracking-[0.2em] ml-2">Cargos Disponíveis</h3>
              <div className="space-y-2">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setActiveRole(role.name)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all ${
                      activeRole === role.name 
                        ? 'bg-primary-500/10 border-primary-500/30 text-primary-400 shadow-glow-purple/10' 
                        : 'bg-hover-bg border-border-primary text-text-secondary hover:text-text-primary hover:border-border-secondary'
                    }`}
                  >
                    <span className="text-xs font-bold font-mono tracking-wider uppercase">{role.name}</span>
                    {activeRole === role.name && <ChevronRight size={14} />}
                  </button>
                ))}
                <button
                  onClick={() => setIsNewRoleModalOpen(true)}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-2xl border border-dashed border-border-primary text-text-secondary hover:text-primary-400 hover:border-primary-500/30 transition-all group"
                >
                  <Plus size={14} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Novo Cargo</span>
                </button>
              </div>
            </div>

            <div className="bg-surface border border-border-primary rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-amber-500">
                <AlertTriangle size={16} />
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest">Atenção</h4>
              </div>
              <p className="text-[10px] text-text-secondary leading-relaxed font-mono uppercase tracking-tighter">
                Alterações nas permissões afetam todos os usuários vinculados ao cargo "{activeRole}" imediatamente após salvar.
              </p>
            </div>
          </div>

          {/* Lista de Permissões */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-surface border border-border-primary rounded-3xl p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary-500/10 text-primary-400 border border-primary-500/20">
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text-primary uppercase">Permissões de {activeRole}</h3>
                  <p className="text-xs text-text-secondary mt-1">Configure o nível de acesso para este cargo</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => loadPermissions(activeRole)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-hover-bg text-text-secondary border border-border-primary font-mono text-[10px] font-bold uppercase tracking-widest hover:text-text-primary transition-all"
                >
                  <RotateCcw size={14} /> Resetar
                </button>
                <button
                  onClick={handleSavePermissions}
                  disabled={isSavingPermissions || isPermissionsLoading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-500 text-white shadow-glow-purple font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-primary-400 transition-all disabled:opacity-50"
                >
                  {isSavingPermissions ? <Spinner size={14} /> : (
                    <>
                      <Save size={14} /> Salvar Alterações
                    </>
                  )}
                </button>
              </div>
            </div>

            {isPermissionsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-3xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PERMISSION_METADATA.map((perm) => (
                  <div 
                    key={perm.id}
                    onClick={() => handleTogglePermission(perm.id)}
                    className={`group p-5 rounded-3xl border transition-all cursor-pointer flex items-center gap-4 ${permissions?.[perm.id] ? 'bg-primary-500/5 border-primary-500/30 shadow-sm' : 'bg-surface border-border-primary hover:border-border-secondary'}`}
                  >
                    <div className={`p-2.5 rounded-xl transition-all ${permissions?.[perm.id] ? 'bg-primary-500 text-white shadow-glow-purple' : 'bg-hover-bg text-text-secondary'}`}>
                      <perm.icon size={20} />
                    </div>
                    
                    <div className="flex-1">
                      <h4 className={`text-sm font-bold transition-colors ${permissions?.[perm.id] ? 'text-primary-400' : 'text-text-primary'}`}>
                        {perm.label}
                      </h4>
                      <p className="text-[10px] text-text-secondary mt-0.5 line-clamp-1">
                        {perm.description}
                      </p>
                    </div>

                    <div className={`w-10 h-6 rounded-full relative transition-all duration-300 shrink-0 ${permissions?.[perm.id] ? 'bg-primary-500 shadow-glow-purple/20' : 'bg-border-primary'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-sm ${permissions?.[perm.id] ? 'translate-x-5' : 'translate-x-1'}`} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Novo Cargo */}
      <Modal isOpen={isNewRoleModalOpen} onClose={() => setIsNewRoleModalOpen(false)} title="Novo Cargo">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest px-1">Nome do Cargo</label>
            <input
              type="text"
              placeholder="Ex: SUPERVISOR"
              className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 uppercase"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
            />
            <p className="text-[10px] text-text-secondary font-mono mt-1 px-1">
              * O cargo será criado com permissões restritas por padrão.
            </p>
          </div>
          <button 
            onClick={handleCreateRole}
            disabled={isCreatingRole}
            className="w-full py-4 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold uppercase tracking-widest transition-all shadow-glow-purple flex items-center justify-center gap-2 h-12 disabled:opacity-50"
          >
            {isCreatingRole ? <Spinner /> : 'Criar Novo Cargo'}
          </button>
        </div>
      </Modal>

      {/* Modal Novo Usuário */}
      <Modal isOpen={isNewUserModalOpen} onClose={() => setIsNewUserModalOpen(false)} title="Novo Usuário">
        <form onSubmit={handleSubmitCreate(onSubmitCreate)} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest px-1">Nome Completo</label>
            <input
              type="text"
              placeholder="Digite o nome do usuário"
              className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${createErrors.name ? 'border-red-500' : 'border-border-primary'}`}
              {...registerCreate('name')}
            />
            {createErrors.name && <span className="text-[10px] text-red-500 font-mono px-1">{createErrors.name.message}</span>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest px-1">Matrícula</label>
              <input
                type="text"
                placeholder="Ex: 123456"
                className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${createErrors.matricula ? 'border-red-500' : 'border-border-primary'}`}
                {...registerCreate('matricula')}
              />
              {createErrors.matricula && <span className="text-[10px] text-red-500 font-mono px-1">{createErrors.matricula.message}</span>}
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest px-1">Cargo</label>
              <select
                className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 uppercase ${createErrors.role ? 'border-red-500' : 'border-border-primary'}`}
                {...registerCreate('role')}
              >
                {roles.map(role => (
                  <option key={role.id} value={role.name}>{role.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest px-1">Senha Inicial</label>
            <input
              type="password"
              placeholder="••••••••"
              className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${createErrors.password ? 'border-red-500' : 'border-border-primary'}`}
              {...registerCreate('password')}
            />
            {createErrors.password && <span className="text-[10px] text-red-500 font-mono px-1">{createErrors.password.message}</span>}
          </div>
          <button 
            type="submit" 
            disabled={isCreating}
            className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold uppercase tracking-widest transition-all shadow-glow-purple flex items-center justify-center gap-2 h-12"
          >
            {isCreating ? <Spinner /> : 'Criar Usuário'}
          </button>
        </form>
      </Modal>

      {/* Modal Editar Usuário */}
      <Modal isOpen={isEditUserModalOpen} onClose={() => setIsEditUserModalOpen(false)} title={`Editar: ${selectedUser?.name}`}>
        <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest px-1">Nome Completo</label>
            <input
              type="text"
              className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${editErrors.name ? 'border-red-500' : 'border-border-primary'}`}
              {...registerEdit('name')}
            />
            {editErrors.name && <span className="text-[10px] text-red-500 font-mono px-1">{editErrors.name.message}</span>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest px-1">Cargo</label>
              <select
                className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 uppercase ${editErrors.role ? 'border-red-500' : 'border-border-primary'}`}
                {...registerEdit('role')}
              >
                {roles.map(role => (
                  <option key={role.id} value={role.name}>{role.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest px-1">Nova Senha</label>
              <input
                type="password"
                placeholder="Manter atual..."
                className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${editErrors.password ? 'border-red-500' : 'border-border-primary'}`}
                {...registerEdit('password')}
              />
              {editErrors.password && <span className="text-[10px] text-red-500 font-mono px-1">{editErrors.password.message}</span>}
            </div>
          </div>
          <button 
            type="submit" 
            disabled={isUpdating}
            className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold uppercase tracking-widest transition-all shadow-glow-purple flex items-center justify-center gap-2 h-12"
          >
            {isUpdating ? <Spinner /> : 'Salvar Alterações'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => selectedUser && deleteUser(selectedUser.id)}
        title="Excluir Usuário"
        description={`Tem certeza que deseja remover o usuário "${selectedUser?.name}"?`}
      />
    </div>
  );
};
