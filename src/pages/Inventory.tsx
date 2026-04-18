import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Search, Trash2, PackagePlus, ChevronLeft, ChevronRight, Package, 
  Plus, Edit2, History, MapPin, User, Download, Filter, 
  X, Settings2, SlidersHorizontal, Tag, ClipboardList 
} from 'lucide-react';

import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { useAssets, useAssetHistory } from '../hooks/useAssets';
import { useAuth } from '../hooks/useAuth';
import { useDebounce } from '../hooks/useDebounce';

import { Skeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';

import { assetService } from '../services/asset.service';
import { createProductSchema, type CreateProductInput } from '../schemas/product.schema';
import { categorySchema, type CategoryInput } from '../schemas/category.schema';
import { createAssetSchema, updateAssetSchema, type CreateAssetInput, type UpdateAssetInput } from '../schemas/asset.schema';

import type { Product, Asset, AssetStatus } from '../types';

const STATUS_LABELS: Record<AssetStatus, { label: string; color: string }> = {
  DISPONIVEL: { label: 'Disponível', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  EM_USO: { label: 'Em Uso', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  EM_MANUTENCAO: { label: 'Manutenção', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  DEFEITO: { label: 'Defeito', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  DESCARTADO: { label: 'Descartado', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
};

type InventoryTab = 'products' | 'categories' | 'assets';

export const Inventory = () => {
  const [activeTab, setActiveTab] = useState<InventoryTab>('assets');
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const canManageAssets = hasPermission('canManageAssets');
  const canManageProducts = hasPermission('canManageProducts');
  const canManageCategories = hasPermission('canManageCategories');
  const canDelete = hasPermission('canDeleteItems');
  const canExportData = hasPermission('canExportData');

  const [searchParams, setSearchParams] = useSearchParams();
  const [assetPage, setAssetPage] = useState(1);
  const [assetLimit, setAssetLimit] = useState(10);
  
  const [assetSearch, setAssetSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  
  const debouncedAssetSearch = useDebounce(assetSearch, 500);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (debouncedAssetSearch) params.set('search', debouncedAssetSearch); else params.delete('search');
    if (statusFilter) params.set('status', statusFilter); else params.delete('status');
    if (categoryFilter) params.set('category', categoryFilter); else params.delete('category');
    setSearchParams(params, { replace: true });
  }, [debouncedAssetSearch, statusFilter, categoryFilter]);

  useEffect(() => {
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const category = searchParams.get('category') || '';
    if (search !== assetSearch) setAssetSearch(search);
    if (status !== statusFilter) setStatusFilter(status);
    if (category !== categoryFilter) setCategoryFilter(category);
  }, [searchParams]);

  const [isExporting, setIsExporting] = useState(false);
  
  const [isAssetCreateModalOpen, setIsAssetCreateModalOpen] = useState(false);
  const [isAssetBulkModalOpen, setIsAssetBulkModalOpen] = useState(false);
  const [isAssetEditModalOpen, setIsAssetEditModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isAssetHistoryModalOpen, setIsAssetHistoryModalOpen] = useState(false);
  const [assetForHistory, setAssetForHistory] = useState<Asset | null>(null);
  const [isAssetDeleteConfirmOpen, setIsAssetDeleteConfirmOpen] = useState(false);

  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [isBulkUpdateModalOpen, setIsBulkUpdateModalOpen] = useState(false);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [bulkData, setBulkData] = useState({ status: '' as AssetStatus | '', location: '', notes: '' });

  const { assetsData, isLoading: isLoadingAssets, createAsset, isCreating: isCreatingAsset, updateAsset, isUpdating: isUpdatingAsset, deleteAsset, bulkCreateAsset, isBulkCreating } = useAssets(
    assetPage, 
    assetLimit, 
    debouncedAssetSearch, 
    statusFilter, 
    categoryFilter
  );

  const { data: assetHistory, isLoading: isLoadingHistory } = useAssetHistory(assetForHistory?.id || null);

  const {
    register: registerAssetCreate,
    handleSubmit: handleSubmitAssetCreate,
    reset: resetAssetCreate,
    formState: { errors: assetCreateErrors },
  } = useForm<CreateAssetInput>({
    resolver: zodResolver(createAssetSchema),
    defaultValues: { status: 'DISPONIVEL' },
  });

  const [bulkForm, setBulkForm] = useState({
    productId: '',
    patrimoniosText: '',
    status: 'DISPONIVEL' as AssetStatus,
    location: '',
    responsible: '',
  });

  const onAssetBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkForm.productId || !bulkForm.patrimoniosText.trim()) {
      toast.error('Preencha o modelo e os números de patrimônio');
      return;
    }

    const patrimonioList = bulkForm.patrimoniosText
      .split(/[\n,]/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (patrimonioList.length === 0) {
      toast.error('Insira ao menos um número de patrimônio válido');
      return;
    }

    if (patrimonioList.length > 100) {
      toast.error('O limite máximo é de 100 ativos por vez');
      return;
    }

    const assets = patrimonioList.map(p => ({
      patrimonio: p,
      productId: bulkForm.productId,
      status: bulkForm.status,
      location: bulkForm.location,
      responsible: bulkForm.responsible || null,
    }));

    bulkCreateAsset(assets, {
      onSuccess: () => {
        setIsAssetBulkModalOpen(false);
        setBulkForm({
          productId: '',
          patrimoniosText: '',
          status: 'DISPONIVEL',
          location: '',
          responsible: '',
        });
      }
    });
  };

  const {
    register: registerAssetEdit,
    handleSubmit: handleSubmitAssetEdit,
    reset: resetAssetEdit,
    formState: { errors: assetEditErrors },
  } = useForm<UpdateAssetInput>({
    resolver: zodResolver(updateAssetSchema),
  });

  useEffect(() => {
    if (selectedAsset) {
      resetAssetEdit({
        status: selectedAsset.status,
        location: selectedAsset.location,
        responsible: selectedAsset.responsible || '',
        observation: selectedAsset.observation || '',
      });
    }
  }, [selectedAsset, resetAssetEdit]);

  const handleAssetSearch = (value: string) => {
    setAssetSearch(value);
    setAssetPage(1);
  };

  const handleAssetExport = async () => {
    try {
      setIsExporting(true);
      await assetService.exportAssets(assetSearch, statusFilter, categoryFilter);
      toast.success('Relatório gerado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao exportar dados');
    } finally {
      setIsExporting(false);
    }
  };

  const onAssetCreateSubmit = (data: CreateAssetInput) => {
    createAsset(data, {
      onSuccess: () => {
        setIsAssetCreateModalOpen(false);
        resetAssetCreate();
      }
    });
  };

  const onAssetEditSubmit = (data: UpdateAssetInput) => {
    if (!selectedAsset) return;
    updateAsset({ 
      id: selectedAsset.id, 
      data: { 
        status: data.status,
        location: data.location,
        responsible: data.responsible,
        notes: data.observation?.trim() || 'Atualização de registro' 
      } 
    }, {
      onSuccess: () => {
        setIsAssetEditModalOpen(false);
        setSelectedAsset(null);
      }
    });
  };

  const toggleSelectAllAssets = () => {
    if (selectedAssetIds.length === (assetsData?.assets.length || 0)) {
      setSelectedAssetIds([]);
    } else {
      setSelectedAssetIds(assetsData?.assets.map(a => a.id) || []);
    }
  };

  const toggleSelectOneAsset = (id: string) => {
    setSelectedAssetIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkUpdate = async () => {
    if (selectedAssetIds.length === 0) return;
    setIsProcessingBulk(true);
    const toastId = toast.loading(`Atualizando ${selectedAssetIds.length} ativos...`);
    try {
      for (const id of selectedAssetIds) {
        const asset = assetsData?.assets.find(a => a.id === id);
        if (!asset) continue;
        const data: any = {};
        if (bulkData.status) data.status = bulkData.status;
        if (bulkData.location) data.location = bulkData.location;
        data.notes = bulkData.notes?.trim() || 'Atualização em massa';
        await assetService.updateAsset(id, data);
      }
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Ativos atualizados com sucesso!', { id: toastId });
      setSelectedAssetIds([]);
      setIsBulkUpdateModalOpen(false);
      setBulkData({ status: '', location: '', notes: '' });
    } catch (error) {
      toast.error('Erro na atualização em massa.', { id: toastId });
    } finally { setIsProcessingBulk(false); }
  };

  const handleBulkDelete = async () => {
    if (selectedAssetIds.length === 0) return;
    setIsProcessingBulk(true);
    const toastId = toast.loading(`Excluindo ${selectedAssetIds.length} ativos...`);
    try {
      for (const id of selectedAssetIds) await assetService.deleteAsset(id);
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Ativos removidos com sucesso!', { id: toastId });
      setSelectedAssetIds([]);
      setIsBulkDeleteConfirmOpen(false);
    } catch (error) {
      toast.error('Erro ao excluir ativos.', { id: toastId });
    } finally { setIsProcessingBulk(false); }
  };

  const [productPage, setProductPage] = useState(1);
  const [productLimit, setProductLimit] = useState(10);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('');
  const [productSortBy, setProductSortBy] = useState<'name' | 'createdAt'>('createdAt');
  const [productOrder, setProductOrder] = useState<'asc' | 'desc'>('desc');
  const debouncedProductSearch = useDebounce(productSearch, 500);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDeleteConfirmOpen, setIsProductDeleteConfirmOpen] = useState(false);

  const { productsData, isLoading: isLoadingProducts, deleteProduct, createProduct, isCreating: isCreatingProduct } = useProducts(
    productPage, 
    productLimit, 
    debouncedProductSearch, 
    productCategoryFilter,
    productSortBy, 
    productOrder
  );

  const {
    register: registerProduct,
    handleSubmit: handleSubmitProduct,
    reset: resetProduct,
    formState: { errors: productErrors },
  } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
  });

  const handleProductSearch = (value: string) => {
    setProductSearch(value);
    setProductPage(1);
  };

  const onProductSubmit = (data: CreateProductInput) => {
    createProduct(data, {
      onSuccess: () => {
        setIsProductModalOpen(false);
        resetProduct();
      }
    });
  };

  const [catPage, setCatPage] = useState(1);
  const [catLimit, setCatLimit] = useState(10);
  const [catSearch, setCatSearch] = useState('');
  const [catSortBy] = useState<'name' | 'createdAt'>('name');
  const [catOrder, setCatOrder] = useState<'asc' | 'desc'>('asc');
  const debouncedCatSearch = useDebounce(catSearch, 500);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isCatDeleteConfirmOpen, setIsCatDeleteConfirmOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string } | null>(null);

  const { categoriesData, isLoading: isLoadingCats, createCategory, updateCategory, deleteCategory } = useCategories(
    catPage, 
    catLimit, 
    debouncedCatSearch,
    catSortBy,
    catOrder
  );

  const {
    register: registerCat,
    handleSubmit: handleSubmitCat,
    reset: resetCat,
    formState: { errors: catErrors },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
  });

  useEffect(() => {
    if (selectedCategory) resetCat({ name: selectedCategory.name });
    else resetCat({ name: '' });
  }, [selectedCategory, resetCat]);

  const handleCatSearch = (value: string) => {
    setCatSearch(value);
    setCatPage(1);
  };

  const onCatSubmit = (data: CategoryInput) => {
    if (selectedCategory) {
      updateCategory({ id: selectedCategory.id, name: data.name }, {
        onSuccess: () => {
          setIsCatModalOpen(false);
          resetCat();
        }
      });
    } else {
      createCategory(data.name, {
        onSuccess: () => {
          setIsCatModalOpen(false);
          resetCat();
        }
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-text-primary leading-tight">
            Gerenciar Estoque
          </h2>
          <p className="text-text-secondary mt-1 font-mono text-xs uppercase tracking-widest">
            {activeTab === 'assets' && 'Controle individual de patrimônio e localização'}
            {activeTab === 'products' && 'Catálogo de modelos de hardware e equipamentos'}
            {activeTab === 'categories' && 'Organização do inventário por categorias'}
          </p>
        </div>

        <div className="flex p-1 bg-surface border border-border-primary rounded-2xl">
          <button
            onClick={() => setActiveTab('assets')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-mono font-bold transition-all ${activeTab === 'assets' ? 'bg-primary-500 text-white shadow-glow-purple' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <ClipboardList size={14} />
            ATIVOS
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-mono font-bold transition-all ${activeTab === 'products' ? 'bg-primary-500 text-white shadow-glow-purple' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <Package size={14} />
            ITENS
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-mono font-bold transition-all ${activeTab === 'categories' ? 'bg-primary-500 text-white shadow-glow-purple' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <Tag size={14} />
            CATEGORIAS
          </button>
        </div>
      </div>

      {activeTab === 'assets' && (
        <>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative group w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary-400 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Buscar patrimônio ou item..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-hover-bg border border-border-primary text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-mono text-sm"
                value={assetSearch}
                onChange={(e) => handleAssetSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              {canExportData && (
                <button 
                  onClick={handleAssetExport}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-secondary hover:text-text-primary font-mono font-bold text-sm uppercase tracking-wider transition-all flex-1 md:flex-none justify-center"
                >
                  {isExporting ? <Spinner size={18} /> : <Download size={18} />} Exportar
                </button>
              )}
              {canManageAssets && (
                <>
                  <button 
                    onClick={() => { resetAssetCreate(); setIsAssetCreateModalOpen(true); }}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-secondary hover:text-primary-400 font-mono font-bold text-sm uppercase tracking-wider transition-all flex-1 md:flex-none justify-center"
                  >
                    <Plus size={18} /> Novo Ativo
                  </button>
                  <button 
                    onClick={() => setIsAssetBulkModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold text-sm uppercase tracking-wider shadow-glow-purple transition-all flex-1 md:flex-none justify-center"
                  >
                    <PackagePlus size={18} /> Cadastro em Lote
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="bg-surface border border-border-primary rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-4 border-r border-border-primary pr-6">
                <div className="flex items-center gap-2 text-text-secondary">
                  <SlidersHorizontal size={16} />
                  <span className="text-xs font-mono uppercase tracking-widest">Exibir:</span>
                </div>
                <div className="flex gap-2">
                  {[10, 20, 50].map((num) => (
                    <button key={num} onClick={() => { setAssetLimit(num); setAssetPage(1); }} className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${assetLimit === num ? 'bg-primary-500 text-white shadow-glow-purple' : 'bg-hover-bg text-text-secondary hover:text-text-primary border border-border-primary'}`}>{num}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Filter size={14} className="text-primary-400" />
                  <span className="text-xs font-mono uppercase tracking-widest">Filtros:</span>
                </div>
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setAssetPage(1); }} className="bg-hover-bg border border-border-primary rounded-xl px-4 py-2 text-xs font-mono font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/50 cursor-pointer">
                  <option value="">Status</option>
                  {Object.entries(STATUS_LABELS).map(([val, { label }]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
                <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setAssetPage(1); }} className="bg-hover-bg border border-border-primary rounded-xl px-4 py-2 text-xs font-mono font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/50 cursor-pointer">
                  <option value="">Categoria</option>
                  {categoriesData?.categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              {(assetSearch || statusFilter || categoryFilter) && (
                <button onClick={() => { setAssetSearch(''); setStatusFilter(''); setCategoryFilter(''); setAssetPage(1); }} className="text-[10px] font-mono font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest pl-2 border-l border-border-primary ml-2">Limpar Filtros</button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border-primary overflow-hidden bg-surface shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-hover-bg">
                  <tr>
                    <th className="w-12 px-6 py-4 border-b border-border-primary text-center">
                      <input type="checkbox" className="w-4 h-4 rounded border-border-primary bg-background text-primary-500" checked={!!(assetsData?.assets && assetsData.assets.length > 0 && selectedAssetIds.length === assetsData.assets.length)} onChange={toggleSelectAllAssets} />
                    </th>
                    <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary text-center">Patrimônio</th>
                    <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Item / Marca</th>
                    <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Responsável</th>
                    <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Localização</th>
                    <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Categoria</th>
                    <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary text-center">Status</th>
                    <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-primary">
                  {isLoadingAssets ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-4 mx-auto" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-16 mx-auto" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-6 py-4 text-center"><Skeleton className="h-6 w-20 mx-auto" /></td>
                        <td className="px-6 py-4 flex justify-end gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></td>
                      </tr>
                    ))
                  ) : assetsData?.assets && assetsData.assets.length > 0 ? (
                    assetsData.assets.map((asset) => (
                      <tr key={asset.id} className={`hover:bg-hover-bg transition-colors border-b border-border-primary last:border-0 ${selectedAssetIds.includes(asset.id) ? 'bg-primary-500/5' : ''}`}>
                        <td className="px-6 py-4 text-center"><input type="checkbox" className="w-4 h-4 rounded border-border-primary bg-background text-primary-500 cursor-pointer" checked={selectedAssetIds.includes(asset.id)} onChange={() => toggleSelectOneAsset(asset.id)} /></td>
                        <td className="px-6 py-4 text-center"><span className="px-3 py-1 rounded bg-hover-bg border border-border-primary font-mono font-bold text-primary-400 text-xs">{asset.patrimonio}</span></td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-text-primary">{asset.product?.name || 'Item Removido'}</span>
                            <span className="text-[10px] font-mono text-text-secondary uppercase tracking-tighter">{asset.product?.brand || 'Sem Marca'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-text-secondary uppercase">
                          {asset.responsible || '---'}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-text-secondary uppercase">
                          {asset.location || '---'}
                        </td>
                        <td className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase">{asset.product?.category?.name || 'Sem Categoria'}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-mono font-bold border ${STATUS_LABELS[asset.status]?.color || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                            {STATUS_LABELS[asset.status]?.label || 'Desconhecido'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => { setAssetForHistory(asset); setIsAssetHistoryModalOpen(true); }} className="p-2 rounded-lg bg-hover-bg border border-border-primary text-text-secondary hover:text-amber-400 transition-all"><History size={14} /></button>
                            {canManageAssets && (
                              <button onClick={() => { setSelectedAsset(asset); setIsAssetEditModalOpen(true); }} className="p-2 rounded-lg bg-hover-bg border border-border-primary text-text-secondary hover:text-primary-400 transition-all"><Edit2 size={14} /></button>
                            )}
                            {canDelete && (
                              <button onClick={() => { setSelectedAsset(asset); setIsAssetDeleteConfirmOpen(true); }} className="p-2 rounded-lg bg-hover-bg border border-border-primary text-text-secondary hover:text-red-400 transition-all"><Trash2 size={14} /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-text-secondary font-mono text-sm italic">Nenhum ativo encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {assetsData && assetsData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between bg-surface p-4 rounded-2xl border border-border-primary shadow-sm">
              <span className="text-xs font-mono text-text-secondary uppercase tracking-widest">Página {assetPage} de {assetsData.pagination.totalPages}</span>
              <div className="flex gap-2">
                <button disabled={assetPage === 1} onClick={() => setAssetPage(p => p - 1)} className="p-2 rounded-xl bg-hover-bg border border-border-primary text-text-secondary hover:text-primary-400 disabled:opacity-30 transition-all"><ChevronLeft size={20} /></button>
                <button disabled={assetPage >= assetsData.pagination.totalPages} onClick={() => setAssetPage(p => p + 1)} className="p-2 rounded-xl bg-hover-bg border border-border-primary text-text-secondary hover:text-primary-400 disabled:opacity-30 transition-all"><ChevronRight size={20} /></button>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'products' && (
        <>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative group w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary-400 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Buscar item..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-hover-bg border border-border-primary text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-mono text-sm"
                value={productSearch}
                onChange={(e) => handleProductSearch(e.target.value)}
              />
            </div>
            {canManageProducts && (
              <button onClick={() => { resetProduct(); setIsProductModalOpen(true); }} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold text-sm uppercase tracking-wider shadow-glow-purple transition-all w-full md:w-auto justify-center">
                <PackagePlus size={18} /> Novo Modelo
              </button>
            )}
          </div>

          <div className="bg-surface border border-border-primary rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-4 border-r border-border-primary pr-6">
                <div className="flex items-center gap-2 text-text-secondary">
                  <SlidersHorizontal size={16} />
                  <span className="text-xs font-mono uppercase tracking-widest">Exibir:</span>
                </div>
                <div className="flex gap-2">
                  {[10, 20, 50].map((num) => (
                    <button key={num} onClick={() => { setProductLimit(num); setProductPage(1); }} className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${productLimit === num ? 'bg-primary-500 text-white shadow-glow-purple' : 'bg-hover-bg text-text-secondary hover:text-text-primary border border-border-primary'}`}>{num}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Filter size={14} className="text-primary-400" />
                  <span className="text-xs font-mono uppercase tracking-widest">Filtros:</span>
                </div>
                <select value={productCategoryFilter} onChange={(e) => { setProductCategoryFilter(e.target.value); setProductPage(1); }} className="bg-hover-bg border border-border-primary rounded-xl px-4 py-2 text-xs font-mono font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/50 cursor-pointer">
                  <option value="">Categoria</option>
                  {categoriesData?.categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <select value={productSortBy} onChange={(e) => { setProductSortBy(e.target.value as any); setProductPage(1); }} className="bg-hover-bg border border-border-primary rounded-xl px-4 py-2 text-xs font-mono font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/50 cursor-pointer">
                  <option value="name">Nome</option>
                  <option value="createdAt">Data</option>
                </select>
                <select value={productOrder} onChange={(e) => { setProductOrder(e.target.value as any); setProductPage(1); }} className="bg-hover-bg border border-border-primary rounded-xl px-4 py-2 text-xs font-mono font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/50 cursor-pointer">
                  <option value="asc">Crescente</option>
                  <option value="desc">Decrescente</option>
                </select>
              </div>
              {(productSearch || productCategoryFilter) && (
                <button onClick={() => { setProductSearch(''); setProductCategoryFilter(''); setProductPage(1); }} className="text-[10px] font-mono font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest pl-2 border-l border-border-primary ml-2">Limpar Filtros</button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border-primary overflow-hidden bg-surface shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-hover-bg">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Item / Modelo</th>
                    <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Marca</th>
                    <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Categoria</th>
                    <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-primary">
                  {isLoadingProducts ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-32" /></td>
                        <td className="px-6 py-4 flex justify-end"><Skeleton className="h-8 w-8" /></td>
                      </tr>
                    ))
                  ) : productsData?.products && productsData.products.length > 0 ? (
                    productsData.products.map((product: Product) => (
                      <tr key={product.id} className="hover:bg-hover-bg transition-colors border-b border-border-primary last:border-0">
                        <td className="px-6 py-4 text-sm font-bold text-text-primary flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-400"><Package size={16} /></div>
                          {product.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-text-secondary font-mono">{product.brand || '---'}</td>
                        <td className="px-6 py-4 text-xs font-mono"><span className="px-3 py-1 rounded-full bg-hover-bg border border-border-primary text-text-secondary">{product.category.name}</span></td>
                        <td className="px-6 py-4 flex justify-end gap-2">
                          {canDelete && (
                            <button onClick={() => { setSelectedProduct(product); setIsProductDeleteConfirmOpen(true); }} className="p-2 rounded-lg bg-hover-bg border border-border-primary text-text-secondary hover:text-red-400 transition-all"><Trash2 size={14} /></button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-text-secondary font-mono text-sm italic">Nenhum modelo encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {productsData && productsData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between bg-surface p-4 rounded-2xl border border-border-primary shadow-sm">
              <span className="text-xs font-mono text-text-secondary uppercase tracking-widest">Página {productPage} de {productsData.pagination.totalPages}</span>
              <div className="flex gap-2">
                <button disabled={productPage === 1} onClick={() => setProductPage(p => p - 1)} className="p-2 rounded-xl bg-hover-bg border border-border-primary text-text-secondary hover:text-primary-400 disabled:opacity-30 transition-all"><ChevronLeft size={20} /></button>
                <button disabled={productPage === productsData.pagination.totalPages} onClick={() => setProductPage(p => p + 1)} className="p-2 rounded-xl bg-hover-bg border border-border-primary text-text-secondary hover:text-primary-400 disabled:opacity-30 transition-all"><ChevronRight size={20} /></button>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'categories' && (
        <>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative group w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary-400 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Buscar categorias..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-hover-bg border border-border-primary text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-mono text-sm"
                value={catSearch}
                onChange={(e) => handleCatSearch(e.target.value)}
              />
            </div>
            {canManageCategories && (
              <button onClick={() => { setSelectedCategory(null); setIsCatModalOpen(true); }} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold text-sm uppercase tracking-wider shadow-glow-purple transition-all w-full md:w-auto justify-center">
                <Plus size={18} /> Nova Categoria
              </button>
            )}
          </div>

          <div className="bg-surface border border-border-primary rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-4 border-r border-border-primary pr-6">
                <div className="flex items-center gap-2 text-text-secondary">
                  <SlidersHorizontal size={16} />
                  <span className="text-xs font-mono uppercase tracking-widest">Exibir:</span>
                </div>
                <div className="flex gap-2">
                  {[10, 20, 50].map((num) => (
                    <button key={num} onClick={() => { setCatLimit(num); setCatPage(1); }} className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${catLimit === num ? 'bg-primary-500 text-white shadow-glow-purple' : 'bg-hover-bg text-text-secondary hover:text-text-primary border border-border-primary'}`}>{num}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Filter size={14} className="text-primary-400" />
                  <span className="text-xs font-mono uppercase tracking-widest">Ordem:</span>
                </div>
                <select value={catOrder} onChange={(e) => { setCatOrder(e.target.value as any); setCatPage(1); }} className="bg-hover-bg border border-border-primary rounded-xl px-4 py-2 text-xs font-mono font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/50 cursor-pointer">
                  <option value="asc">A-Z (Crescente)</option>
                  <option value="desc">Z-A (Decrescente)</option>
                </select>
              </div>
              {catSearch && (
                <button onClick={() => { setCatSearch(''); setCatPage(1); }} className="text-[10px] font-mono font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest pl-2 border-l border-border-primary ml-2">Limpar</button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border-primary overflow-hidden bg-surface shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-hover-bg">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Nome da Categoria</th>
                    <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-primary">
                  {isLoadingCats ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                        <td className="px-6 py-4 flex justify-end gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></td>
                      </tr>
                    ))
                  ) : categoriesData?.categories && categoriesData.categories.length > 0 ? (
                    categoriesData.categories.map((c) => (
                      <tr key={c.id} className="hover:bg-hover-bg transition-colors border-b border-border-primary last:border-0 group">
                        <td className="px-6 py-4 text-sm text-text-primary font-medium">{c.name}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            {canManageCategories && (
                              <button onClick={() => { setSelectedCategory(c); setIsCatModalOpen(true); }} className="p-2 rounded-lg bg-hover-bg border border-border-primary text-text-secondary hover:text-primary-400 transition-all"><Edit2 size={16} /></button>
                            )}
                            {canDelete && (
                              <button onClick={() => { setSelectedCategory(c); setIsCatDeleteConfirmOpen(true); }} className="p-2 rounded-lg bg-hover-bg border border-border-primary text-text-secondary hover:text-red-400 transition-all"><Trash2 size={16} /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={2} className="px-6 py-12 text-center text-text-secondary font-mono text-sm italic">Nenhuma categoria encontrada.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {categoriesData?.pagination && categoriesData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between bg-surface p-4 rounded-2xl border border-border-primary shadow-sm">
              <span className="text-xs font-mono text-text-secondary uppercase tracking-widest">Página {catPage} de {categoriesData.pagination.totalPages}</span>
              <div className="flex gap-2">
                <button disabled={catPage === 1} onClick={() => setCatPage(p => p - 1)} className="p-2 rounded-xl bg-hover-bg border border-border-primary text-text-secondary hover:text-primary-400 disabled:opacity-30 transition-all"><ChevronLeft size={20} /></button>
                <button disabled={catPage === categoriesData.pagination.totalPages} onClick={() => setCatPage(p => p + 1)} className="p-2 rounded-xl bg-hover-bg border border-border-primary text-text-secondary hover:text-primary-400 disabled:opacity-30 transition-all"><ChevronRight size={20} /></button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal isOpen={isAssetCreateModalOpen} onClose={() => setIsAssetCreateModalOpen(false)} title="Novo Ativo (Patrimônio)">
        <form onSubmit={handleSubmitAssetCreate(onAssetCreateSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Número do Patrimônio</label>
            <input type="text" className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${assetCreateErrors.patrimonio ? 'border-red-500' : 'border-border-primary'}`} {...registerAssetCreate('patrimonio')} />
            {assetCreateErrors.patrimonio && <span className="text-[10px] text-red-500 font-mono">{assetCreateErrors.patrimonio.message}</span>}
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Modelo do Item</label>
            <select className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${assetCreateErrors.productId ? 'border-red-500' : 'border-border-primary'}`} {...registerAssetCreate('productId')}>
              <option value="">Selecione...</option>
              {productsData?.products.map((p: Product) => (
                <option key={p.id} value={p.id}>{p.name} {p.brand ? `(${p.brand})` : ''}</option>
              ))}
            </select>
            {assetCreateErrors.productId && <span className="text-[10px] text-red-500 font-mono">{assetCreateErrors.productId.message}</span>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Status Inicial</label>
              <select className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${assetCreateErrors.status ? 'border-red-500' : 'border-border-primary'}`} {...registerAssetCreate('status')}>
                {Object.entries(STATUS_LABELS).map(([val, { label }]) => ( <option key={val} value={val}>{label}</option> ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Localização</label>
              <input type="text" className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${assetCreateErrors.location ? 'border-red-500' : 'border-border-primary'}`} {...registerAssetCreate('location')} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Responsável (Opcional)</label>
            <input type="text" className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50" {...registerAssetCreate('responsible')} />
          </div>
          <button type="submit" disabled={isCreatingAsset} className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold uppercase tracking-wider transition-all shadow-glow-purple flex items-center justify-center gap-2 h-12">
            {isCreatingAsset ? <Spinner /> : 'Registrar Ativo'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={isAssetBulkModalOpen} onClose={() => !isBulkCreating && setIsAssetBulkModalOpen(false)} title="Cadastro de Ativos em Lote">
        <form onSubmit={onAssetBulkSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Modelo do Item</label>
            <select 
              required
              className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              value={bulkForm.productId}
              onChange={(e) => setBulkForm({ ...bulkForm, productId: e.target.value })}
            >
              <option value="">Selecione...</option>
              {productsData?.products.map((p: Product) => (
                <option key={p.id} value={p.id}>{p.name} {p.brand ? `(${p.brand})` : ''}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Números de Patrimônio (Um por linha ou vírgula)</label>
            <textarea 
              required
              placeholder="Ex:&#10;123129&#10;12412&#10;1234"
              className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 min-h-[120px] resize-none"
              value={bulkForm.patrimoniosText}
              onChange={(e) => setBulkForm({ ...bulkForm, patrimoniosText: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Status Inicial</label>
              <select 
                className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary font-mono text-sm focus:outline-none"
                value={bulkForm.status}
                onChange={(e) => setBulkForm({ ...bulkForm, status: e.target.value as AssetStatus })}
              >
                {Object.entries(STATUS_LABELS).map(([val, { label }]) => ( <option key={val} value={val}>{label}</option> ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Localização</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary font-mono text-sm focus:outline-none"
                value={bulkForm.location}
                onChange={(e) => setBulkForm({ ...bulkForm, location: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Responsável (Opcional)</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary font-mono text-sm focus:outline-none"
              value={bulkForm.responsible}
              onChange={(e) => setBulkForm({ ...bulkForm, responsible: e.target.value })}
            />
          </div>
          <div className="p-4 rounded-xl bg-primary-500/5 border border-primary-500/20">
            <p className="text-[10px] font-mono text-primary-400 uppercase leading-relaxed">
              Dica: Você pode copiar uma coluna do Excel e colar diretamente na caixa de patrimônios.
            </p>
          </div>
          <button type="submit" disabled={isBulkCreating} className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold uppercase tracking-wider transition-all shadow-glow-purple flex items-center justify-center gap-2 h-12">
            {isBulkCreating ? <Spinner /> : 'Cadastrar Ativos em Lote'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={isAssetEditModalOpen} onClose={() => setIsAssetEditModalOpen(false)} title={`Atualizar Ativo: ${selectedAsset?.patrimonio}`}>
        <form onSubmit={handleSubmitAssetEdit(onAssetEditSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Novo Status</label>
              <select className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${assetEditErrors.status ? 'border-red-500' : 'border-border-primary'}`} {...registerAssetEdit('status')}>
                {Object.entries(STATUS_LABELS).map(([val, { label }]) => ( <option key={val} value={val}>{label}</option> ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Nova Localização</label>
              <input type="text" className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${assetEditErrors.location ? 'border-red-500' : 'border-border-primary'}`} {...registerAssetEdit('location')} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Responsável (Opcional)</label>
            <input type="text" className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50" {...registerAssetEdit('responsible')} />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Observações</label>
            <textarea className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 min-h-[100px] resize-none" {...registerAssetEdit('observation')} />
          </div>
          <button type="submit" disabled={isUpdatingAsset} className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold uppercase tracking-wider transition-all shadow-glow-purple flex items-center justify-center gap-2 h-12">
            {isUpdatingAsset ? <Spinner /> : 'Salvar Alterações'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={isAssetHistoryModalOpen} onClose={() => { setIsAssetHistoryModalOpen(false); setAssetForHistory(null); }} title={`Histórico: Ativo ${assetForHistory?.patrimonio}`}>
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
          {isLoadingHistory ? (
            <div className="flex justify-center py-10"><Spinner size={32} /></div>
          ) : assetHistory && assetHistory.length > 0 ? (
            assetHistory.map((entry, i) => (
              <div key={entry.id} className={`relative pl-8 ${i !== assetHistory.length - 1 ? 'pb-8 border-l border-border-primary' : ''}`}>
                <div className={`absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full ${STATUS_LABELS[entry.newStatus]?.color.split(' ')[0] || 'bg-primary-500'}`} />
                <div className="flex flex-col gap-3 p-4 rounded-2xl bg-hover-bg border border-border-primary text-xs">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full font-bold border ${STATUS_LABELS[entry.newStatus]?.color}`}>{STATUS_LABELS[entry.newStatus]?.label}</span>
                    <span className="text-text-secondary uppercase font-mono">{new Date(entry.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-primary font-mono"><MapPin size={14} className="text-primary-400" /> {entry.newLocation}</div>
                  {entry.observation && <div className="p-3 rounded-xl bg-surface/50 border border-border-primary italic text-text-secondary">"{entry.observation}"</div>}
                  <div className="flex items-center gap-1.5 font-mono text-text-secondary/60 uppercase"><User size={12} /> Modificado por: {entry.user?.matricula || 'Sistema'}</div>
                </div>
              </div>
            ))
          ) : ( <div className="text-center py-8 text-text-secondary font-mono italic">Nenhum histórico encontrado.</div> )}
        </div>
      </Modal>

      <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title="Novo Modelo de Item">
        <form onSubmit={handleSubmitProduct(onProductSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Nome do Item</label>
            <input type="text" className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${productErrors.name ? 'border-red-500' : 'border-border-primary'}`} {...registerProduct('name')} />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Marca (Opcional)</label>
            <input type="text" className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50" {...registerProduct('brand')} />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Categoria</label>
            <select className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${productErrors.categoryId ? 'border-red-500' : 'border-border-primary'}`} {...registerProduct('categoryId')}>
              <option value="">Selecione...</option>
              {categoriesData?.categories?.map((cat) => ( <option key={cat.id} value={cat.id}>{cat.name}</option> ))}
            </select>
          </div>
          <button type="submit" disabled={isCreatingProduct} className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold uppercase tracking-wider transition-all h-12 shadow-glow-purple">
            {isCreatingProduct ? <Spinner /> : 'Cadastrar Modelo'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} title={selectedCategory ? 'Editar Categoria' : 'Nova Categoria'}>
        <form onSubmit={handleSubmitCat(onCatSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest mb-2">Nome</label>
            <input type="text" className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${catErrors.name ? 'border-red-500' : 'border-border-primary'}`} {...registerCat('name')} />
          </div>
          <button type="submit" className="w-full py-3 h-12 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold uppercase tracking-wider transition-all shadow-glow-purple">Salvar Categoria</button>
        </form>
      </Modal>

      {selectedAssetIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-primary-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 border border-primary-400 font-mono">
            <div className="flex items-center gap-2 border-r border-primary-400 pr-6"><div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold">{selectedAssetIds.length}</div><span className="text-sm font-bold uppercase tracking-wider">Selecionados</span></div>
            <div className="flex items-center gap-3">
              <button onClick={() => setIsBulkUpdateModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-primary-600 hover:bg-zinc-100 transition-all font-bold text-xs uppercase tracking-widest"><Settings2 size={16} /> Alterar Status/Local</button>
              <button onClick={() => setIsBulkDeleteConfirmOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white transition-all font-bold text-xs uppercase tracking-widest"><Trash2 size={16} /> Excluir</button>
              <button onClick={() => setSelectedAssetIds([])} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><X size={20} /></button>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={isBulkUpdateModalOpen} onClose={() => !isProcessingBulk && setIsBulkUpdateModalOpen(false)} title={`Atualizar ${selectedAssetIds.length} Ativos`}>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Status</label>
              <select className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary text-sm font-mono focus:outline-none" value={bulkData.status} onChange={(e) => setBulkData({ ...bulkData, status: e.target.value as AssetStatus })}>
                <option value="">Manter atual...</option>
                {Object.entries(STATUS_LABELS).map(([val, { label }]) => ( <option key={val} value={val}>{label}</option> ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Local</label>
              <input type="text" className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary text-sm font-mono focus:outline-none" placeholder="Manter atual..." value={bulkData.location} onChange={(e) => setBulkData({ ...bulkData, location: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Observação</label>
            <textarea className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary text-sm font-mono focus:outline-none min-h-[100px] resize-none" value={bulkData.notes} onChange={(e) => setBulkData({ ...bulkData, notes: e.target.value })} />
          </div>
          <button onClick={handleBulkUpdate} disabled={isProcessingBulk} className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold uppercase transition-all shadow-glow-purple flex items-center justify-center gap-2 h-12">
            {isProcessingBulk ? <Spinner /> : 'Atualizar Itens'}
          </button>
        </div>
      </Modal>
      <ConfirmDialog isOpen={isAssetDeleteConfirmOpen} onClose={() => setIsAssetDeleteConfirmOpen(false)} onConfirm={() => selectedAsset && deleteAsset(selectedAsset.id)} title="Excluir Ativo" description={`Tem certeza que deseja remover o patrimônio ${selectedAsset?.patrimonio}?`} />
      <ConfirmDialog isOpen={isProductDeleteConfirmOpen} onClose={() => setIsProductDeleteConfirmOpen(false)} onConfirm={() => selectedProduct && deleteProduct(selectedProduct.id)} title="Excluir Modelo" description="Isso removerá o modelo do catálogo. Ativos vinculados podem ser afetados." />
      <ConfirmDialog isOpen={isCatDeleteConfirmOpen} onClose={() => setIsCatDeleteConfirmOpen(false)} onConfirm={() => selectedCategory && deleteCategory(selectedCategory.id)} title="Excluir Categoria" description={`Remover "${selectedCategory?.name}"?`} />
      <ConfirmDialog isOpen={isBulkDeleteConfirmOpen} onClose={() => !isProcessingBulk && setIsBulkDeleteConfirmOpen(false)} onConfirm={handleBulkDelete} title={`Excluir ${selectedAssetIds.length} Ativos`} description="Remover permanentemente os ativos selecionados?" />
    </div>
  );
};
