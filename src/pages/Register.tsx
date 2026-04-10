import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '../components/ui/Spinner';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const Register = () => {
  const [matricula, setMatricula] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, isRegistering } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    register({ matricula, password });
  };

  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center">
          <h1 className="text-4xl font-bold font-mono tracking-tighter mb-2">
            <span className="text-primary-500">{'>_'}</span> ESTOQUE
          </h1>
          <p className="text-text-secondary font-mono text-xs uppercase tracking-widest">
            Crie sua conta no sistema
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface border border-border-primary rounded-2xl p-8 space-y-6 shadow-xl">
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest mb-2 px-1">Matrícula</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary placeholder:text-text-secondary/50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
              placeholder="Digite sua matrícula"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest mb-2 px-1">Senha</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary placeholder:text-text-secondary/50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest mb-2 px-1">Confirmar Senha</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 rounded-xl bg-hover-bg border border-border-primary text-text-primary placeholder:text-text-secondary/50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isRegistering}
            className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold uppercase tracking-wider transition-all shadow-glow-purple flex items-center justify-center gap-2 h-12"
          >
            {isRegistering ? <Spinner className="text-white" /> : 'Criar Conta'}
          </button>

          <p className="text-center text-sm text-text-secondary font-mono">
            Já tem conta?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-primary-500 hover:underline font-bold"
            >
              Entrar
            </button>
          </p>
        </form>

        <p className="text-center text-[10px] font-mono text-text-secondary uppercase tracking-[0.2em] opacity-50">
          Gerenciador de Estoque v2.0 &copy; 2026
        </p>
      </div>
    </div>
  );
};
