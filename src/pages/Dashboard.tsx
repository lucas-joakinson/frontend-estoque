import { Package, Tag, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { useStock } from '../hooks/useStock';
import { Skeleton } from '../components/ui/Skeleton';

export const Dashboard = () => {
  const { products, isLoading: loadingProducts } = useProducts();
  const { categories, isLoading: loadingCategories } = useCategories();
  const { movements, isLoading: loadingMovements } = useStock();

  const stats = [
    {
      label: 'Total de Produtos',
      value: products.length,
      icon: Package,
      loading: loadingProducts,
    },
    {
      label: 'Categorias',
      value: categories.length,
      icon: Tag,
      loading: loadingCategories,
    },
    {
      label: 'Movimentações',
      value: movements.length,
      icon: ArrowUpRight,
      loading: loadingMovements,
    },
  ];

  const recentMovements = movements.slice(0, 10);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold text-text-primary leading-tight">
          Dashboard
        </h2>
        <p className="text-text-secondary mt-1 font-mono text-xs uppercase tracking-widest">
          Visão geral do sistema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl bg-surface border border-border-primary hover:border-primary-500/20 hover:shadow-glow-purple transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-400 group-hover:scale-110 transition-transform">
              <stat.icon size={24} />
            </div>
            {stat.loading ? (
              <Skeleton className="h-10 w-24 mt-4" />
            ) : (
              <h3 className="text-3xl font-bold font-mono text-text-primary mt-4 tracking-tight">
                {stat.value}
              </h3>
            )}
            <p className="text-xs font-mono text-text-secondary uppercase tracking-widest mt-1">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-text-primary font-mono uppercase tracking-widest px-1">
          Últimas Movimentações
        </h3>
        
        <div className="rounded-2xl border border-border-primary overflow-hidden bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-hover-bg">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Data</th>
                  <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Produto</th>
                  <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Tipo</th>
                  <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary text-right">Qtd</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {loadingMovements ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-40" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                      <td className="px-6 py-4 flex justify-end"><Skeleton className="h-4 w-8" /></td>
                    </tr>
                  ))
                ) : recentMovements.length > 0 ? (
                  recentMovements.map((m) => (
                    <tr key={m.id} className="hover:bg-hover-bg transition-colors border-b border-border-primary last:border-0">
                      <td className="px-6 py-4 text-xs font-mono text-text-secondary">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-primary font-medium">{m.product.name}</td>
                      <td className="px-6 py-4">
                        {m.type === 'IN' ? (
                          <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-primary-500/10 text-primary-400 border border-primary-500/20 flex items-center w-fit gap-1">
                            <ArrowUpRight size={12} /> ENTRADA
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center w-fit gap-1">
                            <ArrowDownRight size={12} /> SAÍDA
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-text-primary font-mono text-right">{m.quantity}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-text-secondary font-mono text-sm italic">
                      Nenhuma movimentação registrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
