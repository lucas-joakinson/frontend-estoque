import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Search, Trash2, ChevronLeft, ChevronRight, 
  Plus, Edit2, SlidersHorizontal, Filter, 
  Headphones, History, User, Tag, ClipboardList
} from 'lucide-react';

// Hooks
import { useHeadsets } from '../hooks/useHeadsets';
import { useDebounce } from '../hooks/useDebounce';

// UI Components
import { Skeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';

// Services & Schemas
import { headsetSchema, type HeadsetInput } from '../schemas/headset.schema';

// Types
import type { Headset, HeadsetStatus } from '../types';

const STATUS_LABELS: Record<HeadsetStatus, { label: string; color: string }> = {
  LIGADO: { label: 'Ligado', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  DESLIGADO: { label: 'Desligado', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  MANUTENÇÃO: { label: 'Manutenção', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
};

export const Headsets = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const debouncedSearch = useDebounce(search, 500);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHeadset, setSelectedHeadset] = useState<Headset | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const { 
    headsetsData, 
    isLoading, 
    createHeadset, 
    isCreating, 
    updateHeadset, 
    isUpdating, 
    deleteHeadset 
  } = useHeadsets(page, limit, debouncedSearch, statusFilter);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HeadsetInput>({
    resolver: zodResolver(headsetSchema),
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleOpenModal = (headset?: Headset) => {
    if (headset) {
      setSelectedHeadset(headset);
      reset({
        matricula: headset.matricula,
        lacre: headset.lacre,
        marca: headset.marca,
        numeroSerie: headset.numeroSerie,
        status: headset.status,
        observacoes: headset.observacoes || '',
      });
    } else {
      setSelectedHeadset(null);
      reset({
        matricula: '',
        lacre: '',
        marca: '',
        numeroSerie: '',
        status: 'LIGADO',
        observacoes: '',
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit = (data: HeadsetInput) => {
    if (selectedHeadset) {
      updateHeadset({ id: selectedHeadset.id, data }, {
        onSuccess: () => setIsModalOpen(false),
      });
    } else {
      createHeadset(data, {
        onSuccess: () => setIsModalOpen(false),
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-text-primary leading-tight">
            Headsets
          </h2>
          <p className="text-text-secondary mt-1 font-mono text-xs uppercase tracking-widest">
            Vínculo operador (matrícula) ↔ lacre; marca e série.
          </p>
        </div>

        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold text-sm uppercase tracking-wider shadow-glow-purple transition-all w-full md:w-auto justify-center"
        >
          <Plus size={18} /> Novo Headset
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative group w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary-400 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Buscar por matrícula, lacre, série..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-hover-bg border border-border-primary text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-mono text-sm"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className="bg-surface border border-border-primary rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm w-full md:w-auto">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 border-r border-border-primary pr-6">
              <div className="flex items-center gap-2 text-text-secondary">
                <SlidersHorizontal size={16} />
                <span className="text-xs font-mono uppercase tracking-widest">Exibir:</span>
              </div>
              <div className="flex gap-2">
                {[10, 20, 50].map((num) => (
                  <button 
                    key={num} 
                    onClick={() => { setLimit(num); setPage(1); }} 
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${limit === num ? 'bg-primary-500 text-white shadow-glow-purple' : 'bg-hover-bg text-text-secondary hover:text-text-primary border border-border-primary'}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-text-secondary">
                <Filter size={14} className="text-primary-400" />
                <span className="text-xs font-mono uppercase tracking-widest">Filtros:</span>
              </div>
              <select 
                value={statusFilter} 
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} 
                className="bg-hover-bg border border-border-primary rounded-xl px-4 py-2 text-xs font-mono font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/50 cursor-pointer"
              >
                <option value="">Status</option>
                {Object.entries(STATUS_LABELS).map(([val, { label }]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            {statusFilter && (
              <button onClick={() => { setStatusFilter(''); setPage(1); }} className="text-[10px] font-mono font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest pl-2 border-l border-border-primary ml-2">Limpar</button>
            )}
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-2xl border border-border-primary overflow-hidden bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-hover-bg">
              <tr>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Matrícula</th>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Lacre</th>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Marca</th>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Nº Série</th>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary text-right">Atualizado</th>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4 text-center"><Skeleton className="h-6 w-20 mx-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24 ml-auto" /></td>
                    <td className="px-6 py-4 flex justify-end gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></td>
                  </tr>
                ))
              ) : headsetsData?.headsets && headsetsData.headsets.length > 0 ? (
                headsetsData.headsets.map((headset) => (
                  <tr key={headset.id} className="hover:bg-hover-bg transition-colors border-b border-border-primary last:border-0">
                    <td className="px-6 py-4 text-sm font-bold text-text-primary">{headset.matricula}</td>
                    <td className="px-6 py-4 text-xs font-mono text-text-secondary uppercase">{headset.lacre}</td>
                    <td className="px-6 py-4 text-sm text-text-primary">{headset.marca}</td>
                    <td className="px-6 py-4 text-xs font-mono text-text-secondary uppercase">{headset.numeroSerie}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-mono font-bold border ${STATUS_LABELS[headset.status].color}`}>
                        {STATUS_LABELS[headset.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-[10px] font-mono text-text-secondary uppercase">
                      {new Date(headset.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(headset)} 
                          className="p-2 rounded-lg bg-hover-bg border border-border-primary text-text-secondary hover:text-primary-400 transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => { setSelectedHeadset(headset); setIsDeleteConfirmOpen(true); }} 
                          className="p-2 rounded-lg bg-hover-bg border border-border-primary text-text-secondary hover:text-red-400 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-secondary font-mono text-sm italic">
                    Nenhum headset encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginação */}
      {headsetsData && headsetsData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-surface p-4 rounded-2xl border border-border-primary shadow-sm">
          <span className="text-xs font-mono text-text-secondary uppercase tracking-widest">
            Página {page} de {headsetsData.pagination.totalPages} | Total: {headsetsData.pagination.total}
          </span>
          <div className="flex gap-2">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)} 
              className="p-2 rounded-xl bg-hover-bg border border-border-primary text-text-secondary hover:text-primary-400 disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              disabled={page >= headsetsData.pagination.totalPages} 
              onClick={() => setPage(p => p + 1)} 
              className="p-2 rounded-xl bg-hover-bg border border-border-primary text-text-secondary hover:text-primary-400 disabled:opacity-30 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Modal Cadastro/Edição */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedHeadset ? 'Editar Headset' : 'Novo Headset'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Matrícula</label>
              <input 
                type="text" 
                className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${errors.matricula ? 'border-red-500' : 'border-border-primary'}`} 
                {...register('matricula')} 
              />
              {errors.matricula && <span className="text-[10px] text-red-500 font-mono">{errors.matricula.message}</span>}
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Lacre</label>
              <input 
                type="text" 
                className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${errors.lacre ? 'border-red-500' : 'border-border-primary'}`} 
                {...register('lacre')} 
              />
              {errors.lacre && <span className="text-[10px] text-red-500 font-mono">{errors.lacre.message}</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Marca</label>
              <input 
                type="text" 
                className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${errors.marca ? 'border-red-500' : 'border-border-primary'}`} 
                {...register('marca')} 
              />
              {errors.marca && <span className="text-[10px] text-red-500 font-mono">{errors.marca.message}</span>}
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Nº Série</label>
              <input 
                type="text" 
                className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${errors.numeroSerie ? 'border-red-500' : 'border-border-primary'}`} 
                {...register('numeroSerie')} 
              />
              {errors.numeroSerie && <span className="text-[10px] text-red-500 font-mono">{errors.numeroSerie.message}</span>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Status</label>
            <select 
              className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${errors.status ? 'border-red-500' : 'border-border-primary'}`} 
              {...register('status')}
            >
              {Object.entries(STATUS_LABELS).map(([val, { label }]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Observações</label>
            <textarea 
              className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 min-h-[100px] resize-none" 
              {...register('observacoes')} 
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-secondary font-mono font-bold uppercase tracking-wider transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isCreating || isUpdating}
              className="flex-1 py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold uppercase tracking-wider transition-all shadow-glow-purple flex items-center justify-center h-12"
            >
              {isCreating || isUpdating ? <Spinner /> : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmação de Exclusão */}
      <ConfirmDialog 
        isOpen={isDeleteConfirmOpen} 
        onClose={() => setIsDeleteConfirmOpen(false)} 
        onConfirm={() => selectedHeadset && deleteHeadset(selectedHeadset.id, { onSuccess: () => setIsDeleteConfirmOpen(false) })} 
        title="Excluir Headset" 
        description={`Tem certeza que deseja remover o headset da matrícula ${selectedHeadset?.matricula}?`} 
      />
    </div>
  );
};
