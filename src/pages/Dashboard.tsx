import { useState, useMemo } from 'react';
import { 
  Package, Tag, MapPin, History, BarChart3, 
  PieChart as PieChartIcon, LayoutDashboard, Headphones, Monitor, 
  Boxes, CheckCircle2, AlertTriangle, Hammer, XCircle
} from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { useAssets, useAssetStats } from '../hooks/useAssets';
import { useHeadsetStats } from '../hooks/useHeadsets';
import { useComputerStats } from '../hooks/useComputers';
import { Skeleton } from '../components/ui/Skeleton';
import type { AssetStatus, HeadsetStatus, ComputerStatus } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

type DashboardTab = 'geral' | 'estoque' | 'headsets' | 'computadores';

const ASSET_STATUS_LABELS: Record<AssetStatus, { label: string; color: string; hex: string }> = {
  DISPONIVEL: { label: 'Disponível', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', hex: '#10b981' },
  EM_USO: { label: 'Em Uso', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', hex: '#3b82f6' },
  EM_MANUTENCAO: { label: 'Manutenção', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', hex: '#f59e0b' },
  DEFEITO: { label: 'Defeito', color: 'bg-red-500/10 text-red-400 border-red-500/20', hex: '#ef4444' },
  DESCARTADO: { label: 'Descartado', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', hex: '#71717a' },
};

const HEADSET_STATUS_LABELS: Record<HeadsetStatus, { label: string; color: string; hex: string }> = {
  'EM_USO': { label: 'Em Uso', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', hex: '#10b981' },
  'RESERVA': { label: 'Reserva', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', hex: '#3b82f6' },
  'TROCA_PENDENTE': { label: 'Troca Pendente', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', hex: '#f59e0b' },
  'EM_MANUTENCAO': { label: 'Em Manutenção', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', hex: '#f97316' },
  'DEFEITO': { label: 'Defeito', color: 'bg-red-500/10 text-red-400 border-red-500/20', hex: '#ef4444' },
  'DISPONIVEL': { label: 'Disponível', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', hex: '#71717a' },
};

const COMPUTER_STATUS_LABELS: Record<ComputerStatus, { label: string; color: string; hex: string }> = {
  'Em uso': { label: 'Em Uso', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', hex: '#10b981' },
  'Em estoque': { label: 'Em Estoque', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', hex: '#3b82f6' },
  'Manutenção': { label: 'Manutenção', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', hex: '#f59e0b' },
  'Defeito': { label: 'Defeito', color: 'bg-red-500/10 text-red-400 border-red-500/20', hex: '#ef4444' },
  'Troca pendente': { label: 'Troca Pendente', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', hex: '#71717a' },
};

const StatCard = ({ label, value, icon: Icon, loading, colorClass = "text-primary-400", bgClass = "bg-primary-500/10" }: { label: string; value: number; icon: any; loading: boolean; colorClass?: string; bgClass?: string }) => (
  <div className="p-6 rounded-3xl bg-surface border border-border-primary hover:border-primary-500/20 hover:shadow-glow-purple/10 transition-all duration-300 group">
    <div className={`w-12 h-12 rounded-2xl ${bgClass} flex items-center justify-center ${colorClass} group-hover:scale-110 transition-transform`}>
      <Icon size={24} />
    </div>
    {loading ? (
      <Skeleton className="h-10 w-24 mt-4" />
    ) : (
      <h3 className="text-3xl font-bold font-mono text-text-primary mt-4 tracking-tight">
        {value}
      </h3>
    )}
    <p className="text-xs font-mono text-text-secondary uppercase tracking-widest mt-1">
      {label}
    </p>
  </div>
);

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('geral');

  const { productsData, isLoading: loadingProducts } = useProducts(1, 10);
  const { categoriesData, isLoading: loadingCategories } = useCategories(1, 10);
  const { assetsData, isLoading: loadingAssets } = useAssets(1, 10, '', undefined, undefined, 'updatedAt', 'desc');
  const { data: assetStatsData, isLoading: loadingAssetStats } = useAssetStats();
  const { data: headsetStatsData, isLoading: loadingHeadsets } = useHeadsetStats();
  const { data: computerStatsData, isLoading: loadingComputers } = useComputerStats();

  const assets = assetsData?.assets || [];
  
  const totalAssets = useMemo(() => {
    if (assetStatsData) return Object.values(assetStatsData).reduce((a, b) => a + b, 0);
    return assetsData?.pagination?.total || 0;
  }, [assetStatsData, assetsData]);

  const totalHeadsets = useMemo(() => 
    headsetStatsData ? Object.values(headsetStatsData).reduce((a, b) => a + b, 0) : 0
  , [headsetStatsData]);

  const totalComputers = useMemo(() => 
    computerStatsData ? Object.values(computerStatsData).reduce((a, b) => a + b, 0) : 0
  , [computerStatsData]);

  const generalStats = useMemo(() => [
    { label: 'Total de Ativos', value: totalAssets, icon: Boxes, loading: loadingAssetStats || loadingAssets },
    { label: 'Total de Headsets', value: totalHeadsets, icon: Headphones, loading: loadingHeadsets },
    { label: 'Total de Computadores', value: totalComputers, icon: Monitor, loading: loadingComputers },
  ], [totalAssets, totalHeadsets, totalComputers, loadingAssetStats, loadingAssets, loadingHeadsets, loadingComputers]);

  const assetStatusData = useMemo(() => {
    if (assetStatsData) {
      return Object.entries(ASSET_STATUS_LABELS).map(([key, { label, hex }]) => ({
        name: label,
        value: assetStatsData[key as AssetStatus] || 0,
        color: hex
      })).filter(d => d.value > 0);
    }
    return Object.entries(ASSET_STATUS_LABELS).map(([key, { label, hex }]) => ({
      name: label,
      value: assets.filter(a => a.status === key).length,
      color: hex
    })).filter(d => d.value > 0);
  }, [assetStatsData, assets]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    assets.forEach(asset => {
      const catName = asset.product?.category?.name || 'Sem Categoria';
      counts[catName] = (counts[catName] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [assets]);

  const headsetStatusChartData = useMemo(() => 
    headsetStatsData ? Object.entries(HEADSET_STATUS_LABELS).map(([key, { label, hex }]) => ({
      name: label,
      value: headsetStatsData[key as HeadsetStatus] || 0,
      color: hex
    })).filter(d => d.value > 0) : []
  , [headsetStatsData]);

  const headsetStats = useMemo(() => [
    { label: 'Em Uso', value: headsetStatsData?.['EM_USO'] || 0, icon: CheckCircle2, colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10' },
    { label: 'Em Manutenção', value: headsetStatsData?.['EM_MANUTENCAO'] || 0, icon: Hammer, colorClass: 'text-orange-400', bgClass: 'bg-orange-500/10' },
    { label: 'Com Defeito', value: headsetStatsData?.['DEFEITO'] || 0, icon: AlertTriangle, colorClass: 'text-red-400', bgClass: 'bg-red-500/10' },
    { label: 'Disponível', value: (headsetStatsData?.['DISPONIVEL'] || 0) + (headsetStatsData?.['RESERVA'] || 0), icon: Tag, colorClass: 'text-zinc-400', bgClass: 'bg-zinc-500/10' },
  ], [headsetStatsData]);

  const computerStatusChartData = useMemo(() => 
    computerStatsData ? Object.entries(COMPUTER_STATUS_LABELS).map(([key, { label, hex }]) => ({
      name: label,
      value: computerStatsData[key as ComputerStatus] || 0,
      color: hex
    })).filter(d => d.value > 0) : []
  , [computerStatsData]);

  const computerStats = useMemo(() => [
    { label: 'Em Uso', value: computerStatsData?.['Em uso'] || 0, icon: CheckCircle2, colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10' },
    { label: 'Em Estoque', value: computerStatsData?.['Em estoque'] || 0, icon: Tag, colorClass: 'text-blue-400', bgClass: 'bg-blue-500/10' },
    { label: 'Manutenção', value: computerStatsData?.['Manutenção'] || 0, icon: Hammer, colorClass: 'text-amber-400', bgClass: 'bg-amber-500/10' },
    { label: 'Com Defeito', value: computerStatsData?.['Defeito'] || 0, icon: XCircle, colorClass: 'text-red-400', bgClass: 'bg-red-500/10' },
  ], [computerStatsData]);

  const recentAssets = useMemo(() => assets.slice(0, 5), [assets]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-text-primary leading-tight">Dashboard</h2>
          <p className="text-text-secondary mt-1 font-mono text-xs uppercase tracking-widest">
            {activeTab === 'geral' && 'Visão geral do ecossistema de hardware'}
            {activeTab === 'estoque' && 'Análise detalhada do estoque geral de ativos'}
            {activeTab === 'headsets' && 'Status e disponibilidade da frota de headsets'}
            {activeTab === 'computadores' && 'Métricas e saúde do parque de computadores'}
          </p>
        </div>

        <div className="flex p-1 bg-surface border border-border-primary rounded-2xl overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('geral')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap ${activeTab === 'geral' ? 'bg-primary-500 text-white shadow-glow-purple' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <LayoutDashboard size={14} /> GERAL
          </button>
          <button
            onClick={() => setActiveTab('estoque')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap ${activeTab === 'estoque' ? 'bg-primary-500 text-white shadow-glow-purple' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <Boxes size={14} /> ESTOQUE
          </button>
          <button
            onClick={() => setActiveTab('headsets')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap ${activeTab === 'headsets' ? 'bg-primary-500 text-white shadow-glow-purple' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <Headphones size={14} /> HEADSETS
          </button>
          <button
            onClick={() => setActiveTab('computadores')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap ${activeTab === 'computadores' ? 'bg-primary-500 text-white shadow-glow-purple' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <Monitor size={14} /> COMPUTADORES
          </button>
        </div>
      </div>

      {activeTab === 'geral' && (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {generalStats.map((stat, i) => (
              <StatCard key={i} {...stat} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-surface border border-border-primary rounded-3xl p-8 space-y-6 shadow-sm">
              <div className="flex items-center gap-2">
                <PieChartIcon size={18} className="text-primary-400" />
                <h3 className="text-sm font-bold text-text-primary font-mono uppercase tracking-widest">Ativos por Status</h3>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="99%" height={300}>
                  <PieChart>
                    <Pie data={assetStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {assetStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }} itemStyle={{ color: '#f4f4f5', fontSize: '12px', fontFamily: 'monospace' }} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-surface border border-border-primary rounded-3xl p-8 space-y-6 shadow-sm overflow-hidden">
               <div className="flex items-center gap-2">
                <History size={18} className="text-primary-400" />
                <h3 className="text-sm font-bold text-text-primary font-mono uppercase tracking-widest">Atualizações Recentes</h3>
              </div>
              <div className="space-y-4">
                {recentAssets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between p-3 rounded-2xl bg-hover-bg/50 border border-border-primary/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface border border-border-primary flex items-center justify-center font-mono font-bold text-primary-400 text-xs">{asset.patrimonio}</div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-text-primary">{asset.product?.name || 'Sem nome'}</span>
                        <span className="text-[10px] font-mono text-text-secondary uppercase">{asset.responsible || 'Sem responsável'}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${ASSET_STATUS_LABELS[asset.status]?.color || 'border-zinc-500/20 text-zinc-400 bg-zinc-500/10'}`}>
                      {ASSET_STATUS_LABELS[asset.status]?.label || asset.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'estoque' && (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Modelos Únicos" value={productsData?.pagination?.total || 0} icon={Package} loading={loadingProducts} />
            <StatCard label="Categorias" value={categoriesData?.pagination?.total || 0} icon={Tag} loading={loadingCategories} />
            <StatCard label="Em Uso" value={assetStatsData?.['EM_USO'] || 0} icon={CheckCircle2} loading={loadingAssetStats} colorClass="text-blue-400" bgClass="bg-blue-500/10" />
            <StatCard label="Disponíveis" value={assetStatsData?.['DISPONIVEL'] || 0} icon={Tag} loading={loadingAssetStats} colorClass="text-emerald-400" bgClass="bg-emerald-500/10" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-surface border border-border-primary rounded-3xl p-8 space-y-6 shadow-sm">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-primary-400" />
                <h3 className="text-sm font-bold text-text-primary font-mono uppercase tracking-widest">Top 5 Categorias</h3>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="99%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} fontFamily="monospace" />
                    <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} fontFamily="monospace" />
                    <Tooltip cursor={{ fill: '#ffffff', opacity: 0.05 }} contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-surface border border-border-primary rounded-3xl p-8 space-y-6 shadow-sm">
               <div className="flex items-center gap-2">
                <PieChartIcon size={18} className="text-primary-400" />
                <h3 className="text-sm font-bold text-text-primary font-mono uppercase tracking-widest">Status dos Ativos</h3>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="99%" height={300}>
                  <PieChart>
                    <Pie data={assetStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {assetStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'headsets' && (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {headsetStats.map((stat, i) => (
              <StatCard key={i} {...stat} loading={loadingHeadsets} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-surface border border-border-primary rounded-3xl p-8 space-y-6 shadow-sm">
               <div className="flex items-center gap-2">
                <PieChartIcon size={18} className="text-primary-400" />
                <h3 className="text-sm font-bold text-text-primary font-mono uppercase tracking-widest">Distribuição por Status</h3>
              </div>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="99%" height={350}>
                  <PieChart>
                    <Pie data={headsetStatusChartData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                      {headsetStatusChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }} />
                    <Legend verticalAlign="bottom" height={40} wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-surface border border-border-primary rounded-3xl p-8 space-y-6 shadow-sm flex flex-col justify-center">
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-hover-bg/50 border border-border-primary text-center">
                  <h4 className="text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-2">Saúde da Frota</h4>
                  <div className="text-4xl font-bold font-mono text-emerald-400">
                    {Math.round((((headsetStatsData?.['EM_USO'] || 0) + (headsetStatsData?.['RESERVA'] || 0) + (headsetStatsData?.['DISPONIVEL'] || 0)) / (totalHeadsets || 1)) * 100)}%
                  </div>
                  <p className="text-[10px] font-mono text-text-secondary mt-2 uppercase">Equipamentos Operacionais</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 text-center">
                    <span className="block text-xl font-bold font-mono text-orange-400">{headsetStatsData?.['EM_MANUTENCAO'] || 0}</span>
                    <span className="text-[9px] font-mono text-text-secondary uppercase">Em Reparo</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-center">
                    <span className="block text-xl font-bold font-mono text-red-400">{headsetStatsData?.['DEFEITO'] || 0}</span>
                    <span className="text-[9px] font-mono text-text-secondary uppercase">Perda Total</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'computadores' && (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {computerStats.map((stat, i) => (
              <StatCard key={i} {...stat} loading={loadingComputers} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-surface border border-border-primary rounded-3xl p-8 space-y-6 shadow-sm">
               <div className="flex items-center gap-2">
                <PieChartIcon size={18} className="text-primary-400" />
                <h3 className="text-sm font-bold text-text-primary font-mono uppercase tracking-widest">Status das Máquinas</h3>
              </div>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="99%" height={350}>
                  <PieChart>
                    <Pie data={computerStatusChartData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                      {computerStatusChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }} />
                    <Legend verticalAlign="bottom" height={40} wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-surface border border-border-primary rounded-3xl p-8 space-y-6 shadow-sm">
               <div className="flex items-center gap-2">
                <Monitor size={18} className="text-primary-400" />
                <h3 className="text-sm font-bold text-text-primary font-mono uppercase tracking-widest">Resumo de Ativos TI</h3>
              </div>
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-hover-bg border border-border-primary">
                  <span className="text-xs font-mono text-text-secondary uppercase">Disponibilidade</span>
                  <span className="text-sm font-bold text-text-primary">{computerStatsData?.['Em estoque'] || 0} Livres</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-hover-bg border border-border-primary">
                  <span className="text-xs font-mono text-text-secondary uppercase">Taxa de Ocupação</span>
                  <span className="text-sm font-bold text-text-primary">
                    {Math.round(((computerStatsData?.['Em uso'] || 0) / (totalComputers || 1)) * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-hover-bg border border-border-primary">
                  <span className="text-xs font-mono text-text-secondary uppercase">Aguardando Manutenção</span>
                  <span className="text-sm font-bold text-amber-400">{computerStatsData?.['Manutenção'] || 0} unidades</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-hover-bg border border-border-primary">
                  <span className="text-xs font-mono text-text-secondary uppercase">Inoperantes (Defeito)</span>
                  <span className="text-sm font-bold text-red-400">{computerStatsData?.['Defeito'] || 0} unidades</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
