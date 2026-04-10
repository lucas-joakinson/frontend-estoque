import { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { useStock } from '../hooks/useStock';
import { useAuth } from '../hooks/useAuth';
import { Plus, Edit2, Trash2, Search, ArrowUp, ArrowDown } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Skeleton } from '../components/ui/Skeleton';
import type { Product } from '../types';

export const Products = () => {
  const { products, isLoading, createProduct, updateProduct, deleteProduct } = useProducts();
  const { categories } = useCategories();
  const { stockIn, stockOut } = useStock();
  const { isAdmin } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<'IN' | 'OUT'>('IN');

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: '', sku: '', categoryId: '' });
  const [movementData, setMovementData] = useState({ quantity: 1, reason: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setSelectedProduct(product);
      setFormData({ name: product.name, sku: product.sku, categoryId: product.categoryId });
    } else {
      setSelectedProduct(null);
      setFormData({ name: '', sku: '', categoryId: categories[0]?.id || '' });
    }
    setIsModalOpen(true);
  };

  const handleOpenMovement = (product: Product, type: 'IN' | 'OUT') => {
    setSelectedProduct(product);
    setMovementType(type);
    setMovementData({ quantity: 1, reason: '' });
    setIsMovementModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProduct) {
      updateProduct({ id: selectedProduct.id, ...formData });
    } else {
      createProduct(formData);
    }
    setIsModalOpen(false);
  };

  const handleMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (movementType === 'IN') {
      stockIn({ productId: selectedProduct.id, ...movementData });
    } else {
      stockOut({ productId: selectedProduct.id, ...movementData });
    }
    setIsMovementModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-text-primary leading-tight">
            Gerenciar Produtos
          </h2>
          <p className="text-text-secondary mt-1 font-mono text-xs uppercase tracking-widest">
            Catálogo global de produtos
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative group w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary-400 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome ou SKU..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-hover-bg border border-border-primary text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all font-mono text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {isAdmin && (
            <button 
              onClick={() => handleOpenModal()} 
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold text-sm uppercase tracking-wider shadow-glow-purple hover:shadow-glow-purple transition-all w-full md:w-auto justify-center"
            >
              <Plus size={18} /> Novo Produto
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border-primary overflow-hidden bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-hover-bg">
              <tr>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Produto</th>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">SKU</th>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Categoria</th>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Qtd</th>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-8" /></td>
                    <td className="px-6 py-4 flex justify-end gap-2"><Skeleton className="h-8 w-24" /></td>
                  </tr>
                ))
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-hover-bg transition-colors border-b border-border-primary last:border-0 group">
                    <td className="px-6 py-4 text-sm text-text-primary font-medium">{p.name}</td>
                    <td className="px-6 py-4 text-xs font-mono text-text-secondary">{p.sku}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-primary-500/10 text-primary-400 border border-primary-500/20">
                        {p.category?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {p.quantity > 10 ? (
                        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-primary-500/10 text-primary-400 border border-primary-500/20">
                          {p.quantity}
                        </span>
                      ) : p.quantity > 0 ? (
                        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {p.quantity}
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                          {p.quantity}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          title="Entrada"
                          onClick={() => handleOpenMovement(p, 'IN')}
                          className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-primary-500/10 text-primary-400 border border-primary-500/20 hover:bg-primary-500/20 transition-all"
                        >
                          <ArrowUp size={14} className="inline mr-1" /> IN
                        </button>
                        <button
                          title="Saída"
                          onClick={() => handleOpenMovement(p, 'OUT')}
                          className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                        >
                          <ArrowDown size={14} className="inline mr-1" /> OUT
                        </button>
                        
                        {/* Ações restritas para ADMIN */}
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleOpenModal(p)}
                              className="p-2 rounded-lg bg-hover-bg border border-border-primary text-text-secondary hover:text-primary-400 hover:border-primary-500/30 transition-all"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedProduct(p);
                                setIsConfirmOpen(true);
                              }}
                              className="p-2 rounded-lg bg-hover-bg border border-border-primary text-text-secondary hover:text-red-400 hover:border-red-500/30 transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-secondary font-mono text-sm italic">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedProduct ? 'Editar Produto' : 'Novo Produto'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest mb-2">Nome</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary placeholder:text-text-secondary/50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest mb-2">SKU</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary placeholder:text-text-secondary/50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest mb-2">Categoria</label>
            <select
              required
              className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all cursor-pointer"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="pt-4">
            <button type="submit" className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold uppercase tracking-wider transition-all shadow-glow-purple">
              Salvar Produto
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        title={`${movementType === 'IN' ? 'Entrada' : 'Saída'} - ${selectedProduct?.name}`}
      >
        <form onSubmit={handleMovementSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest mb-2">Quantidade</label>
            <input
              type="number"
              min="1"
              required
              className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary placeholder:text-text-secondary/50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
              value={movementData.quantity}
              onChange={(e) => setMovementData({ ...movementData, quantity: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest mb-2">Motivo (Opcional)</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary placeholder:text-text-secondary/50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
              placeholder="Ex: Reposição de estoque"
              value={movementData.reason}
              onChange={(e) => setMovementData({ ...movementData, reason: e.target.value })}
            />
          </div>
          <div className="pt-4">
            <button
              type="submit"
              className={`w-full py-3 rounded-xl font-mono font-bold uppercase tracking-wider transition-all shadow-glow-purple text-white ${
                movementType === 'IN' ? 'bg-primary-500 hover:bg-primary-400' : 'bg-red-500 hover:bg-red-400'
              }`}
            >
              Confirmar {movementType === 'IN' ? 'Entrada' : 'Saída'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => selectedProduct && deleteProduct(selectedProduct.id)}
        title="Excluir Produto"
        description={`Tem certeza que deseja excluir "${selectedProduct?.name}"? Esta ação removerá o produto e todo seu histórico.`}
      />
    </div>
  );
};
