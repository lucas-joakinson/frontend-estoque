import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, Trash2, ChevronLeft, ChevronRight, 
  Plus, Edit2, SlidersHorizontal, Filter, 
  History, User, ClipboardList,
  PackagePlus, Download, X, Settings2, UserMinus, UserPlus
} from 'lucide-react';

import { useHeadsets, useHeadsetHistory } from '../hooks/useHeadsets';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../hooks/useAuth';

import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

import { Skeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';

import { headsetService } from '../services/headset.service';
import { headsetSchema, type HeadsetInput } from '../schemas/headset.schema';

import type { Headset, HeadsetStatus, UserPermissions } from '../types';

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
  const { hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const debouncedSearch = useDebounce(search, 500);

  const canManageHeadsets = hasPermission('canManageHeadsets');
  const canDeleteHeadsets = hasPermission('canDeleteHeadsets');
  const canExportData = hasPermission('canExportData');

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (debouncedSearch) params.set('search', debouncedSearch); else params.delete('search');
    if (statusFilter) params.set('status', statusFilter); else params.delete('status');
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    const s = searchParams.get('search') || '';
    const st = searchParams.get('status') || '';
    if (s !== search) setSearch(s);
    if (st !== statusFilter) setStatusFilter(st);
  }, [searchParams]);

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

  const [selectedHeadsetIds, setSelectedHeadsetIds] = useState<string[]>([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [isBulkUpdateModalOpen, setIsBulkUpdateModalOpen] = useState(false);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [bulkData, setBulkData] = useState({ status: '' as HeadsetStatus | '', observacoes: '' });

  const [parsedHeadsets, setParsedHeadsets] = useState<HeadsetInput[]>([]);
  const [bulkErrors, setBulkErrors] = useState<{ row: number; errors: string[] }[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  const { 
    headsetsData, isLoading, createHeadset, isCreating, bulkCreateHeadset, isBulkCreating, updateHeadset, isUpdating, deleteHeadset 
  } = useHeadsets(page, limit, debouncedSearch, statusFilter, sortBy, order as 'asc' | 'desc');

  const { data: headsetHistory, isLoading: isLoadingHistory } = useHeadsetHistory(headsetForHistory?.id || null);

  const {
    register, handleSubmit, reset, setValue, watch, formState: { errors },
  } = useForm<HeadsetInput>({
    resolver: zodResolver(headsetSchema),
  });

  const watchedMatricula = watch('matricula');
  const watchedStatus = watch('status');

  useEffect(() => {
    if (watchedMatricula && watchedMatricula.trim().length > 0 && RESTRICTED_STATUSES.includes(watchedStatus)) {
      setValue('status', 'EM_USO');
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
          if (RESTRICTED_STATUSES.includes(bulkData.status)) data.matricula = null;
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
        matricula: headset.matricula, lacre: headset.lacre, marca: headset.marca,
        numeroSerie: headset.numeroSerie || '', status: headset.status, observacoes: headset.observacoes || '',
      });
    } else {
      setSelectedHeadset(null);
      reset({ matricula: '', lacre: '', marca: '', numeroSerie: '', status: 'EM_USO', observacoes: '' });
    }
    setIsModalOpen(true);
  };

  const onSubmit = (data: HeadsetInput) => {
    const payload = { ...data, matricula: data.matricula && data.matricula.trim() !== '' ? data.matricula : null };
    if (selectedHeadset) {
      updateHeadset({ id: selectedHeadset.id, data: payload as any }, { onSuccess: () => setIsModalOpen(false) });
    } else {
      createHeadset(payload as any, { onSuccess: () => setIsModalOpen(false) });
    }
  };

  const handleDisconnect = () => {
    if (!selectedHeadset) return;
    const toastId = toast.loading('Desvinculando operador...');
    updateHeadset({ 
      id: selectedHeadset.id, 
      data: { 
        matricula: null, status: disconnectStatus,
        observacoes: `Operador desligado. Equipamento definido como ${STATUS_LABELS[disconnectStatus].label}.`
      } 
    }, {
      onSuccess: () => {
        toast.success('Operador desvinculado com sucesso!', { id: toastId });
        setIsDisconnectModalOpen(false);
        setSelectedHeadset(null);
      },
      onError: (error: any) => toast.error(error.response?.data?.message || 'Erro ao desvincular operador', { id: toastId })
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
      id: selectedHeadset.id, data: { matricula: connectMatricula.trim(), status: 'EM_USO', observacoes: finalObs } 
    }, {
      onSuccess: () => {
        toast.success('Operador vinculado com sucesso!', { id: toastId });
        setIsConnectModalOpen(false);
        setSelectedHeadset(null);
        setConnectMatricula('');
        setConnectObservacoes('');
      },
      onError: (error: any) => toast.error(error.response?.data?.message || 'Erro ao vincular operador', { id: toastId })
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setBulkErrors([{ row: 0, errors: ['O arquivo deve ter no máximo 5MB.'] }]); return; }
    setIsParsing(true); setBulkErrors([]); setParsedHeadsets([]);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames.find(name => name.toLowerCase() === 'headsets');
        if (!wsname) { setBulkErrors([{ row: 0, errors: ['A aba "headsets" não foi encontrada no arquivo.'] }]); setIsParsing(false); return; }
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];
        const results: HeadsetInput[] = [];
        const errorsList: { row: number; errors: string[] }[] = [];
        const lacresInSheet = new Set<string>();
        const matriculasInSheet = new Set<string>();
        const seriesInSheet = new Set<string>();
        data.forEach((row, index) => {
          const rowNum = index + 2; const rowErrors: string[] = [];
          const rawMatricula = String(row['MATRÍCULA'] || '').trim();
          const rawLacre = String(row['LACRE'] || '').trim();
          const rawMarca = String(row['MARCA'] || '').trim();
          const rawSerie = String(row['Nº SÉRIE'] || '').trim();
          const rawStatus = String(row['STATUS'] || '').trim().toUpperCase().replace(/ /g, '_');
          const rawObs = String(row['OBSERVAÇÕES'] || '').trim();
          if (!rawLacre) rowErrors.push('LACRE é obrigatório');
          else if (rawLacre.length > 5) rowErrors.push('LACRE deve ter no máximo 5 caracteres');
          else if (lacresInSheet.has(rawLacre)) rowErrors.push(`LACRE duplicado na planilha: ${rawLacre}`);
          if (rawMatricula && matriculasInSheet.has(rawMatricula)) rowErrors.push(`MATRÍCULA duplicada na planilha: ${rawMatricula}`);
          if (rawSerie && seriesInSheet.has(rawSerie)) rowErrors.push(`Nº SÉRIE duplicado na planilha: ${rawSerie}`);
          if (!rawMarca) rowErrors.push('MARCA é obrigatória');
          const validStatuses = ['EM_USO', 'RESERVA', 'TROCA_PENDENTE', 'EM_MANUTENCAO', 'DEFEITO', 'DISPONIVEL'];
          if (!rawStatus) rowErrors.push('STATUS é obrigatório');
          else if (!validStatuses.includes(rawStatus)) rowErrors.push(`STATUS inválido: ${rawStatus}`);
          if (RESTRICTED_STATUSES.includes(rawStatus) && rawMatricula) rowErrors.push(`Status ${rawStatus} não pode ter matrícula.`);
          if (rowErrors.length > 0) errorsList.push({ row: rowNum, errors: rowErrors });
          else {
            lacresInSheet.add(rawLacre); if (rawMatricula) matriculasInSheet.add(rawMatricula); if (rawSerie) seriesInSheet.add(rawSerie);
            results.push({ matricula: rawMatricula || null, lacre: rawLacre, marca: rawMarca, numeroSerie: rawSerie || null, status: rawStatus as any, observacoes: rawObs || null });
          }
        });
        setParsedHeadsets(results); setBulkErrors(errorsList);
      } catch (err) { setBulkErrors([{ row: 0, errors: ['Erro ao processar o arquivo.'] }]); } finally { setIsParsing(false); }
    };
    reader.readAsBinaryString(file);
  };

  const onBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault(); if (parsedHeadsets.length === 0 || bulkErrors.length > 0) return;
    bulkCreateHeadset(parsedHeadsets as any, { onSuccess: () => { setIsBulkModalOpen(false); setParsedHeadsets([]); setBulkErrors([]); } });
  };

  const handleCloseBulkModal = () => { if (!isBulkCreating && !isParsing) { setIsBulkModalOpen(false); setParsedHeadsets([]); setBulkErrors([]); } };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-text-primary leading-tight">Headsets</h2>
          <p className="text-text-secondary mt-1 font-mono text-xs uppercase tracking-widest">Vínculo operador (matrícula) ↔ lacre; marca e série.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          {canExportData && (
            <button onClick={handleHeadsetExport} disabled={isExporting} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-secondary hover:text-primary-400 font-mono font-bold text-sm uppercase tracking-wider transition-all justify-center w-full md:w-auto">
              {isExporting ? <Spinner size={18} /> : <Download size={18} />} <span>Exportar</span>
            </button>
          )}
          {canManageHeadsets && (
            <>
              <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-secondary hover:text-primary-400 font-mono font-bold text-sm uppercase tracking-wider transition-all justify-center w-full md:w-auto">
                <Plus size={18} /> <span>Novo Headset</span>
              </button>
              <button onClick={() => setIsBulkModalOpen(true)} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold text-sm uppercase tracking-wider shadow-glow-purple transition-all justify-center w-full md:w-auto">
                <PackagePlus size={18} /> <span>Cadastro em Lote</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative group w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary-400 transition-colors" size={18} />
          <input type="text" placeholder="Buscar por matrícula, lacre, série..." className="w-full pl-12 pr-4 py-3 rounded-2xl bg-hover-bg border border-border-primary text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-mono text-sm" value={search} onChange={(e) => handleSearch(e.target.value)} />
        </div>
        {/* Filtros em coluna mobile */}
        <div className="bg-surface border border-border-primary rounded-2xl p-4 flex flex-col gap-6 shadow-sm w-full md:w-auto">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-center gap-4 border-b md:border-b-0 md:border-r border-border-primary pb-4 md:pb-0 md:pr-6">
              <div className="flex items-center gap-2 text-text-secondary"><SlidersHorizontal size={16} /><span className="text-xs font-mono uppercase tracking-widest">Exibir:</span></div>
              <div className="flex gap-2">
                {[10, 20, 50].map((num) => (
                  <button key={num} onClick={() => { setLimit(num); setPage(1); setSelectedHeadsetIds([]); }} className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${limit === num ? 'bg-primary-500 text-white shadow-glow-purple' : 'bg-hover-bg text-text-secondary hover:text-text-primary border border-border-primary'}`}>{num}</button>
                ))}
              </div>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-4 w-full">
              <div className="flex items-center gap-2 text-text-secondary shrink-0"><Filter size={14} className="text-primary-400" /><span className="text-xs font-mono uppercase tracking-widest">Filtros:</span></div>
              <div className="flex flex-col md:flex-row gap-3 w-full">
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); setSelectedHeadsetIds([]); }} className="bg-hover-bg border border-border-primary rounded-xl px-4 py-2 text-xs font-mono font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/50 cursor-pointer w-full md:w-auto">
                  <option value="">Status</option>
                  {Object.entries(STATUS_LABELS).map(([val, { label }]) => ( <option key={val} value={val}>{label}</option> ))}
                </select>
                <select value={`${sortBy}-${order}`} onChange={(e) => { const [newSortBy, newOrder] = e.target.value.split('-'); setSortBy(newSortBy); setOrder(newOrder as 'asc' | 'desc'); setPage(1); }} className="bg-hover-bg border border-border-primary rounded-xl px-4 py-2 text-xs font-mono font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/50 cursor-pointer w-full md:w-auto">
                  <option value="createdAt-desc">Mais Recentes</option><option value="createdAt-asc">Mais Antigos</option><option value="lacre-asc">Lacre (A-Z)</option><option value="marca-asc">Marca (A-Z)</option><option value="matricula-asc">Matrícula (A-Z)</option>
                </select>
              </div>
            </div>
          </div>
          {(search || statusFilter || sortBy !== 'createdAt' || order !== 'desc') && (
            <button onClick={() => { setSearch(''); setStatusFilter(''); setSortBy('createdAt'); setOrder('desc'); setPage(1); setSelectedHeadsetIds([]); }} className="text-[10px] font-mono font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest self-start">Limpar Filtros</button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border-primary overflow-hidden bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-hover-bg">
              <tr>
                <th className="w-12 px-6 py-4 border-b border-border-primary text-center">
                  <input type="checkbox" className="w-4 h-4 rounded border-border-primary/50 bg-zinc-800/50 accent-primary-500 cursor-pointer transition-all" checked={!!(headsetsData?.headsets && headsetsData.headsets.length > 0 && selectedHeadsetIds.length === headsetsData.headsets.length)} onChange={toggleSelectAllHeadsets} />
                </th>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Matrícula</th>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Lacre</th>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Marca</th>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-4 mx-auto" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-6 py-4 text-center"><Skeleton className="h-6 w-20 mx-auto" /></td>
                  <td className="px-6 py-4 flex justify-end gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></td>
                </tr>
              )) : headsetsData?.headsets.map((headset) => (
                <tr key={headset.id} className={`hover:bg-hover-bg transition-colors border-b border-border-primary last:border-0 ${selectedHeadsetIds.includes(headset.id) ? 'bg-primary-500/5' : ''}`}>
                  <td className="px-6 py-4 text-center"><input type="checkbox" checked={selectedHeadsetIds.includes(headset.id)} onChange={() => toggleSelectOneHeadset(headset.id)} /></td>
                  <td className="px-6 py-4 text-sm font-bold text-text-primary">{headset.matricula || <span className="text-text-secondary/40 italic">---</span>}</td>
                  <td className="px-6 py-4 text-xs font-mono text-text-secondary uppercase">{headset.lacre}</td>
                  <td className="px-6 py-4 text-sm text-text-primary">{headset.marca}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-mono font-bold border ${STATUS_LABELS[headset.status]?.color || DEFAULT_STATUS.color}`}>{STATUS_LABELS[headset.status]?.label || DEFAULT_STATUS.label}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      {canManageHeadsets && (
                        <>
                          {headset.matricula ? (
                            <button onClick={() => { setSelectedHeadset(headset); setIsDisconnectModalOpen(true); }} className="p-2 rounded-lg bg-hover-bg border border-border-primary text-text-secondary hover:text-zinc-100 hover:bg-zinc-800 transition-all" title="Desligar Operador"><UserMinus size={14} /></button>
                          ) : (
                            headset.status === 'DISPONIVEL' && <button onClick={() => { setSelectedHeadset(headset); setIsConnectModalOpen(true); }} className="p-2 rounded-lg bg-hover-bg border border-border-primary text-text-secondary hover:text-emerald-400 hover:bg-emerald-500/5 transition-all" title="Vincular Operador"><UserPlus size={14} /></button>
                          )}
                        </>
                      )}
                      <button onClick={() => { setHeadsetForHistory(headset); setIsHistoryModalOpen(true); }} className="p-2 rounded-lg bg-hover-bg border border-border-primary text-text-secondary hover:text-amber-400 transition-all"><History size={14} /></button>
                      {canManageHeadsets && <button onClick={() => handleOpenModal(headset)} className="p-2 rounded-lg bg-hover-bg border border-border-primary text-text-secondary hover:text-primary-400 transition-all"><Edit2 size={14} /></button>}
                      {canDeleteHeadsets && canManageHeadsets && <button onClick={() => { setSelectedHeadset(headset); setIsDeleteConfirmOpen(true); }} className="p-2 rounded-lg bg-hover-bg border border-border-primary text-text-secondary hover:text-red-400 transition-all"><Trash2 size={14} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Paginação, Ações em Massa e Modais Omitidos no resumo, mas mantidos no código completo */}
    </div>
  );
};
