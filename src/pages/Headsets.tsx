import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Search, Trash2, ChevronLeft, ChevronRight, 
  Plus, Edit2, SlidersHorizontal, Filter, 
  History, User, ClipboardList,
  PackagePlus
} from 'lucide-react';

// Hooks
import { useHeadsets, useHeadsetHistory } from '../hooks/useHeadsets';
import { useDebounce } from '../hooks/useDebounce';

import * as XLSX from 'xlsx';

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
  'EM USO': { label: 'Em Uso', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  'RESERVA': { label: 'Reserva', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  'TROCA PENDENTE': { label: 'Troca Pendente', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  'DESLIGADO': { label: 'Desligado', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

export const Headsets = () => {
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (5MB)
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

        data.forEach((row, index) => {
          const rowNum = index + 2; // +1 header, +1 zero-based
          const rowErrors: string[] = [];

          // Mapeamento e Limpeza
          const rawMatricula = String(row['MATRÍCULA'] || '').trim();
          const rawLacre = String(row['LACRE'] || '').trim();
          const rawMarca = String(row['MARCA'] || '').trim();
          const rawSerie = String(row['Nº SÉRIE'] || '').trim();
          const rawStatus = String(row['STATUS'] || '').trim().toUpperCase();
          const rawObs = String(row['OBSERVAÇÕES'] || '').trim();

          // Validação
          if (!rawMatricula) rowErrors.push('MATRÍCULA é obrigatória');
          if (!rawLacre) {
            rowErrors.push('LACRE é obrigatório');
          } else if (rawLacre.length > 5) {
            rowErrors.push('LACRE deve ter no máximo 5 caracteres');
          } else if (lacresInSheet.has(rawLacre)) {
            rowErrors.push(`LACRE duplicado na planilha: ${rawLacre}`);
          }
          
          if (!rawMarca) rowErrors.push('MARCA é obrigatória');
          
          const validStatuses = ['EM USO', 'RESERVA', 'TROCA PENDENTE', 'DESLIGADO'];
          if (!rawStatus) {
            rowErrors.push('STATUS é obrigatório');
          } else if (!validStatuses.includes(rawStatus)) {
            rowErrors.push(`STATUS inválido: ${rawStatus}. Use: EM USO, RESERVA, TROCA PENDENTE ou DESLIGADO`);
          }

          if (rowErrors.length > 0) {
            errorsList.push({ row: rowNum, errors: rowErrors });
          } else {
            lacresInSheet.add(rawLacre);
            results.push({
              matricula: rawMatricula,
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

        <div className="flex gap-2 w-full md:w-auto">
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
                    <td className="px-6 py-4 text-xs font-mono text-text-secondary uppercase">{headset.numeroSerie || '---'}</td>
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
                <div className={`absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full ${STATUS_LABELS[entry.newStatus]?.color.split(' ')[0] || 'bg-primary-500'}`} />
                <div className="flex flex-col gap-3 p-4 rounded-2xl bg-hover-bg border border-border-primary text-xs">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full font-bold border ${STATUS_LABELS[entry.newStatus]?.color}`}>{STATUS_LABELS[entry.newStatus]?.label}</span>
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
    </div>
  );
};
