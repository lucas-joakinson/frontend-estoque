import { useState } from 'react';
import { useStock } from '../hooks/useStock';
import { ArrowUpRight, ArrowDownRight, Edit3, Check, X } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';

export const StockMovements = () => {
  const { movements, isLoading, updateMovement } = useStock();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editReason, setEditReason] = useState('');

  const handleStartEdit = (id: string, reason: string) => {
    setEditingId(id);
    setEditReason(reason || '');
  };

  const handleSaveEdit = (id: string) => {
    updateMovement({ id, reason: editReason });
    setEditingId(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold text-text-primary leading-tight">
          Movimentações de Estoque
        </h2>
        <p className="text-text-secondary mt-1 font-mono text-xs uppercase tracking-widest">
          Histórico completo de entradas e saídas
        </p>
      </div>

      <div className="rounded-2xl border border-border-primary overflow-hidden bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-hover-bg">
              <tr>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Data</th>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Produto</th>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Tipo</th>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Quantidade</th>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Motivo</th>
                <th className="px-6 py-4 text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-border-primary">Usuário</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-8" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                  </tr>
                ))
              ) : movements.length > 0 ? (
                movements.map((m) => (
                  <tr key={m.id} className="hover:bg-hover-bg transition-colors border-b border-border-primary last:border-0 group">
                    <td className="px-6 py-4 text-xs text-text-secondary font-mono">
                      {new Date(m.createdAt).toLocaleString()}
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
                    <td className="px-6 py-4 text-sm font-bold text-text-primary font-mono">{m.quantity}</td>
                    <td className="px-6 py-4">
                      {editingId === m.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            className="px-3 py-1.5 rounded-lg bg-hover-bg border border-border-primary text-text-primary font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary-500/50 w-48 transition-all"
                            value={editReason}
                            onChange={(e) => setEditReason(e.target.value)}
                            onBlur={() => handleSaveEdit(m.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(m.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                          />
                          <button onClick={() => handleSaveEdit(m.id)} className="text-primary-400">
                            <Check size={16} />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleStartEdit(m.id, m.reason || '')}
                          className="group flex items-center gap-2 cursor-pointer text-sm text-text-secondary hover:text-text-primary transition-colors"
                        >
                          <span className="truncate max-w-[200px]">{m.reason || <span className="italic opacity-50">Sem motivo</span>}</span>
                          <Edit3 size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-text-secondary">{m.user.matricula}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-secondary font-mono text-sm italic">
                    Nenhuma movimentação registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
