import { useState } from 'react';
import { useCategories } from '../hooks/useCategories';
import { useAuth } from '../hooks/useAuth';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Skeleton } from '../components/ui/Skeleton';

export const Categories = () => {
  const { categories, isLoading, createCategory, updateCategory, deleteCategory } = useCategories();
  const { isAdmin } = useAuth();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string } | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (category?: { id: string; name: string }) => {
    if (category) {
      setSelectedCategory(category);
      setCategoryName(category.name);
    } else {
      setSelectedCategory(null);
      setCategoryName('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategory) {
      updateCategory({ id: selectedCategory.id, name: categoryName });
    } else {
      createCategory(categoryName);
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (selectedCategory) {
      deleteCategory(selectedCategory.id);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-text-primary leading-tight">
            Gerenciar Categorias
          </h2>
          <p className="text-text-secondary mt-1 font-mono text-xs uppercase tracking-widest">
            Organização por categorias
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative group w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary-400 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Buscar categorias..."
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
              <Plus size={18} /> Nova Categoria
            </button>
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
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-6 py-4 flex justify-end gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></td>
                  </tr>
                ))
              ) : filteredCategories.length > 0 ? (
                filteredCategories.map((c) => (
                  <tr key={c.id} className="hover:bg-hover-bg transition-colors border-b border-border-primary last:border-0 group">
                    <td className="px-6 py-4 text-sm text-text-primary font-medium">{c.name}</td>
                    <td className="px-6 py-4">
                      {isAdmin && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(c)}
                            className="p-2 rounded-lg bg-hover-bg border border-border-primary text-text-secondary hover:text-primary-400 hover:border-primary-500/30 transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCategory(c);
                              setIsConfirmOpen(true);
                            }}
                            className="p-2 rounded-lg bg-hover-bg border border-border-primary text-text-secondary hover:text-red-400 hover:border-red-500/30 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="px-6 py-12 text-center text-text-secondary font-mono text-sm italic">
                    Nenhuma categoria encontrada.
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
        title={selectedCategory ? 'Editar Categoria' : 'Nova Categoria'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest mb-2">Nome</label>
            <input
              type="text"
              required
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary placeholder:text-text-secondary/50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
              placeholder="Ex: Eletrônicos"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />
          </div>
          <div className="pt-2">
            <button type="submit" className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold uppercase tracking-wider transition-all shadow-glow-purple">
              Salvar Categoria
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Categoria"
        description={`Tem certeza que deseja excluir a categoria "${selectedCategory?.name}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
};
