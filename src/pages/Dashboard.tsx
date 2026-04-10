import { Package, Tag, ClipboardList, MapPin, History } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { useAssets } from '../hooks/useAssets';
import { Skeleton } from '../components/ui/Skeleton';
import type { AssetStatus } from '../types';

const STATUS_LABELS: Record<AssetStatus, { label: string; color: string }> = {
  DISPONIVEL: { label: 'Disponível', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  EM_USO: { label: 'Em Uso', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  EM_MANUTENCAO: { label: 'Manutenção', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  DEFEITO: { label: 'Defeito', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  DESCARTADO: { label: 'Descartado', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
};

export const Dashboard = () => {
  const { productsData, isLoading: loadingProducts } = useProducts(1, 1);
  const { categoriesData, isLoading: loadingCategories } = useCategories(1, 1);
  const { assetsData, isLoading: loadingAssets } = useAssets(1, 10, '', 'updatedAt', 'desc');

  const stats = [
    {
      label: 'Modelos de Itens',
      value: productsData?.pagination.total || 0,
      icon: Package,
      loading: loadingProducts,
    },
    {
      label: 'Total de Ativos',
      value: assetsData?.pagination.total || 0,
      icon: ClipboardList,
      loading: loadingAssets,
    },
    {
      label: 'Categorias',
      value: categoriesData?.pagination.total || 0,
      icon: Tag,
      loading: loadingCategories,
    },
  ];

  const recentAssets = assetsData?.assets || [];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold text-text-primary leading-tight">
          Dashboard
        </h2>
        <p className="text-text-secondary mt-1 font-mono text-xs uppercase tracking-widest">
          Gestão de Ativos e Patrimônio
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
        <div className="flex items-center gap-2 px-1">
          <History size={18} className="text-primary-400" />
          <h3 className="text-lg font-bold text-text-primary font-mono uppercase tracking-widest">
            Ativos Atualizados Recentemente
          </h3>
        </div>
        
        <div className="rounded-2xl border border-border-primary overflow-hidden bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-hover-bg">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary text-center">Patrimônio</th>
                  <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Item</th>
                  <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Status</th>
                  <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Localização</th>
                  <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary text-right">Última Modif.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {loadingAssets ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-16 mx-auto" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-40" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-6 py-4 flex justify-end"><Skeleton className="h-4 w-24" /></td>
                    </tr>
                  ))
                ) : recentAssets.length > 0 ? (
                  recentAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-hover-bg transition-colors border-b border-border-primary last:border-0">
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
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-mono font-bold border ${STATUS_LABELS[asset.status].color}`}>
                          {STATUS_LABELS[asset.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex items-center gap-2 text-xs font-mono text-text-secondary">
                        <MapPin size={12} className="text-primary-500/50" />
                        {asset.location}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-text-secondary text-right">
                        {new Date(asset.updatedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-text-secondary font-mono text-sm italic">
                      Nenhum ativo registrado.
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
