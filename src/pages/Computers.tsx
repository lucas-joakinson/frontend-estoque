import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Search, Trash2, ChevronLeft, ChevronRight, 
  Plus, Edit2, SlidersHorizontal, Filter, 
  History, User, ClipboardList,
  PackagePlus, Download, MapPin, X, Settings2
} from 'lucide-react';

// Hooks
import { useComputers, useComputerHistory } from '../hooks/useComputers';
import { useDebounce } from '../hooks/useDebounce';

import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

// UI Components
import { Skeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';

// Services & Schemas
import { computerService } from '../services/computer.service';
import { computerSchema, type ComputerInput } from '../schemas/computer.schema';

// Types
import type { Computer, ComputerStatus } from '../types';

const STATUS_LABELS: Record<ComputerStatus, { label: string; color: string }> = {
  'Em uso': { label: 'Em Uso', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  'Manutenção': { label: 'Manutenção', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  'Defeito': { label: 'Defeito', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  'Troca pendente': { label: 'Troca Pendente', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  'Em estoque': { label: 'Em Estoque', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
};

export const Computers = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const debouncedSearch = useDebounce(search, 500);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedComputer, setSelectedComputer] = useState<Computer | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [computerForHistory, setComputerForHistory] = useState<Computer | null>(null);

  const [isExporting, setIsExporting] = useState(false);

  // Seleção em massa
  const [selectedComputerIds, setSelectedComputerIds] = useState<string[]>([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [isBulkUpdateModalOpen, setIsBulkUpdateModalOpen] = useState(false);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [bulkData, setBulkData] = useState({ status: '' as ComputerStatus | '', localizacao: '', observacoes: '' });

  // Estados para importação em lote
  const [parsedComputers, setParsedComputers] = useState<ComputerInput[]>([]);
  const [bulkErrors, setBulkErrors] = useState<{ row: number; errors: string[] }[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  const { 
    computersData, 
    isLoading, 
    createComputer, 
    isCreating, 
    bulkCreateComputers,
    isBulkCreating,
    updateComputer, 
    isUpdating, 
    deleteComputer 
  } = useComputers(page, limit, debouncedSearch, statusFilter);

  const { data: computerHistory, isLoading: isLoadingHistory } = useComputerHistory(computerForHistory?.id || null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ComputerInput>({
    resolver: zodResolver(computerSchema),
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    setSelectedComputerIds([]);
  };

  const toggleSelectAllComputers = () => {
    if (selectedComputerIds.length === (computersData?.computers.length || 0)) {
      setSelectedComputerIds([]);
    } else {
      setSelectedComputerIds(computersData?.computers.map(c => c.id) || []);
    }
  };

  const toggleSelectOneComputer = (id: string) => {
    setSelectedComputerIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkUpdate = async () => {
    if (selectedComputerIds.length === 0) return;
    setIsProcessingBulk(true);
    const toastId = toast.loading(`Atualizando ${selectedComputerIds.length} computadores...`);
    try {
      for (const id of selectedComputerIds) {
        const data: any = {};
        if (bulkData.status) data.status = bulkData.status;
        if (bulkData.localizacao) data.localizacao = bulkData.localizacao;
        if (bulkData.observacoes) data.observacoes = bulkData.observacoes;
        
        await computerService.updateComputer(id, data);
      }
      queryClient.invalidateQueries({ queryKey: ['computers'] });
      toast.success('Computadores atualizados com sucesso!', { id: toastId });
      setSelectedComputerIds([]);
      setIsBulkUpdateModalOpen(false);
      setBulkData({ status: '', localizacao: '', observacoes: '' });
    } catch (error) {
      toast.error('Erro na atualização em massa.', { id: toastId });
    } finally { setIsProcessingBulk(false); }
  };

  const handleBulkDelete = async () => {
    if (selectedComputerIds.length === 0) return;
    setIsProcessingBulk(true);
    const toastId = toast.loading(`Excluindo ${selectedComputerIds.length} computadores...`);
    try {
      for (const id of selectedComputerIds) await computerService.deleteComputer(id);
      queryClient.invalidateQueries({ queryKey: ['computers'] });
      toast.success('Computadores removidos com sucesso!', { id: toastId });
      setSelectedComputerIds([]);
      setIsBulkDeleteConfirmOpen(false);
    } catch (error) {
      toast.error('Erro ao excluir computadores.', { id: toastId });
    } finally { setIsProcessingBulk(false); }
  };

  const handleOpenModal = (computer?: Computer) => {
    if (computer) {
      setSelectedComputer(computer);
      reset({
        patrimonio: computer.patrimonio,
        hostname: computer.hostname,
        status: computer.status,
        localizacao: computer.localizacao,
        observacoes: computer.observacoes || '',
      });
    } else {
      setSelectedComputer(null);
      reset({
        patrimonio: '',
        hostname: '',
        status: 'Em estoque',
        localizacao: '',
        observacoes: '',
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit = (data: ComputerInput) => {
    if (selectedComputer) {
      updateComputer({ id: selectedComputer.id, data }, {
        onSuccess: () => setIsModalOpen(false),
      });
    } else {
      createComputer(data, {
        onSuccess: () => setIsModalOpen(false),
      });
    }
  };

  const handleComputerExport = async () => {
    try {
      setIsExporting(true);
      await computerService.exportComputers(debouncedSearch, statusFilter);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao exportar dados');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setBulkErrors([{ row: 0, errors: ['O arquivo deve ter no máximo 5MB.'] }]);
      return;
    }

    setIsParsing(true);
    setBulkErrors([]);
    setParsedComputers([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        const wsname = wb.SheetNames.find(name => name.toLowerCase() === 'computadores');
        if (!wsname) {
          setBulkErrors([{ row: 0, errors: ['A aba "computadores" não foi encontrada no arquivo.'] }]);
          setIsParsing(false);
          return;
        }

        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];
        
        const results: ComputerInput[] = [];
        const errorsList: { row: number; errors: string[] }[] = [];

        data.forEach((row, index) => {
          const rowNum = index + 2;
          const rowErrors: string[] = [];

          const rawPatrimonio = String(row['PATRIMÔNIO'] || '').trim();
          const rawHostname = String(row['HOSTNAME'] || '').trim();
          const rawStatusInput = String(row['STATUS'] || '').trim();
          const rawLocation = String(row['LOCALIZAÇÃO'] || '').trim();
          const rawObs = String(row['OBSERVAÇÕES'] || '').trim();
          
          const formatStatus = (s: string): ComputerStatus => {
            const lower = s.toLowerCase();
            if (lower === 'em uso') return 'Em uso';
            if (lower === 'manutenção' || lower === 'manutencao') return 'Manutenção';
            if (lower === 'defeito') return 'Defeito';
            if (lower === 'troca pendente') return 'Troca pendente';
            if (lower === 'em estoque') return 'Em estoque';
            return s as any;
          };

          const rawStatus = formatStatus(rawStatusInput);

          if (!rawPatrimonio) rowErrors.push('PATRIMÔNIO é obrigatório');
          if (!rawHostname) rowErrors.push('HOSTNAME é obrigatório');
          if (!rawLocation) rowErrors.push('LOCALIZAÇÃO é obrigatória');
          
          const validStatuses = ['Em uso', 'Manutenção', 'Defeito', 'Troca pendente', 'Em estoque'];
          if (!rawStatusInput) {
            rowErrors.push('STATUS é obrigatório');
          } else if (!validStatuses.includes(rawStatus)) {
            rowErrors.push(`STATUS inválido: ${rawStatusInput}`);
          }

          if (rowErrors.length > 0) {
            errorsList.push({ row: rowNum, errors: rowErrors });
          } else {
            results.push({
              patrimonio: rawPatrimonio,
              hostname: rawHostname,
              status: rawStatus,
              localizacao: rawLocation,
              observacoes: rawObs || null,
            });
          }
        });

        setParsedComputers(results);
        setBulkErrors(errorsList);
      } catch (err) {
        setBulkErrors([{ row: 0, errors: ['Erro ao processar o arquivo.'] }]);
      } finally {
        setIsParsing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const onBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedComputers.length === 0 || bulkErrors.length > 0) return;

    bulkCreateComputers(parsedComputers as any, {
      onSuccess: () => {
        setIsBulkModalOpen(false);
        setParsedComputers([]);
        setBulkErrors([]);
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-text-primary leading-tight">
            Computadores
          </h2>
          <p className="text-text-secondary mt-1 font-mono text-xs uppercase tracking-widest">
            Controle de patrimônio, hostname e localização.
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={handleComputerExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-secondary hover:text-text-primary font-mono font-bold text-sm uppercase tracking-wider transition-all flex-1 md:flex-none justify-center"
          >
            {isExporting ? <Spinner size={18} /> : <Download size={18} />} Exportar
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-secondary hover:text-primary-400 font-mono font-bold text-sm uppercase tracking-wider transition-all flex-1 md:flex-none justify-center"
          >
            <Plus size={18} /> Novo Computador
          </button>
          <button 
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold text-sm uppercase tracking-wider shadow-glow-purple transition-all flex-1 md:flex-none justify-center"
          >
            <PackagePlus size={18} /> Importar Excel
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative group w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary-400 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Buscar por patrimônio, hostname..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-hover-bg border border-border-primary text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-mono text-sm"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className="bg-surface border border-border-primary rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm w-full md:w-auto">
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
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); setSelectedComputerIds([]); }} 
                className="bg-hover-bg border border-border-primary rounded-xl px-4 py-2 text-xs font-mono font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/50 cursor-pointer"
              >
                <option value="">Todos os status</option>
                {Object.entries(STATUS_LABELS).map(([val, { label }]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            {(search || statusFilter) && (
              <button 
                onClick={() => { setSearch(''); setStatusFilter(''); setPage(1); setSelectedComputerIds([]); }} 
                className="text-[10px] font-mono font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest pl-2 border-l border-border-primary ml-2"
              >
                Limpar Filtros
              </button>
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
                <th className="w-12 px-6 py-4 border-b border-border-primary text-center">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-border-primary bg-background text-primary-500" 
                    checked={!!(computersData?.computers && computersData.computers.length > 0 && selectedComputerIds.length === computersData.computers.length)} 
                    onChange={toggleSelectAllComputers} 
                  />
                </th>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Patrimônio</th>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Hostname</th>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Localização</th>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary text-right">Atualizado</th>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-4 mx-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4 text-center"><Skeleton className="h-6 w-24 mx-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24 ml-auto" /></td>
                    <td className="px-6 py-4 flex justify-end gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></td>
                  </tr>
                ))
              ) : computersData?.computers && computersData.computers.length > 0 ? (
                computersData.computers.map((comp) => (
                  <tr key={comp.id} className={`hover:bg-hover-bg transition-colors border-b border-border-primary last:border-0 ${selectedComputerIds.includes(comp.id) ? 'bg-primary-500/5' : ''}`}>
                    <td className="px-6 py-4 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-border-primary bg-background text-primary-500" 
                        checked={selectedComputerIds.includes(comp.id)} 
                        onChange={() => toggleSelectOneComputer(comp.id)} 
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-text-primary">
                      <span className="px-2 py-1 rounded bg-hover-bg border border-border-primary font-mono text-xs">
                        {comp.patrimonio}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-primary-400">{comp.hostname}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-mono font-bold border ${STATUS_LABELS[comp.status].color}`}>
                        {STATUS_LABELS[comp.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-text-secondary uppercase">{comp.localizacao}</td>
                    <td className="px-6 py-4 text-right text-[10px] font-mono text-text-secondary uppercase">
                      {new Date(comp.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => { setComputerForHistory(comp); setIsHistoryModalOpen(true); }} 
                          className="p-2 rounded-lg bg-hover-bg border border-border-primary text-text-secondary hover:text-amber-400 transition-all"
                        >
                          <History size={14} />
                        </button>
                        <button 
                          onClick={() => handleOpenModal(comp)} 
                          className="p-2 rounded-lg bg-hover-bg border border-border-primary text-text-secondary hover:text-primary-400 transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => { setSelectedComputer(comp); setIsDeleteConfirmOpen(true); }} 
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
                    Nenhum computador encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginação */}
      {computersData && computersData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-surface p-4 rounded-2xl border border-border-primary shadow-sm">
          <span className="text-xs font-mono text-text-secondary uppercase tracking-widest">
            Página {page} de {computersData.pagination.totalPages} | Total: {computersData.pagination.total}
          </span>
          <div className="flex gap-2">
            <button 
              disabled={page === 1} 
              onClick={() => { setPage(p => p - 1); setSelectedComputerIds([]); }} 
              className="p-2 rounded-xl bg-hover-bg border border-border-primary text-text-secondary hover:text-primary-400 disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              disabled={page >= computersData.pagination.totalPages} 
              onClick={() => { setPage(p => p + 1); setSelectedComputerIds([]); }} 
              className="p-2 rounded-xl bg-hover-bg border border-border-primary text-text-secondary hover:text-primary-400 disabled:opacity-30 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Ações em Massa */}
      {selectedComputerIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-primary-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 border border-primary-400 font-mono">
            <div className="flex items-center gap-2 border-r border-primary-400 pr-6">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold">{selectedComputerIds.length}</div>
              <span className="text-sm font-bold uppercase tracking-wider">Selecionados</span>
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
              <button onClick={() => setSelectedComputerIds([])} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Alteração em Massa */}
      <Modal isOpen={isBulkUpdateModalOpen} onClose={() => !isProcessingBulk && setIsBulkUpdateModalOpen(false)} title={`Atualizar ${selectedComputerIds.length} Computadores`}>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Status</label>
              <select 
                className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary text-sm font-mono focus:outline-none" 
                value={bulkData.status} 
                onChange={(e) => setBulkData({ ...bulkData, status: e.target.value as ComputerStatus })}
              >
                <option value="">Manter atual...</option>
                {Object.entries(STATUS_LABELS).map(([val, { label }]) => ( <option key={val} value={val}>{label}</option> ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Localização</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary text-sm font-mono focus:outline-none" 
                placeholder="Manter atual..." 
                value={bulkData.localizacao} 
                onChange={(e) => setBulkData({ ...bulkData, localizacao: e.target.value })} 
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Observações</label>
            <textarea 
              className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary text-sm font-mono focus:outline-none min-h-[100px] resize-none" 
              placeholder="Manter atual..."
              value={bulkData.observacoes} 
              onChange={(e) => setBulkData({ ...bulkData, observacoes: e.target.value })} 
            />
          </div>
          <button 
            onClick={handleBulkUpdate} 
            disabled={isProcessingBulk} 
            className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold uppercase transition-all shadow-glow-purple flex items-center justify-center gap-2 h-12"
          >
            {isProcessingBulk ? <Spinner /> : 'Atualizar Itens'}
          </button>
        </div>
      </Modal>

      {/* Modal Cadastro/Edição */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedComputer ? 'Editar Computador' : 'Novo Computador'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Patrimônio</label>
              <input 
                type="text" 
                className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${errors.patrimonio ? 'border-red-500' : 'border-border-primary'}`} 
                {...register('patrimonio')} 
              />
              {errors.patrimonio && <span className="text-[10px] text-red-500 font-mono">{errors.patrimonio.message}</span>}
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Hostname</label>
              <input 
                type="text" 
                className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${errors.hostname ? 'border-red-500' : 'border-border-primary'}`} 
                {...register('hostname')} 
              />
              {errors.hostname && <span className="text-[10px] text-red-500 font-mono">{errors.hostname.message}</span>}
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
            {errors.status && <span className="text-[10px] text-red-500 font-mono">{errors.status.message}</span>}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Localização</label>
            <input 
              type="text" 
              className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${errors.localizacao ? 'border-red-500' : 'border-border-primary'}`} 
              {...register('localizacao')} 
            />
            {errors.localizacao && <span className="text-[10px] text-red-500 font-mono">{errors.localizacao.message}</span>}
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

      {/* Modal Importação Excel */}
      <Modal 
        isOpen={isBulkModalOpen} 
        onClose={() => !isBulkCreating && setIsBulkModalOpen(false)} 
        title="Importar Computadores (.xlsx)"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-hover-bg border border-border-primary">
              <h4 className="text-[10px] font-mono font-bold text-primary-400 uppercase tracking-widest mb-3">Como usar:</h4>
              <ol className="space-y-2">
                {[
                  'Prepare um arquivo Excel (.xlsx) com os dados',
                  'Selecione importar',
                  'Clique no campo acima ou arraste o arquivo',
                  'Clique em Validar para verificar se os dados estão corretos',
                  'Se tudo estiver OK, clique em Importar para inserir no banco',
                  'Após importar, os dados aparecem na página de Computadores'
                ].map((step, i) => (
                  <li key={i} className="text-[10px] font-mono text-text-secondary flex gap-3 leading-relaxed">
                    <span className="text-primary-400 font-bold">{i+1}.</span> {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="p-4 rounded-2xl bg-hover-bg border border-border-primary">
              <h4 className="text-[10px] font-mono font-bold text-primary-400 uppercase tracking-widest mb-3">Formato da Planilha:</h4>
              <p className="text-[10px] font-mono text-text-primary font-bold tracking-widest bg-surface px-3 py-2 rounded-lg border border-border-primary">
                PATRIMÔNIO | HOSTNAME | STATUS | LOCALIZAÇÃO | OBSERVAÇÕES
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-primary-500/5 border border-primary-500/10">
              <h4 className="text-[10px] font-mono font-bold text-primary-400 uppercase tracking-widest mb-3">Dicas:</h4>
              <ul className="space-y-1">
                {[
                  'Tamanho máximo do arquivo: 5 MB',
                  'Formato suportado: Excel (.xlsx) apenas',
                  'Cada planilha deve ter uma aba \'computadores\'',
                  'Validação ocorre antes da importação para evitar erros',
                  'A importação não pode ser desfeita, então valide bem antes de importar!',
                  'Você pode importar headsets e computadores em arquivos separados ou no mesmo arquivo'
                ].map((tip, i) => (
                  <li key={i} className="text-[10px] font-mono text-text-secondary flex gap-2 before:content-['•'] before:text-primary-400">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <form onSubmit={onBulkSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="relative group">
                <input 
                  type="file" 
                  accept=".xlsx"
                  onChange={handleFileUpload}
                  disabled={isParsing || isBulkCreating}
                  className="w-full px-4 py-8 rounded-2xl bg-hover-bg border-2 border-dashed border-border-primary text-text-secondary font-mono text-xs cursor-pointer file:hidden hover:border-primary-500/50 transition-all text-center"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-2">
                  <PackagePlus className="text-text-secondary group-hover:text-primary-400 transition-colors" size={24} />
                  <span className="text-[10px] uppercase tracking-widest font-bold">Clique ou arraste o arquivo .xlsx</span>
                </div>
              </div>
            </div>

            {isParsing && (
              <div className="flex flex-col items-center justify-center py-6 gap-3 bg-hover-bg rounded-2xl border border-border-primary animate-pulse">
                <Spinner size={24} />
                <span className="text-[10px] font-mono text-primary-400 uppercase tracking-widest">Processando planilha...</span>
              </div>
            )}

            {bulkErrors.length > 0 && (
              <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-3 max-h-[200px] overflow-y-auto no-scrollbar">
                <div className="flex items-center gap-2 text-red-400">
                  <SlidersHorizontal size={14} />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Erros de Validação:</span>
                </div>
                <ul className="space-y-2">
                  {bulkErrors.map((err, i) => (
                    <li key={i} className="text-[10px] font-mono text-red-400/80 leading-relaxed border-l-2 border-red-500/30 pl-3">
                      {err.row > 0 ? `Linha ${err.row}: ` : ''}{err.errors.join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {parsedComputers.length > 0 && bulkErrors.length === 0 && (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">Resumo da Importação</span>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/20">
                    {parsedComputers.length} Computadores Encontrados
                  </span>
                </div>

                <button 
                  type="submit" 
                  disabled={isBulkCreating} 
                  className="w-full py-4 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold uppercase tracking-wider transition-all shadow-glow-purple flex items-center justify-center gap-2 h-14"
                >
                  {isBulkCreating ? <Spinner /> : (
                    <>
                      <ClipboardList size={18} /> Confirmar Importação
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </Modal>

      {/* Modal Histórico */}
      <Modal isOpen={isHistoryModalOpen} onClose={() => { setIsHistoryModalOpen(false); setComputerForHistory(null); }} title={`Histórico: Computador ${computerForHistory?.patrimonio}`}>
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
          {isLoadingHistory ? (
            <div className="flex justify-center py-10"><Spinner size={32} /></div>
          ) : computerHistory && computerHistory.length > 0 ? (
            computerHistory.map((entry, i) => (
              <div key={entry.id} className={`relative pl-8 ${i !== computerHistory.length - 1 ? 'pb-8 border-l border-border-primary' : ''}`}>
                <div className={`absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full ${STATUS_LABELS[entry.newStatus]?.color.split(' ')[0] || 'bg-primary-500'}`} />
                <div className="flex flex-col gap-3 p-4 rounded-2xl bg-hover-bg border border-border-primary text-xs">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full font-bold border ${STATUS_LABELS[entry.newStatus]?.color}`}>{STATUS_LABELS[entry.newStatus]?.label}</span>
                    <span className="text-text-secondary uppercase font-mono">{new Date(entry.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-primary font-mono"><MapPin size={14} className="text-primary-400" /> {entry.newLocalizacao}</div>
                  {entry.observacoes && <div className="p-3 rounded-xl bg-surface/50 border border-border-primary italic text-text-secondary">"{entry.observacoes}"</div>}
                  <div className="flex items-center gap-1.5 font-mono text-text-secondary/60 uppercase"><User size={12} /> Modificado por: {entry.user?.name || 'Sistema'}</div>
                </div>
              </div>
            ))
          ) : ( <div className="text-center py-8 text-text-secondary font-mono italic">Nenhum histórico encontrado.</div> )}
        </div>
      </Modal>

      {/* Confirmação de Exclusão */}
      <ConfirmDialog 
        isOpen={isDeleteConfirmOpen} 
        onClose={() => setIsDeleteConfirmOpen(false)} 
        onConfirm={() => selectedComputer && deleteComputer(selectedComputer.id, { onSuccess: () => setIsDeleteConfirmOpen(false) })} 
        title="Excluir Computador" 
        description={`Tem certeza que deseja remover o computador de patrimônio ${selectedComputer?.patrimonio}?`} 
      />
      <ConfirmDialog isOpen={isBulkDeleteConfirmOpen} onClose={() => !isProcessingBulk && setIsBulkDeleteConfirmOpen(false)} onConfirm={handleBulkDelete} title={`Excluir ${selectedComputerIds.length} Computadores`} description="Remover permanentemente os computadores selecionados?" />
    </div>
  );
};

