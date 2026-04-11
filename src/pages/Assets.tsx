import { useState } from 'react';
import { useAssets, useAssetHistory } from '../hooks/useAssets';
import { useProducts } from '../hooks/useProducts';
import { Search, Plus, Edit2, History, Trash2, MapPin, ClipboardList, User, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import { toast } from 'sonner';
import type { Asset, AssetStatus } from '../types';

const STATUS_LABELS: Record<AssetStatus, { label: string; color: string }> = {
  DISPONIVEL: { label: 'Disponível', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  EM_USO: { label: 'Em Uso', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  EM_MANUTENCAO: { label: 'Manutenção', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  DEFEITO: { label: 'Defeito', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  DESCARTADO: { label: 'Descartado', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
};

export const Assets = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createData, setCreateData] = useState({ patrimonio: '', productId: '', status: 'DISPONIVEL' as AssetStatus, location: '' });
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [editData, setEditData] = useState({ status: 'DISPONIVEL' as AssetStatus, location: '', notes: '' });

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [assetForHistory, setAssetForHistory] = useState<Asset | null>(null);

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const { assetsData, isLoading, createAsset, isCreating, updateAsset, isUpdating, deleteAsset } = useAssets(page, limit, search);
  const { productsData } = useProducts(1, 100);
  const { data: history, isLoading: isLoadingHistory } = useAssetHistory(assetForHistory?.id || null);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createAsset(createData, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        setCreateData({ patrimonio: '', productId: '', status: 'DISPONIVEL', location: '' });
      }
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    updateAsset({ id: selectedAsset.id, data: editData }, {
      onSuccess: () => {
        setIsEditModalOpen(false);
        setSelectedAsset(null);
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
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
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold text-sm uppercase tracking-wider shadow-glow-purple transition-all w-full md:w-auto justify-center"
          >
            <Plus size={18} /> Novo Ativo
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border-primary overflow-hidden bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-hover-bg">
              <tr>
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
                  <tr key={asset.id} className="hover:bg-hover-bg transition-colors border-b border-border-primary last:border-0 group">
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
                            setEditData({ status: asset.status, location: asset.location, notes: '' });
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
                  <td colSpan={6} className="px-6 py-12 text-center text-text-secondary font-mono text-sm italic">
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
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Número do Patrimônio</label>
            <input
              type="text"
              required
              maxLength={6}
              placeholder="Ex: 123456"
              className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              value={createData.patrimonio}
              onChange={(e) => setCreateData({ ...createData, patrimonio: e.target.value.replace(/\D/g, '') })}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Modelo do Item</label>
            <select
              required
              className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              value={createData.productId}
              onChange={(e) => setCreateData({ ...createData, productId: e.target.value })}
            >
              <option value="">Selecione um modelo...</option>
              {productsData?.products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} {p.brand ? `(${p.brand})` : ''}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Status Inicial</label>
              <select
                className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                value={createData.status}
                onChange={(e) => setCreateData({ ...createData, status: e.target.value as AssetStatus })}
              >
                {Object.entries(STATUS_LABELS).map(([val, { label }]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Localização</label>
              <input
                type="text"
                required
                placeholder="Ex: Sala 204"
                className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                value={createData.location}
                onChange={(e) => setCreateData({ ...createData, location: e.target.value })}
              />
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
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="p-4 rounded-xl bg-hover-bg border border-border-primary mb-4">
            <p className="text-xs font-mono text-text-secondary uppercase tracking-widest mb-1">Item selecionado</p>
            <p className="text-sm font-bold text-text-primary">{selectedAsset?.product.name}</p>
            <p className="text-[10px] font-mono text-primary-400">{selectedAsset?.product.brand}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Novo Status</label>
              <select
                className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                value={editData.status}
                onChange={(e) => setEditData({ ...editData, status: e.target.value as AssetStatus })}
              >
                {Object.entries(STATUS_LABELS).map(([val, { label }]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Nova Localização</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                value={editData.location}
                onChange={(e) => setEditData({ ...editData, location: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Observações para o Histórico</label>
            <textarea
              className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 min-h-[100px] resize-none"
              placeholder="Descreva o motivo da mudança..."
              value={editData.notes}
              onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
            />
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
    </div>
  );
};
