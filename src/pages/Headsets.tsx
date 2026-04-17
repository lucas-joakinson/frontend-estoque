import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Search, Trash2, ChevronLeft, ChevronRight, 
  Plus, Edit2, SlidersHorizontal, Filter, 
  History, User, ClipboardList,
  PackagePlus, Download, X, Settings2, UserMinus, UserPlus
} from 'lucide-react';

import { useHeadsets, useHeadsetHistory } from '../hooks/useHeadsets';
import { useDebounce } from '../hooks/useDebounce';

import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

import { Skeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';

import { headsetService } from '../services/headset.service';
import { headsetSchema, type HeadsetInput } from '../schemas/headset.schema';

import type { Headset, HeadsetStatus } from '../types';

const STATUS_LABELS: Record<HeadsetStatus, { label: string; color: string }> = {
  'EM_USO': { label: 'Em Uso', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  'RESERVA': { label: 'Reserva', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  'TROCA_PENDENTE': { label: 'Troca Pendente', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  'EM_MANUTENCAO': { label: 'Em Manutenção', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  'DEFEITO': { label: 'Defeito', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  'DISPONIVEL': { label: 'Disponível', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
};

const RESTRICTED_STATUSES = ['EM_MANUTENCAO', 'DEFEITO', 'DISPONIVEL'];

const DEFAULT_STATUS = { label: 'Desconhecido', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' };

export const Headsets = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const debouncedSearch = useDebounce(search, 500);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedHeadset, setSelectedHeadset] = useState<Headset | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [headsetForHistory, setHeadsetForHistory] = useState<Headset | null>(null);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [disconnectStatus, setDisconnectStatus] = useState<'DISPONIVEL' | 'DEFEITO'>('DISPONIVEL');
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [connectMatricula, setConnectMatricula] = useState('');
  const [connectObservacoes, setConnectObservacoes] = useState('');

  const [isExporting, setIsExporting] = useState(false);

  // Seleção em massa
  const [selectedHeadsetIds, setSelectedHeadsetIds] = useState<string[]>([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [isBulkUpdateModalOpen, setIsBulkUpdateModalOpen] = useState(false);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [bulkData, setBulkData] = useState({ status: '' as HeadsetStatus | '', observacoes: '' });

  // Estados para importação em lote
  const [parsedHeadsets, setParsedHeadsets] = useState<HeadsetInput[]>([]);
  const [bulkErrors, setBulkErrors] = useState<{ row: number; errors: string[] }[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  const { 
    headsetsData, 
    isLoading, 
    createHeadset, 
    isCreating, 
    bulkCreateHeadset,
    isBulkCreating,
    updateHeadset, 
    isUpdating, 
    deleteHeadset 
  } = useHeadsets(page, limit, debouncedSearch, statusFilter);

  const { data: headsetHistory, isLoading: isLoadingHistory } = useHeadsetHistory(headsetForHistory?.id || null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<HeadsetInput>({
    resolver: zodResolver(headsetSchema),
  });

  const watchedMatricula = watch('matricula');
  const watchedStatus = watch('status');

  useEffect(() => {
    if (watchedMatricula && watchedMatricula.trim().length > 0) {
      if (RESTRICTED_STATUSES.includes(watchedStatus)) {
        setValue('status', 'EM_USO');
      }
    }
  }, [watchedMatricula, watchedStatus, setValue]);

  useEffect(() => {
    if (RESTRICTED_STATUSES.includes(watchedStatus)) {
      setValue('matricula', '');
    }
  }, [watchedStatus, setValue]);

  const toggleSelectAllHeadsets = () => {
    if (selectedHeadsetIds.length === (headsetsData?.headsets.length || 0)) {
      setSelectedHeadsetIds([]);
    } else {
      setSelectedHeadsetIds(headsetsData?.headsets.map(h => h.id) || []);
    }
  };

  const toggleSelectOneHeadset = (id: string) => {
    setSelectedHeadsetIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkUpdate = async () => {
    if (selectedHeadsetIds.length === 0) return;
    setIsProcessingBulk(true);
    const toastId = toast.loading(`Atualizando ${selectedHeadsetIds.length} headsets...`);
    try {
      for (const id of selectedHeadsetIds) {
        const data: any = {};
        if (bulkData.status) {
          data.status = bulkData.status;
          if (RESTRICTED_STATUSES.includes(bulkData.status)) {
            data.matricula = null;
          }
        }
        if (bulkData.observacoes) data.observacoes = bulkData.observacoes;

        await headsetService.updateHeadset(id, data);
      }
      queryClient.invalidateQueries({ queryKey: ['headsets'] });
      toast.success('Headsets atualizados com sucesso!', { id: toastId });
      setSelectedHeadsetIds([]);
      setIsBulkUpdateModalOpen(false);
      setBulkData({ status: '', observacoes: '' });
    } catch (error) {
      toast.error('Erro na atualização em massa.', { id: toastId });
    } finally { setIsProcessingBulk(false); }
  };

  const handleBulkDelete = async () => {
    if (selectedHeadsetIds.length === 0) return;
    setIsProcessingBulk(true);
    const toastId = toast.loading(`Excluindo ${selectedHeadsetIds.length} headsets...`);
    try {
      for (const id of selectedHeadsetIds) await headsetService.deleteHeadset(id);
      queryClient.invalidateQueries({ queryKey: ['headsets'] });
      toast.success('Headsets removidos com sucesso!', { id: toastId });
      setSelectedHeadsetIds([]);
      setIsBulkDeleteConfirmOpen(false);
    } catch (error) {
      toast.error('Erro ao excluir headsets.', { id: toastId });
    } finally { setIsProcessingBulk(false); }
  };

  const handleHeadsetExport = async () => {
    try {
      setIsExporting(true);
      await headsetService.exportHeadsets(debouncedSearch, statusFilter);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao exportar dados');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    setSelectedHeadsetIds([]);
  };

  const handleOpenModal = (headset?: Headset) => {
    if (headset) {
      setSelectedHeadset(headset);
      reset({
        matricula: headset.matricula,
        lacre: headset.lacre,
        marca: headset.marca,
        numeroSerie: headset.numeroSerie || '',
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
        status: 'RESERVA',
        observacoes: '',
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit = (data: HeadsetInput) => {
    const payload = {
      ...data,
      matricula: data.matricula && data.matricula.trim() !== '' ? data.matricula : null
    };

    if (selectedHeadset) {
      updateHeadset({ id: selectedHeadset.id, data: payload as any }, {
        onSuccess: () => setIsModalOpen(false),
      });
    } else {
      createHeadset(payload as any, {
        onSuccess: () => setIsModalOpen(false),
      });
    }
  };

  const handleDisconnect = () => {
    if (!selectedHeadset) return;
    
    const toastId = toast.loading('Desvinculando operador...');
    
    updateHeadset({ 
      id: selectedHeadset.id, 
      data: { 
        matricula: null, 
        status: disconnectStatus,
        observacoes: `Operador desligado. Equipamento definido como ${STATUS_LABELS[disconnectStatus].label}.`
      } 
    }, {
      onSuccess: () => {
        toast.success('Operador desvinculado com sucesso!', { id: toastId });
        setIsDisconnectModalOpen(false);
        setSelectedHeadset(null);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Erro ao desvincular operador', { id: toastId });
      }
    });
  };

  const handleConnect = () => {
    if (!selectedHeadset || !connectMatricula.trim()) {
      toast.error('Por favor, informe a matrícula do operador.');
      return;
    }
    
    const toastId = toast.loading('Vinculando operador...');
    const finalObs = `Headset vinculado a matrícula ${connectMatricula.trim()}${connectObservacoes.trim() ? `. ${connectObservacoes.trim()}` : ''}`;
    
    updateHeadset({ 
      id: selectedHeadset.id, 
      data: { 
        matricula: connectMatricula.trim(), 
        status: 'EM_USO',
        observacoes: finalObs
      } 
    }, {
      onSuccess: () => {
        toast.success('Operador vinculado com sucesso!', { id: toastId });
        setIsConnectModalOpen(false);
        setSelectedHeadset(null);
        setConnectMatricula('');
        setConnectObservacoes('');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Erro ao vincular operador', { id: toastId });
      }
    });
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
    setParsedHeadsets([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        const wsname = wb.SheetNames.find(name => name.toLowerCase() === 'headsets');
        if (!wsname) {
          setBulkErrors([{ row: 0, errors: ['A aba "headsets" não foi encontrada no arquivo.'] }]);
          setIsParsing(false);
          return;
        }

        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];
        
        const results: HeadsetInput[] = [];
        const errorsList: { row: number; errors: string[] }[] = [];
        const lacresInSheet = new Set<string>();
        const matriculasInSheet = new Set<string>();
        const seriesInSheet = new Set<string>();

        data.forEach((row, index) => {
          const rowNum = index + 2;
          const rowErrors: string[] = [];

          // Mapeamento e Limpeza
          const rawMatricula = String(row['MATRÍCULA'] || '').trim();
          const rawLacre = String(row['LACRE'] || '').trim();
          const rawMarca = String(row['MARCA'] || '').trim();
          const rawSerie = String(row['Nº SÉRIE'] || '').trim();
          const rawStatus = String(row['STATUS'] || '').trim().toUpperCase().replace(/ /g, '_');
          const rawObs = String(row['OBSERVAÇÕES'] || '').trim();

          // Validação de Lacre
          if (!rawLacre) {
            rowErrors.push('LACRE é obrigatório');
          } else if (rawLacre.length > 5) {
            rowErrors.push('LACRE deve ter no máximo 5 caracteres');
          } else if (lacresInSheet.has(rawLacre)) {
            rowErrors.push(`LACRE duplicado na planilha: ${rawLacre}`);
          }
          
          // Validação de Matrícula
          if (rawMatricula) {
            if (matriculasInSheet.has(rawMatricula)) {
              rowErrors.push(`MATRÍCULA duplicada na planilha: ${rawMatricula}`);
            }
          }

          // Validação de Nº Série
          if (rawSerie) {
            if (seriesInSheet.has(rawSerie)) {
              rowErrors.push(`Nº SÉRIE duplicado na planilha: ${rawSerie}`);
            }
          }

          if (!rawMarca) rowErrors.push('MARCA é obrigatória');
          
          const validStatuses = ['EM_USO', 'RESERVA', 'TROCA_PENDENTE', 'EM_MANUTENCAO', 'DEFEITO', 'DISPONIVEL'];
          if (!rawStatus) {
            rowErrors.push('STATUS é obrigatório');
          } else if (!validStatuses.includes(rawStatus)) {
            rowErrors.push(`STATUS inválido: ${rawStatus}. Use: EM USO, RESERVA, TROCA PENDENTE, EM MANUTENCAO, DEFEITO ou DISPONIVEL`);
          }

          // Validação de Regra de Negócio: Status Restrito vs Matrícula
          if (RESTRICTED_STATUSES.includes(rawStatus) && rawMatricula) {
            rowErrors.push(`Status ${rawStatus} não pode ter matrícula vinculada.`);
          }

          if (rowErrors.length > 0) {
            errorsList.push({ row: rowNum, errors: rowErrors });
          } else {
            lacresInSheet.add(rawLacre);
            if (rawMatricula) matriculasInSheet.add(rawMatricula);
            if (rawSerie) seriesInSheet.add(rawSerie);
            
            results.push({
              matricula: rawMatricula || null,
              lacre: rawLacre,
              marca: rawMarca,
              numeroSerie: rawSerie || null,
              status: rawStatus as any,
              observacoes: rawObs || null,
            });
          }
        });

        setParsedHeadsets(results);
        setBulkErrors(errorsList);
      } catch (err) {
        setBulkErrors([{ row: 0, errors: ['Erro ao processar o arquivo. Verifique se é um .xlsx válido.'] }]);
      } finally {
        setIsParsing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const onBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedHeadsets.length === 0 || bulkErrors.length > 0) return;

    bulkCreateHeadset(parsedHeadsets as any, {
      onSuccess: () => {
        setIsBulkModalOpen(false);
        setParsedHeadsets([]);
        setBulkErrors([]);
      }
    });
  };

  const handleCloseBulkModal = () => {
    if (!isBulkCreating && !isParsing) {
      setIsBulkModalOpen(false);
      setParsedHeadsets([]);
      setBulkErrors([]);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-text-primary leading-tight">
            Headsets
          </h2>
          <p className="text-text-secondary mt-1 font-mono text-xs uppercase tracking-widest">
            Vínculo operador (matrícula) ↔ lacre; marca e série.
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={handleHeadsetExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-secondary hover:text-primary-400 font-mono font-bold text-sm uppercase tracking-wider transition-all flex-1 md:flex-none justify-center"
          >
            {isExporting ? <Spinner size={18} /> : <Download size={18} />} Exportar
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-secondary hover:text-primary-400 font-mono font-bold text-sm uppercase tracking-wider transition-all flex-1 md:flex-none justify-center"
          >
            <Plus size={18} /> Novo Headset
          </button>
          <button 
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold text-sm uppercase tracking-wider shadow-glow-purple transition-all flex-1 md:flex-none justify-center"
          >
            <PackagePlus size={18} /> Cadastro em Lote
          </button>
        </div>
      </div>

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
                    onClick={() => { setLimit(num); setPage(1); setSelectedHeadsetIds([]); }} 
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
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); setSelectedHeadsetIds([]); }} 
                className="bg-hover-bg border border-border-primary rounded-xl px-4 py-2 text-xs font-mono font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/50 cursor-pointer"
              >
                <option value="">Status</option>
                {Object.entries(STATUS_LABELS).map(([val, { label }]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            {(search || statusFilter) && (
              <button 
                onClick={() => { setSearch(''); setStatusFilter(''); setPage(1); setSelectedHeadsetIds([]); }} 
                className="text-[10px] font-mono font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest pl-2 border-l border-border-primary ml-2"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border-primary overflow-hidden bg-surface shadow-sm">        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-hover-bg">
              <tr>
                <th className="w-12 px-6 py-4 border-b border-border-primary text-center">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-border-primary bg-background text-primary-500" 
                    checked={!!(headsetsData?.headsets && headsetsData.headsets.length > 0 && selectedHeadsetIds.length === headsetsData.headsets.length)} 
                    onChange={toggleSelectAllHeadsets} 
                  />
                </th>
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
                    <td className="px-6 py-4"><Skeleton className="h-4 w-4 mx-auto" /></td>
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
                  <tr key={headset.id} className={`hover:bg-hover-bg transition-colors border-b border-border-primary last:border-0 ${selectedHeadsetIds.includes(headset.id) ? 'bg-primary-500/5' : ''}`}>
                    <td className="px-6 py-4 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-border-primary bg-background text-primary-500" 
                        checked={selectedHeadsetIds.includes(headset.id)} 
                        onChange={() => toggleSelectOneHeadset(headset.id)} 
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-text-primary">
                      {headset.matricula || <span className="text-text-secondary/40 font-mono text-xs uppercase italic">---</span>}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-text-secondary uppercase">{headset.lacre}</td>
                    <td className="px-6 py-4 text-sm text-text-primary">{headset.marca}</td>
                    <td className="px-6 py-4 text-xs font-mono text-text-secondary uppercase">{headset.numeroSerie || '---'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-mono font-bold border ${STATUS_LABELS[headset.status]?.color || DEFAULT_STATUS.color}`}>
                        {STATUS_LABELS[headset.status]?.label || DEFAULT_STATUS.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-[10px] font-mono text-text-secondary uppercase">
                      {new Date(headset.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        {headset.matricula ? (
                          <button 
                            onClick={() => { setSelectedHeadset(headset); setIsDisconnectModalOpen(true); }} 
                            className="p-2 rounded-lg bg-hover-bg border border-border-primary text-text-secondary hover:text-zinc-100 hover:bg-zinc-800 transition-all"
                            title="Desligar Operador"
                          >
                            <UserMinus size={14} />
                          </button>
                        ) : (
                          headset.status === 'DISPONIVEL' && (
                            <button 
                              onClick={() => { setSelectedHeadset(headset); setIsConnectModalOpen(true); }} 
                              className="p-2 rounded-lg bg-hover-bg border border-border-primary text-text-secondary hover:text-emerald-400 hover:bg-emerald-500/5 transition-all"
                              title="Vincular Operador"
                            >
                              <UserPlus size={14} />
                            </button>
                          )
                        )}
                        <button 
                          onClick={() => { setHeadsetForHistory(headset); setIsHistoryModalOpen(true); }} 
                          className="p-2 rounded-lg bg-hover-bg border border-border-primary text-text-secondary hover:text-amber-400 transition-all"
                        >
                          <History size={14} />
                        </button>
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
                  <td colSpan={8} className="px-6 py-12 text-center text-text-secondary font-mono text-sm italic">
                    Nenhum headset encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {headsetsData && headsetsData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-surface p-4 rounded-2xl border border-border-primary shadow-sm">
          <span className="text-xs font-mono text-text-secondary uppercase tracking-widest">
            Página {page} de {headsetsData.pagination.totalPages} | Total: {headsetsData.pagination.total}
          </span>
          <div className="flex gap-2">
            <button 
              disabled={page === 1} 
              onClick={() => { setPage(p => p - 1); setSelectedHeadsetIds([]); }} 
              className="p-2 rounded-xl bg-hover-bg border border-border-primary text-text-secondary hover:text-primary-400 disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              disabled={page >= headsetsData.pagination.totalPages} 
              onClick={() => { setPage(p => p + 1); setSelectedHeadsetIds([]); }} 
              className="p-2 rounded-xl bg-hover-bg border border-border-primary text-text-secondary hover:text-primary-400 disabled:opacity-30 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Ações em Massa */}
      {selectedHeadsetIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-primary-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 border border-primary-400 font-mono">
            <div className="flex items-center gap-2 border-r border-primary-400 pr-6">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold">{selectedHeadsetIds.length}</div>
              <span className="text-sm font-bold uppercase tracking-wider">Selecionados</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsBulkUpdateModalOpen(true)} 
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-primary-600 hover:bg-zinc-100 transition-all font-bold text-xs uppercase tracking-widest"
              >
                <Settings2 size={16} /> Alterar Status/Obs
              </button>
              <button 
                onClick={() => setIsBulkDeleteConfirmOpen(true)} 
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white transition-all font-bold text-xs uppercase tracking-widest"
              >
                <Trash2 size={16} /> Excluir
              </button>
              <button onClick={() => setSelectedHeadsetIds([])} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Alteração em Massa */}
      <Modal isOpen={isBulkUpdateModalOpen} onClose={() => !isProcessingBulk && setIsBulkUpdateModalOpen(false)} title={`Atualizar ${selectedHeadsetIds.length} Headsets`}>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Status</label>
            <select 
              className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary text-sm font-mono focus:outline-none" 
              value={bulkData.status} 
              onChange={(e) => setBulkData({ ...bulkData, status: e.target.value as HeadsetStatus })}
            >
              <option value="">Manter atual...</option>
              {Object.entries(STATUS_LABELS).map(([val, { label }]) => ( <option key={val} value={val}>{label}</option> ))}
            </select>
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
        title={selectedHeadset ? 'Editar Headset' : 'Novo Headset'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">
                Matrícula {RESTRICTED_STATUSES.includes(watchedStatus) && (
                  <span className="text-[10px] text-amber-500 lowercase normal-case font-normal ml-1">(desabilitado para este status)</span>
                )}
              </label>
              <input 
                type="text" 
                disabled={RESTRICTED_STATUSES.includes(watchedStatus)}
                placeholder={RESTRICTED_STATUSES.includes(watchedStatus) ? "Indisponível" : ""}
                className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${errors.matricula ? 'border-red-500' : 'border-border-primary'} ${RESTRICTED_STATUSES.includes(watchedStatus) ? 'opacity-50 cursor-not-allowed' : ''}`} 
                {...register('matricula')} 
              />
              {errors.matricula && <span className="text-[10px] text-red-500 font-mono">{errors.matricula.message}</span>}
              {RESTRICTED_STATUSES.includes(watchedStatus) && (
                <p className="text-[9px] text-amber-500/80 font-mono leading-tight">
                  Equipamentos em manutenção, com defeito ou disponíveis não podem possuir matrícula vinculada.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Lacre</label>
              <input 
                type="text" 
                maxLength={5}
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
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Nº Série (Opcional)</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50" 
                {...register('numeroSerie')} 
              />
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

      {/* Modal Cadastro em Lote */}
      <Modal 
        isOpen={isBulkModalOpen} 
        onClose={handleCloseBulkModal} 
        title="Importar Headsets (.xlsx)"
      >
        <form onSubmit={onBulkSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-hover-bg border border-border-primary">
              <h4 className="text-[10px] font-mono font-bold text-primary-400 uppercase tracking-widest mb-3">Como usar:</h4>
              <ol className="space-y-2">
                {[
                  'Prepare um arquivo Excel (.xlsx) com os dados',
                  'Selecione importar Excel',
                  'Se tudo estiver OK, clique em Importar para inserir no banco',
                  'Após importar, os dados aparecem na página de Headsets'
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
                PATRIMÔNIO | LACRE | MARCA | Nº SÉRIE | STATUS | OBSERVAÇÕES
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-primary-500/5 border border-primary-500/10">
              <h4 className="text-[10px] font-mono font-bold text-primary-400 uppercase tracking-widest mb-3">Dicas:</h4>
              <ul className="space-y-1">
                {[
                  'Tamanho máximo do arquivo: 5 MB',
                  'Formato suportado: Excel (.xlsx) apenas',
                  'Cada planilha deve ter uma aba \'headsets  \'',
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
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Selecione o arquivo Excel</label>
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
                <span className="text-[10px] uppercase tracking-widest">Clique ou arraste o arquivo .xlsx</span>
              </div>
            </div>
            <p className="text-[10px] font-mono text-text-secondary/60 uppercase text-center">Tamanho máximo: 5MB | Aba obrigatória: "headsets"</p>
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

          {parsedHeadsets.length > 0 && bulkErrors.length === 0 && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">Resumo da Importação</span>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/20">
                    {parsedHeadsets.length} Equipamentos Encontrados
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                <p className="text-[10px] font-mono text-amber-400 uppercase leading-relaxed text-center">
                  Atenção: Esta operação não pode ser desfeita após a confirmação.
                </p>
              </div>

              <button 
                type="submit" 
                disabled={isBulkCreating} 
                className="w-full py-4 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold uppercase tracking-wider transition-all shadow-glow-purple flex items-center justify-center gap-2"
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
      </Modal>

      {/* Modal Histórico */}
      <Modal isOpen={isHistoryModalOpen} onClose={() => { setIsHistoryModalOpen(false); setHeadsetForHistory(null); }} title={`Histórico: Headset Matrícula ${headsetForHistory?.matricula}`}>
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
          {isLoadingHistory ? (
            <div className="flex justify-center py-10"><Spinner size={32} /></div>
          ) : headsetHistory && headsetHistory.length > 0 ? (
            headsetHistory.map((entry, i) => (
              <div key={entry.id} className={`relative pl-8 ${i !== headsetHistory.length - 1 ? 'pb-8 border-l border-border-primary' : ''}`}>
                <div className={`absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full ${(STATUS_LABELS[entry.newStatus] || DEFAULT_STATUS).color.split(' ')[0] || 'bg-primary-500'}`} />
                <div className="flex flex-col gap-3 p-4 rounded-2xl bg-hover-bg border border-border-primary text-xs">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full font-bold border ${(STATUS_LABELS[entry.newStatus] || DEFAULT_STATUS).color}`}>{(STATUS_LABELS[entry.newStatus] || DEFAULT_STATUS).label}</span>
                    <span className="text-text-secondary uppercase font-mono">{new Date(entry.createdAt).toLocaleString()}</span>
                  </div>
                  {entry.observation && <div className="p-3 rounded-xl bg-surface/50 border border-border-primary italic text-text-secondary">"{entry.observation}"</div>}
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
        onConfirm={() => selectedHeadset && deleteHeadset(selectedHeadset.id, { onSuccess: () => setIsDeleteConfirmOpen(false) })} 
        title="Excluir Headset" 
        description={`Tem certeza que deseja remover o headset da matrícula ${selectedHeadset?.matricula}?`} 
      />
      <ConfirmDialog isOpen={isBulkDeleteConfirmOpen} onClose={() => !isProcessingBulk && setIsBulkDeleteConfirmOpen(false)} onConfirm={handleBulkDelete} title={`Excluir ${selectedHeadsetIds.length} Headsets`} description="Remover permanentemente os headsets selecionados?" />

      {/* Modal Desvincular Operador */}
      <Modal 
        isOpen={isDisconnectModalOpen} 
        onClose={() => setIsDisconnectModalOpen(false)} 
        title="Desvincular Operador"
      >
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
            <p className="text-xs font-mono text-amber-400 uppercase leading-relaxed text-center">
              Você está desvinculando o headset da matrícula <span className="font-bold">{selectedHeadset?.matricula}</span>.
              Para qual estado este equipamento deve ir?
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setDisconnectStatus('DISPONIVEL')}
              className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 ${disconnectStatus === 'DISPONIVEL' ? 'bg-zinc-500/10 border-zinc-500/50 text-zinc-400' : 'bg-hover-bg border-border-primary text-text-secondary hover:border-zinc-500/30'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${disconnectStatus === 'DISPONIVEL' ? 'bg-zinc-500/20' : 'bg-surface'}`}>
                <PackagePlus size={20} />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Disponível</span>
            </button>

            <button 
              onClick={() => setDisconnectStatus('DEFEITO')}
              className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 ${disconnectStatus === 'DEFEITO' ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-hover-bg border-border-primary text-text-secondary hover:border-red-500/30'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${disconnectStatus === 'DEFEITO' ? 'bg-red-500/20' : 'bg-surface'}`}>
                <Trash2 size={20} />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Defeito</span>
            </button>
          </div>

          <div className="flex gap-4 pt-2">
            <button 
              onClick={() => setIsDisconnectModalOpen(false)}
              className="flex-1 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-secondary font-mono font-bold uppercase tracking-wider transition-all"
            >
              Cancelar
            </button>
            <button 
              onClick={handleDisconnect}
              disabled={isUpdating}
              className="flex-1 py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold uppercase tracking-wider transition-all shadow-glow-purple flex items-center justify-center h-12"
            >
              {isUpdating ? <Spinner /> : 'Confirmar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Vincular Operador */}
      <Modal 
        isOpen={isConnectModalOpen} 
        onClose={() => setIsConnectModalOpen(false)} 
        title="Vincular Operador"
      >
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-primary-500/5 border border-primary-500/10">
            <p className="text-xs font-mono text-primary-400 uppercase leading-relaxed text-center">
              Vinculando operador ao headset lacre <span className="font-bold">{selectedHeadset?.lacre}</span>.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Matrícula do Operador</label>
              <input 
                type="text" 
                placeholder="Ex: 123456"
                value={connectMatricula}
                onChange={(e) => setConnectMatricula(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50" 
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Observações Adicionais (Opcional)</label>
              <textarea 
                placeholder="Alguma observação extra?"
                value={connectObservacoes}
                onChange={(e) => setConnectObservacoes(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 min-h-[100px] resize-none" 
              />
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <button 
              onClick={() => setIsConnectModalOpen(false)}
              className="flex-1 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-secondary font-mono font-bold uppercase tracking-wider transition-all"
            >
              Cancelar
            </button>
            <button 
              onClick={handleConnect}
              disabled={isUpdating}
              className="flex-1 py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold uppercase tracking-wider transition-all shadow-glow-purple flex items-center justify-center h-12"
            >
              {isUpdating ? <Spinner /> : 'Confirmar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
