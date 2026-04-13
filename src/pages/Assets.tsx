import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAssets, useAssetHistory } from '../hooks/useAssets';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { useDebounce } from '../hooks/useDebounce';
import { Search, Plus, Edit2, History, Trash2, MapPin, User, Calendar, ChevronLeft, ChevronRight, Download, Filter, X, Settings2 } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import { toast } from 'sonner';
import type { Asset, AssetStatus, Product } from '../types';
import { assetService } from '../services/asset.service';
import { createAssetSchema, updateAssetSchema, type CreateAssetInput, type UpdateAssetInput } from '../schemas/asset.schema';
import { useQueryClient } from '@tanstack/react-query';

const STATUS_LABELS: Record<AssetStatus, { label: string; color: string }> = {
  DISPONIVEL: { label: 'Disponível', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  EM_USO: { label: 'Em Uso', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  EM_MANUTENCAO: { label: 'Manutenção', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  DEFEITO: { label: 'Defeito', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  DESCARTADO: { label: 'Descartado', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
};

export const Assets = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const debouncedSearch = useDebounce(search, 500);
  const [isExporting, setIsExporting] = useState(false);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [assetForHistory, setAssetForHistory] = useState<Asset | null>(null);

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  // Estados para Ações em Massa
  const [selectedIds, setSelectedAssetIds] = useState<string[]>([]);
  const [isBulkUpdateModalOpen, setIsBulkUpdateModalOpen] = useState(false);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [bulkData, setBulkData] = useState({ status: '' as AssetStatus | '', location: '', observation: '' });

  const { assetsData, isLoading, createAsset, isCreating, updateAsset, isUpdating, deleteAsset } = useAssets(
    page, 
    10, 
    debouncedSearch, 
    statusFilter, 
    categoryFilter
  );
  const { productsData } = useProducts(1, 100);
  const { categoriesData } = useCategories(1, 100);
  const { data: history, isLoading: isLoadingHistory } = useAssetHistory(assetForHistory?.id || null);

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    formState: { errors: createErrors },
  } = useForm<CreateAssetInput>({
    resolver: zodResolver(createAssetSchema),
    defaultValues: {
      status: 'DISPONIVEL',
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<UpdateAssetInput>({
    resolver: zodResolver(updateAssetSchema),
  });

  useEffect(() => {
    if (selectedAsset) {
      resetEdit({
        status: selectedAsset.status,
        location: selectedAsset.location,
        observation: selectedAsset.observation || '',
      });
    }
  }, [selectedAsset, resetEdit]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setCategoryFilter('');
    setPage(1);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await assetService.exportAssets();
      toast.success('Relatório gerado com sucesso!');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao exportar dados';
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  };

  const onSubmitCreate = (data: CreateAssetInput) => {
    createAsset(data, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        resetCreate();
      }
    });
  };

  const onSubmitEdit = (data: UpdateAssetInput) => {
    if (!selectedAsset) return;
    
    // Se a observação estiver vazia, usa a anterior
    const payload = {
      ...data,
      observation: data.observation?.trim() || selectedAsset.observation || 'Atualização de registro'
    };

    updateAsset({ id: selectedAsset.id, data: payload }, {
      onSuccess: () => {
        setIsEditModalOpen(false);
        setSelectedAsset(null);
      }
    });
  };

  // Lógica de Seleção em Massa
  const toggleSelectAll = () => {
    if (selectedIds.length === (assetsData?.assets.length || 0)) {
      setSelectedAssetIds([]);
    } else {
      setSelectedAssetIds(assetsData?.assets.map(a => a.id) || []);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedAssetIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkUpdate = async () => {
    if (selectedIds.length === 0) return;
    
    setIsProcessingBulk(true);
    const toastId = toast.loading(`Atualizando ${selectedIds.length} ativos...`);
    
    try {
      let successCount = 0;
      for (const id of selectedIds) {
        const asset = assetsData?.assets.find(a => a.id === id);
        if (!asset) continue;

        const data: any = {};
        if (bulkData.status) data.status = bulkData.status;
        if (bulkData.location) data.location = bulkData.location;
        
        // Se não houver nova observação, tenta usar a do próprio ativo
        data.observation = bulkData.observation?.trim() || asset.observation || 'Atualização em massa';

        if (Object.keys(data).length > 0) {
          await assetService.updateAsset(id, data);
          successCount++;
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success(`${successCount} ativos atualizados com sucesso!`, { id: toastId });
      setSelectedAssetIds([]);
      setIsBulkUpdateModalOpen(false);
      setBulkData({ status: '', location: '', observation: '' });
    } catch (error) {
      toast.error('Ocorreu um erro durante a atualização em massa.', { id: toastId });
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    setIsProcessingBulk(true);
    const toastId = toast.loading(`Excluindo ${selectedIds.length} ativos...`);
    
    try {
      for (const id of selectedIds) {
        await assetService.deleteAsset(id);
      }
      
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success(`${selectedIds.length} ativos removidos com sucesso!`, { id: toastId });
      setSelectedAssetIds([]);
      setIsBulkDeleteConfirmOpen(false);
    } catch (error) {
      toast.error('Erro ao excluir alguns ativos. Verifique as permissões.', { id: toastId });
    } finally {
      setIsProcessingBulk(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* Barra de Ações em Massa (Floating) */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-primary-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 border border-primary-400">
            <div className="flex items-center gap-2 border-r border-primary-400 pr-6">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold font-mono">
                {selectedIds.length}
              </div>
              <span className="text-sm font-bold uppercase tracking-wider font-mono">Selecionados</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsBulkUpdateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-primary-600 hover:bg-zinc-100 transition-all font-bold text-xs uppercase tracking-widest"
              >
                <Settings2 size={16} /> Alterar Status/Local
              </button>
              
              <button 
                onClick={() => setIsBulkDeleteConfirmOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white transition-all font-bold text-xs uppercase tracking-widest"
              >
                <Trash2 size={16} /> Excluir
              </button>
              
              <button 
                onClick={() => setSelectedAssetIds([])}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Cancelar seleção"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-text-primary leading-tight">Gestão de Ativos</h2>
          <p className="text-text-secondary mt-1 font-mono text-xs uppercase tracking-widest">Controle individual de patrimônio e localização</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative group w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary-400 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Buscar patrimônio ou item..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-hover-bg border border-border-primary text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-mono text-sm"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-secondary hover:text-text-primary font-mono font-bold text-sm uppercase tracking-wider transition-all flex-1 md:flex-none justify-center"
              title="Exportar para Excel"
            >
              {isExporting ? <Spinner size={18} /> : <Download size={18} />} Exportar
            </button>
            <button 
              onClick={() => {
                resetCreate();
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold text-sm uppercase tracking-wider shadow-glow-purple transition-all flex-1 md:flex-none justify-center"
            >
              <Plus size={18} /> Novo Ativo
            </button>
          </div>
        </div>
      </div>

      {/* Filtros Avançados */}
      <div className="bg-surface border border-border-primary rounded-2xl p-4 flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex items-center gap-2 text-text-secondary font-mono text-[10px] uppercase tracking-widest px-2">
          <Filter size={14} className="text-primary-400" />
          Filtros:
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-hover-bg border border-border-primary rounded-xl px-4 py-2 text-xs font-mono font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/50 cursor-pointer transition-all"
        >
          <option value="">Todos os Status</option>
          {Object.entries(STATUS_LABELS).map(([val, { label }]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="bg-hover-bg border border-border-primary rounded-xl px-4 py-2 text-xs font-mono font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/50 cursor-pointer transition-all"
        >
          <option value="">Todas as Categorias</option>
          {categoriesData?.categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        {(search || statusFilter || categoryFilter) && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2 text-[10px] font-mono font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest"
          >
            Limpar Filtros
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-border-primary overflow-hidden bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-hover-bg">
              <tr>
                <th className="w-12 px-6 py-4 border-b border-border-primary text-center">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-border-primary bg-background text-primary-500 focus:ring-primary-500/50"
                    checked={!!(assetsData?.assets && assetsData.assets.length > 0 && selectedIds.length === assetsData.assets.length)}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary text-center">Patrimônio</th>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Item / Marca</th>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Categoria</th>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Status</th>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Localização</th>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-4 mx-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16 mx-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4 flex justify-end gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></td>
                  </tr>
                ))
              ) : assetsData?.assets && assetsData.assets.length > 0 ? (
                assetsData.assets.map((asset) => (
                  <tr key={asset.id} className={`hover:bg-hover-bg transition-colors border-b border-border-primary last:border-0 group ${selectedIds.includes(asset.id) ? 'bg-primary-500/5' : ''}`}>
                    <td className="px-6 py-4 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-border-primary bg-background text-primary-500 focus:ring-primary-500/50 cursor-pointer"
                        checked={selectedIds.includes(asset.id)}
                        onChange={() => toggleSelectOne(asset.id)}
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 rounded bg-hover-bg border border-border-primary font-mono font-bold text-primary-400 text-xs">
                        {asset.patrimonio}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-text-primary">{asset.product.name}</span>
                        <span className="text-[10px] font-mono text-text-secondary uppercase tracking-tighter">{asset.product.brand || 'Sem Marca'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase">{asset.product.category.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-mono font-bold border ${STATUS_LABELS[asset.status].color}`}>
                        {STATUS_LABELS[asset.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex items-center gap-2 text-xs font-mono text-text-secondary">
                      <MapPin size={12} className="text-primary-500/50" />
                      {asset.location}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            setAssetForHistory(asset);
                            setIsHistoryModalOpen(true);
                          }}
                          className="p-2 rounded-lg bg-hover-bg border border-border-primary text-text-secondary hover:text-amber-400 transition-all"
                          title="Ver Histórico"
                        >
                          <History size={14} />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedAsset(asset);
                            setIsEditModalOpen(true);
                          }}
                          className="p-2 rounded-lg bg-hover-bg border border-border-primary text-text-secondary hover:text-primary-400 transition-all"
                          title="Atualizar Status/Local"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedAsset(asset);
                            setIsConfirmDeleteOpen(true);
                          }}
                          className="p-2 rounded-lg bg-hover-bg border border-border-primary text-text-secondary hover:text-red-400 transition-all"
                          title="Remover Ativo"
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
                    Nenhum ativo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {assetsData && assetsData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-surface p-4 rounded-2xl border border-border-primary shadow-sm">
          <span className="text-xs font-mono text-text-secondary uppercase tracking-widest">
            Página {page} de {assetsData.pagination.totalPages}
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
              disabled={page === assetsData.pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-2 rounded-xl bg-hover-bg border border-border-primary text-text-secondary hover:text-primary-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Modal de Cadastro */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Novo Ativo (Patrimônio)">
        <form onSubmit={handleSubmitCreate(onSubmitCreate)} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Número do Patrimônio</label>
            <input
              type="text"
              placeholder="Ex: 123456"
              className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${createErrors.patrimonio ? 'border-red-500' : 'border-border-primary'}`}
              {...registerCreate('patrimonio')}
            />
            {createErrors.patrimonio && <span className="text-[10px] text-red-500 font-mono">{createErrors.patrimonio.message}</span>}
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Modelo do Item</label>
            <select
              className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${createErrors.productId ? 'border-red-500' : 'border-border-primary'}`}
              {...registerCreate('productId')}
            >
              <option value="">Selecione um modelo...</option>
              {productsData?.products.map((p: Product) => (
                <option key={p.id} value={p.id}>{p.name} {p.brand ? `(${p.brand})` : ''}</option>
              ))}
            </select>
            {createErrors.productId && <span className="text-[10px] text-red-500 font-mono">{createErrors.productId.message}</span>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Status Inicial</label>
              <select
                className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${createErrors.status ? 'border-red-500' : 'border-border-primary'}`}
                {...registerCreate('status')}
              >
                {Object.entries(STATUS_LABELS).map(([val, { label }]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              {createErrors.status && <span className="text-[10px] text-red-500 font-mono">{createErrors.status.message}</span>}
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Localização</label>
              <input
                type="text"
                placeholder="Ex: Sala 204"
                className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${createErrors.location ? 'border-red-500' : 'border-border-primary'}`}
                {...registerCreate('location')}
              />
              {createErrors.location && <span className="text-[10px] text-red-500 font-mono">{createErrors.location.message}</span>}
            </div>
          </div>
          <button 
            type="submit" 
            disabled={isCreating}
            className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold uppercase tracking-wider transition-all shadow-glow-purple flex items-center justify-center gap-2 h-12"
          >
            {isCreating ? <Spinner /> : 'Registrar Ativo'}
          </button>
        </form>
      </Modal>

      {/* Modal de Edição */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Atualizar Ativo: ${selectedAsset?.patrimonio}`}>
        <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="space-y-4">
          <div className="p-4 rounded-xl bg-hover-bg border border-border-primary mb-4">
            <p className="text-xs font-mono text-text-secondary uppercase tracking-widest mb-1">Item selecionado</p>
            <p className="text-sm font-bold text-text-primary">{selectedAsset?.product.name}</p>
            <p className="text-[10px] font-mono text-primary-400">{selectedAsset?.product.brand}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Novo Status</label>
              <select
                className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${editErrors.status ? 'border-red-500' : 'border-border-primary'}`}
                {...registerEdit('status')}
              >
                {Object.entries(STATUS_LABELS).map(([val, { label }]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              {editErrors.status && <span className="text-[10px] text-red-500 font-mono">{editErrors.status.message}</span>}
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Nova Localização</label>
              <input
                type="text"
                className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${editErrors.location ? 'border-red-500' : 'border-border-primary'}`}
                {...registerEdit('location')}
              />
              {editErrors.location && <span className="text-[10px] text-red-500 font-mono">{editErrors.location.message}</span>}
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Observações para o Histórico</label>
            <textarea
              className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 min-h-[100px] resize-none ${editErrors.observation ? 'border-red-500' : 'border-border-primary'}`}
              placeholder="Descreva o motivo da mudança..."
              {...registerEdit('observation')}
            />
            {editErrors.observation && <span className="text-[10px] text-red-500 font-mono">{editErrors.observation.message}</span>}
          </div>
          <button 
            type="submit" 
            disabled={isUpdating}
            className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold uppercase tracking-wider transition-all shadow-glow-purple flex items-center justify-center gap-2 h-12"
          >
            {isUpdating ? <Spinner /> : 'Salvar Alterações'}
          </button>
        </form>
      </Modal>

      {/* Modal de Atualização em Massa */}
      <Modal isOpen={isBulkUpdateModalOpen} onClose={() => !isProcessingBulk && setIsBulkUpdateModalOpen(false)} title={`Atualizar ${selectedIds.length} Ativos`}>
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/20 text-xs font-mono text-primary-400">
            Os campos deixados em branco não serão alterados nos ativos selecionados.
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Novo Status</label>
              <select
                className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                value={bulkData.status}
                onChange={(e) => setBulkData({ ...bulkData, status: e.target.value as AssetStatus })}
              >
                <option value="">Manter atual...</option>
                {Object.entries(STATUS_LABELS).map(([val, { label }]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Nova Localização</label>
              <input
                type="text"
                placeholder="Manter atual..."
                className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                value={bulkData.location || ''}
                onChange={(e) => setBulkData({ ...bulkData, location: e.target.value })}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Observação do Histórico</label>
            <textarea
              className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 min-h-[100px] resize-none"
              placeholder="Descreva o motivo desta alteração em massa..."
              value={bulkData.observation || ''}
              onChange={(e) => setBulkData({ ...bulkData, observation: e.target.value })}
            />
          </div>

          <button 
            onClick={handleBulkUpdate}
            disabled={isProcessingBulk || (!bulkData.status && !bulkData.location && !bulkData.observation)}
            className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold uppercase tracking-wider transition-all shadow-glow-purple flex items-center justify-center gap-2 h-12 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessingBulk ? <Spinner /> : `Atualizar ${selectedIds.length} Itens`}
          </button>
        </div>
      </Modal>

      {/* Modal de Histórico */}
      <Modal 
        isOpen={isHistoryModalOpen} 
        onClose={() => {
          setIsHistoryModalOpen(false);
          setAssetForHistory(null);
        }} 
        title={`Histórico: Ativo ${assetForHistory?.patrimonio}`}
      >
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
          {isLoadingHistory ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="relative pl-8 pb-6 border-l border-border-primary">
                <Skeleton className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full" />
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-20 w-full rounded-xl" />
              </div>
            ))
          ) : history && history.length > 0 ? (
            history.map((entry, i) => (
              <div key={entry.id} className={`relative pl-8 ${i !== history.length - 1 ? 'pb-8 border-l border-border-primary' : ''}`}>
                <div className={`absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full ${STATUS_LABELS[entry.newStatus]?.color.split(' ')[0] || 'bg-primary-500'}`} />
                <div className="flex flex-col gap-3 p-4 rounded-2xl bg-hover-bg border border-border-primary">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {entry.oldStatus && entry.oldStatus !== entry.newStatus && (
                        <>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono opacity-50 border ${STATUS_LABELS[entry.oldStatus]?.color}`}>
                            {STATUS_LABELS[entry.oldStatus]?.label}
                          </span>
                          <span className="text-text-secondary text-[10px]">→</span>
                        </>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${STATUS_LABELS[entry.newStatus]?.color}`}>
                        {STATUS_LABELS[entry.newStatus]?.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-secondary uppercase">
                      <Calendar size={12} />
                      {new Date(entry.createdAt).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs font-mono text-text-primary">
                      <MapPin size={14} className="text-primary-400" />
                      {entry.oldLocation && entry.oldLocation !== entry.newLocation ? (
                        <span className="flex items-center gap-1">
                          <span className="opacity-50">{entry.oldLocation}</span>
                          <span className="text-text-secondary text-[10px]">→</span>
                          <span>{entry.newLocation}</span>
                        </span>
                      ) : (
                        entry.newLocation
                      )}
                    </div>
                  </div>

                  {entry.observation && (
                    <div className="p-3 rounded-xl bg-surface/50 border border-border-primary text-xs text-text-secondary italic">
                      "{entry.observation}"
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-secondary/60 uppercase">
                    <User size={12} />
                    Modificado por: {entry.user?.matricula || 'Sistema'}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-text-secondary font-mono text-sm italic">
              Nenhum histórico encontrado para este ativo.
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={() => selectedAsset && deleteAsset(selectedAsset.id)}
        title="Remover Ativo"
        description={`Tem certeza que deseja remover o patrimônio ${selectedAsset?.patrimonio} do sistema? Esta ação é irreversível e removerá todo o histórico vinculado.`}
      />

      <ConfirmDialog
        isOpen={isBulkDeleteConfirmOpen}
        onClose={() => !isProcessingBulk && setIsBulkDeleteConfirmOpen(false)}
        onConfirm={handleBulkDelete}
        title={`Excluir ${selectedIds.length} Ativos`}
        description={`Tem certeza que deseja remover permanentemente os ${selectedIds.length} ativos selecionados? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
};
