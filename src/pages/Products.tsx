import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { useDebounce } from '../hooks/useDebounce';
import { Search, Trash2, PackagePlus, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import type { Product } from '../types';
import { createProductSchema, type CreateProductInput } from '../schemas/product.schema';

export const Products = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const { productsData, isLoading, deleteProduct, createProduct, isCreating } = useProducts(page, 10, debouncedSearch, 'createdAt', 'desc');
  const { categoriesData } = useCategories(1, 100);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const onSubmit = (data: CreateProductInput) => {
    createProduct(data, {
      onSuccess: () => {
        setIsModalOpen(false);
        reset();
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-text-primary leading-tight">
            Itens (Modelos)
          </h2>
          <p className="text-text-secondary mt-1 font-mono text-xs uppercase tracking-widest">
            Catálogo de modelos de hardware e equipamentos
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative group w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary-400 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Buscar item..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-hover-bg border border-border-primary text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all font-mono text-sm"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => {
              reset();
              setIsModalOpen(true);
            }} 
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold text-sm uppercase tracking-wider shadow-glow-purple hover:shadow-glow-purple transition-all w-full md:w-auto justify-center"
          >
            <PackagePlus size={18} /> Novo Modelo
          </button>
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
              {isLoading ? (
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
                      <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-400">
                        <Package size={16} />
                      </div>
                      {product.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary font-mono">{product.brand || '---'}</td>
                    <td className="px-6 py-4 text-xs font-mono">
                      <span className="px-3 py-1 rounded-full bg-hover-bg border border-border-primary text-text-secondary">
                        {product.category.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setIsConfirmOpen(true);
                          }}
                          className="p-2 rounded-lg bg-hover-bg border border-border-primary text-text-secondary hover:text-red-400 hover:border-red-500/30 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-text-secondary font-mono text-sm italic">
                    Nenhum modelo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {productsData && productsData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-surface p-4 rounded-2xl border border-border-primary shadow-sm">
          <span className="text-xs font-mono text-text-secondary uppercase tracking-widest">
            Página {page} de {productsData.pagination.totalPages}
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
              disabled={page === productsData.pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-2 rounded-xl bg-hover-bg border border-border-primary text-text-secondary hover:text-primary-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Modelo de Item">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Nome do Item</label>
            <input
              type="text"
              className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${errors.name ? 'border-red-500' : 'border-border-primary'}`}
              {...register('name')}
            />
            {errors.name && <span className="text-[10px] text-red-500 font-mono">{errors.name.message}</span>}
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Marca (Opcional)</label>
            <input
              type="text"
              className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${errors.brand ? 'border-red-500' : 'border-border-primary'}`}
              {...register('brand')}
            />
            {errors.brand && <span className="text-[10px] text-red-500 font-mono">{errors.brand.message}</span>}
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest">Categoria</label>
            <select
              className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${errors.categoryId ? 'border-red-500' : 'border-border-primary'}`}
              {...register('categoryId')}
            >
              <option value="">Selecione...</option>
              {categoriesData?.categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {errors.categoryId && <span className="text-[10px] text-red-500 font-mono">{errors.categoryId.message}</span>}
          </div>
          <button 
            type="submit" 
            disabled={isCreating}
            className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold uppercase tracking-wider transition-all shadow-glow-purple flex items-center justify-center gap-2 h-12"
          >
            {isCreating ? <Spinner /> : 'Cadastrar Modelo'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => selectedProduct && deleteProduct(selectedProduct.id)}
        title="Excluir Modelo"
        description="Isso removerá o modelo do catálogo. Ativos vinculados a este modelo podem ser afetados."
      />
    </div>
  );
};
